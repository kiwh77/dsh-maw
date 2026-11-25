/**
 * blueprint.js 的单元测试：校验、渲染、落盘路径。
 *
 * 渲染出来的 TOML 必须能被 maw 接受，所以这里除了结构断言，还把渲染结果
 * 交给真实的 `maw plan check` 跑一遍（maw 不在时跳过）。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { normalizePlan, renderBlueprint, blueprintPath, tomlString, tomlArray } from '../lib/blueprint.js'

/** 一份最小合法请求。 */
function sample() {
  return {
    iteration: { id: 'IT-MAW-MODE', name: 'MAW 模式', goal: '验证压入链路' },
    tasks: [
      {
        id: 'MAW-1001',
        title: '第一题',
        goal: '做甲',
        lane: '内核与插件',
        writeScope: ['docs/a.md'],
        acceptance: ['甲通过'],
        verify: ['git diff --check'],
      },
      {
        id: 'MAW-1002',
        title: '第二题',
        deps: ['MAW-1001'],
        writeScope: ['docs/b.md'],
        acceptance: ['乙通过'],
        verify: ['manual: 人工核对 b.md'],
      },
    ],
  }
}

test('TOML 字符串转义', () => {
  assert.equal(tomlString('a"b'), '"a\\"b"')
  assert.equal(tomlString('a\\b'), '"a\\\\b"')
  assert.equal(tomlString('a\nb'), '"a\\nb"')
  assert.equal(tomlArray([]), '[]')
  assert.equal(tomlArray(['x', 'y']), '["x", "y"]')
})

test('合法请求通过校验', () => {
  const result = normalizePlan(sample())
  assert.equal(result.ok, true)
  assert.equal(result.plan.tasks.length, 2)
  assert.equal(result.plan.iteration.targetBranch, 'dev')
})

test('缺 acceptance / verify 被拦下（maw 的硬要求）', () => {
  const result = normalizePlan({
    iteration: { id: 'IT-X' },
    tasks: [{ id: 'A-1', title: 't' }],
  })
  assert.equal(result.ok, false)
  assert.ok(result.errors.some(e => e.includes('acceptance')))
  assert.ok(result.errors.some(e => e.includes('verify')))
})

test('缺 id / 缺 title / 空清单都被拦下', () => {
  const noIteration = normalizePlan({ tasks: [{ id: 'A-1', title: 't' }] })
  assert.equal(noIteration.ok, false)
  assert.ok(noIteration.errors.some(e => e.includes('iteration.id')))

  const noTitle = normalizePlan({ iteration: { id: 'IT-X' }, tasks: [{ id: 'A-1' }] })
  assert.equal(noTitle.ok, false)
  assert.ok(noTitle.errors.some(e => e.includes('title')))

  const empty = normalizePlan({ iteration: { id: 'IT-X' }, tasks: [] })
  assert.equal(empty.ok, false)
})

test('非法与重复 id 被拦下', () => {
  const bad = normalizePlan({ iteration: { id: 'IT-X' }, tasks: [{ id: '1-bad', title: 't' }] })
  assert.equal(bad.ok, false)

  const dup = normalizePlan({
    iteration: { id: 'IT-X' },
    tasks: [{ id: 'A-1', title: 'a' }, { id: 'A-1', title: 'b' }],
  })
  assert.equal(dup.ok, false)
  assert.ok(dup.errors.some(e => e.includes('重复')))
})

test('自依赖被拦下', () => {
  const result = normalizePlan({ iteration: { id: 'IT-X' }, tasks: [{ id: 'A-1', title: 't', deps: ['A-1'] }] })
  assert.equal(result.ok, false)
  assert.ok(result.errors.some(e => e.includes('依赖自己')))
})

test('merge_order 默认排在既有任务之后', () => {
  const result = normalizePlan(sample())
  assert.equal(result.plan.tasks[0].mergeOrder, 9000)
  assert.equal(result.plan.tasks[1].mergeOrder, 9001)
})

test('渲染结果包含全部关键字段', () => {
  const toml = renderBlueprint(normalizePlan(sample()).plan)
  for (const needle of ['[meta]', '[[iteration]]', '[[task]]', 'MAW-1001', 'MAW-1002', 'deps = ["MAW-1001"]', 'write_scope = ["docs/a.md"]']) {
    assert.ok(toml.includes(needle), `缺少 ${needle}`)
  }
})

test('同样输入渲染出同样字节', () => {
  const plan = normalizePlan(sample()).plan
  assert.equal(renderBlueprint(plan), renderBlueprint(plan))
})

test('落盘路径带时间戳且不覆盖既有蓝图', () => {
  const path = blueprintPath('/tmp/proj/', new Date('2026-11-25T14:40:05'))
  assert.equal(path, '/tmp/proj/.multiagent/blueprint.maw-20261125-144005.toml')
})

test('渲染结果能被 maw plan check 接受', { skip: !hasMaw() }, () => {
  const plan = normalizePlan(sample()).plan
  const dir = mkdtempSync(join(tmpdir(), 'dsh-maw-bp-'))
  const file = join(dir, 'blueprint.toml')
  writeFileSync(file, renderBlueprint(plan), 'utf8')
  const out = execFileSync('maw', ['plan', 'check', file, '--json'], { encoding: 'utf8' })
  const parsed = JSON.parse(out)
  assert.equal(parsed.ok, true, `maw 拒绝了渲染结果：${out}`)
  assert.equal(parsed.task_count, 2)
})

/** maw 是否可用。 */
function hasMaw() {
  try {
    execFileSync('maw', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}
