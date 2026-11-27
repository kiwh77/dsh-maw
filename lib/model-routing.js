const GOAL_PREFIX = '[maw-model] '
const TIER_PATTERN = /^[a-z][a-z0-9-]{0,63}$/u

function isModelId(value) {
  return typeof value === 'string' && /^[^\s\p{Cc}]+$/u.test(value)
}

function readModel(value) {
  if (!isModelId(value?.provider) || !isModelId(value?.model)) return null
  const { provider, model, reasoning_effort } = value
  if (reasoning_effort !== undefined && !isModelId(reasoning_effort)) return null
  return { provider, model, ...(reasoning_effort === undefined ? {} : { reasoning_effort }) }
}

export function readModelRequirements({ capabilityTier, model }, errors, label) {
  const requirements = {}
  if (capabilityTier !== undefined) {
    if (typeof capabilityTier === 'string' && TIER_PATTERN.test(capabilityTier)) {
      requirements.capabilityTier = capabilityTier
    } else {
      errors.push(`${label}.capabilityTier 需小写字母开头，只含小写字母、数字和连字符，最长 64 字符`)
    }
  }
  if (model !== undefined) {
    const route = readModel(model)
    if (route === null) errors.push(`${label}.model 需包含 provider 和 model，可选 reasoning_effort，各项均为非空且无空白的字符串`)
    else requirements.model = route
  }
  return requirements
}

// maw 的蓝图只把 goal / verify / not_doing 落进 extra（0.4.1 与 0.5.0 一致），
// 所以能力等级与模型只能编码进 goal 首行，不能指望自定义字段被保留。
export function encodeModelGoal(goal, { capabilityTier, model }) {
  if (capabilityTier === undefined && model === undefined) return goal
  return `${GOAL_PREFIX}${JSON.stringify({ capabilityTier, model })}${goal === '' ? '' : `\n${goal}`}`
}

export function decodeModelGoal(value) {
  if (!value.startsWith(GOAL_PREFIX)) return { goal: value }
  const newline = value.indexOf('\n')
  const header = newline === -1 ? value : value.slice(0, newline)
  const goal = newline === -1 ? '' : value.slice(newline + 1)
  const errors = []
  try {
    const requirements = readModelRequirements(JSON.parse(header.slice(GOAL_PREFIX.length)), errors, '任务')
    if (errors.length === 0 && Object.keys(requirements).length > 0) return { goal, ...requirements }
  } catch {
    // 保留原始内容供任务详情诊断，派发时拒绝使用默认模型。
  }
  return { goal: value, modelRoutingError: errors.join('；') || '任务的 [maw-model] 声明无效' }
}

export function normalizeModelGroups(value) {
  const groups = Object.create(null)
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return groups
  for (const [tier, models] of Object.entries(value)) {
    if (!TIER_PATTERN.test(tier)) continue
    const routes = Array.isArray(models) ? models.map(readModel) : []
    groups[tier] = routes.includes(null) ? [] : routes
  }
  return groups
}

export function resolveTaskModel(task, groups) {
  if (task.modelRoutingError !== undefined) return { error: task.modelRoutingError }
  if (task.model !== undefined) return { route: task.model }
  if (task.capabilityTier === undefined) return { route: {} }
  const route = groups[task.capabilityTier]?.[0]
  if (route === undefined) return { error: `能力等级 ${task.capabilityTier} 缺少有效的 modelGroups 配置` }
  return { route }
}
