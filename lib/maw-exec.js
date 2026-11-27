/**
 * maw 只读命令执行器。
 *
 * 三件事：
 *  1) 找到 maw 可执行文件（PATH 优先，常见安装路径回退）。
 *  2) 跑只读命令，带超时、缓存、并发去重。
 *  3) 把一切失败归一成 `{ ok: false, error }`，绝不向调用方抛异常 —— 看板
 *     坏掉不该拖垮会话。
 *
 * 这里只允许只读子命令；写命令在 `assertReadOnly` 里被硬拦，防止后续改动
 * 误把 `next --claim` 之类塞进来。
 */

import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** 允许执行的只读子命令白名单。任何不在表内的调用都被拒绝。 */
const READ_ONLY_COMMANDS = new Set([
  'board',
  'task list',
  'task show',
  'agents',
  'project list',
  'iteration list',
])

/**
 * 允许执行的写子命令白名单。
 *
 * 只有「把任务清单压进队列」这一类：`plan check` 是纯校验，`plan apply` 是
 * 增量合入（不带 --reset，不会清空既有任务）。领取、提交、合入、阻塞、
 * 清理这些会动 worktree 与分支的命令一律不在此表。
 */
const WRITE_COMMANDS = new Set([
  'plan check',
  'plan apply',
])

/**
 * 允许执行的「预览型」子命令白名单：会读工程状态、可能扫盘，但**不改任何
 * 任务状态、不动 worktree、不删分支**。
 *
 * 三条命令的默认形态都是只报告：
 *  - `doctor` 体检：只读配置与协议版本。
 *  - `prune` 不带 `--yes` 时是 dry-run，只列出残留。
 *  - `reconcile` 不带 `--apply` 时只报告，不动修复。
 *
 * 这里刻意不收 `--yes` / `--apply`：那些参数会让它们真的删东西，属于人的决定。
 */
const PREVIEW_COMMANDS = new Set([
  'doctor',
  'prune',
  'reconcile',
])

/**
 * 预览命令里禁止出现的参数：它们会把「只看」变成「真删/真改」。
 * 用参数级黑名单而不是只靠调用方自觉 —— 白名单只到子命令粒度。
 */
const FORBIDDEN_PREVIEW_FLAGS = ['--yes', '--force', '--apply', '--force-unmerged', '--history']

/** maw 不在 PATH 时的候选安装位置。 */
const FALLBACK_PATHS = [
  join(homedir(), '.local', 'bin', 'maw'),
  '/opt/homebrew/bin/maw',
  '/usr/local/bin/maw',
  join(homedir(), 'go', 'bin', 'maw'),
]

/** 已解析的可执行文件路径；进程内只解析一次。 */
let resolvedBinary

/** 解析缓存：key → { at, value }。 */
const cache = new Map()

/** 在途请求：key → Promise，用于并发去重。 */
const inflight = new Map()

/**
 * 定位 maw 可执行文件。
 * @param {string} [explicit] 配置里显式指定的路径。
 * @returns {string|null} 找到的绝对路径，或 null。
 */
export function resolveMawBinary(explicit) {
  if (explicit !== undefined && explicit !== '' && existsSync(explicit)) return explicit
  if (resolvedBinary !== undefined) return resolvedBinary
  for (const candidate of FALLBACK_PATHS) {
    if (existsSync(candidate)) {
      resolvedBinary = candidate
      return resolvedBinary
    }
  }
  // PATH 上的裸名字：交给 execFile 自己找，成功与否由首次调用决定。
  resolvedBinary = 'maw'
  return resolvedBinary
}

/**
 * 判断一组参数是否为只读命令。
 * @param {string[]} args
 * @returns {boolean}
 */
export function isReadOnly(args) {
  if (!Array.isArray(args) || args.length === 0) return false
  const head = args[0]
  // 子命令形如 ['task', 'list'] 或 ['board']。
  if (args.length > 1 && READ_ONLY_COMMANDS.has(`${head} ${args[1]}`)) return true
  return READ_ONLY_COMMANDS.has(head)
}

/**
 * 判断一组参数是否为白名单内的写命令。
 * @param {string[]} args
 * @returns {boolean}
 */
export function isAllowedWrite(args) {
  if (!Array.isArray(args) || args.length < 2) return false
  return WRITE_COMMANDS.has(`${args[0]} ${args[1]}`)
}

/**
 * 判断一组参数是否为白名单内的预览命令。
 *
 * 两道闸：子命令在白名单里，且参数里没有会把预览变成真删的标志。
 * @param {string[]} args
 * @returns {boolean}
 */
export function isAllowedPreview(args) {
  if (!Array.isArray(args) || args.length === 0) return false
  const head = args[0]
  if (typeof head !== 'string' || !PREVIEW_COMMANDS.has(head)) return false
  return !args.some(arg => FORBIDDEN_PREVIEW_FLAGS.includes(arg))
}

/**
 * 执行一次预览命令（必带 dry-run 语义）。
 *
 * 不缓存：预览的意义就是当下的状态。
 * @param {string[]} args
 * @param {{cwd?: string, timeoutMs?: number, binary?: string, signal?: AbortSignal}} [options]
 * @returns {Promise<{ok: true, data: any, cached: boolean} | {ok: false, error: {code: string, message: string}}>}
 */
export async function execMawPreview(args, options = {}) {
  if (!isAllowedPreview(args)) {
    return {
      ok: false,
      error: {
        code: 'NOT_ALLOWED_PREVIEW',
        message: `dsh-maw 只允许无副作用的预览命令，已拒绝：maw ${Array.isArray(args) ? args.join(' ') : ''}`,
      },
    }
  }
  return runOnce(args, {
    cwd: options.cwd ?? homedir(),
    timeoutMs: options.timeoutMs ?? 30000,
    binary: options.binary,
    signal: options.signal,
  })
}

/**
 * 执行一次 maw 写命令（白名单内、显式调用）。
 * 不做缓存：写命令的结果必须每次真实。
 * @param {string[]} args
 * @param {{cwd?: string, timeoutMs?: number, binary?: string, signal?: AbortSignal}} [options]
 * @returns {Promise<{ok: true, data: any, cached: boolean} | {ok: false, error: {code: string, message: string}}>}
 */
export async function execMawWrite(args, options = {}) {
  if (!isAllowedWrite(args)) {
    return {
      ok: false,
      error: { code: 'NOT_ALLOWED_WRITE', message: `dsh-maw 只允许压入任务，已拒绝：maw ${args.join(' ')}` },
    }
  }
  return runOnce(args, {
    cwd: options.cwd ?? homedir(),
    timeoutMs: options.timeoutMs ?? 60000,
    binary: options.binary,
    signal: options.signal,
  })
}

/**
 * 执行一次 maw 只读命令。
 * @param {string[]} args 子命令与参数（不含可执行文件名）。
 * @param {object} options
 * @param {string} [options.cwd] 工作目录。
 * @param {number} [options.timeoutMs] 超时，默认 8000。
 * @param {number} [options.cacheMs] 缓存 TTL；0 表示不缓存。
 * @param {string} [options.binary] 显式 maw 路径。
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ok: true, data: any, cached: boolean} | {ok: false, error: {code: string, message: string}}>}
 */
export async function execMaw(args, options = {}) {
  if (!isReadOnly(args)) {
    return {
      ok: false,
      error: { code: 'NOT_READ_ONLY', message: `dsh-maw 只执行只读命令，已拒绝：maw ${args.join(' ')}` },
    }
  }

  const {
    cwd = homedir(),
    timeoutMs = 8000,
    cacheMs = 0,
    binary,
    signal,
  } = options

  // 缓存键必须带 binary：同一个 cwd 与参数在不同 maw 可执行文件下的结果
  // 并不相同（测试注入的假 maw、用户指定的自定义路径都属于这种情况）。
  const key = `${binary ?? ''}\u0000${cwd}\u0000${args.join('\u0000')}`
  const now = Date.now()

  if (cacheMs > 0) {
    const hit = cache.get(key)
    if (hit !== undefined && now - hit.at < cacheMs) {
      return { ok: true, data: hit.value, cached: true }
    }
  }

  const pending = inflight.get(key)
  if (pending !== undefined) return pending

  const task = runOnce(args, { cwd, timeoutMs, binary, signal })
    .then(result => {
      if (result.ok && cacheMs > 0) cache.set(key, { at: Date.now(), value: result.data })
      return result
    })
    .finally(() => { inflight.delete(key) })

  inflight.set(key, task)
  return task
}

/**
 * 真正的进程执行与 JSON 解析。
 * @param {string[]} args
 * @param {{cwd: string, timeoutMs: number, binary?: string, signal?: AbortSignal}} options
 */
async function runOnce(args, options) {
  const binary = resolveMawBinary(options.binary)
  const argv = [...args, '--json']

  return new Promise(resolve => {
    let settled = false
    const finish = value => {
      if (settled) return
      settled = true
      resolve(value)
    }

    let child
    try {
      child = execFile(
        binary,
        argv,
        {
          cwd: options.cwd,
          timeout: options.timeoutMs,
          maxBuffer: 32 * 1024 * 1024,
          encoding: 'utf8',
          signal: options.signal,
        },
        (error, stdout, stderr) => {
          if (error !== null && error !== undefined) {
            const code = error.killed === true
              ? 'TIMEOUT'
              : (error.code === 'ENOENT' ? 'MAW_NOT_FOUND' : 'EXEC_FAILED')
            finish({
              ok: false,
              error: {
                code,
                message: code === 'MAW_NOT_FOUND'
                  ? '未找到 maw 可执行文件，请先安装 maw 并确认它在 PATH 上。'
                  : code === 'TIMEOUT'
                    ? `maw ${args.join(' ')} 超时（${options.timeoutMs}ms）。`
                    : `maw ${args.join(' ')} 执行失败：${(stderr || error.message || '').trim().slice(0, 500)}`,
              },
            })
            return
          }

          const text = (stdout ?? '').trim()
          if (text === '') {
            finish({ ok: false, error: { code: 'EMPTY_OUTPUT', message: `maw ${args.join(' ')} 没有输出。` } })
            return
          }

          let parsed
          try {
            parsed = JSON.parse(text)
          } catch {
            finish({
              ok: false,
              error: {
                code: 'BAD_JSON',
                message: `maw ${args.join(' ')} 的输出不是 JSON：${text.slice(0, 200)}`,
              },
            })
            return
          }

          // maw 自己在信封里报错时（例如 not inside a git repository）也算失败。
          if (parsed !== null && typeof parsed === 'object' && parsed.ok === false) {
            finish({
              ok: false,
              error: {
                code: 'MAW_REPORTED_ERROR',
                message: typeof parsed.error === 'string' ? parsed.error : `maw ${args.join(' ')} 报告失败。`,
                hint: typeof parsed.next === 'string' ? parsed.next : undefined,
              },
            })
            return
          }

          finish({ ok: true, data: parsed, cached: false })
        },
      )
    } catch (error) {
      finish({
        ok: false,
        error: { code: 'SPAWN_FAILED', message: String(error?.message ?? error).slice(0, 500) },
      })
      return
    }

    if (child !== undefined && child !== null) {
      child.on('error', error => {
        finish({
          ok: false,
          error: {
            code: error?.code === 'ENOENT' ? 'MAW_NOT_FOUND' : 'SPAWN_FAILED',
            message: error?.code === 'ENOENT'
              ? '未找到 maw 可执行文件，请先安装 maw 并确认它在 PATH 上。'
              : String(error?.message ?? error).slice(0, 500),
          },
        })
      })
    }
  })
}

/** 清空缓存；测试与配置变更后使用。 */
export function clearCache() {
  cache.clear()
}
