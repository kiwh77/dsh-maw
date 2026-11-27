/**
 * 迭代筛选的单元测试。
 *
 * 背景：页面改成「迭代栏 + 内容区」之后，内容区只展示当前迭代的题。
 * 这条约束一旦漏掉，用户切到某个迭代却看到别的迭代的卡片，界面看起来就是错的；
 * 而未归迭代（`iteration_id` 为空）又必须能被单独选中 —— 它和「全部迭代」
 * 不能共用同一个值，否则两者会同时命中。
 *
 * 所以这里钉住两件事：
 *  1. filterTasks 的 iteration 参数按迭代 id 精确过滤；
 *  2. countByIteration 把未归迭代单独计数，不静默丢弃。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { filterTasks, countByIteration, normalizeTask, resolveIterationFilter } from '../lib/model.js'

/** 造一批任务：两个迭代 + 未归迭代 + 已完成。 */
const tasks = [
  normalizeTask({ id: 'A-1', project_id: 'p1', title: 'a1', iteration_id: 'IT-A', status: 'ready' }),
  normalizeTask({ id: 'A-2', project_id: 'p1', title: 'a2', iteration_id: 'IT-A', status: 'backlog' }),
  normalizeTask({ id: 'B-1', project_id: 'p1', title: 'b1', iteration_id: 'IT-B', status: 'ready' }),
  normalizeTask({ id: 'N-1', project_id: 'p1', title: 'n1', status: 'ready' }),
  normalizeTask({ id: 'A-DONE', project_id: 'p1', title: 'ad', iteration_id: 'IT-A', status: 'done' }),
  normalizeTask({ id: 'X-1', project_id: 'p2', title: 'x1', iteration_id: 'IT-A', status: 'ready' }),
]

test('按迭代过滤只留该迭代的题', () => {
  const ids = filterTasks(tasks, { project: 'p1', iteration: 'IT-A', includeDone: true }).map(task => task.id)
  assert.deepEqual(ids, ['A-1', 'A-2', 'A-DONE'])
})

test('不给迭代参数时行为不变（全部迭代）', () => {
  const ids = filterTasks(tasks, { project: 'p1' }).map(task => task.id)
  assert.deepEqual(ids, ['A-1', 'A-2', 'B-1', 'N-1'])
})

test('迭代过滤同样受工程约束，不串工程', () => {
  const ids = filterTasks(tasks, { project: 'p1', iteration: 'IT-A', includeDone: true }).map(task => task.id)
  assert.ok(!ids.includes('X-1'))
})

test('迭代过滤与状态筛选叠加', () => {
  const ids = filterTasks(tasks, { project: 'p1', iteration: 'IT-A', status: 'ready' }).map(task => task.id)
  assert.deepEqual(ids, ['A-1'])
})

test('countByIteration 把未归迭代单独计数', () => {
  const counts = countByIteration(tasks, 'p1')
  assert.equal(counts['IT-A'], 3)
  assert.equal(counts['IT-B'], 1)
  // 未归迭代用空串作键：界面据此单列「未归迭代」，而不是丢掉这些题。
  assert.equal(counts[''], 1)
})

test('countByIteration 不统计别的工程的题', () => {
  const counts = countByIteration(tasks, 'p1')
  assert.equal(Object.values(counts).reduce((sum, n) => sum + n, 0), 5)
})
test('iteration 查询参数：空与 __all__ 表示全部迭代', () => {
  assert.deepEqual(resolveIterationFilter(''), { kind: 'all', id: '' })
  assert.deepEqual(resolveIterationFilter('__all__'), { kind: 'all', id: '' })
  assert.deepEqual(resolveIterationFilter(undefined), { kind: 'all', id: '' })
})

test('__none__ 专指未归迭代，不能与「全部」混用', () => {
  assert.deepEqual(resolveIterationFilter('__none__'), { kind: 'none', id: '' })
})

test('其余取值按迭代 id 精确匹配', () => {
  assert.deepEqual(resolveIterationFilter('IT-ARCH-001'), { kind: 'one', id: 'IT-ARCH-001' })
  assert.deepEqual(resolveIterationFilter('  IT-X  '), { kind: 'one', id: 'IT-X' })
})
