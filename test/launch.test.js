/**
 * 启动按钮的回归测试：判定 + 路由。
 *
 * 三条不能回退的性质：
 *  1) 只有「有可开工的题」且「该工程没有在跑的 MAW 会话」时按钮才可点。
 *  2) 已在执行时的重复点击必须在 Host 侧被挡掉，不能靠界面禁用兜住。
 *  3) 点击后真的会建一个 MAW 模式会话并把启动指令投进去。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chmodSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { apply } from '../index.js'
import { clearCache } from '../lib/maw-exec.js'
import { launchPrompt, launchState, runningInProject, samePath } from '../lib/launch.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const FAKE_MAW = join(HERE, 'fixtures', 'fake-maw.js')
const PROJECT = '/tmp/maw-project'
const MAW = 'maw'

// 假 maw 是在工程目录里被调起的：目录不存在时 execFile 会 ENOENT，
// 那条失败会被归一成「maw 未安装」，测试看起来就像取数失败。
mkdirSync(PROJECT, { recursive: true })
chmodSync(FAKE_MAW, 0o755)

/** 造一个假 agent：只填判定用到的字段。 */
function agent({ id = 's1', status = 'running', cwd = PROJECT, preset = MAW } = {}) {
  return { id, status, session: { header: { cwd, agentPreset: preset } } }
}

/** 造一份最小的看板模型。 */
function board({ frontier = ['T-1'], total = 3, projectId = 'p1' } = {}) {
  return {
    projectPath: PROJECT,
    projects: [{ id: projectId, name: 'demo', path: PROJECT }],
    total,
    tasks: frontier.map(id => ({ id, projectId, status: 'ready' })),
    graph: { frontier },
  }
}

test('samePath：尾部斜杠与空值都不误判', () => {
  assert.equal(samePath('/a/b', '/a/b/'), true)
  assert.equal(samePath('/a/b', '/a/c'), false)
  assert.equal(samePath('', ''), false)
  assert.equal(samePath(undefined, '/a/b'), false)
})

test('runningInProject：只有「同工程 + MAW + running」三条同时成立才算在跑', () => {
  assert.equal(runningInProject([agent()], PROJECT, MAW).length, 1)
  // 别的工程
  assert.equal(runningInProject([agent({ cwd: '/tmp/other' })], PROJECT, MAW).length, 0)
  // 别的 preset
  assert.equal(runningInProject([agent({ preset: 'standard' })], PROJECT, MAW).length, 0)
  // 活着但空闲
  assert.equal(runningInProject([agent({ status: 'idle' })], PROJECT, MAW).length, 0)
  assert.equal(runningInProject(undefined, PROJECT, MAW).length, 0)
})

test('launchState：可开工才放行，执行中与无题都禁用', () => {
  assert.deepEqual(launchState({ frontier: ['T-1'], total: 2 }, []), {
    canLaunch: true, reason: '', frontier: 1, running: 0,
  })
  // 已经在跑：即便还有别的可开工题也不许再开一个会话。
  assert.deepEqual(launchState({ frontier: ['T-1'], total: 2 }, [agent()]), {
    canLaunch: false, reason: 'already-running', frontier: 1, running: 1,
  })
  assert.equal(launchState({ frontier: [], total: 5 }, []).reason, 'nothing-ready')
  assert.equal(launchState({ frontier: [], total: 0 }, []).reason, 'no-tasks')
})

test('launchPrompt：带上工程路径，且不含未替换的占位符', () => {
  const text = launchPrompt(PROJECT)
  assert.match(text, /\/tmp\/maw-project/u)
  assert.doesNotMatch(text, /\{projectPath\}/u)
})

/** 最小的假 ctx：路由 + agents + sessionController。 */
function makeCtx({ agents = [], onCreate, onPrompt } = {}) {
  const routes = new Map()
  const created = []
  const prompts = []
  return {
    routes,
    created,
    prompts,
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
        if (name === 'agents') return { list: () => agents, rootOf: value => value }
        if (name === 'sessionController') {
          return {
            async create(request) {
              const id = onCreate === undefined ? 'new-session' : onCreate(request)
              created.push({ request, id })
              return { sessionId: id, agentPreset: request.agentPreset }
            },
            async prompt(request, signal) {
              // 第二参数必须是 AbortSignal：sessionController.prompt 内部会直接
              // signal.throwIfAborted()，传成 source 对象会在真实环境里炸掉。
              assert.equal(typeof signal?.throwIfAborted, 'function')
              prompts.push(request)
              onPrompt?.(request)
              return { accepted: true }
            },
          }
        }
        return undefined
      },
      logger() { return { info() {}, warn() {}, error() {} } },
    },
  }
}

/** 调一次路由，返回 { status, body }。 */
function call(handler, path, query, method = 'GET') {
  return new Promise((resolve, reject) => {
    const response = {
      writeHead(status) { this.status = status },
      end(text) { resolve({ status: this.status, body: JSON.parse(text) }) },
    }
    Promise.resolve(handler({ method, url: `${path}${query}`, headers: {} }, response)).catch(reject)
  })
}

test('启动路由：执行中返回 409，不建新会话', async () => {
  // 有可开工的题，但该工程已经有一个在跑的 MAW 会话。
  process.env.FAKE_MAW_PROJECT = PROJECT
  process.env.FAKE_MAW_TASKS = 'T-1,T-2'
  chmodSync(FAKE_MAW, 0o755)
  clearCache()

  const { ctx, routes, created } = makeCtx({ agents: [agent()] })
  apply(ctx, { autoInstall: false, mawBinary: FAKE_MAW })

  const res = await call(routes.get('/dsh-maw/api/launch'), '/dsh-maw/api/launch', '?project=p1', 'POST')
  assert.equal(res.status, 409)
  assert.equal(res.body.ok, false)
  assert.equal(res.body.reason, 'already-running')
  assert.equal(created.length, 0, '已在执行时不能创建会话')
})

test('启动路由：有可开工题时建 MAW 会话并投递启动指令', async () => {
  process.env.FAKE_MAW_PROJECT = PROJECT
  process.env.FAKE_MAW_TASKS = 'T-1,T-2'
  chmodSync(FAKE_MAW, 0o755)
  clearCache()

  const { ctx, routes, created, prompts } = makeCtx()
  apply(ctx, { autoInstall: false, mawBinary: FAKE_MAW })

  const res = await call(routes.get('/dsh-maw/api/launch'), '/dsh-maw/api/launch', '?project=p1', 'POST')
  assert.equal(res.status, 200)
  assert.equal(res.body.ok, true)
  assert.equal(res.body.sessionId, 'new-session')
  // 启动之后按钮立刻转为禁用，避免同一拍内再点一次。
  assert.equal(res.body.launch.canLaunch, false)
  assert.equal(created.length, 1)
  assert.equal(created[0].request.agentPreset, MAW)
  assert.equal(created[0].request.cwd, PROJECT)
  assert.equal(prompts.length, 1)
  const promptText = prompts[0].content[0].text
  assert.match(promptText, /\/tmp\/maw-project/u)
  // 启动指令必须带上工程 id，并要求工具调用带 project 参数 —— 否则 MAW 模式
  // 会读到别的工程的队列（隔离靠这段文字 + 工具侧默认值双保险）。
  assert.match(promptText, /id p1/u, promptText)
  assert.match(promptText, /project="p1"/u, promptText)
  assert.equal(prompts[0].mode, 'queue')
  assert.equal(typeof prompts[0].requestId, 'string')
})

test('启动路由：没有可开工的题时 409，不建会话', async () => {
  process.env.FAKE_MAW_PROJECT = PROJECT
  process.env.FAKE_MAW_TASKS = ''
  chmodSync(FAKE_MAW, 0o755)
  clearCache()

  const { ctx, routes, created } = makeCtx()
  apply(ctx, { autoInstall: false, mawBinary: FAKE_MAW })

  const res = await call(routes.get('/dsh-maw/api/launch'), '/dsh-maw/api/launch', '?project=p1', 'POST')
  assert.equal(res.status, 409)
  assert.equal(res.body.reason, 'no-tasks')
  assert.equal(created.length, 0)
})

test('看板路由：随数据下发 launch 字段', async () => {
  process.env.FAKE_MAW_PROJECT = PROJECT
  process.env.FAKE_MAW_TASKS = 'T-1'
  chmodSync(FAKE_MAW, 0o755)
  clearCache()

  const { ctx, routes } = makeCtx()
  apply(ctx, { autoInstall: false, mawBinary: FAKE_MAW })

  const res = await call(routes.get('/dsh-maw/api/board'), '/dsh-maw/api/board', '?project=p1')
  assert.equal(res.status, 200)
  assert.ok(res.body.launch !== undefined, 'board 必须带 launch')
  assert.equal(res.body.launch.canLaunch, true)
  assert.equal(res.body.launch.frontier, 1)
})