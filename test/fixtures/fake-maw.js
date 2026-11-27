#!/usr/bin/env node
/**
 * 假 maw：给路由测试喂固定数据。
 *
 * 环境变量：
 *  - FAKE_MAW_PROJECT  工程路径（project list 与 task list 里用它）
 *  - FAKE_MAW_TASKS    逗号分隔的任务 id；空串表示没有任务
 *  - FAKE_MAW_REGISTERED  '0' 表示工程未登记（project list 返回空表）
 *  - FAKE_MAW_DOCTOR_ISSUES  数值：doctor 报几个问题
 *  - FAKE_MAW_PRUNE_ITEMS    数值：prune 预览出几项可清理
 *  - FAKE_MAW_RECONCILE_FINDINGS  数值：reconcile 报几处不一致
 *
 * 只实现插件实际用到的那几条命令；其它一律回一个明确的错误信封。
 */
const args = process.argv.slice(2).filter(item => item !== '--json')
const project = process.env.FAKE_MAW_PROJECT ?? '/tmp/fake-maw'
const taskIds = (process.env.FAKE_MAW_TASKS ?? '').split(',').filter(Boolean)
const registered = process.env.FAKE_MAW_REGISTERED !== '0'
const num = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const emit = value => {
  process.stdout.write(`${JSON.stringify(value)}\n`)
}

/** maw 在未登记工程里的真实错误信封长这样。 */
const notRegistered = () => emit({
  ok: false,
  error: 'not inside a git repository',
  next: 'cd into a git repo, then run `maw init`',
})

if (args[0] === 'project' && args[1] === 'list') {
  emit({
    ok: true,
    count: registered ? 1 : 0,
    projects: registered
      ? [{ project_id: 'p1', project_name: 'demo', project_path: project }]
      : [],
  })
} else if (args[0] === 'task' && args[1] === 'list') {
  const routing = {
    'Routing-Basic': { capabilityTier: 'basic' },
    'Routing-Advanced': { capabilityTier: 'advanced' },
    'Routing-Override': { capabilityTier: 'advanced', model: { provider: 'provider-c', model: 'specific' } },
    'Routing-Unknown': { capabilityTier: 'unconfigured' },
  }
  const ids = process.env.FAKE_MAW_ROUTING === '1'
    ? [...taskIds, ...Object.keys(routing)]
    : taskIds
  emit({
    ok: true,
    count: ids.length,
    project_id: 'p1',
    tasks: ids.map(id => ({
      id, project_id: 'p1', project_name: 'demo', title: `task ${id}`, status: 'ready', lane: 'main',
      ...(routing[id] === undefined ? {} : { extra: { goal: `[maw-model] ${JSON.stringify(routing[id])}` } }),
    })),
  })
} else if (args[0] === 'agents') {
  emit({ ok: true, agents: [] })
} else if (args[0] === 'board') {
  emit({ ok: true, snapshot: { iterations: [], risks: [], problems: [] } })
} else if (args[0] === 'doctor') {
  const count = num(process.env.FAKE_MAW_DOCTOR_ISSUES)
  emit({
    ok: true,
    maw_version: '0.4.1',
    protocol_version: 9,
    project_id: 'p1',
    config: `${project}/.maw/config.toml`,
    issues: Array.from({ length: count }, (_, i) => `issue-${i + 1}`),
  })
} else if (args[0] === 'prune') {
  const count = num(process.env.FAKE_MAW_PRUNE_ITEMS)
  emit({
    ok: true,
    dry_run: true,
    project_id: 'p1',
    worktrees: Array.from({ length: count }, (_, i) => ({ path: `/tmp/wt-${i + 1}` })),
    branches: [],
    blocked_holds: [],
    kept_worktrees: 0,
    unmerged_warnings: [],
  })
} else if (args[0] === 'reconcile') {
  const count = num(process.env.FAKE_MAW_RECONCILE_FINDINGS)
  emit({
    ok: true,
    dry_run: true,
    project_id: 'p1',
    fixed: 0,
    findings: Array.from({ length: count }, (_, i) => ({
      kind: 'checkout_drift', detail: `drift-${i + 1}`, fixable: i === 0,
    })),
  })
} else if (args[0] === 'prune' || args[0] === 'reconcile' || args[0] === 'doctor') {
  notRegistered()
} else {
  emit({ ok: false, error: `unsupported: ${args.join(' ')}` })
}
