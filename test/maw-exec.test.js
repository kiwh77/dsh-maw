/**
 * 执行器只读白名单的回归测试。
 *
 * 背景：白名单里曾同时列着 `node list` 与 `stats`，而这两条在 maw 里都已经
 * 走不通 —— `node` 子命令在 maw 0.5.0 被整个删掉（0.4.1 也已无该命令），
 * `stats` 则是不带 JSON 输出的父命令（只打印帮助）。两者留着就是给未来的
 * 调用方埋坑：白名单说「能用」，真跑起来却是 `unknown command` 或帮助文本。
 *
 * 这里锁死两条性质：
 *  1) 白名单只放行真实存在且会输出 JSON 的只读命令。
 *  2) 已从 maw 移除的子命令被拒，而不是放行后由 maw 报错。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { isReadOnly, isAllowedPreview, isAllowedWrite } from '../lib/maw-exec.js'

test('放行看板实际用到的只读命令', () => {
  for (const args of [
    ['board'],
    ['task', 'list'],
    ['task', 'show', 'T-1'],
    ['agents'],
    ['project', 'list'],
    ['iteration', 'list'],
  ]) {
    assert.equal(isReadOnly(args), true, args.join(' '))
  }
})

test('maw 已移除的子命令不再放行', () => {
  // `node` 在 maw 0.5.0 被删除；`stats` 是不输出 JSON 的父命令。
  assert.equal(isReadOnly(['node', 'list']), false)
  assert.equal(isReadOnly(['node', 'register']), false)
  assert.equal(isReadOnly(['stats']), false)
})

test('写命令只放行压入蓝图', () => {
  assert.equal(isAllowedWrite(['plan', 'check']), true)
  assert.equal(isAllowedWrite(['plan', 'apply']), true)
  assert.equal(isAllowedWrite(['next', '--claim']), false)
  assert.equal(isAllowedWrite(['merge']), false)
})

test('预览命令带破坏性参数时被拒', () => {
  assert.equal(isAllowedPreview(['doctor']), true)
  assert.equal(isAllowedPreview(['prune']), true)
  assert.equal(isAllowedPreview(['prune', '--yes']), false)
  assert.equal(isAllowedPreview(['reconcile', '--apply']), false)
})