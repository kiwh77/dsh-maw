/**
 * 工具侧工程隔离的回归测试。
 *
 * 背景：`maw_board` / `maw_task` / `maw_deps` 早先取数时传的是「部署级默认
 * 目录」而不是调用会话自己的目录，于是 MAW 会话里的工具会读到别的工程
 * （甚至全局）的队列。这里的测试锁死两条性质：
 *
 *  1) 不传 project 时，只查调用会话自己的工程。
 *  2) 会话不属于任何 maw 工程时，明确报「无法列出任务」，绝不用别的工程顶替。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chmodSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { apply } from '../index.js'
import { clearCache } from '../lib/maw-exec.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const FAKE_MAW = join(HERE, 'fixtures', 'fake-maw.js')
const PROJECT = '/tmp/maw-project'
// 部署级默认目录：故意设成另一个路径，用来抓「工具读默认目录」这个回归。
const ELSEWHERE = '/tmp/maw-elsewhere'
// 一个存在但没登记进 maw 的目录：验证「不属于任何工程」的分支。
const UNRELATED = '/tmp/maw-not-any-project'

mkdirSync(PROJECT, { recursive: true })
mkdirSync(ELSEWHERE, { recursive: true })
mkdirSync(UNRELATED, { recursive: true })
chmodSync(FAKE_MAW, 0o755)

/** 设好假 maw 的环境并清缓存。 */
function scenario(env = {}) {
  process.env.FAKE_MAW_PROJECT = PROJECT
  process.env.FAKE_MAW_TASKS = env.tasks ?? 'T-1,T-2'
  process.env.FAKE_MAW_REGISTERED = env.registered ?? '1'
  clearCache()
}

/**
 * 建一个能注册工具、并能按 agent 返回会话目录的假 ctx。
 * @param {{cwd: string}} input agent 的会话目录
 */
function makeCtx({ cwd }) {
  const tools = new Map()
  return {
    tools,
    ctx: {
      tools: {
        register(definition) {
          tools.set(definition.name, definition)
          return () => {}
        },
      },
      webServer: { register() { return () => {} } },
      effect(fn) {
        const dispose = fn()
        return typeof dispose === 'function' ? dispose : () => {}
      },
      on() { return () => {} },
      get(name) {
        if (name === 'workingDirectory') {
          return {
            // 会话自己的目录：工具必须用它，而不是 defaultDirectory。
            get: () => cwd,
            defaultDirectory: ELSEWHERE,
          }
        }
        if (name === 'agents') return { list: () => [], rootOf: value => value }
        return undefined
      },
      logger() { return { info() {}, warn() {}, error() {} } },
    },
  }
}

/** 跑一个工具。 */
async function runTool(tools, name, args, agent) {
  const tool = tools.get(name)
  assert.ok(tool, `工具 ${name} 应当注册`)
  return tool.execute(args, { agent, signal: undefined })
}

test('maw_board：不传 project 时按会话自己的工程取数', async () => {
  scenario()
  const { ctx, tools } = makeCtx({ cwd: PROJECT })
  apply(ctx, { autoInstall: false, mawBinary: FAKE_MAW })

  const text = await runTool(tools, 'maw_board', {}, { id: 's1' })
  assert.match(text, /\/tmp\/maw-project/u, `应显示本工程路径：${text}`)
  assert.match(text, /T-1/u, '应列出本工程的题')
})

test('maw_board：会话在工程子目录里也算这个工程', async () => {
  scenario()
  const sub = join(PROJECT, 'packages', 'x')
  mkdirSync(sub, { recursive: true })
  const { ctx, tools } = makeCtx({ cwd: sub })
  apply(ctx, { autoInstall: false, mawBinary: FAKE_MAW })

  const text = await runTool(tools, 'maw_board', {}, { id: 's1' })
  assert.match(text, /T-1/u, `子目录也应看到本工程的题：${text}`)
})

test('maw_board：会话不在任何工程里时明确拒绝，不退回全局', async () => {
  scenario()
  const { ctx, tools } = makeCtx({ cwd: UNRELATED })
  apply(ctx, { autoInstall: false, mawBinary: FAKE_MAW })

  const text = await runTool(tools, 'maw_board', {}, { id: 's1' })
  assert.match(text, /无法确定要查的工程/u, text)
  // 关键：绝不能把某个工程的题端上来。
  assert.doesNotMatch(text, /T-1/u, `不该出现任何任务：${text}`)
})

test('maw_board：显式 project 参数可以读别的工程', async () => {
  scenario()
  const { ctx, tools } = makeCtx({ cwd: UNRELATED })
  apply(ctx, { autoInstall: false, mawBinary: FAKE_MAW })

  // 假 maw 只登记一个工程 p1，显式点名 p1 应当能读到。
  const text = await runTool(tools, 'maw_board', { project: 'p1' }, { id: 's1' })
  assert.match(text, /T-1/u, `显式点名时应当读到：${text}`)
})

test('maw_task：不传 project 时按会话工程解析任务', async () => {
  scenario()
  const { ctx, tools } = makeCtx({ cwd: PROJECT })
  apply(ctx, { autoInstall: false, mawBinary: FAKE_MAW })

  const text = await runTool(tools, 'maw_task', { id: 'T-1' }, { id: 's1' })
  assert.match(text, /T-1/u, text)
})

test('maw_task：会话不属于任何工程时不查询', async () => {
  scenario()
  const { ctx, tools } = makeCtx({ cwd: UNRELATED })
  apply(ctx, { autoInstall: false, mawBinary: FAKE_MAW })

  const text = await runTool(tools, 'maw_task', { id: 'T-1' }, { id: 's1' })
  assert.match(text, /无法确定要查的工程/u, text)
})

test('maw_deps：不传 project 时按会话工程取拓扑', async () => {
  scenario()
  const { ctx, tools } = makeCtx({ cwd: PROJECT })
  apply(ctx, { autoInstall: false, mawBinary: FAKE_MAW })

  const text = await runTool(tools, 'maw_deps', {}, { id: 's1' })
  assert.match(text, /T-1/u, text)
})

test('maw_deps：会话不属于任何工程时不查询', async () => {
  scenario()
  const { ctx, tools } = makeCtx({ cwd: UNRELATED })
  apply(ctx, { autoInstall: false, mawBinary: FAKE_MAW })

  const text = await runTool(tools, 'maw_deps', {}, { id: 's1' })
  assert.match(text, /无法确定要查的工程/u, text)
})

test('maw_board：默认目录里的别的工程不会串进来', async () => {
  // defaultDirectory 设成 ELSEWHERE，而会话在 PROJECT。
  // 若工具误用默认目录，取数会脱离本工程；这里断言它仍然读 PROJECT。
  scenario()
  const { ctx, tools } = makeCtx({ cwd: PROJECT })
  apply(ctx, { autoInstall: false, mawBinary: FAKE_MAW })

  const text = await runTool(tools, 'maw_board', {}, { id: 's1' })
  assert.doesNotMatch(text, /maw-elsewhere/u, `不该读到默认目录：${text}`)
  assert.match(text, /maw-project/u, text)
})