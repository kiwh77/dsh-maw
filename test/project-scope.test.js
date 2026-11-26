/**
 * 工程作用域的单元测试。
 *
 * 背景：看板的数据分两步取——先决定「跑哪个工程的 maw 子命令」，再按
 * 工程 id 过滤任务。两步用的工程必须是同一个。一旦前者只看会话目录、
 * 后者看请求参数，切工程后就会出现「本工程的题被另一个工程的任务集筛掉」，
 * 界面表现为「没有符合条件的任务」。
 *
 * 所以这里钉住 resolveProjectPath 的约定：显式给了工程 id，就取它。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { resolveProjectPath, filterTasks, normalizeTask } from '../lib/model.js'

/** 登记表：顺序刻意把另一个工程排在前面。 */
const registered = [
  { project_id: 'aaa', project_name: 'niuma-buddy', project_path: '/w/niuma-buddy' },
  { project_id: 'bbb', project_name: 'trand', project_path: '/w/trand' },
]

test('显式工程 id 决定取数工程，不被登记顺序顶掉', () => {
  // cwd 不属于任何登记工程时，旧逻辑取登记表第一项 → 取到 aaa 的题。
  assert.equal(resolveProjectPath({ projects: [] }, '/elsewhere', registered, 'bbb'), '/w/trand')
})

test('显式工程 id 压过配置里的工程', () => {
  assert.equal(resolveProjectPath({ projects: ['/configured'] }, '/elsewhere', registered, 'bbb'), '/w/trand')
})

test('显式工程 id 压过会话目录命中的工程', () => {
  assert.equal(resolveProjectPath({ projects: [] }, '/w/niuma-buddy/sub', registered, 'bbb'), '/w/trand')
})

test('工程 id 不认识时退回原有规则', () => {
  assert.equal(resolveProjectPath({ projects: [] }, '/elsewhere', registered, 'missing'), '/w/niuma-buddy')
  assert.equal(resolveProjectPath({ projects: ['/configured'] }, '/elsewhere', registered, 'missing'), '/configured')
  assert.equal(resolveProjectPath({ projects: [] }, '/w/niuma-buddy/sub', registered, 'missing'), '/w/niuma-buddy')
})

test('不传工程 id 时行为不变', () => {
  assert.equal(resolveProjectPath({ projects: [] }, '/w/trand', registered), '/w/trand')
})

test('按工程 id 过滤只留该工程的题（空看板的直接来源）', () => {
  const tasks = [
    normalizeTask({ id: 'A-1', project_id: 'aaa', status: 'backlog' }),
    normalizeTask({ id: 'B-1', project_id: 'bbb', status: 'backlog' }),
    normalizeTask({ id: 'B-2', project_id: 'bbb', status: 'in_progress' }),
  ]
  assert.deepEqual(filterTasks(tasks, { project: 'bbb' }).map(item => item.id), ['B-1', 'B-2'])
  // 取数取到了 aaa、过滤却按 bbb —— 就是用户看到的空列表。
  assert.deepEqual(filterTasks(tasks.filter(item => item.projectId === 'aaa'), { project: 'bbb' }), [])
})
