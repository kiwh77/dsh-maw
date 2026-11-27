/**
 * 启动：把「面板上的一个按钮」变成一次真实的 MAW 模式会话。
 *
 * 三件事：
 *  1) 判定能不能启动 —— 有可开工的题，且没有正在跑的 MAW 会话。
 *  2) 发起启动 —— 建一个 MAW 模式的会话，把启动指令投进去，让它自己按
 *     「拆题 → 压入队列 → 团队执行 → 汇报」跑起来。
 *  3) 把结果归一成 `{ ok, status, ... }`，不向调用方抛异常。
 *
 * 判定必须在 Host 侧做：只有这里同时看得到 maw 看板、会话头和 agent 的
 * 运行状态；放在浏览器侧会得到「按钮亮着但点了没反应」的错觉。
 *
 * 与控制台里的其它部分一致：这里只 import 本地文件，不依赖 `@deepseek-ai/*`
 * 能从插件目录解析。
 */

/** 已在运行的判据：agent 状态为 running。 */
const RUNNING = 'running'

/** 启动指令模板。工程由调用方填，其余是固定的执行要求。 */
const LAUNCH_PROMPT = [
  '按 MAW 模式执行 maw 队列里的任务。',
  '',
  '工程：{projectName}（id {projectId}）',
  '目录：{projectPath}',
  '',
  '隔离要求：只看这个工程的队列。调用 maw_board / maw_task / maw_deps / maw_plan_push 时',
  '一律带上 project="{projectId}"，不要跨工程读题或派活。',
  '',
  '流程：先用 maw_board 看当前可开工的题和它们的依赖层次；有可开工的题就按依赖顺序开团队并行执行，',
  '用 maw_delegate 按任务 id 和当前 project 派发，由工具应用题卡上的模型要求。',
  '每个 teammate 只动自己那题的 writeScope；没有可开工的题就停下来汇报卡在哪里。',
  '执行中不要压入新题、不要改动队列里既有任务，只做派活与复核。',
  '收尾给一张表：题号 / 结果 / 验证证据 / 遗留问题。',
].join('\n')

/**
 * 把启动指令里的工程信息填进去。
 * @param {string} projectPath 工程目录
 * @param {string} [projectId] 工程 id；有了它模型才能把工具调用限定在本工程
 * @param {string} [projectName] 工程名，便于模型复述
 * @returns {string}
 */
export function launchPrompt(projectPath, projectId = '', projectName = '') {
  // projectId 在模板里出现两次（标题与隔离要求），必须全替换。
  return LAUNCH_PROMPT
    .replaceAll('{projectName}', projectName === '' ? projectPath : projectName)
    .replaceAll('{projectId}', projectId === '' ? '(未提供)' : projectId)
    .replaceAll('{projectPath}', projectPath)
}

/**
 * 从 agent 会话头判断它属于哪个工程路径。
 *
 * 同一个目录可能被登记成 workspace 的规范化路径，也可能写进会话头的是
 * 用户给的原始路径，所以两边都做一次尾部斜杠归一后比较。
 *
 * @param {string} sessionCwd
 * @param {string} projectPath
 * @returns {boolean}
 */
export function samePath(sessionCwd, projectPath) {
  const left = normalizePath(sessionCwd)
  const right = normalizePath(projectPath)
  return left !== '' && left === right
}

/**
 * 归一一个目录路径：只去掉尾部斜杠。
 *
 * 不做 realpath 之类的额外解析 —— 调用方比对的都是同一来源的路径，
 * 多解析一层反而可能把符号链接的两种写法判成不同工程。
 * @param {unknown} value
 * @returns {string}
 */
export function normalizePath(value) {
  return typeof value === 'string' ? value.replace(/\/+$/u, '') : ''
}

/**
 * 找出某个工程下正在运行的 MAW 会话。
 *
 * 三条约束缺一不可：同一个工程目录、MAW 模式、agent 正在跑。只看「这个工程
 * 有会话」会把历史会话也算成忙碌；只看 preset 会把别的工程的会话也算进来。
 *
 * @param {object[]} agents 活的 agent 列表
 * @param {string} projectPath
 * @param {string} presetId MAW 模式的 preset id
 * @returns {object[]} 命中的 agent
 */
export function runningInProject(agents, projectPath, presetId) {
  const list = Array.isArray(agents) ? agents : []
  return list.filter(agent => {
    if (agent === null || typeof agent !== 'object') return false
    if (agent.status !== RUNNING) return false
    const header = agent.session?.header ?? {}
    if (header.agentPreset !== presetId) return false
    return samePath(header.cwd, projectPath)
  })
}

/**
 * 判定这次请求该不该让按钮可点，并给出原因。
 *
 * 顺序很重要：先看有没有活可干，再看是不是已经在干。两条都不满足时，
 * 界面上的按钮都禁用，但禁用文案应该说的是真正的原因。
 *
 * @param {{frontier: string[], total: number}} board 看板模型
 * @param {object[]} running 该工程下正在运行的 MAW 会话
 * @returns {{canLaunch: boolean, reason: string, frontier: number, running: number}}
 */
export function launchState(board, running) {
  const frontier = Array.isArray(board?.frontier) ? board.frontier.length : 0
  const runningCount = Array.isArray(running) ? running.length : 0
  if (runningCount > 0) {
    return { canLaunch: false, reason: 'already-running', frontier, running: runningCount }
  }
  if (frontier === 0) {
    const total = typeof board?.total === 'number' ? board.total : 0
    return { canLaunch: false, reason: total === 0 ? 'no-tasks' : 'nothing-ready', frontier, running: 0 }
  }
  return { canLaunch: true, reason: '', frontier, running: 0 }
}
