/**
 * 把一份任务清单渲染成 maw 能接受的 blueprint TOML。
 *
 * 只做「生成 + 校验 + 落盘」三件事，不碰 maw 状态；压入由调用方决定是否执行。
 * 生成的 TOML 必须是确定性的（同样的输入产出同样的字节），这样重复压入是幂等的。
 */

/** 合法任务 id：字母开头，含字母数字与连字符。 */
const TASK_ID_PATTERN = /^[A-Za-z][A-Za-z0-9-]{0,63}$/u

/**
 * 转义一个 TOML 基本字符串。
 * @param {string} value
 * @returns {string}
 */
export function tomlString(value) {
  const escaped = String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
  return `"${escaped}"`
}

/**
 * 渲染字符串数组；空数组渲染成 `[]`。
 * @param {string[]} values
 * @returns {string}
 */
export function tomlArray(values) {
  if (!Array.isArray(values) || values.length === 0) return '[]'
  return `[${values.map(tomlString).join(', ')}]`
}

/**
 * 校验并归一压入请求。
 * @param {object} input
 * @returns {{ok: true, plan: object} | {ok: false, errors: string[]}}
 */
export function normalizePlan(input) {
  const errors = []
  const raw = input !== null && typeof input === 'object' ? input : {}

  const iteration = raw.iteration !== null && typeof raw.iteration === 'object' ? raw.iteration : {}
  const iterationId = typeof iteration.id === 'string' ? iteration.id.trim() : ''
  if (iterationId === '') errors.push('iteration.id 必填')
  if (iterationId !== '' && !TASK_ID_PATTERN.test(iterationId)) {
    errors.push(`iteration.id "${iterationId}" 不合法：需字母开头，只含字母数字与连字符`)
  }

  const tasks = Array.isArray(raw.tasks) ? raw.tasks : []
  if (tasks.length === 0) errors.push('tasks 至少要有一项')

  const seen = new Set()
  const normalized = []
  for (const [index, task] of tasks.entries()) {
    const item = task !== null && typeof task === 'object' ? task : {}
    const label = `tasks[${index}]`
    const id = typeof item.id === 'string' ? item.id.trim() : ''
    if (id === '') {
      errors.push(`${label}.id 必填`)
      continue
    }
    if (!TASK_ID_PATTERN.test(id)) {
      errors.push(`${label}.id "${id}" 不合法：需字母开头，只含字母数字与连字符`)
      continue
    }
    if (seen.has(id)) {
      errors.push(`${label}.id "${id}" 重复`)
      continue
    }
    seen.add(id)

    const title = typeof item.title === 'string' ? item.title.trim() : ''
    if (title === '') errors.push(`${label}.title 必填`)

    const strArray = value => (Array.isArray(value) ? value.filter(v => typeof v === 'string' && v.trim() !== '').map(v => v.trim()) : [])

    // maw 的硬要求：每题都要有可判定断言与可执行验证，否则 plan check 会拒。
    const acceptance = strArray(item.acceptance)
    const verify = strArray(item.verify)
    if (acceptance.length === 0) errors.push(`${label}.acceptance 至少要有一条（可判定断言）`)
    if (verify.length === 0) errors.push(`${label}.verify 至少要有一条（可执行命令或 manual: …）`)

    normalized.push({
      id,
      title,
      goal: typeof item.goal === 'string' ? item.goal.trim() : '',
      lane: typeof item.lane === 'string' ? item.lane.trim() : '',
      iteration: typeof item.iteration === 'string' && item.iteration.trim() !== '' ? item.iteration.trim() : iterationId,
      priority: Number.isFinite(item.priority) ? Math.trunc(item.priority) : 100,
      // 默认排在既有任务之后：既有工程用 2xxx/3xxx 段，压入的题从 9xxx 起，
      // 避免与历史 merge_order 抢同一个合入位。
      mergeOrder: Number.isFinite(item.mergeOrder) ? Math.trunc(item.mergeOrder) : 9000 + index,
      deps: strArray(item.deps),
      writeScope: strArray(item.writeScope),
      readScope: strArray(item.readScope),
      acceptance,
      verify,
      notDoing: strArray(item.notDoing),
    })
  }

  // 依赖可以指向本批任务，也可以指向历史任务（外部 id 无法在此校验），
  // 唯一能确定错的只有「依赖自己」。
  for (const task of normalized) {
    if (task.deps.includes(task.id)) errors.push(`${task.id} 依赖自己`)
  }

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    plan: {
      name: typeof raw.name === 'string' && raw.name.trim() !== '' ? raw.name.trim() : 'maw-mode',
      version: Number.isFinite(raw.version) ? Math.trunc(raw.version) : 1,
      mainBranch: typeof raw.mainBranch === 'string' && raw.mainBranch.trim() !== '' ? raw.mainBranch.trim() : 'dev',
      iteration: {
        id: iterationId,
        name: typeof iteration.name === 'string' && iteration.name.trim() !== '' ? iteration.name.trim() : iterationId,
        goal: typeof iteration.goal === 'string' ? iteration.goal.trim() : '',
        targetBranch: typeof iteration.targetBranch === 'string' && iteration.targetBranch.trim() !== ''
          ? iteration.targetBranch.trim()
          : 'dev',
      },
      tasks: normalized,
    },
  }
}

/**
 * 渲染 blueprint TOML。
 * @param {ReturnType<typeof normalizePlan> extends {plan: infer P} ? P : never} plan
 * @returns {string}
 */
export function renderBlueprint(plan) {
  const lines = []
  lines.push('[meta]')
  lines.push(`name = ${tomlString(plan.name)}`)
  lines.push(`version = ${plan.version}`)
  lines.push(`main_branch = ${tomlString(plan.mainBranch)}`)
  lines.push('')
  lines.push('[[iteration]]')
  lines.push(`id = ${tomlString(plan.iteration.id)}`)
  lines.push(`name = ${tomlString(plan.iteration.name)}`)
  lines.push(`goal = ${tomlString(plan.iteration.goal)}`)
  lines.push(`target_branch = ${tomlString(plan.iteration.targetBranch)}`)
  lines.push('status = "running"')

  for (const task of plan.tasks) {
    lines.push('')
    lines.push('[[task]]')
    lines.push(`id = ${tomlString(task.id)}`)
    if (task.lane !== '') lines.push(`lane = ${tomlString(task.lane)}`)
    lines.push(`title = ${tomlString(task.title)}`)
    if (task.goal !== '') lines.push(`goal = ${tomlString(task.goal)}`)
    lines.push(`iteration = ${tomlString(task.iteration)}`)
    lines.push(`priority = ${task.priority}`)
    lines.push(`merge_order = ${task.mergeOrder}`)
    lines.push(`deps = ${tomlArray(task.deps)}`)
    lines.push(`write_scope = ${tomlArray(task.writeScope)}`)
    lines.push(`read_scope = ${tomlArray(task.readScope)}`)
    lines.push(`acceptance = ${tomlArray(task.acceptance)}`)
    lines.push(`verify = ${tomlArray(task.verify)}`)
    if (task.notDoing.length > 0) lines.push(`not_doing = ${tomlArray(task.notDoing)}`)
  }
  return `${lines.join('\n')}\n`
}

/**
 * 生成落盘路径：放在项目的 .multiagent 下，文件名带时间戳，永不覆盖既有蓝图。
 * @param {string} projectPath
 * @param {Date} [now]
 * @returns {string}
 */
export function blueprintPath(projectPath, now = new Date()) {
  const pad = n => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return `${projectPath.replace(/\/+$/u, '')}/.multiagent/blueprint.maw-${stamp}.toml`
}
