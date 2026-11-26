/**
 * 预览动作：把 maw 的三条「只看不改」命令做成按钮。
 *
 * 选这三条的理由是它们**默认无副作用**：
 *  - `doctor`      体检：读配置与协议版本，报 issues。
 *  - `prune`       残留预览：不带 `--yes` 时只列不清。
 *  - `reconcile`   一致性报告：不带 `--apply` 时只报告不修。
 *
 * 会真正改状态的那一类（submit/merge/block/cancel/prune --yes/reconcile --apply）
 * 刻意不做成按钮：它们需要题在特定状态、需要人确认后果，交给 MAW 模式的 Agent
 * 用工具调用更合适。
 *
 * 执行器侧还有第二道闸（`isAllowedPreview`）：即便这里的参数被改坏，
 * 带 `--yes` / `--apply` 的调用也会被拒绝。
 */

import { execMawPreview } from './maw-exec.js'

/** 动作定义：id → 参数与文案槽。 */
export const PREVIEW_ACTIONS = [
  {
    id: 'doctor',
    args: ['doctor'],
    // 体检永远是「可以点」的：它只读，跑一次最坏也就是慢一点。
    labelKey: 'actionDoctor',
    hintKey: 'actionDoctorHint',
  },
  {
    id: 'prune',
    args: ['prune'],
    labelKey: 'actionPrune',
    hintKey: 'actionPruneHint',
  },
  {
    id: 'reconcile',
    args: ['reconcile'],
    labelKey: 'actionReconcile',
    hintKey: 'actionReconcileHint',
  },
]

/**
 * 查一个动作的定义。
 * @param {string} id
 * @returns {object|undefined}
 */
export function findAction(id) {
  return PREVIEW_ACTIONS.find(action => action.id === id)
}

/**
 * 把 `doctor` 的输出压成摘要。
 * @param {object} data
 * @returns {{summary: string, lines: string[], issues: number}}
 */
function summarizeDoctor(data) {
  const issues = Array.isArray(data?.issues) ? data.issues : []
  const lines = [
    `maw ${String(data?.maw_version ?? '?')} · 协议 ${String(data?.protocol_version ?? '?')}`,
    `工程 ${String(data?.project_id ?? '?')}`,
    `配置 ${String(data?.config ?? '?')}`,
  ]
  for (const issue of issues) {
    lines.push(`问题：${typeof issue === 'string' ? issue : JSON.stringify(issue)}`)
  }
  return {
    summary: issues.length === 0 ? '体检通过，没有发现问题' : `体检发现 ${issues.length} 个问题`,
    lines,
    issues: issues.length,
  }
}

/**
 * 把 `prune` 的预览输出压成摘要。
 * @param {object} data
 * @returns {{summary: string, lines: string[], removable: number}}
 */
function summarizePrune(data) {
  const worktrees = Array.isArray(data?.worktrees) ? data.worktrees : []
  const branches = Array.isArray(data?.branches) ? data.branches : []
  const holds = Array.isArray(data?.blocked_holds) ? data.blocked_holds : []
  const warnings = Array.isArray(data?.unmerged_warnings) ? data.unmerged_warnings : []
  const removable = worktrees.length + branches.length + holds.length
  const lines = [
    `可清工作树 ${worktrees.length} · 可清分支 ${branches.length} · 阻塞占用 ${holds.length}`,
    `保留工作树 ${Number(data?.kept_worktrees ?? 0)}`,
  ]
  for (const warning of warnings) {
    lines.push(`未合入告警：${typeof warning === 'string' ? warning : JSON.stringify(warning)}`)
  }
  return {
    summary: removable === 0
      ? '没有可清理的残留'
      : `有 ${removable} 项可清理（预览，未删除）`,
    lines,
    removable,
  }
}

/**
 * 把 `reconcile` 的报告压成摘要。
 * @param {object} data
 * @returns {{summary: string, lines: string[], findings: number}}
 */
function summarizeReconcile(data) {
  const findings = Array.isArray(data?.findings) ? data.findings : []
  const lines = [`发现 ${findings.length} 处不一致 · 已修复 ${Number(data?.fixed ?? 0)}`]
  for (const finding of findings) {
    const kind = typeof finding?.kind === 'string' ? finding.kind : 'unknown'
    const detail = typeof finding?.detail === 'string' ? finding.detail : JSON.stringify(finding)
    const fixable = finding?.fixable === true ? '（可修复）' : ''
    lines.push(`${kind}${fixable}：${detail}`)
  }
  return {
    summary: findings.length === 0 ? '没有发现不一致' : `发现 ${findings.length} 处不一致（仅报告）`,
    lines,
    findings: findings.length,
  }
}

/**
 * 跑一个预览动作，并归一成给界面的结果。
 *
 * 失败一律归一成 `{ ok: false, error }`，不抛：按钮点了不该把面板打崩。
 *
 * @param {object} input
 * @param {string} input.id 动作 id
 * @param {string} input.projectPath 工程目录（必须在里面跑）
 * @param {string} [input.binary] maw 可执行文件
 * @param {AbortSignal} [input.signal]
 * @returns {Promise<{ok: boolean, id: string, summary: string, lines: string[], error: string}>}
 */
export async function runPreview({ id, projectPath, binary, signal }) {
  const action = findAction(id)
  if (action === undefined) {
    return { ok: false, id, summary: '', lines: [], error: `未知动作：${id}` }
  }
  const result = await execMawPreview(action.args, {
    cwd: projectPath,
    timeoutMs: 30000,
    ...(typeof binary === 'string' && binary !== '' ? { binary } : {}),
    signal,
  })
  if (!result.ok) {
    // maw 自己在信封里报错（未登记、不是 git 仓）时给出它的 next 提示。
    const hint = typeof result.error?.hint === 'string' ? `（${result.error.hint}）` : ''
    return { ok: false, id, summary: '', lines: [], error: `${result.error.message}${hint}` }
  }

  const data = result.data
  const summarized = id === 'doctor'
    ? summarizeDoctor(data)
    : id === 'prune'
      ? summarizePrune(data)
      : summarizeReconcile(data)
  return { ok: true, id, summary: summarized.summary, lines: summarized.lines, error: '' }
}