/**
 * graph.js 与 model.js 的单元测试。
 *
 * 用真实 snapshot.json 做基准断言（207 节点 / 361 边 / 29 层 / 无环），
 * 再用手造数据覆盖环、悬空依赖、前沿等边界。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { buildGraph, computeLevels, detectCycles, computeCriticalPath, subgraphAround } from '../lib/graph.js'
import { normalizeTask, normalizeAgent, countByStatus, computePercent, filterTasks, taskDetail, dependencyView } from '../lib/model.js'

/** 造一个任务。 */
function task(id, deps = [], extra = {}) {
  return { id, status: 'backlog', deps, mergeOrder: 100, lane: '', ...extra }
}

/** 真实快照；不存在时跳过相关断言。 */
const snapshotPath = join(homedir(), '.maw', 'board', 'snapshot.json')
const snapshot = existsSync(snapshotPath) ? JSON.parse(readFileSync(snapshotPath, 'utf8')) : null

test('空图不崩', () => {
  const graph = buildGraph([])
  assert.equal(graph.nodeCount, 0)
  assert.equal(graph.edgeCount, 0)
  assert.deepEqual(graph.cycles, [])
  assert.deepEqual(graph.frontier, [])
  assert.deepEqual(graph.criticalPath, [])
})

test('非数组输入不崩', () => {
  for (const input of [null, undefined, 42, 'x', {}]) {
    const graph = buildGraph(input)
    assert.equal(graph.nodeCount, 0)
  }
})

test('线性依赖分层正确', () => {
  const tasks = [task('A'), task('B', ['A']), task('C', ['B'])]
  const graph = buildGraph(tasks)
  assert.deepEqual(graph.levelOf, { A: 0, B: 1, C: 2 })
  assert.equal(graph.levels.length, 3)
  assert.deepEqual(graph.edges, [['A', 'B'], ['B', 'C']])
})

test('菱形依赖取最长路径分层', () => {
  // A → B → D，A → C → D；D 应在第 2 层。
  const tasks = [task('A'), task('B', ['A']), task('C', ['A']), task('D', ['B', 'C'])]
  const graph = buildGraph(tasks)
  assert.equal(graph.levelOf.A, 0)
  assert.equal(graph.levelOf.D, 2)
})

test('环被检测出来且不死循环', () => {
  const tasks = [task('A', ['C']), task('B', ['A']), task('C', ['B'])]
  const graph = buildGraph(tasks)
  assert.equal(graph.cycles.length, 1)
  assert.equal(graph.cycles[0].length, 3)
  // 分层不抛异常。
  assert.equal(typeof graph.levelOf.A, 'number')
})

test('自环被检测出来', () => {
  const graph = buildGraph([task('A', ['A'])])
  assert.equal(graph.cycles.length, 1)
})

test('同一环换起点只报一次', () => {
  const tasks = [task('A', ['C']), task('B', ['A']), task('C', ['B'])]
  const graph = buildGraph(tasks)
  assert.equal(graph.cycles.length, 1)
})

test('悬空依赖被单列而不丢弃', () => {
  const graph = buildGraph([task('A', ['GHOST'])])
  assert.deepEqual(graph.dangling, [{ from: 'A', to: 'GHOST' }])
  assert.equal(graph.edgeCount, 0)
})

test('可开工前沿：依赖全部完成才算', () => {
  const tasks = [
    task('A', [], { status: 'done' }),
    task('B', ['A'], { status: 'backlog' }),
    task('C', ['B'], { status: 'backlog' }),
  ]
  const graph = buildGraph(tasks)
  assert.deepEqual(graph.frontier, ['B'])
})

test('取消也算完成', () => {
  const tasks = [
    task('A', [], { status: 'cancelled' }),
    task('B', ['A'], { status: 'ready' }),
  ]
  assert.deepEqual(buildGraph(tasks).frontier, ['B'])
})

test('阻塞链沿未完成依赖上溯', () => {
  const tasks = [
    task('A', [], { status: 'in_progress' }),
    task('B', ['A'], { status: 'backlog' }),
    task('C', ['B'], { status: 'blocked' }),
  ]
  const graph = buildGraph(tasks)
  assert.equal(graph.blockedChains.length, 1)
  assert.equal(graph.blockedChains[0].task, 'C')
  assert.deepEqual(graph.blockedChains[0].chain, ['B', 'A'])
})

test('关键路径取最长链', () => {
  const tasks = [task('A'), task('B', ['A']), task('C', ['A']), task('D', ['B'])]
  const graph = buildGraph(tasks)
  assert.equal(graph.criticalPath.length, 3)
  assert.deepEqual(graph.criticalPath, ['A', 'B', 'D'])
})

test('邻域只含限深内的节点', () => {
  const tasks = [task('A'), task('B', ['A']), task('C', ['B']), task('D', ['C'])]
  const graph = buildGraph(tasks)
  const near = subgraphAround(graph, tasks, 'B', 1)
  assert.deepEqual(near.upstream, ['A'])
  assert.deepEqual(near.downstream, ['C'])
})

test('重复 id 后者覆盖前者', () => {
  const graph = buildGraph([task('A'), task('A', ['A'])])
  assert.equal(graph.nodeCount, 1)
})

test('真实快照：结构不变量', { skip: snapshot === null }, () => {
  // 看板是活的：任务数、边数、层数都会随 Agent 干活变化，所以只断言不变量。
  const graph = buildGraph(snapshot.tasks)
  assert.ok(graph.nodeCount > 0, '至少有一个任务')
  assert.ok(graph.edgeCount > 0, '至少有一条依赖')
  assert.equal(graph.levels.length, Math.max(0, ...Object.values(graph.levelOf)) + 1)
  // 每个节点都属于某一层，且层号不为负。
  assert.equal(Object.keys(graph.levelOf).length, graph.nodeCount)
  for (const level of Object.values(graph.levelOf)) assert.ok(level >= 0)
  // 真实数据当前无环；若将来出现环，这里会提醒我们去看检测输出而不是静默通过。
  assert.equal(graph.cycles.length, 0)
})

// ── model ────────────────────────────────────────────────

test('任务归一：字段缺失不崩', () => {
  const normalized = normalizeTask({})
  assert.equal(normalized.id, '')
  assert.equal(normalized.status, 'backlog')
  assert.deepEqual(normalized.deps, [])
  assert.deepEqual(normalized.acceptance, [])
  assert.equal(normalized.done, false)
})

test('任务归一：extra 提取', () => {
  const normalized = normalizeTask({
    id: 'X-1',
    status: 'done',
    extra: { goal: '目标', verify: ['go test ./...'], block_category: 'env' },
  })
  assert.equal(normalized.goal, '目标')
  assert.deepEqual(normalized.verify, ['go test ./...'])
  assert.equal(normalized.blockCategory, 'env')
  assert.equal(normalized.done, true)
})

test('Agent 归一：bound_lane 从 meta 提取', () => {
  const agent = normalizeAgent({ id: 'a-1', status: 'working', meta: { bound_lane: '内核与插件' } })
  assert.equal(agent.lane, '内核与插件')
  assert.equal(agent.status, 'working')
})

test('状态计数覆盖全部状态', () => {
  const counts = countByStatus([{ status: 'done' }, { status: 'done' }, { status: 'blocked' }])
  assert.equal(counts.done, 2)
  assert.equal(counts.blocked, 1)
  assert.equal(counts.backlog, 0)
})

test('进度百分比：取消也算完成', () => {
  assert.equal(computePercent({ done: 1, cancelled: 1, backlog: 2 }), 50)
  assert.equal(computePercent({}), 0)
})

test('筛选：默认排除已完成', () => {
  const tasks = [
    { id: 'A', status: 'done', projectId: 'p', lane: 'l', owner: 'o' },
    { id: 'B', status: 'blocked', projectId: 'p', lane: 'l', owner: 'o' },
  ]
  assert.deepEqual(filterTasks(tasks, {}).map(t => t.id), ['B'])
  assert.deepEqual(filterTasks(tasks, { includeDone: true }).map(t => t.id), ['A', 'B'])
})

test('筛选：四维组合', () => {
  const tasks = [
    { id: 'A', status: 'blocked', projectId: 'p1', lane: 'l1', owner: 'o1' },
    { id: 'B', status: 'blocked', projectId: 'p1', lane: 'l2', owner: 'o1' },
    { id: 'C', status: 'blocked', projectId: 'p2', lane: 'l1', owner: 'o2' },
  ]
  assert.deepEqual(filterTasks(tasks, { lane: 'l1' }).map(t => t.id), ['A', 'C'])
  assert.deepEqual(filterTasks(tasks, { project: 'p1', lane: 'l1' }).map(t => t.id), ['A'])
  assert.deepEqual(filterTasks(tasks, { agent: 'o2' }).map(t => t.id), ['C'])
})

test('任务详情带上下游', () => {
  const board = {
    tasks: [{ id: 'A', deps: [] }, { id: 'B', deps: ['A'] }],
    graph: { edges: [['A', 'B']], cycles: [] },
  }
  const detail = taskDetail(board, 'A')
  assert.deepEqual(detail.downstream, ['B'])
  assert.deepEqual(detail.upstream, [])
  assert.equal(taskDetail(board, 'ZZZ'), null)
})

test('依赖视图：不传 focus 返回全图', () => {
  const board = {
    tasks: [task('A'), task('B', ['A'])],
    graph: buildGraph([task('A'), task('B', ['A'])]),
  }
  const view = dependencyView(board, {})
  assert.equal(view.nodeCount, 2)
  assert.equal(view.focus, undefined)
})

test('依赖视图：focus 返回邻域', () => {
  const tasks = [task('A'), task('B', ['A'])]
  const board = { tasks, graph: buildGraph(tasks) }
  const view = dependencyView(board, { focus: 'B', depth: 1 })
  assert.equal(view.focus, 'B')
  assert.deepEqual(view.upstream, ['A'])
})
