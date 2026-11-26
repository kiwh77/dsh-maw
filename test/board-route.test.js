/**
 * 看板路由的回归测试：按工程取数。
 *
 * 逻辑链路：`/board?project=<id>` → 在**该工程目录**里跑 maw 取数 → 按同一个
 * 工程 id 过滤。两步必须是同一个工程，否则「取 A 的题、按 B 的 id 筛」会恒为空，
 * 界面表现为「没有符合条件的任务」。
 *
 * 这条测试读本机真实的 maw 登记表：没有 maw 或没有登记工程时自动跳过，
 * 所以对干净机器 / CI 无害。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { apply } from '../index.js'
import { loadProjects } from '../lib/model.js'

const TERMINAL = new Set(['done', 'cancelled'])

/** 最小的假 ctx：只实现插件用到的那几个服务。 */
function makeCtx() {
  const routes = new Map()
  return {
    routes,
    ctx: {
      tools: { register() {} },
      webServer: {
        register({ path, handler }) {
          routes.set(path, handler)
          return () => {}
        },
      },
      effect(fn) {
        const dispose = fn()
        return typeof dispose === 'function' ? dispose : () => {}
      },
      on() { return () => {} },
      get(name) {
        return name === 'workingDirectory' ? { defaultDirectory: process.cwd() } : undefined
      },
      logger() { return { info() {}, warn() {}, error() {} } },
    },
  }
}

/** 调一次只读路由，返回 { status, body }。 */
function call(handler, path, query) {
  return new Promise((resolve, reject) => {
    const response = {
      writeHead(status) { this.status = status },
      end(text) { resolve({ status: this.status, body: JSON.parse(text) }) },
    }
    Promise.resolve(handler({ method: 'GET', url: `${path}${query}`, headers: {} }, response)).catch(reject)
  })
}

test('看板路由：每个工程的取数与过滤指向同一个工程', async t => {
  // autoInstall: false —— 测试里绝不触发安装。
  const { ctx, routes } = makeCtx()
  apply(ctx, { autoInstall: false })

  const boardRoute = routes.get('/dsh-maw/api/board')
  assert.ok(boardRoute, '看板路由应当注册成功')

  const projects = await loadProjects({ timeoutMs: 8000, cacheMs: 0 }, process.cwd())
  if (projects.length === 0) {
    t.skip('本机没有已登记的 maw 工程')
    return
  }

  for (const project of projects.slice(0, 3)) {
    const all = await call(boardRoute, '/dsh-maw/api/board', `?project=${project.id}&includeDone=true`)
    assert.equal(all.status, 200)
    // 取数工程必须就是点名的那个工程。
    assert.equal(all.body.projectPath, project.path, `工程 ${project.name} 取数目录不对`)
    // 题也必须都属于这个工程。
    assert.ok(
      all.body.tasks.every(task => task.projectId === project.id),
      `工程 ${project.name} 的看板混入了别的工程的题`,
    )

    const open = all.body.tasks.filter(task => !TERMINAL.has(task.status)).length
    if (open === 0) continue
    // 有未完成的题时默认视图不能是空的 —— 这正是「没有符合条件的任务」的回归点。
    const visible = await call(boardRoute, '/dsh-maw/api/board', `?project=${project.id}`)
    assert.ok(visible.body.tasks.length > 0, `工程 ${project.name} 有 ${open} 道未完成题，看板却是空的`)
  }
})
