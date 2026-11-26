/**
 * dsh-maw Host 半边。
 *
 * 三件事：
 *  1) 注册三个只读工具：maw_board / maw_task / maw_deps。
 *  2) 注册四条只读 HTTP 路由，供浏览器端看板与拓扑取数。
 *  3) 全程不执行任何 maw 写命令。
 *
 * 只 import Node 内置模块与本地文件：第三方插件无法保证 `@deepseek-ai/*`
 * 能从自己的目录解析（它们嵌在 dsh 安装目录里），所以配置校验也自己写。
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { execMaw, execMawWrite, clearCache } from './lib/maw-exec.js'
import { loadBoard, loadProjects, filterTasks, taskDetail, dependencyView } from './lib/model.js'
import { normalizePlan, renderBlueprint, blueprintPath } from './lib/blueprint.js'
import { detectMaw, installMaw, installMawWithGo } from './lib/maw-install.js'

export const name = 'dsh-maw'

export const inject = ['tools', 'webServer']

/** 路由前缀。 */
const API_PREFIX = '/dsh-maw/api'

/** 配置默认值。 */
const DEFAULTS = {
  projects: [],
  pollMs: 5000,
  cacheMs: 5000,
  timeoutMs: 8000,
  showDone: false,
  maxGraphNodes: 300,
  mawBinary: '',
  // maw 作为背景依赖：缺失时按官方 release 自动装好，装完再跑看板。
  autoInstall: true,
  mawVersion: 'latest',
  installDir: '',
  allowGoFallback: false,
}

/**
 * 归一配置：缺字段补默认，类型不对就退回默认。
 * @param {unknown} raw
 * @returns {typeof DEFAULTS}
 */
export function normalizeConfig(raw) {
  const input = raw !== null && typeof raw === 'object' ? raw : {}
  const numOr = (value, fallback) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback)
  return {
    projects: Array.isArray(input.projects) ? input.projects.filter(item => typeof item === 'string') : [],
    pollMs: numOr(input.pollMs, DEFAULTS.pollMs),
    cacheMs: numOr(input.cacheMs, DEFAULTS.cacheMs),
    timeoutMs: numOr(input.timeoutMs, DEFAULTS.timeoutMs),
    showDone: input.showDone === true,
    maxGraphNodes: numOr(input.maxGraphNodes, DEFAULTS.maxGraphNodes),
    mawBinary: typeof input.mawBinary === 'string' ? input.mawBinary : '',
    autoInstall: input.autoInstall !== false,
    mawVersion: typeof input.mawVersion === 'string' && input.mawVersion !== '' ? input.mawVersion : DEFAULTS.mawVersion,
    installDir: typeof input.installDir === 'string' ? input.installDir : '',
    allowGoFallback: input.allowGoFallback === true,
  }
}

/**
 * 解析工作目录：优先取发起调用的 Agent 会话目录，其次配置的项目，最后进程 cwd。
 * @param {object} ctx
 * @param {object} settings
 * @param {object} [agent]
 * @returns {string}
 */
function cwdFor(ctx, settings, agent) {
  try {
    const workingDirectory = ctx.get('workingDirectory')
    if (workingDirectory !== undefined) {
      if (agent !== undefined && typeof workingDirectory.get === 'function') {
        const dir = workingDirectory.get(agent)
        if (typeof dir === 'string' && dir !== '') return dir
      }
      if (typeof workingDirectory.defaultDirectory === 'string' && workingDirectory.defaultDirectory !== '') {
        return workingDirectory.defaultDirectory
      }
    }
  } catch {
    // 会话目录不可用时继续走后面的兜底。
  }
  if (settings.projects.length > 0) return settings.projects[0]
  return process.cwd()
}

/** DSH 把每个工作区的会话放在以该工作区路径编码命名的目录下。 */
const SESSIONS_ROOT = join(homedir(), '.dsh', 'sessions')

/**
 * 工作区路径 → 会话目录名。`/a/b` 变成 `--a-b--`。
 * @param {string} workspacePath
 * @returns {string}
 */
function sessionDirName(workspacePath) {
  return `--${workspacePath.replace(/^\/+/, '').replace(/\//g, '-')}--`
}

/**
 * 由会话 id 反查它所属的工作区路径。
 * 逐个 maw 工程试它的会话目录，命中即返回——不需要读会话内容，也不依赖内部服务。
 * @param {string} sessionId
 * @param {Array<{id: string, path: string}>} projects
 * @returns {{id: string, path: string}|null}
 */
export function resolveSessionProject(sessionId, projects) {
  if (typeof sessionId !== 'string' || sessionId === '') return null
  if (!Array.isArray(projects)) return null
  for (const project of projects) {
    if (typeof project?.path !== 'string' || project.path === '') continue
    const dir = join(SESSIONS_ROOT, sessionDirName(project.path))
    if (existsSync(join(dir, sessionId)) || existsSync(join(dir, `session-${sessionId}`))) {
      return project
    }
  }
  return null
}

/**
 * 把看板模型压成给模型看的紧凑文本。
 * @param {object} board
 * @param {object[]} tasks
 * @returns {string}
 */
function renderBoardText(board, tasks) {
  const lines = []
  lines.push(`maw 看板 · ${board.projectPath}`)
  lines.push(`进度 ${board.percent}% · 共 ${board.total} 题 · 活跃 Agent ${board.activeAgents}`)
  const counts = Object.entries(board.counts)
    .filter(([, n]) => n > 0)
    .map(([status, n]) => `${status} ${n}`)
    .join(' · ')
  lines.push(`状态：${counts}`)
  if (board.graph.frontier.length > 0) {
    lines.push(`可开工前沿（${board.graph.frontier.length}）：${board.graph.frontier.join(', ')}`)
  }
  if (tasks.length > 0) {
    lines.push('')
    lines.push(`任务（${tasks.length}）：`)
    for (const task of tasks.slice(0, 60)) {
      const flags = []
      if (task.status === 'blocked') flags.push('阻塞')
      if (task.ready) flags.push('可开工')
      const suffix = flags.length > 0 ? ` [${flags.join('/')}]` : ''
      lines.push(`- ${task.id} [${task.status}] ${task.title}${suffix}${task.owner !== '' ? ` · ${task.owner}` : ''}`)
    }
    if (tasks.length > 60) lines.push(`… 另有 ${tasks.length - 60} 条，用 maw_task 查单条详情`)
  }
  if (board.risks.length > 0) {
    lines.push('')
    lines.push(`风险（${board.risks.length}）：`)
    for (const risk of board.risks.slice(0, 8)) {
      lines.push(`- [${risk.severity}] ${risk.taskId} ${risk.message.slice(0, 160)}`)
    }
  }
  if (board.problems.length > 0) {
    lines.push('')
    lines.push(`问题（${board.problems.length}）：`)
    for (const problem of board.problems.slice(0, 8)) {
      lines.push(`- [${problem.severity}] ${problem.taskId} ${problem.kind}：${problem.message.slice(0, 160)}`)
    }
  }
  const stale = Object.entries(board.sources).filter(([, state]) => state !== 'ok').map(([source]) => source)
  if (stale.length > 0) lines.push(`\n注意：${stale.join(', ')} 数据源降级，结果可能不完整。`)
  return lines.join('\n')
}

/**
 * 把任务详情压成给模型看的文本。
 * @param {object|null} detail
 * @returns {string}
 */
function renderTaskText(detail) {
  if (detail === null) return '没有找到该任务。'
  const lines = [
    `${detail.id} [${detail.status}] ${detail.title}`,
    `项目 ${detail.projectName} · 泳道 ${detail.lane || '(无)'} · 负责人 ${detail.owner || '(未分配)'}`,
    `优先级 ${detail.priority} · 合入序 ${detail.mergeOrder} · 尝试 ${detail.attempts} 次 · 第 ${detail.revision} 版`,
  ]
  if (detail.deps.length > 0) lines.push(`依赖：${detail.deps.join(', ')}`)
  if (detail.upstream.length > 0) lines.push(`上游：${detail.upstream.join(', ')}`)
  if (detail.downstream.length > 0) lines.push(`下游：${detail.downstream.join(', ')}`)
  if (detail.blockedReason !== '') lines.push(`阻塞原因：${detail.blockedReason}`)
  if (detail.goal !== '') lines.push(`目标：${detail.goal}`)
  if (detail.writeScope.length > 0) lines.push(`写范围：\n${detail.writeScope.map(item => `  - ${item}`).join('\n')}`)
  if (detail.readScope.length > 0) lines.push(`读范围：\n${detail.readScope.map(item => `  - ${item}`).join('\n')}`)
  if (detail.acceptance.length > 0) {
    lines.push(`验收：\n${detail.acceptance.map((item, index) => `  ${index + 1}. ${item}`).join('\n')}`)
  }
  if (detail.verify.length > 0) lines.push(`验证命令：\n${detail.verify.map(item => `  - ${item}`).join('\n')}`)
  if (detail.branch !== '') lines.push(`分支：${detail.branch}`)
  if (detail.worktree !== '') lines.push(`工作树：${detail.worktree}`)
  return lines.join('\n')
}

/**
 * 把依赖视图压成给模型看的文本。
 * @param {object} view
 * @returns {string}
 */
function renderDepsText(view) {
  const lines = []
  if (typeof view.focus === 'string') {
    lines.push(`${view.focus} 的依赖邻域（深度 ${view.depth}）`)
    lines.push(`上游 ${view.upstream.length}：${view.upstream.join(', ') || '(无)'}`)
    lines.push(`下游 ${view.downstream.length}：${view.downstream.join(', ') || '(无)'}`)
  } else {
    lines.push(`依赖拓扑：${view.nodeCount} 个任务 · ${view.edgeCount} 条依赖 · ${view.levels.length} 层`)
    lines.push(`可开工前沿（${view.frontier.length}）：${view.frontier.join(', ') || '(无)'}`)
    lines.push(`关键路径（${view.criticalPath.length} 层）：${view.criticalPath.join(' → ') || '(无)'}`)
  }
  if (view.cycles.length > 0) {
    lines.push('')
    lines.push(`⚠ 检测到 ${view.cycles.length} 个循环依赖：`)
    for (const cycle of view.cycles) lines.push(`- ${[...cycle, cycle[0]].join(' → ')}`)
  }
  if (view.dangling.length > 0) {
    lines.push('')
    lines.push(`⚠ ${view.dangling.length} 条悬空依赖（指向不存在的任务）：`)
    for (const item of view.dangling.slice(0, 10)) lines.push(`- ${item.from} → ${item.to}`)
  }
  if (Array.isArray(view.blockedChains) && view.blockedChains.length > 0) {
    lines.push('')
    lines.push(`阻塞链（${view.blockedChains.length}）：`)
    for (const entry of view.blockedChains) {
      lines.push(`- ${entry.task}${entry.chain.length > 0 ? ` ← ${entry.chain.join(' ← ')}` : '（无未完成上游）'}`)
    }
  }
  if (Array.isArray(view.levels)) {
    lines.push('')
    lines.push('按层（0 层为无依赖）：')
    view.levels.forEach((bucket, level) => {
      if (bucket.length > 0) lines.push(`  第 ${level} 层：${bucket.join(', ')}`)
    })
  }
  return lines.join('\n')
}

/**
 * 插件主体。
 * @param {object} ctx
 * @param {unknown} rawConfig
 */
export function apply(ctx, rawConfig) {
  const settings = normalizeConfig(rawConfig)

  /** maw 运行时状态：检测结果 + 最近一次安装过程。 */
  const runtime = {
    maw: detectMaw(settings.mawBinary),
    install: { status: 'idle', at: '', error: '', version: '', tag: '' },
  }

  /**
   * 确保 maw 可用：缺了就按官方 release 装到用户目录。
   * 装完把路径写回配置，后续命令直接用它。
   * @param {AbortSignal} [signal]
   * @returns {Promise<{ok: boolean, version: string, error: string}>}
   */
  const ensureMaw = async signal => {
    if (runtime.install.status === 'installing') return { ok: false, version: '', error: '安装进行中' }
    runtime.maw = detectMaw(settings.mawBinary)
    if (runtime.maw.found) return { ok: true, version: runtime.maw.version, error: '' }

    runtime.install = { status: 'installing', at: new Date().toISOString(), error: '', version: '', tag: '' }
    const options = {
      dir: settings.installDir,
      version: settings.mawVersion,
      signal,
      log: line => ctx.logger?.('dsh-maw')?.info?.(line),
    }
    let result = await installMaw(options)
    if (!result.ok && settings.allowGoFallback) {
      ctx.logger?.('dsh-maw')?.warn?.(`release 安装失败，尝试 go install：${result.error}`)
      result = await installMawWithGo({ dir: settings.installDir, version: settings.mawVersion })
    }

    if (!result.ok) {
      runtime.install = { ...runtime.install, status: 'failed', error: result.error, at: new Date().toISOString() }
      return { ok: false, version: '', error: result.error }
    }

    // 装到非默认目录时把路径固定下来，否则让它走 PATH/常见位置查找。
    settings.mawBinary = result.path
    clearCache()
    runtime.maw = detectMaw(result.path)
    runtime.install = {
      status: 'installed',
      at: new Date().toISOString(),
      error: '',
      version: result.version,
      tag: result.tag ?? '',
    }
    return { ok: true, version: result.version, error: '' }
  }

  // 背景依赖：插件激活时若缺 maw 且允许自动安装，就在后台装好，不阻塞会话。
  if (settings.autoInstall && !runtime.maw.found) {
    ctx.effect(() => {
      void ensureMaw().catch(error => {
        runtime.install = { status: 'failed', at: new Date().toISOString(), error: String(error?.message ?? error), version: '', tag: '' }
      })
      return () => {}
    }, 'dsh-maw: background maw install')
  }

  /** 读一次看板。 */
  const readBoard = (agent, signal) => loadBoard(settings, cwdFor(ctx, settings, agent), signal)

  /**
   * 读一次「指定工程的」看板。
   *
   * 取数要分两步：先在某个工程目录里跑 maw 拿数据，再按工程 id 过滤任务。
   * 两步必须指向同一个工程 —— 只按会话目录解析工程、再按请求里的工程 id
   * 过滤，就会「取 A 的题、按 B 的 id 筛」，结果恒为空。
   *
   * @param {string} projectId 目标工程 id；空串表示沿用自动解析。
   * @param {AbortSignal} [signal]
   */
  const readBoardOf = (projectId, signal) =>
    loadBoard(settings, cwdFor(ctx, settings), signal, { projectId })

  /**
   * 解析一次「这次请求该看哪个工程」。
   *
   * 优先级：显式 project 参数 > 会话所属工作区对应的工程 > 空（沿用自动解析）。
   *
   * @param {string} sessionId 会话 id，用于反查它所属的工作区。
   * @param {string} requestedProject 请求里点名的工程 id。
   * @param {AbortSignal} [signal]
   * @returns {Promise<{projectId: string, sessionProject: object|null}>}
   */
  const resolveScope = async (sessionId, requestedProject, signal) => {
    const projects = await loadProjects(settings, cwdFor(ctx, settings), signal)
    const sessionProject = resolveSessionProject(sessionId, projects)
    return {
      projectId: requestedProject !== '' ? requestedProject : (sessionProject?.id ?? ''),
      sessionProject,
    }
  }

  /** MAW 模式的 preset id，与本 bundle 的 preset 行一致。 */
  const MAW_PRESET_ID = 'maw'

  /** MAW 模式判定与团队开启的诊断记录，供 /api/mode 查看。 */
  const modeLog = []

  /**
   * 已知处于 MAW 模式的会话。
   *
   * 会话头里的 agentPreset 是创建时的值，切换模式后不更新，所以不能只靠它；
   * 由 agent-preset/selected 事件维护这个集合，作为最快的判据。
   */
  const mawSessions = new Set()

  /**
   * 判断某个 agent 是否跑在 MAW 模式下，并说明依据。
   *
   * 三条依据依次尝试：会话头里的 agentPreset（最直接）、composedPreset、
   * presetForSession。任一条命中即算 MAW 模式。
   * @param {object} [agent]
   * @returns {{maw: boolean, via: string, detail: string}}
   */
  const detectMode = agent => {
    if (agent === undefined || agent === null) return { maw: false, via: 'none', detail: 'no agent' }

    // 1) 事件维护的集合：切换过 MAW 的会话在这里。
    const sessionId = String(agent.id ?? '')
    if (sessionId !== '' && mawSessions.has(sessionId)) return { maw: true, via: 'session-set', detail: sessionId }

    try {
      const presets = ctx.get('agentPresets')
      if (presets === undefined) return { maw: false, via: 'none', detail: 'no agentPresets service' }
      // 2) 服务查询：读到的是当前预设，不是创建时的快照。
      if (typeof presets.presetForSession === 'function' && agent.session !== undefined) {
        const named = presets.presetForSession(agent.session)
        if (typeof named === 'string' && named !== '') {
          return { maw: named === MAW_PRESET_ID, via: 'presetForSession', detail: named }
        }
      }
      if (typeof presets.composedPreset === 'function' && agent.ctx !== undefined) {
        const composed = presets.composedPreset(agent.ctx)
        if (typeof composed === 'string') return { maw: composed === MAW_PRESET_ID, via: 'composedPreset', detail: composed }
      }
    } catch (error) {
      return { maw: false, via: 'error', detail: String(error?.message ?? error) }
    }

    // 3) 兜底：创建时的会话头。
    const headerPreset = agent.session?.header?.agentPreset
    if (typeof headerPreset === 'string' && headerPreset !== '') {
      return { maw: headerPreset === MAW_PRESET_ID, via: 'session.header', detail: headerPreset }
    }
    return { maw: false, via: 'none', detail: 'no signal' }
  }

  /**
   * 判断某个 agent 是否跑在 MAW 模式下。
   * @param {object} [agent]
   * @returns {boolean}
   */
  const isMawMode = agent => detectMode(agent).maw

  /**
   * 给一个 MAW 模式的 agent 打开团队协作，并记录结果。
   * @param {object} agent
   * @param {AbortSignal} [signal]
   * @param {string} trigger 触发来源，用于诊断。
   */
  const enableTeamsFor = async (agent, signal, trigger, knownPreset) => {
    // 事件已经告诉我们预设名时用它：此刻会话头里的 agentPreset 可能还没落新值。
    const mode = typeof knownPreset === 'string' && knownPreset !== ''
      ? { maw: knownPreset === MAW_PRESET_ID, via: 'event', detail: knownPreset }
      : detectMode(agent)
    const entry = { at: new Date().toISOString(), session: agent?.id ?? '', trigger, ...mode, teams: 'started', error: '' }
    // 先入表再逐步更新：即使后面挂住，也能看到卡在哪一步。
    modeLog.push(entry)
    if (modeLog.length > 40) modeLog.shift()
    try {
      if (!mode.maw) {
        entry.teams = 'not-maw'
      } else {
        const teams = ctx.get('agentTeams')
        if (teams === undefined) {
          entry.teams = 'no service'
        } else if (teams.isEnabled(agent)) {
          entry.teams = 'already on'
        } else {
          // setEnabled 只接受根 agent；子 agent 抛错会中断创建，所以先确认是根。
          const subagents = ctx.get('subagents')
          const root = subagents !== undefined && typeof subagents.rootOf === 'function' ? subagents.rootOf(agent) : undefined
          if (root !== undefined && root.id !== agent.id) {
            entry.teams = 'descendant-skip'
          } else {
            entry.teams = 'calling-setEnabled'
            // 不无限等：setEnabled 要落一条会话事件，锁冲突时会一直挂着。
            const timeout = new Promise((_, reject) => {
              const timer = setTimeout(() => reject(new Error('setEnabled timeout after 8s')), 8000)
              if (typeof timer?.unref === 'function') timer.unref()
            })
            await Promise.race([teams.setEnabled(agent, true, signal), timeout])
            entry.teams = 'enabled'
          }
        }
      }
    } catch (error) {
      // 团队开关失败不该让会话创建失败，退回普通模式继续。
      entry.teams = 'failed'
      entry.error = String(error?.message ?? error)
      ctx.logger?.('dsh-maw')?.warn?.(`MAW 模式开启团队协作失败：${entry.error}`)
    }
  }

  // 新会话直接以 MAW 模式创建时，agent/created 就能看到。
  ctx.effect(() => ctx.on('agent/created', ({ agent, signal }) => {
    if (agent?.session?.header?.agentPreset === MAW_PRESET_ID) mawSessions.add(String(agent.id ?? ''))
    return enableTeamsFor(agent, signal, 'agent/created')
  }),
    'dsh-maw: maw mode enables agent teams on create')

  // 会话内切换模式时，会话头在创建之后才更新，所以还要听这个事件。
  //
  // 这个事件是在会话 append 过程中发出的，此刻再调 setEnabled 会被
  // 「session append cannot reenter」挡掉，所以延后一拍再开团队。
  ctx.effect(() => ctx.on('agent-preset/selected', (sessionId, agentPreset) => {
    if (agentPreset === MAW_PRESET_ID) mawSessions.add(String(sessionId))
    else mawSessions.delete(String(sessionId))
    modeLog.push({ at: new Date().toISOString(), session: String(sessionId), trigger: 'event-arrived',
      maw: agentPreset === MAW_PRESET_ID, via: 'event', detail: String(agentPreset), teams: 'pending', error: '' })
    if (modeLog.length > 40) modeLog.shift()
    if (agentPreset !== MAW_PRESET_ID) return
    const run = () => {
      const agent = ctx.get('agents')?.get?.(sessionId)
      if (agent === undefined) {
        modeLog.push({ at: new Date().toISOString(), session: String(sessionId), trigger: 'agent-preset/selected',
          maw: true, via: 'event', detail: agentPreset, teams: 'no live agent', error: '' })
        if (modeLog.length > 40) modeLog.shift()
        return
      }
      void enableTeamsFor(agent, undefined, 'agent-preset/selected', agentPreset)
    }
    // 用 Node 原生定时器：ctx.timeout 在这个上下文里没按时触发过。
    setTimeout(() => {
      try {
        run()
      } catch (error) {
        modeLog.push({ at: new Date().toISOString(), session: String(sessionId), trigger: 'deferred-run',
          maw: true, via: 'event', detail: agentPreset, teams: 'threw', error: String(error?.message ?? error) })
        if (modeLog.length > 40) modeLog.shift()
      }
    }, 300)
  }), 'dsh-maw: maw mode enables agent teams on preset switch')

  // ── 工具 ──────────────────────────────────────────────
  ctx.tools.register({
    name: 'maw_board',
    description:
      'Read the local maw multi-agent board: progress, per-status counts, ready frontier, '
      + 'agents, risks and problems. Filter by project, lane, status or agent. Read-only.',
    parameters: {
      project: { type: 'string', description: 'Project id; omit to use the current session project.' },
      lane: { type: 'string', description: 'Lane name, such as 内核与插件; omit for every lane.' },
      status: {
        type: 'string',
        description: 'Task status: backlog, ready, in_progress, merging, blocked, done or cancelled.',
      },
      agent: { type: 'string', description: 'Agent id; omit for every agent.' },
      includeDone: { type: 'boolean', description: 'Include done and cancelled tasks; defaults to false.' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: String(value) }],
    },
    async execute(args, exec) {
      const board = await readBoardOf(String(args?.project ?? ''), exec.signal)
      const tasks = filterTasks(board.tasks, {
        project: args?.project,
        lane: args?.lane,
        status: args?.status,
        agent: args?.agent,
        includeDone: args?.includeDone === true || settings.showDone === true,
      })
      return renderBoardText(board, tasks)
    },
  })

  ctx.tools.register({
    name: 'maw_task',
    description:
      'Read one maw task in full: status, owner, dependencies, upstream and downstream, '
      + 'write and read scope, acceptance criteria and verify commands. Read-only.',
    parameters: {
      id: { type: 'string', required: true, description: 'Task id, such as RD-2601.' },
      project: { type: 'string', description: 'Project id the task belongs to; omit to use the current session project.' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: String(value) }],
    },
    async execute(args, exec) {
      const board = await readBoardOf(String(args?.project ?? ''), exec.signal)
      return renderTaskText(taskDetail(board, String(args?.id ?? '')))
    },
  })

  ctx.tools.register({
    name: 'maw_deps',
    description:
      'Read the maw dependency topology: layers, ready frontier, blocked chains, cycle and '
      + 'dangling-dependency detection, and the critical path. Pass focus for one task neighbourhood. Read-only.',
    parameters: {
      focus: { type: 'string', description: 'Task id to centre the neighbourhood on; omit for the whole graph.' },
      depth: { type: 'number', description: 'Neighbourhood depth around focus; defaults to 3.' },
      project: { type: 'string', description: 'Project id; omit to use the current session project.' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: String(value) }],
    },
    async execute(args, exec) {
      const board = await readBoardOf(String(args?.project ?? ''), exec.signal)
      return renderDepsText(dependencyView(board, { focus: args?.focus, depth: args?.depth }))
    },
  })

  // 压入工具：只在 MAW 模式下可见（其它模式连工具都不出现，避免误写队列）。
  ctx.tools.register({
    name: 'maw_plan_push',
    description:
      'Push a task list into the local maw queue as a blueprint. Validates the plan first, writes it to '
      + '.multiagent/, runs maw plan check, and applies it only when apply is true. Incremental merge; '
      + 'it never resets existing tasks. Available in MAW mode.',
    parameters: {
      iteration: {
        type: 'object',
        description: 'Iteration the pushed tasks belong to: { id, name?, goal?, targetBranch? }.',
        required: true,
        properties: {
          id: { type: 'string', description: 'Iteration id, such as IT-MAW-20261125.' },
          name: { type: 'string', description: 'Iteration name.' },
          goal: { type: 'string', description: 'What this iteration delivers.' },
          targetBranch: { type: 'string', description: 'Branch the work lands on; defaults to dev.' },
        },
      },
      tasks: {
        type: 'array',
        required: true,
        description: 'Task cards to push. One card per independently verifiable deliverable.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', required: true, description: 'Stable task id, such as MAW-1001.' },
            title: { type: 'string', required: true, description: 'One-line deliverable.' },
            goal: { type: 'string', description: 'Why this task exists and what it settles.' },
            lane: { type: 'string', description: 'Lane name used for board grouping.' },
            deps: { type: 'array', items: { type: 'string' }, description: 'Task ids that must finish first.' },
            writeScope: { type: 'array', items: { type: 'string' }, description: 'Files or directories this task may write.' },
            readScope: { type: 'array', items: { type: 'string' }, description: 'Files worth reading before starting.' },
            acceptance: { type: 'array', items: { type: 'string' }, description: 'Verifiable acceptance items.' },
            verify: { type: 'array', items: { type: 'string' }, description: 'Commands that prove the task is done.' },
            notDoing: { type: 'array', items: { type: 'string' }, description: 'Explicitly out of scope.' },
            priority: { type: 'number', description: 'Lower runs earlier; defaults to 100.' },
            mergeOrder: { type: 'number', description: 'Merge position; defaults to 9000 + index.' },
          },
        },
      },
      apply: {
        type: 'boolean',
        description: 'Apply the plan after it passes validation; defaults to false (validate only).',
      },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: String(value) }],
    },
    async execute(args, exec) {
      const plan = normalizePlan(args)
      if (!plan.ok) return `任务清单有误，未压入：\n${plan.errors.map(item => `- ${item}`).join('\n')}`

      const board = await readBoard(exec.agent, exec.signal)
      const projectPath = board.projectPath
      if (projectPath === '') return '没有找到 maw 工程路径，未压入。'

      const toml = renderBlueprint(plan.plan)
      const file = blueprintPath(projectPath)
      try {
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, toml, 'utf8')
      } catch (error) {
        return `蓝图写入失败：${String(error?.message ?? error)}`
      }

      const writeOptions = {
        cwd: projectPath,
        timeoutMs: Math.max(settings.timeoutMs, 30000),
        binary: settings.mawBinary === '' ? undefined : settings.mawBinary,
        signal: exec.signal,
      }

      const check = await execMawWrite(['plan', 'check', file], writeOptions)
      if (!check.ok) {
        return `蓝图校验未通过，未压入。\n文件：${file}\n${check.error.message}`
      }

      const summary = [
        `蓝图：${file}`,
        `迭代：${plan.plan.iteration.id} · 任务 ${plan.plan.tasks.length} 题`,
        `校验：通过（理论并行 ${check.data?.parallel?.max_parallel_theory ?? '?'}）`,
      ]
      const warnings = check.data?.warnings
      if (Array.isArray(warnings) && warnings.length > 0) {
        summary.push(`告警：${warnings.join('；')}`)
      }

      if (args?.apply !== true) {
        summary.push('未压入（apply=false）。确认无误后带 apply=true 再调一次。')
        return summary.join('\n')
      }

      const applied = await execMawWrite(['plan', 'apply', file, '--yes'], writeOptions)
      if (!applied.ok) {
        summary.push(`压入失败：${applied.error.message}`)
        return summary.join('\n')
      }

      clearCache()
      summary.push('已压入 maw 队列（增量合入，未清空既有任务）。')
      const next = applied.data?.next
      if (typeof next === 'string' && next !== '') summary.push(`下一步：${next}`)
      return summary.join('\n')
    },
  }, { when: context => isMawMode(context.agent) })

  // 环境自检与安装：maw 是背景依赖，缺失时用这个工具补上。
  ctx.tools.register({
    name: 'maw_setup',
    description:
      'Check or install the local maw runtime. Reports the detected binary and version; install downloads the '
      + 'official release for this platform, verifies its sha256, and installs it to the user bin directory. '
      + 'Read-only unless the action installs.',
    parameters: {
      action: {
        type: 'string',
        required: true,
        enum: ['status', 'install', 'go'],
        description: 'status reports the current runtime; install downloads the official release; go uses the Go toolchain.',
      },
      version: { type: 'string', description: 'Release tag such as v0.4.0; defaults to latest.' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: String(value) }],
    },
    async execute(args, exec) {
      const action = String(args?.action ?? 'status')
      if (action === 'status') {
        runtime.maw = detectMaw(settings.mawBinary)
        const lines = [
          runtime.maw.found
            ? `maw 已就绪：${runtime.maw.version}（${runtime.maw.path}）`
            : 'maw 未安装：看板与压入都不可用。',
          `自动安装：${settings.autoInstall ? '开' : '关'} · 目标版本 ${settings.mawVersion}`,
          `最近一次安装：${runtime.install.status}${runtime.install.error === '' ? '' : `（${runtime.install.error}）`}`,
        ]
        return lines.join('\n')
      }

      if (action === 'go') {
        runtime.install = { status: 'installing', at: new Date().toISOString(), error: '', version: '', tag: '' }
        const result = await installMawWithGo({ dir: settings.installDir, version: args?.version ?? settings.mawVersion })
        if (!result.ok) {
          runtime.install = { ...runtime.install, status: 'failed', error: result.error }
          return `go install 失败：${result.error}`
        }
        settings.mawBinary = result.path
        clearCache()
        runtime.maw = detectMaw(result.path)
        runtime.install = { status: 'installed', at: new Date().toISOString(), error: '', version: result.version, tag: '' }
        return `已用 go install 装好 maw ${result.version}（${result.path}）。`
      }

      const savedVersion = settings.mawVersion
      if (typeof args?.version === 'string' && args.version !== '') settings.mawVersion = args.version
      const result = await ensureMaw(exec.signal)
      settings.mawVersion = savedVersion
      return result.ok
        ? `已装好 maw ${result.version}（${runtime.maw.path}）。`
        : `安装失败：${result.error}`
    },
  })

  // ── HTTP 路由（浏览器端取数） ─────────────────────────
  ctx.effect(() => {
    const sendJson = (response, status, payload) => {
      response.writeHead(status, {
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
      })
      response.end(JSON.stringify(payload))
    }

    /**
     * 只接受同源 GET。
     * @param {import('node:http').IncomingMessage} request
     * @returns {{status: number, body: object}|null}
     */
    const guard = request => {
      if (request.method !== 'GET') return { status: 405, body: { ok: false, error: 'method not allowed' } }
      const origin = request.headers.origin
      if (typeof origin === 'string' && origin !== '') {
        const host = request.headers.host
        let originHost = ''
        try {
          originHost = new URL(origin).host
        } catch {
          return { status: 403, body: { ok: false, error: 'bad origin' } }
        }
        if (host !== undefined && originHost !== host) {
          return { status: 403, body: { ok: false, error: 'untrusted origin' } }
        }
      }
      return null
    }

    /**
     * 非 GET 路由的守卫：要求方法与同源。
     * @param {import('node:http').IncomingMessage} request
     * @param {string} method
     * @returns {{status: number, body: object}|null}
     */
    const guardSameOrigin = (request, method) => {
      if (request.method !== method) return { status: 405, body: { ok: false, error: 'method not allowed' } }
      const origin = request.headers.origin
      if (typeof origin !== 'string' || origin === '') {
        // 同源 fetch 可能不带 Origin；此时要求是浏览器提交的 JSON 请求。
        return null
      }
      try {
        if (new URL(origin).host !== request.headers.host) {
          return { status: 403, body: { ok: false, error: 'untrusted origin' } }
        }
      } catch {
        return { status: 403, body: { ok: false, error: 'bad origin' } }
      }
      return null
    }

    const disposers = []
    /** 注册失败的路由（典型情况：上一代实例残留在同名路径上）。 */
    const routeConflicts = []

    const route = (path, handle, method = 'GET') => {
      try {
        disposers.push(ctx.webServer.register({
        kind: 'exact',
        path,
          handler: async (request, response) => {
            const denied = method === 'GET' ? guard(request) : guardSameOrigin(request, method)
            if (denied !== null) {
              sendJson(response, denied.status, denied.body)
              return
            }
            try {
              const url = new URL(request.url ?? path, 'http://localhost')
              await handle(url, response)
            } catch (error) {
              sendJson(response, 500, { ok: false, error: String(error?.message ?? error).slice(0, 500) })
            }
          },
        }))
      } catch (error) {
        // 同名路由已被上一代实例占用时，不拖垮整个插件：记下来，其余路由照常。
        const message = String(error?.message ?? error)
        if (!/duplicate exact route/iu.test(message)) throw error
        routeConflicts.push(path)
        ctx.logger?.('dsh-maw')?.warn?.(`路由被既有实例占用，本次跳过：${path}`)
      }
    }

    route(`${API_PREFIX}/board`, async (url, response) => {
      const includeDone = url.searchParams.get('includeDone') === 'true' || settings.showDone === true
      // 先定工程，再在它自己目录里取数：取数与过滤必须是同一个工程。
      const { projectId: effectiveProject, sessionProject } = await resolveScope(
        url.searchParams.get('session') ?? '',
        url.searchParams.get('project') ?? '',
        undefined,
      )
      const board = await readBoardOf(effectiveProject, undefined)
      const defaultProjectId = sessionProject?.id ?? ''
      const filtered = filterTasks(board.tasks, {
        project: effectiveProject !== '' ? effectiveProject : undefined,
        lane: url.searchParams.get('lane') ?? undefined,
        status: url.searchParams.get('status') ?? undefined,
        agent: url.searchParams.get('agent') ?? undefined,
        includeDone,
      })
      sendJson(response, 200, {
        ok: true,
        config: {
          pollMs: settings.pollMs,
          showDone: settings.showDone,
          maxGraphNodes: settings.maxGraphNodes,
        },
        defaultProjectId,
        ...board,
        // graph 里的分层是全量结构，前端切换筛选时不重新请求也能高亮。
        // 任务集始终受筛选约束：勾「显示已完成」只放开 done/cancelled，
        // 不该把工程/泳道筛掉的任务又放回来。
        tasks: filtered,
        filteredTasks: filtered,
      })
    })

    route(`${API_PREFIX}/graph`, async (url, response) => {
      const { projectId: project, sessionProject } = await resolveScope(
        url.searchParams.get('session') ?? '',
        url.searchParams.get('project') ?? '',
        undefined,
      )
      const board = await readBoardOf(project, undefined)
      const scoped = project === '' ? board.tasks : board.tasks.filter(task => task.projectId === project)
      sendJson(response, 200, {
        ok: true,
        generatedAt: board.generatedAt,
        defaultProjectId: sessionProject?.id ?? '',
        tasks: scoped.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          lane: task.lane,
          owner: task.owner,
          deps: task.deps,
          level: task.level,
          ready: task.ready,
          blocked: task.blocked,
          mergeOrder: task.mergeOrder,
        })),
        view: dependencyView(board, {
          focus: url.searchParams.get('focus') ?? undefined,
          depth: url.searchParams.get('depth') ?? undefined,
        }),
      })
    })

    route(`${API_PREFIX}/task`, async (url, response) => {
      const id = url.searchParams.get('id') ?? ''
      const { projectId } = await resolveScope(
        url.searchParams.get('session') ?? '',
        url.searchParams.get('project') ?? '',
        undefined,
      )
      const board = await readBoardOf(projectId, undefined)
      const detail = taskDetail(board, id)
      if (detail === null) {
        sendJson(response, 404, { ok: false, error: `没有找到任务 ${id}` })
        return
      }
      sendJson(response, 200, { ok: true, task: detail })
    })

    route(`${API_PREFIX}/health`, async (_url, response) => {
      runtime.maw = detectMaw(settings.mawBinary)
      sendJson(response, 200, {
        ok: true,
        maw: runtime.maw,
        install: runtime.install,
        routeConflicts,
        config: {
          autoInstall: settings.autoInstall,
          mawVersion: settings.mawVersion,
          installDir: settings.installDir === '' ? '~/.local/bin' : settings.installDir,
        },
      })
    })

    // 安装是一次显式动作，所以走 POST 并校验同源。
    route(`${API_PREFIX}/install`, async (_url, response) => {
      const result = await ensureMaw()
      sendJson(response, result.ok ? 200 : 500, {
        ok: result.ok,
        version: result.version,
        error: result.error,
        maw: runtime.maw,
        install: runtime.install,
      })
    }, 'POST')

    route(`${API_PREFIX}/mode`, async (_url, response) => {
      sendJson(response, 200, { ok: true, presetId: MAW_PRESET_ID, log: modeLog })
    })

    route(`${API_PREFIX}/refresh`, async (_url, response) => {
      clearCache()
      sendJson(response, 200, { ok: true })
    })

    return () => {
      for (const dispose of disposers.reverse()) {
        try {
          dispose()
        } catch {
          // 单个路由卸载失败不该影响其余清理。
        }
      }
      clearCache()
    }
  }, 'dsh-maw: http routes')
}
