/**
 * 读模型：把 maw 的原始 JSON 归一成前端稳定的结构。
 *
 * 设计要点：
 *  - 所有字段读取都走容错访问器，maw 少给字段也不崩。
 *  - 派生字段（ready / blocked / frontier）在 Host 侧算一次。
 *  - 每个数据源单独记录状态，一个源失败只让该源降级。
 */

import { readFileSync } from 'node:fs'
import { execMaw } from './maw-exec.js'
import { buildGraph, subgraphAround } from './graph.js'
import { decodeModelGoal } from './model-routing.js'

/** 视为「已完成」的状态。 */
const TERMINAL_DONE = new Set(['done', 'cancelled'])

/** 全部状态，用于计数排序。 */
const STATUS_ORDER = ['backlog', 'ready', 'in_progress', 'merging', 'blocked', 'done', 'cancelled']

/**
 * 安全取字符串。
 * @param {unknown} value
 * @param {string} [fallback]
 * @returns {string}
 */
function str(value, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

/**
 * 安全取数字。
 * @param {unknown} value
 * @param {number} [fallback]
 * @returns {number}
 */
function num(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/**
 * 安全取字符串数组。
 * @param {unknown} value
 * @returns {string[]}
 */
function strArray(value) {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : []
}

/**
 * 安全取对象。
 * @param {unknown} value
 * @returns {Record<string, unknown>}
 */
function obj(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

/**
 * 归一阻塞历史。
 *
 * maw 把每次阻塞写成 `{ at, reason }`，reason 里通常带 `[类别]` 前缀。
 * 这里只保留能显示的条目，坏数据直接跳过而不是让整个任务读不出来。
 * @param {unknown} value
 * @returns {{at: string, reason: string}[]}
 */
function blockHistoryOf(value) {
  if (!Array.isArray(value)) return []
  return value
    .map(entry => ({
      at: str(obj(entry).at),
      reason: str(obj(entry).reason),
    }))
    .filter(entry => entry.reason !== '')
}

/**
 * 归一一个任务。
 * @param {Record<string, unknown>} raw
 * @returns {object}
 */
export function normalizeTask(raw) {
  const extra = obj(raw.extra)
  const status = str(raw.status, 'backlog')
  return {
    id: str(raw.id),
    projectId: str(raw.project_id),
    projectName: str(raw.project_name),
    title: str(raw.title),
    status,
    lane: str(raw.lane),
    owner: str(raw.owner),
    priority: num(raw.priority, 100),
    mergeOrder: num(raw.merge_order, 100),
    iterationId: str(raw.iteration_id),
    deps: strArray(raw.deps),
    writeScope: strArray(raw.write_scope),
    readScope: strArray(raw.read_scope),
    acceptance: strArray(raw.acceptance),
    ...decodeModelGoal(str(extra.goal)),
    verify: strArray(extra.verify),
    notDoing: strArray(extra.not_doing),
    suggestedFollowups: strArray(extra.suggested_followups),
    blockCategory: str(extra.block_category),
    branch: str(raw.branch),
    worktree: str(raw.worktree),
    attempts: num(raw.attempts, 0),
    blockedReason: str(raw.blocked_reason),
    heartbeat: str(raw.heartbeat),
    revision: num(raw.revision, 0),
    prevStatus: str(raw.prev_status),
    instanceId: str(raw.instance_id),
    // ── 执行思路类字段：任务详情要能完整复述「这题打算怎么做」 ──
    // delivery_strategy 是执行方式（如 manual_client_compat），run/delivery id
    // 用来把一次执行串起来，排查时能对上。
    deliveryStrategy: str(extra.delivery_strategy),
    deliveryId: str(extra.delivery_id),
    runId: str(extra.run_id),
    // 阻塞与取消的原因链：单看状态看不出「为什么停下来」，这些要一起给出来。
    blockCategory: str(extra.block_category),
    blockReason: str(extra.block_reason),
    blockHistory: blockHistoryOf(extra.block_history),
    cancelReason: str(extra.cancel_reason),
    supersededBy: str(extra.superseded_by),
    // 范围扩张是执行中常见动作，记下什么时候、为什么扩。
    scopeExpandedAt: str(extra.scope_expanded_at),
    scopeExpandReason: str(extra.scope_expand_reason),
    done: TERMINAL_DONE.has(status),
  }
}

/**
 * 归一一个 Agent。
 * @param {Record<string, unknown>} raw
 * @returns {object}
 */
export function normalizeAgent(raw) {
  const meta = obj(raw.meta)
  return {
    id: str(raw.id),
    projectId: str(raw.project_id),
    projectName: str(raw.project_name),
    role: str(raw.role, 'worker'),
    status: str(raw.status, 'idle'),
    taskId: str(raw.task_id),
    worktree: str(raw.worktree),
    branch: str(raw.branch),
    lane: str(meta.bound_lane),
    registeredAt: str(raw.registered_at),
    lastSeen: str(raw.last_seen),
  }
}

/**
 * 按状态计数。
 * @param {object[]} tasks
 * @returns {Record<string, number>}
 */
export function countByStatus(tasks) {
  const counts = {}
  for (const status of STATUS_ORDER) counts[status] = 0
  for (const task of tasks) {
    const status = task.status
    if (status in counts) counts[status] += 1
    else counts[status] = (counts[status] ?? 0) + 1
  }
  return counts
}

/**
 * 计算进度百分比（按已完成 / 总数）。
 * @param {Record<string, number>} counts
 * @returns {number}
 */
export function computePercent(counts) {
  const done = (counts.done ?? 0) + (counts.cancelled ?? 0)
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
  if (total === 0) return 0
  return Math.round((done / total) * 100)
}

/**
 * 按迭代统计任务数（含已完成），供迭代栏显示规模。
 *
 * 未归迭代的任务记在空键 `''` 下：界面把它单列成一个「未归迭代」分组，
 * 而不是静默丢掉，否则总数会对不上看板上看到的卡片。
 * @param {object[]} tasks 已经按工程裁过的任务
 * @param {string} [projectId]
 * @returns {Record<string, number>}
 */
export function countByIteration(tasks, projectId = '') {
  const counts = { '': 0 }
  for (const task of tasks) {
    if (projectId !== '' && task.projectId !== projectId) continue
    const key = typeof task.iterationId === 'string' ? task.iterationId : ''
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

/**
 * 解析 `/board?iteration=` 的取值。
 *
 * 空串与 `__all__` 都表示「全部迭代」；`__none__` 表示未归迭代（任务上
 * `iterationId` 为空）。空串不能直接表示未归迭代，否则「全部」与「未归」
 * 会同时命中，所以这里用哨兵值把三种意图分开。
 *
 * @param {string} value 查询参数原值
 * @returns {{kind: 'all' | 'none' | 'one', id: string}}
 */
export function resolveIterationFilter(value) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (raw === '' || raw === '__all__') return { kind: 'all', id: '' }
  if (raw === '__none__') return { kind: 'none', id: '' }
  return { kind: 'one', id: raw }
}

/**
 * 迭代的终态：maw 显式关掉之后就以记录值为准，不再按任务推导。
 */
const ITERATION_TERMINAL = new Set(['done', 'completed', 'closed', 'archived', 'cancelled'])

/**
 * 按任务完成度推导迭代状态。
 *
 * 规则（顺序即优先级）：
 *  - 记录值已是终态 → 用记录值（人明确关过，不推翻）；
 *  - 这个迭代下没有题 → empty（由 buildIterations 处理，避免显示成进行中）；
 *  - 题全部完成/取消 → done；
 *  - 有在跑或合入中 → running；
 *  - 有可开工的 → running（这活已经可动）；
 *  - 剩下的全是阻塞 → blocked；
 *  - 其余（只有待办）→ planning。
 *
 * @param {string} recorded maw 里记录的迭代状态
 * @param {Record<string, number>} counts 该迭代各状态的题数
 * @returns {{status: string, derived: boolean}}
 */
export function deriveIterationStatus(recorded, counts) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
  if (ITERATION_TERMINAL.has(recorded)) return { status: recorded, derived: false }
  if (total === 0) return { status: recorded, derived: false }
  const done = (counts.done ?? 0) + (counts.cancelled ?? 0)
  if (done === total) return { status: 'done', derived: true }
  if ((counts.in_progress ?? 0) > 0 || (counts.merging ?? 0) > 0) return { status: 'running', derived: true }
  if ((counts.ready ?? 0) > 0) return { status: 'running', derived: true }
  if ((counts.blocked ?? 0) > 0 && (counts.backlog ?? 0) === 0) return { status: 'blocked', derived: true }
  return { status: 'planning', derived: true }
}

/**
 * 组装迭代列表：带题数与推导后的状态。
 *
 * @param {unknown} snapshotIterations 快照里的迭代（全局）
 * @param {string} projectId 只留这个工程的迭代
 * @param {object[]} tasks 已归一并带 level 的任务
 * @returns {object[]}
 */
export function buildIterations(snapshotIterations, projectId, tasks) {
  if (!Array.isArray(snapshotIterations)) return []
  const scoped = tasks.filter(task => projectId === '' || task.projectId === projectId)
  const byIteration = new Map()
  for (const task of scoped) {
    const key = task.iterationId
    if (!byIteration.has(key)) byIteration.set(key, [])
    byIteration.get(key).push(task)
  }

  return snapshotIterations
    .filter(item => projectId === '' || str(item.project_id) === projectId)
    .map(item => {
      const id = str(item.id)
      const recorded = str(item.status)
      const bucket = byIteration.get(id) ?? []
      const counts = countByStatus(bucket)
      // 一道题都没有的迭代：继续显示 maw 的 running 会让人以为它在推进，
      // 单独标成 empty（界面显示「无任务」），记录的 running 留在 recordedStatus 里。
      const { status, derived } = bucket.length === 0
        ? { status: 'empty', derived: true }
        : deriveIterationStatus(recorded, counts)
      return {
        id,
        name: str(item.name),
        // status 是界面要显示的那个；recordedStatus 保留原值，便于排查。
        status,
        recordedStatus: recorded,
        statusDerived: derived,
        goal: str(item.goal),
        targetBranch: str(item.target_branch),
        createdAt: str(item.created_at),
        updatedAt: str(item.updated_at),
        total: bucket.length,
        done: (counts.done ?? 0) + (counts.cancelled ?? 0),
        percent: computePercent(counts),
        counts,
      }
    })
}

/**
 * 解析项目路径：显式指定的工程优先，其次配置，再到当前工作目录，最后从
 * maw 项目登记里挑。
 *
 * 显式工程 id 必须压过其余规则：看板先决定「跑哪个工程的 maw 子命令」取数，
 * 再按工程 id 过滤任务。两条路径必须指向同一个工程 —— 否则按 id 过滤会把
 * 刚取到的题全筛掉，界面就只剩「没有符合条件的任务」。
 *
 * @param {object} config
 * @param {string} cwd
 * @param {Array<{project_id: string, project_path: string, project_name: string}>} registered
 * @param {string} [projectId] 调用方要看的工程 id。
 * @returns {string}
 */
export function resolveProjectPath(config, cwd, registered, projectId = '') {
  const list = Array.isArray(registered) ? registered : []

  // 0) 调用方点名要哪个工程，就在那个工程里取数。
  if (typeof projectId === 'string' && projectId !== '') {
    const hit = list.find(item => str(item?.project_id) === projectId)
    const hitPath = hit === undefined ? '' : str(hit.project_path)
    if (hitPath !== '') return hitPath
  }

  const configured = strArray(config.projects)
  if (configured.length > 0) return configured[0]

  const paths = list
    .map(item => str(item?.project_path))
    .filter(path => path !== '')

  // 1) 会话目录本身就是已登记的 maw 工程（含子目录）时，用它。
  const own = paths
    .filter(path => cwd === path || cwd.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0]
  if (own !== undefined) return own

  // 2) 只登记了一个工程时直接用它：从别的工作区进来也能看到这道工程，
  //    而不是去那个非 maw 仓库里跑 task list 然后降级。
  if (paths.length === 1) return paths[0]

  // 3) 会话目录是别的 git 仓库，就按它自己查。
  if (cwd !== '' && looksLikeRepo(cwd)) return cwd

  if (paths.length > 0) return paths[0]
  return cwd
}

/**
 * 粗判目录是否是 git 仓库（有 .git 即可）。
 * @param {string} dir
 * @returns {boolean}
 */
function looksLikeRepo(dir) {
  try {
    readFileSync(`${dir}/.git/HEAD`)
    return true
  } catch {
    try {
      // worktree / submodule 的 .git 是文件。
      readFileSync(`${dir}/.git`)
      return true
    } catch {
      return false
    }
  }
}

/**
 * 读 maw 已登记的工程表。
 *
 * 路由要先把「会话属于哪个工程」和「请求点名了哪个工程」解析出来，才知道
 * 该在哪个工程里取数；这一步就是那次的登记表读取（有缓存，和 loadBoard
 * 里的那次共用）。
 *
 * @param {object} config 插件配置。
 * @param {string} cwd 工作目录（只在 PATH 之外找 maw 时用得上）。
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array<{id: string, name: string, path: string}>>}
 */
export async function loadProjects(config, cwd, signal) {
  const result = await execMaw(['project', 'list'], {
    timeoutMs: num(config.timeoutMs, 8000),
    cacheMs: num(config.cacheMs, 5000),
    ...(str(config.mawBinary) === '' ? {} : { binary: str(config.mawBinary) }),
    signal,
    cwd,
  })
  const registered = result.ok && Array.isArray(result.data?.projects) ? result.data.projects : []
  return registered.map(item => ({
    id: str(item?.project_id),
    name: str(item?.project_name),
    path: str(item?.project_path),
  }))
}

/**
 * 读全部数据源并合成看板模型。
 * @param {object} config 插件配置。
 * @param {string} cwd 会话工作目录。
 * @param {AbortSignal} [signal]
 * @param {{projectId?: string}} [options] projectId：只在这个工程里取数。
 * @returns {Promise<object>}
 */
export async function loadBoard(config, cwd, signal, options = {}) {
  const execOptions = {
    timeoutMs: num(config.timeoutMs, 8000),
    cacheMs: num(config.cacheMs, 5000),
    // 配置了 mawBinary 就必须用它：否则自定义路径下的 maw 永远调不到，
    // 看板会一直降级成「读不到数据」。
    ...(str(config.mawBinary) === '' ? {} : { binary: str(config.mawBinary) }),
    signal,
  }
  const projectId = typeof options.projectId === 'string' ? options.projectId : ''

  // 1) 项目登记：任何目录可用。
  const projectsResult = await execMaw(['project', 'list'], { ...execOptions, cwd })
  const registered = projectsResult.ok && Array.isArray(projectsResult.data?.projects)
    ? projectsResult.data.projects
    : []

  // 取数工程与上层过滤用的工程 id 必须一致，所以这里接受显式工程 id。
  const projectPath = resolveProjectPath(config, cwd, registered, projectId)

  // 工程名：风险列表里的纯字符串形态只带名字，裁它时需要名字比对。
  const projectName = projectId === ''
    ? ''
    : str(registered.find(item => str(item?.project_id) === projectId)?.project_name)

  // 2) 全量任务：唯一能拿到全部任务（含 deps）的路径。
  const tasksResult = await execMaw(['task', 'list'], {
    ...execOptions,
    cwd: projectPath,
    timeoutMs: Math.max(num(config.timeoutMs, 8000), 15000),
  })

  // 3) 看板摘要 + 健康度：只在项目目录内有效。
  //
  // `maw board` 是跨工程的全局看板，而且会把这台机器共用的 snapshot.json
  // 覆盖写成「本次查询的范围」。所以这里不加 `--project`（那会把别人的看板
  // 数据覆盖成单工程），改为拿到全局快照后按工程 id 在本地裁。
  const boardResult = await execMaw(['board'], { ...execOptions, cwd: projectPath })

  // 4) Agent 列表。
  // 在工程目录里取：会话目录可能是工程的父目录，在那里跑 agents 会带出
  // 别的工程的 agent（活跃数被算大）。取数目录必须与任务取数一致。
  const agentsResult = await execMaw(['agents'], { ...execOptions, cwd: projectPath })

  const tasks = tasksResult.ok && Array.isArray(tasksResult.data?.tasks)
    ? tasksResult.data.tasks.map(normalizeTask).filter(task => task.id !== '')
    : []

  const agents = agentsResult.ok && Array.isArray(agentsResult.data?.agents)
    ? agentsResult.data.agents.map(normalizeAgent).filter(agent => agent.id !== '')
    : []

  const boardSnapshot = readBoardSnapshot(boardResult)

  const counts = countByStatus(tasks)
  const graph = buildGraph(tasks)

  const frontierSet = new Set(graph.frontier)
  const blockedSet = new Set(graph.blockedChains.map(entry => entry.task))

  const enrichedTasks = tasks.map(task => ({
    ...task,
    ready: frontierSet.has(task.id),
    blocked: blockedSet.has(task.id) || task.status === 'blocked',
    isFrontier: frontierSet.has(task.id),
    level: graph.levelOf[task.id] ?? 0,
  }))

  const sources = {
    tasks: tasksResult.ok ? 'ok' : 'stale',
    board: boardResult.ok ? 'ok' : 'stale',
    agents: agentsResult.ok ? 'ok' : 'stale',
    projects: projectsResult.ok ? 'ok' : 'stale',
  }

  const errors = []
  if (!tasksResult.ok) errors.push({ source: 'tasks', ...tasksResult.error })
  if (!boardResult.ok) errors.push({ source: 'board', ...boardResult.error })
  if (!agentsResult.ok) errors.push({ source: 'agents', ...agentsResult.error })
  if (!projectsResult.ok) errors.push({ source: 'projects', ...projectsResult.error })

  return {
    generatedAt: new Date().toISOString(),
    projectPath,
    projects: registered.map(item => ({
      id: str(item.project_id),
      name: str(item.project_name),
      path: str(item.project_path),
    })),
    // 迭代状态不能只看 maw 记录值：maw 不会在题做完后自动关迭代，库里
    // 长期停在 running，界面上就会「所有迭代都在进行中」。这里按任务完成度
    // 推导，记录值只在它已经是终态时优先。
    iterations: buildIterations(boardSnapshot?.iterations, projectId, enrichedTasks),
    // 迭代栏上每个迭代的题数：只按工程裁，不受泳道/状态/Agent 筛选影响，
    // 否则选了泳道之后迭代数字跟着跳，看不出「这个迭代还有多少活」。
    iterationCounts: countByIteration(enrichedTasks, projectId),
    counts,
    percent: computePercent(counts),
    total: tasks.length,
    // 再按工程裁一次：即便 maw 多给了 agent，也不能把别的工程算进来。
    activeAgents: agents.filter(agent => agent.status === 'working'
      && (projectId === '' || agent.projectId === projectId)).length,
    tasks: enrichedTasks,
    agents,
    // 风险 / 问题来自全局快照，必须按工程裁一遍：否则限定工程后仍会看到
    // 别的工程的风险项，等于把隔离又漏出去了。
    risks: scopeSignals(normalizeSignals(boardSnapshot?.risks), projectId, projectName),
    problems: scopeSignals(normalizeSignals(boardSnapshot?.problems), projectId, projectName),
    graph,
    sources,
    errors,
  }
}

/**
 * 从 `maw board --json` 的结果里拿到看板快照。
 * board 命令把数据写进 snapshot 文件，stdout 只给路径。
 * @param {{ok: boolean, data?: any}} boardResult
 * @returns {object|null}
 */
export function readBoardSnapshot(boardResult) {
  if (!boardResult.ok) return null
  const data = boardResult.data
  if (data === null || typeof data !== 'object') return null

  // 有的版本直接内联 snapshot 对象。
  if (data.snapshot !== null && typeof data.snapshot === 'object') return data.snapshot

  // 常规路径：snapshot 是文件路径。
  const snapshotPath = str(data.snapshot)
  if (snapshotPath !== '') {
    try {
      return JSON.parse(readFileSync(snapshotPath, 'utf8'))
    } catch {
      return null
    }
  }

  // 兜底：若 board 自己带 tasks/iterations 就直接用。
  if (Array.isArray(data.tasks) || Array.isArray(data.iterations)) return data
  return null
}

/**
 * 归一 risks / problems 列表。
 * maw 的 risks 是纯文本数组（形如「项目/任务号 阻塞：原因」），
 * problems 是结构化对象数组；两种都要能吃。
 * @param {unknown} value
 * @returns {object[]}
 */
/**
 * 把风险 / 问题列表裁到某个工程。
 *
 * 快照里的对象形态带 project_id，直接按 id 比最准；纯字符串形态没有 id，
 * 退而按解析出来的 project_name 比。两者都判不出来时保留 —— 宁可多显示
 * 一条泛化的告警，也不要把它悄悄吞掉。
 *
 * @param {object[]} signals normalizeSignals 的结果
 * @param {string} projectId 目标工程 id；空串表示不裁
 * @param {string} projectName 目标工程名，用于比对字符串形态
 * @returns {object[]}
 */
function scopeSignals(signals, projectId, projectName) {
  if (projectId === '') return signals
  return signals.filter(signal => {
    if (signal.projectId !== '') return signal.projectId === projectId
    if (signal.projectName !== '') return signal.projectName === projectName
    return true
  })
}

function normalizeSignals(value) {
  if (!Array.isArray(value)) return []
  return value.map(item => {
    // 纯字符串：从「项目/任务号 类别：正文」里解析出任务号与严重度。
    if (typeof item === 'string') {
      const text = item.trim()
      const match = text.match(/^([^/\s]+)\/([A-Za-z]+-\d+)\s*(阻塞|风险|问题|risk|blocked)?[:：]?\s*(.*)$/u)
      const isBlocked = /阻塞|blocked/iu.test(text)
      return {
        taskId: match?.[2] ?? '',
        projectId: '',
        projectName: match?.[1] ?? '',
        kind: match?.[3] ?? '',
        severity: isBlocked ? 'high' : 'medium',
        message: match?.[4]?.trim() || text,
        category: '',
        ts: '',
      }
    }
    const raw = obj(item)
    return {
      taskId: str(raw.task_id),
      projectId: str(raw.project_id),
      projectName: str(raw.project_name),
      kind: str(raw.kind),
      severity: str(raw.severity, 'low'),
      message: str(raw.message),
      category: str(raw.category),
      ts: str(raw.ts),
    }
  }).filter(signal => signal.message !== '')
}

/**
 * 按筛选条件裁剪任务列表。
 * @param {object[]} tasks
 * @param {{project?: string, lane?: string, status?: string, agent?: string, includeDone?: boolean}} filter
 * @returns {object[]}
 */
export function filterTasks(tasks, filter = {}) {
  const { project, lane, status, agent, iteration, includeDone = false } = filter
  return tasks.filter(task => {
    if (includeDone !== true && TERMINAL_DONE.has(task.status)) return false
    if (project !== undefined && project !== '' && task.projectId !== project) return false
    if (lane !== undefined && lane !== '' && task.lane !== lane) return false
    if (status !== undefined && status !== '' && task.status !== status) return false
    if (agent !== undefined && agent !== '' && task.owner !== agent) return false
    if (iteration !== undefined && iteration !== '' && task.iterationId !== iteration) return false
    return true
  })
}

/**
 * 取单个任务的完整详情。
 * @param {object} board loadBoard 的结果
 * @param {string} id
 * @returns {object|null}
 */
export function taskDetail(board, id) {
  const task = board.tasks.find(item => item.id === id)
  if (task === undefined) return null
  const graph = board.graph
  const upstream = graph.edges.filter(([, to]) => to === id).map(([from]) => from)
  const downstream = graph.edges.filter(([from]) => from === id).map(([, to]) => to)
  return {
    ...task,
    upstream,
    downstream,
    cycle: graph.cycles.some(cycle => cycle.includes(id)),
  }
}

/**
 * 依赖视图：整图摘要或某任务的邻域。
 * @param {object} board
 * @param {{focus?: string, depth?: number}} options
 * @returns {object}
 */
export function dependencyView(board, options = {}) {
  const focus = typeof options.focus === 'string' ? options.focus : ''
  if (focus === '') {
    return {
      levels: board.graph.levels,
      edges: board.graph.edges,
      cycles: board.graph.cycles,
      dangling: board.graph.dangling,
      frontier: board.graph.frontier,
      blockedChains: board.graph.blockedChains,
      criticalPath: board.graph.criticalPath,
      levelOf: board.graph.levelOf,
      nodeCount: board.graph.nodeCount,
      edgeCount: board.graph.edgeCount,
    }
  }
  const depth = num(options.depth, 3)
  const sub = subgraphAround(board.graph, board.tasks, focus, depth)
  return {
    focus,
    depth,
    ...sub,
    cycles: board.graph.cycles.filter(cycle => cycle.includes(focus)),
    dangling: board.graph.dangling.filter(item => item.from === focus || item.to === focus),
  }
}
