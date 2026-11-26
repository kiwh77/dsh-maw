/**
 * 预览按钮的回归测试。
 *
 * 这几条性质必须一直成立：
 *  1) 只有白名单里的三条命令能跑，带 --yes / --apply 的一律拒绝。
 *  2) 未登记的工程既不跑命令，也不把按钮露出来。
 *  3) 摘要如实反映输出，失败时不抛异常。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chmodSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { apply } from '../index.js'
import { clearCache, isAllowedPreview } from '../lib/maw-exec.js'
import { runPreview } from '../lib/preview.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const FAKE_MAW = join(HERE, 'fixtures', 'fake-maw.js')
const PROJECT = '/tmp/maw-project'

mkdirSync(PROJECT, { recursive: true })
chmodSync(FAKE_MAW, 0o755)

/** 一次性设好环境并清缓存：假 maw 的输出由环境变量决定。 */
function scenario(env) {
  process.env.FAKE_MAW_PROJECT = PROJECT
  for (const [key, value] of Object.entries(env)) process.env[key] = value
  clearCache()
}

/** 最小的假 ctx。 */
function makeCtx({ agents = [] } = {}) {
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
        if (name === 'agents') return { list: () => agents, rootOf: value => value }
        return undefined
      },
      logger() { return { info() {}, warn() {}, error() {} } },
    },
  }
}

/** 调一次路由。 */
function call(handler, path, query, method = 'GET') {
  return new Promise((resolve, reject) => {
    const response = {
      writeHead(status) { this.status = status },
      end(text) { resolve({ status: this.status, body: JSON.parse(text) }) },
    }
    Promise.resolve(handler({ method, url: `${path}${query}`, headers: {} }, response)).catch(reject)
  })
}

test('预览白名单：三条安全命令放行，带破坏性参数的一律拒绝', () => {
  for (const args of [['doctor'], ['prune'], ['reconcile']]) {
    assert.equal(isAllowedPreview(args), true, args.join(' '))
  }
  const denied = [
    ['prune', '--yes'],
    ['prune', '--history'],
    ['prune', '--force-unmerged'],
    ['reconcile', '--apply'],
    ['next', '--claim'],
    ['submit'],
    ['merge', '--yes'],
    ['task', 'cancel', 'T-1'],
    ['project', 'rm', 'p1'],
    [],
  ]
  for (const args of denied) {
    assert.equal(isAllowedPreview(args), false, args.join(' '))
  }
})

test('runPreview：doctor 如实报问题数', async () => {
  scenario({ FAKE_MAW_DOCTOR_ISSUES: '2' })
  const result = await runPreview({ id: 'doctor', projectPath: PROJECT, binary: FAKE_MAW })
  assert.equal(result.ok, true)
  assert.match(result.summary, /2 个问题/u)
  // 版本与协议号要出现在明细里，方便人一眼核对。
  assert.ok(result.lines.some(line => line.includes('0.4.1')), JSON.stringify(result.lines))
})

test('runPreview：doctor 无问题时给通过文案', async () => {
  scenario({ FAKE_MAW_DOCTOR_ISSUES: '0' })
  const result = await runPreview({ id: 'doctor', projectPath: PROJECT, binary: FAKE_MAW })
  assert.equal(result.ok, true)
  assert.match(result.summary, /没有发现问题/u)
})

test('runPreview：prune 预览如实说明「未删除」', async () => {
  scenario({ FAKE_MAW_PRUNE_ITEMS: '3' })
  const result = await runPreview({ id: 'prune', projectPath: PROJECT, binary: FAKE_MAW })
  assert.equal(result.ok, true)
  assert.match(result.summary, /3 项/u)
  assert.match(result.summary, /未删除/u)
})

test('runPreview：reconcile 报告不一致处数，并标出可修复项', async () => {
  scenario({ FAKE_MAW_RECONCILE_FINDINGS: '2' })
  const result = await runPreview({ id: 'reconcile', projectPath: PROJECT, binary: FAKE_MAW })
  assert.equal(result.ok, true)
  assert.match(result.summary, /2 处/u)
  assert.ok(result.lines.some(line => line.includes('可修复')), JSON.stringify(result.lines))
})

test('runPreview：未知动作不执行命令', async () => {
  scenario({})
  const result = await runPreview({ id: 'prune-yes', projectPath: PROJECT, binary: FAKE_MAW })
  assert.equal(result.ok, false)
  assert.match(result.error, /未知动作/u)
})

test('runPreview：maw 报错时归一成 error，并带上它的 next 提示', async () => {
  scenario({})
  const result = await runPreview({ id: 'doctor', projectPath: '/tmp/definitely-not-a-repo', binary: FAKE_MAW })
  // 目录不存在 → execFile ENOENT 或 maw 自己的错误信封，两者都必须变成 ok:false。
  assert.equal(result.ok, false)
  assert.ok(result.error !== '', '必须有可读的失败原因')
})

test('未登记工程：看板里 registered=false，启动不可用', async () => {
  scenario({ FAKE_MAW_REGISTERED: '0', FAKE_MAW_TASKS: 'T-1' })
  const { ctx, routes } = makeCtx()
  apply(ctx, { autoInstall: false, mawBinary: FAKE_MAW })

  const res = await call(routes.get('/dsh-maw/api/board'), '/dsh-maw/api/board', '?project=p1')
  assert.equal(res.status, 200)
  assert.equal(res.body.launch.registered, false)
  assert.equal(res.body.launch.canLaunch, false)
  assert.equal(res.body.launch.reason, 'unregistered')
})

test('未登记工程：预览路由直接拒绝，不跑命令', async () => {
  scenario({ FAKE_MAW_REGISTERED: '0' })
  const { ctx, routes } = makeCtx()
  apply(ctx, { autoInstall: false, mawBinary: FAKE_MAW })

  const res = await call(routes.get('/dsh-maw/api/preview'), '/dsh-maw/api/preview', '?action=doctor&project=p1', 'POST')
  assert.equal(res.status, 409)
  assert.equal(res.body.ok, false)
  assert.match(res.body.error, /未在 maw 登记/u)
})

test('已登记工程：预览路由跑得通并回摘要', async () => {
  scenario({ FAKE_MAW_REGISTERED: '1', FAKE_MAW_DOCTOR_ISSUES: '0' })
  const { ctx, routes } = makeCtx()
  apply(ctx, { autoInstall: false, mawBinary: FAKE_MAW })

  const res = await call(routes.get('/dsh-maw/api/preview'), '/dsh-maw/api/preview', '?action=doctor&project=p1', 'POST')
  assert.equal(res.status, 200)
  assert.equal(res.body.ok, true)
  assert.equal(res.body.id, 'doctor')
  assert.ok(res.body.summary !== '')
})