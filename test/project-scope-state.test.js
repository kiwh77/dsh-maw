/**
 * 「只展示当前工作区的工程」的回归测试。
 *
 * 三条性质：
 *  1) 工程归属以会话**真实 cwd** 为准，而不是猜会话目录名。
 *  2) 会话在工程的子目录里运行时，仍算这个工程。
 *  3) 当前工作区不是 maw 工程时，看板不展示任何工程内容（matched=false）。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { apply, matchProjectByCwd, resolveSessionProject } from '../index.js'

const PROJECTS = [
  { id: 'p-repo', name: 'repo', path: '/work/repo' },
  { id: 'p-sub', name: 'sub', path: '/work/repo/sub' },
  { id: 'p-other', name: 'other', path: '/work/other' },
]

test('matchProjectByCwd：目录恰好相等时命中', () => {
  assert.equal(matchProjectByCwd('/work/repo', PROJECTS)?.id, 'p-repo')
})

test('matchProjectByCwd：子目录归给最长匹配的工程', () => {
  // /work/repo/sub 同时是 p-repo 的子目录和 p-sub 本身的目录，取更具体的那个。
  assert.equal(matchProjectByCwd('/work/repo/sub', PROJECTS)?.id, 'p-sub')
  assert.equal(matchProjectByCwd('/work/repo/sub/pkg/x', PROJECTS)?.id, 'p-sub')
  assert.equal(matchProjectByCwd('/work/repo/packages/x', PROJECTS)?.id, 'p-repo')
})

test('matchProjectByCwd：尾部斜杠不影响判定', () => {
  assert.equal(matchProjectByCwd('/work/repo/', PROJECTS)?.id, 'p-repo')
})

test('matchProjectByCwd：不在任何工程里的目录返回 null', () => {
  assert.equal(matchProjectByCwd('/work/unregistered', PROJECTS), null)
  // 前缀相同但不是子路径，不能误判为「在工程里」。
  assert.equal(matchProjectByCwd('/work/repository', PROJECTS), null)
  assert.equal(matchProjectByCwd('', PROJECTS), null)
})

test('resolveSessionProject：拿得到真实 cwd 时以它为准', async () => {
  const hit = await resolveSessionProject(
    'sess-1',
    PROJECTS,
    cwd => matchProjectByCwd(cwd, PROJECTS),
    async () => '/work/other',
  )
  assert.equal(hit?.id, 'p-other')
})

test('resolveSessionProject：真实 cwd 不属于任何工程时返回 null，不回退去猜目录名', async () => {
  // 这一点很关键：如果 cwd 明确不在任何工程里，就不该再用目录名探测
  // 把某个不相干的工程认领回来 —— 那正是「显示了别的工程」的来源。
  const hit = await resolveSessionProject(
    'sess-2',
    PROJECTS,
    cwd => matchProjectByCwd(cwd, PROJECTS),
    async () => '/tmp/not-a-maw-project',
  )
  assert.equal(hit, null)
})

test('resolveSessionProject：读不到 cwd 时退回目录名探测（不抛）', async () => {
  const hit = await resolveSessionProject(
    'sess-3',
    PROJECTS,
    cwd => matchProjectByCwd(cwd, PROJECTS),
    async () => { throw new Error('boom') },
  )
  // 本机没有该会话的目录，所以只要求「不抛且为 null」。
  assert.equal(hit, null)
})

/** 最小的假 ctx，可注入 sessionQuery。 */
function makeCtx({ sessionCwd = null } = {}) {
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
        if (name === 'workingDirectory') return { defaultDirectory: process.cwd() }
        if (name === 'agents') return { list: () => [], rootOf: value => value }
        if (name === 'sessionQuery') {
          return {
            async filterSessions(filters) {
              const wanted = filters.find(item => item.kind === 'id')?.values ?? []
              if (wanted.length === 0) return []
              return [{ header: { id: wanted[0], cwd: sessionCwd }, live: false, persisted: true }]
            },
          }
        }
        return undefined
      },
      logger() { return { info() {}, warn() {}, error() {} } },
    },
  }
}

/** 调一次路由。 */
function call(handler, path, query) {
  return new Promise((resolve, reject) => {
    const response = {
      writeHead(status) { this.status = status },
      end(text) { resolve({ status: this.status, body: JSON.parse(text) }) },
    }
    Promise.resolve(handler({ method: 'GET', url: `${path}${query}`, headers: {} }, response)).catch(reject)
  })
}

test('看板路由：会话 cwd 不是 maw 工程时 matched=false 且不返回任何任务', async () => {
  const { ctx, routes } = makeCtx({ sessionCwd: '/tmp/definitely-not-a-maw-project' })
  apply(ctx, { autoInstall: false })

  const res = await call(routes.get('/dsh-maw/api/board'), '/dsh-maw/api/board', '?session=sess-x')
  assert.equal(res.status, 200)
  assert.equal(res.body.matched, false)
  assert.deepEqual(res.body.tasks, [])
  assert.deepEqual(res.body.projects, [])
  // 未匹配时不该给出任何动作入口。
  assert.equal(res.body.launch.canLaunch, false)
  assert.equal(res.body.launch.reason, 'unregistered')
  assert.deepEqual(res.body.actions, [])
})