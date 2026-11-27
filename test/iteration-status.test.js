/**
 * 迭代状态推导的单元测试。
 *
 * 背景：maw 不会在题做完后自动关迭代，库里状态长期停在 `running`，
 * 所以界面上所有迭代都显示「进行中」。看板要能反映真实进度，只能在
 * Host 侧按任务完成度推导。这里钉住推导规则，避免以后又退回「全都进行中」。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { deriveIterationStatus, buildIterations, normalizeTask } from '../lib/model.js'

const counts = (overrides = {}) => ({
  backlog: 0, ready: 0, in_progress: 0, merging: 0, blocked: 0, done: 0, cancelled: 0,
  ...overrides,
})

test('题全部完成时迭代算已完成，即使 maw 记录还是 running', () => {
  const result = deriveIterationStatus('running', counts({ done: 61, cancelled: 1 }))
  assert.equal(result.status, 'done')
  assert.equal(result.derived, true)
})

test('还有在跑的题就算进行中', () => {
  const result = deriveIterationStatus('running', counts({ done: 20, in_progress: 1, backlog: 10 }))
  assert.equal(result.status, 'running')
})

test('只剩可开工的题也算进行中（活已经能动了）', () => {
  assert.equal(deriveIterationStatus('running', counts({ done: 3, ready: 2 })).status, 'running')
})

test('全都卡住时算阻塞', () => {
  assert.equal(deriveIterationStatus('running', counts({ blocked: 4 })).status, 'blocked')
})

test('只有待办的题算规划中', () => {
  assert.equal(deriveIterationStatus('running', counts({ backlog: 6 })).status, 'planning')
})

test('maw 已显式关闭的迭代以记录值为准，不被任务数推翻', () => {
  const result = deriveIterationStatus('closed', counts({ backlog: 3 }))
  assert.equal(result.status, 'closed')
  assert.equal(result.derived, false)
})

test('没有题的迭代在列表里标成 empty，不冒充进行中', () => {
  // maw 里这类迭代记录值常常还是 running，直接透传会让人以为它在推进。
  const iterations = buildIterations(
    [{ project_id: 'p1', id: 'IT-EMPTY', name: '空迭代', status: 'running' }],
    'p1',
    [],
  )
  assert.equal(iterations[0].status, 'empty')
  assert.equal(iterations[0].recordedStatus, 'running')
  assert.equal(iterations[0].total, 0)
})

test('buildIterations 只收本工程的迭代，并带上题数与完成度', () => {
  const tasks = [
    normalizeTask({ id: 'A-1', project_id: 'p1', title: 'a1', iteration_id: 'IT-A', status: 'done' }),
    normalizeTask({ id: 'A-2', project_id: 'p1', title: 'a2', iteration_id: 'IT-A', status: 'ready' }),
    normalizeTask({ id: 'B-1', project_id: 'p2', title: 'b1', iteration_id: 'IT-A', status: 'done' }),
  ]
  const snapshot = [
    { project_id: 'p1', id: 'IT-A', name: '甲', status: 'running' },
    { project_id: 'p2', id: 'IT-OTHER', name: '乙', status: 'running' },
  ]
  const iterations = buildIterations(snapshot, 'p1', tasks)
  assert.equal(iterations.length, 1)
  const [first] = iterations
  assert.equal(first.id, 'IT-A')
  assert.equal(first.total, 2)
  assert.equal(first.done, 1)
  // 只算 p1 的题：B-1 属于 p2，不能计进来，否则完成度会被别的工程拉偏。
  assert.equal(first.counts.done, 1)
  assert.equal(first.status, 'running')
  assert.equal(first.percent, 50)
})

test('normalizeTask 带出执行思路类字段', () => {
  const task = normalizeTask({
    id: 'X-1',
    title: 'x',
    status: 'blocked',
    blocked_reason: '等待接口确认',
    prev_status: 'in_progress',
    revision: 3,
    instance_id: 'ti_abc',
    extra: {
      goal: '现状：没有入口。目标：补入口。',
      not_doing: ['不改接口'],
      verify: ['npm test'],
      delivery_strategy: 'manual_client_compat',
      run_id: 'run_1',
      delivery_id: 'dlv_1',
      block_category: 'dependency',
      cancel_reason: 'out_of_scope',
      superseded_by: 'X-2',
      scope_expand_reason: '需要追加一条路由',
      scope_expanded_at: '2026-11-26T03:47:03Z',
      block_history: [{ at: '2026-11-25T08:02:17Z', reason: '[dependency] 等接口' }, { reason: '' }],
    },
  })
  assert.equal(task.goal, '现状：没有入口。目标：补入口。')
  assert.deepEqual(task.notDoing, ['不改接口'])
  assert.equal(task.deliveryStrategy, 'manual_client_compat')
  assert.equal(task.blockCategory, 'dependency')
  assert.equal(task.supersededBy, 'X-2')
  assert.equal(task.prevStatus, 'in_progress')
  // 空 reason 的坏条目要丢掉，别在详情里留一行空白。
  assert.equal(task.blockHistory.length, 1)
  assert.equal(task.blockHistory[0].at, '2026-11-25T08:02:17Z')
  assert.equal(task.instanceId, 'ti_abc')
})
