/**
 * 依赖图：分层、环检测、悬空依赖、ready 前沿、阻塞链、关键路径。
 *
 * 全部是纯函数，输入任务数组，输出可序列化的普通对象 —— 便于单测，
 * 也便于直接塞进 HTTP 响应。
 */

/**
 * @typedef {object} GraphTask
 * @property {string} id
 * @property {string} status
 * @property {string[]} deps
 * @property {number} mergeOrder
 * @property {string} lane
 */

/** 视为「已完成」的状态：依赖这些状态的任务才算可开工。 */
const TERMINAL_DONE = new Set(['done', 'cancelled'])

/** 视为「可开工」的状态。 */
const READY_STATUSES = new Set(['backlog', 'ready'])

/**
 * 建图并算出全部派生结构。
 * @param {GraphTask[]} tasks
 * @returns {{
 *   levels: string[][],
 *   edges: Array<[string, string]>,
 *   cycles: string[][],
 *   dangling: Array<{from: string, to: string}>,
 *   frontier: string[],
 *   blockedChains: Array<{task: string, chain: string[]}>,
 *   criticalPath: string[],
 *   levelOf: Record<string, number>,
 *   nodeCount: number,
 *   edgeCount: number,
 * }}
 */
export function buildGraph(tasks) {
  const list = Array.isArray(tasks) ? tasks : []
  const byId = new Map()
  for (const task of list) {
    if (task !== null && typeof task === 'object' && typeof task.id === 'string') {
      byId.set(task.id, task)
    }
  }

  /** 只保留指向已知任务的依赖；未知的进 dangling。 */
  const deps = new Map()
  const dangling = []
  for (const [id, task] of byId) {
    const raw = Array.isArray(task.deps) ? task.deps : []
    const kept = []
    for (const dep of raw) {
      if (typeof dep !== 'string') continue
      if (byId.has(dep)) kept.push(dep)
      else dangling.push({ from: id, to: dep })
    }
    deps.set(id, kept)
  }

  const edges = []
  for (const [id, ds] of deps) {
    for (const dep of ds) edges.push([dep, id])
  }

  const cycles = detectCycles(byId, deps)
  const levelOf = computeLevels(byId, deps)

  const levelCount = Math.max(0, ...Object.values(levelOf)) + 1
  const levels = Array.from({ length: levelCount }, () => [])
  for (const [id, level] of Object.entries(levelOf)) {
    levels[level].push(id)
  }
  // 层内按 mergeOrder 再按 id 排序，保证渲染稳定。
  for (const bucket of levels) {
    bucket.sort((a, b) => {
      const ma = Number(byId.get(a)?.mergeOrder ?? 0)
      const mb = Number(byId.get(b)?.mergeOrder ?? 0)
      return ma === mb ? a.localeCompare(b) : ma - mb
    })
  }

  const doneSet = new Set()
  for (const [id, task] of byId) {
    if (TERMINAL_DONE.has(String(task.status))) doneSet.add(id)
  }

  const frontier = []
  for (const [id, task] of byId) {
    if (!READY_STATUSES.has(String(task.status))) continue
    const ds = deps.get(id) ?? []
    if (ds.every(dep => doneSet.has(dep))) frontier.push(id)
  }
  frontier.sort()

  const blockedChains = buildBlockedChains(byId, deps, doneSet)
  const criticalPath = computeCriticalPath(byId, deps)

  return {
    levels,
    edges,
    cycles,
    dangling,
    frontier,
    blockedChains,
    criticalPath,
    levelOf,
    nodeCount: byId.size,
    edgeCount: edges.length,
  }
}

/**
 * 最长路径分层：无依赖的任务在第 0 层。
 * 遇到环时退化为「已访问即返回当前深度」，保证不死循环。
 * @param {Map<string, GraphTask>} byId
 * @param {Map<string, string[]>} deps
 * @returns {Record<string, number>}
 */
export function computeLevels(byId, deps) {
  const memo = new Map()
  const visiting = new Set()

  const levelOf = id => {
    if (memo.has(id)) return memo.get(id)
    if (visiting.has(id)) return 0 // 环：就地截断，环本身由 detectCycles 报告。
    visiting.add(id)
    let best = 0
    for (const dep of deps.get(id) ?? []) {
      if (!byId.has(dep)) continue
      best = Math.max(best, levelOf(dep) + 1)
    }
    visiting.delete(id)
    memo.set(id, best)
    return best
  }

  const result = {}
  for (const id of byId.keys()) result[id] = levelOf(id)
  return result
}

/**
 * DFS 三色标记找环，返回所有找到的环路径（每个环只报一次，规范化起点）。
 * @param {Map<string, GraphTask>} byId
 * @param {Map<string, string[]>} deps
 * @returns {string[][]}
 */
export function detectCycles(byId, deps) {
  const WHITE = 0
  const GRAY = 1
  const BLACK = 2
  const color = new Map()
  for (const id of byId.keys()) color.set(id, WHITE)

  const stack = []
  const found = []
  const seenKeys = new Set()

  const dfs = id => {
    color.set(id, GRAY)
    stack.push(id)
    for (const dep of deps.get(id) ?? []) {
      if (!byId.has(dep)) continue
      const c = color.get(dep) ?? WHITE
      if (c === GRAY) {
        // 环：从 stack 里 dep 首次出现的位置到栈顶。
        const start = stack.indexOf(dep)
        if (start >= 0) {
          const cycle = stack.slice(start)
          const key = normalizeCycleKey(cycle)
          if (!seenKeys.has(key)) {
            seenKeys.add(key)
            found.push(cycle)
          }
        }
      } else if (c === WHITE) {
        dfs(dep)
      }
    }
    stack.pop()
    color.set(id, BLACK)
  }

  for (const id of byId.keys()) {
    if ((color.get(id) ?? WHITE) === WHITE) dfs(id)
  }
  return found
}

/**
 * 环的规范化键：把字典序最小的节点转到首位，避免同一环换起点重复报告。
 * @param {string[]} cycle
 * @returns {string}
 */
function normalizeCycleKey(cycle) {
  if (cycle.length === 0) return ''
  let minIndex = 0
  for (let i = 1; i < cycle.length; i += 1) {
    if (cycle[i] < cycle[minIndex]) minIndex = i
  }
  const rotated = [...cycle.slice(minIndex), ...cycle.slice(0, minIndex)]
  return rotated.join('>')
}

/**
 * 阻塞链：对每个 blocked 任务，沿依赖回溯到第一个未完成的源头。
 * @param {Map<string, GraphTask>} byId
 * @param {Map<string, string[]>} deps
 * @param {Set<string>} doneSet
 * @returns {Array<{task: string, chain: string[]}>}
 */
function buildBlockedChains(byId, deps, doneSet) {
  const out = []
  for (const [id, task] of byId) {
    if (String(task.status) !== 'blocked') continue
    const chain = []
    const visited = new Set([id])
    let cursor = id
    // 广度上溯：找出所有尚未完成的依赖，形成一条代表性链路。
    for (let depth = 0; depth < 64; depth += 1) {
      const ds = (deps.get(cursor) ?? []).filter(dep => !doneSet.has(dep))
      if (ds.length === 0) break
      const next = ds[0]
      if (visited.has(next)) break
      visited.add(next)
      chain.push(next)
      cursor = next
    }
    out.push({ task: id, chain })
  }
  return out
}

/**
 * 关键路径：按依赖深度与 mergeOrder 取最长的一条链。
 * @param {Map<string, GraphTask>} byId
 * @param {Map<string, string[]>} deps
 * @returns {string[]}
 */
export function computeCriticalPath(byId, deps) {
  const memo = new Map()

  /** @returns {{length: number, path: string[]}} */
  const best = (id, visiting) => {
    if (memo.has(id)) return memo.get(id)
    if (visiting.has(id)) return { length: 0, path: [id] }
    visiting.add(id)
    let pick = { length: 1, path: [id] }
    for (const dep of deps.get(id) ?? []) {
      if (!byId.has(dep)) continue
      const sub = best(dep, visiting)
      if (sub.length + 1 > pick.length) {
        pick = { length: sub.length + 1, path: [...sub.path, id] }
      }
    }
    visiting.delete(id)
    memo.set(id, pick)
    return pick
  }

  let winner = { length: 0, path: [] }
  for (const id of byId.keys()) {
    const candidate = best(id, new Set())
    if (candidate.length > winner.length) winner = candidate
  }
  return winner.path
}

/**
 * 取某个任务的上下游（限深度），用于 `maw_deps --focus`。
 * @param {ReturnType<typeof buildGraph>} graph
 * @param {GraphTask[]} tasks
 * @param {string} focusId
 * @param {number} [depth] 默认 3。
 * @returns {{upstream: string[], downstream: string[], edges: Array<[string,string]>}}
 */
export function subgraphAround(graph, tasks, focusId, depth = 3) {
  const deps = new Map()
  for (const task of tasks) {
    if (task !== null && typeof task === 'object' && typeof task.id === 'string') {
      deps.set(task.id, Array.isArray(task.deps) ? task.deps.filter(d => typeof d === 'string') : [])
    }
  }

  const children = new Map()
  for (const [id, ds] of deps) {
    for (const dep of ds) {
      if (!children.has(dep)) children.set(dep, [])
      children.get(dep).push(id)
    }
  }

  const upstream = walk(focusId, deps, depth)
  const downstream = walk(focusId, children, depth)
  const keep = new Set([focusId, ...upstream, ...downstream])
  const edges = graph.edges.filter(([from, to]) => keep.has(from) && keep.has(to))
  return { upstream: [...upstream].sort(), downstream: [...downstream].sort(), edges }
}

/**
 * 沿一个方向做 BFS，返回限深内的可达节点（不含起点）。
 * @param {string} start
 * @param {Map<string, string[]>} adjacency
 * @param {number} depth
 * @returns {Set<string>}
 */
function walk(start, adjacency, depth) {
  const seen = new Set()
  let frontier = [start]
  for (let d = 0; d < depth; d += 1) {
    const next = []
    for (const node of frontier) {
      for (const neighbour of adjacency.get(node) ?? []) {
        if (neighbour === start || seen.has(neighbour)) continue
        seen.add(neighbour)
        next.push(neighbour)
      }
    }
    if (next.length === 0) break
    frontier = next
  }
  return seen
}
