# Multi-Agent Workspace（dsh-maw）

在 DeepSeek Harness 会话里直接看本机 [maw](https://github.com/) 多 Agent 看板：进度、任务泳道、依赖拓扑与 Agent 状态。

**看板与拓扑只读。** 它们不会领取（`next --claim`）、提交（`submit`）、合入（`merge`）、阻塞（`block`）或清理（`prune --yes`）任何任务。

会改动 maw 的执行路径只有两条，都是显式点击后才发生：

- **工具条按钮**：`启动`（新建 MAW 会话开工）、`自检`、`清理预览`、`一致性检查`。后三条对应的命令默认都不改任何东西（见「工具条按钮」）。
- **MAW 模式下压入任务**：把任务清单渲染成 blueprint，`maw plan check` 校验通过后增量 `plan apply`；不带 `--reset`，不会清空既有任务。

## 功能

- **会话视图标签**：在会话主区的「对话」「轨迹」旁边多一个「MAW看板」标签，点开就是看板。
- **只看当前工作区的工程**：看板展示哪个工程由会话自己的工作目录决定，没有「切换工程」入口。工作目录不属于任何 maw 工程时，内容区只显示一句「暂无任务。」，工具条上的问题按钮也一并隐藏（没有可查的数据，露出按钮只会误导）；怎么登记属于插件文档，不占界面文案。
- **快捷键**：按标签位置切换视图 —— `⌘1/2/3` 或 `⌥1/2/3`（Windows、Linux 为 `Ctrl+1/2/3` 或 `Alt+1/2/3`）。浏览器把「单修饰键 + 数字」留给自己，改用 `⌘⌥1/2/3`（`Ctrl+Alt+1/2/3`）。
- **页面分三块**：左侧「迭代」、中间「内容（看板 / 依赖）」、右侧「详情抽屉」。看板与依赖的切换在内容区自己的头部，只影响中间那块；只展示当前选中迭代的题。
- **迭代栏**：列出当前工程的迭代，带完成度（`20/35`）与状态。状态按任务完成度推导（见下节「三个维度」），所以题做完的迭代会显示「已完成」沉到后面，而不是永远「进行中」；一道题都没有的迭代标成「无任务」。选「全部迭代」看整工程，选某个迭代只看它。
- **看板**：按任务状态分列（可开工 / 进行中 / 合入中 / 待办 / 阻塞 / 已完成 / 已取消），每张卡用低饱和状态底色区分（不是只靠左侧细条）；按 标签 / 状态 / Agent 筛选，可切换是否显示已完成任务。筛选只作用于当前迭代。
- **依赖拓扑**：与 maw board 同款卡片（200×98、id + 状态徽章、两行标题、负责人与优先级）、平滑连线带中点圆点、跨视图依赖虚线；悬停高亮上下游，点击看详情。节点同样按状态铺底色。只画当前迭代的题；该迭代的题都已完成时，画布位置换成一句提示和「显示全部节点」开关，而不是留一张空画布。
- **详情抽屉**：点看板卡片或依赖节点，右侧抽屉展示任务详情：迭代与泳道、负责人、优先级、合入序、尝试次数、修订、实例、**执行思路（目标）**、不做的事、验收条目、验证命令、后续建议、上下游依赖（可点击跳转）、读写范围、阻塞分类与阻塞历史、取消原因与被替代关系、范围扩张记录。
- **问题面板**：工具条上「自检」左侧的「问题」按钮（带条数徽章）展开一份问题 / 风险清单，类型与严重度都是中文；带任务 id 的条目点一下直接打开那个任务的详情，Esc 或点空白处收起。

### 两个维度 + 一个标签：迭代、状态、标签

看板上真正正交的只有两个维度，`lane` 是挂在任务上的一个标注：

| 维度 | 回答的问题 | 取值示例 | 谁在维护 |
| --- | --- | --- | --- |
| **迭代**（iteration） | 这批活是哪一批要一起交付的 | `IT-HANDOFF-DUAL-END`「双端与 Figma 发布体验」，带目标与目标分支 | maw 迭代表 |
| **状态**（status） | 这道题自己走到哪一步了 | 待办 → 可开工 → 进行中 → 合入中 → 已完成 | maw 任务表，由 Agent 领取/提交/合入推动 |
| **标签**（lane） | 这道题属于哪块分工面 | `QA`、`WEB-FIX`、`设计与组件` | 压任务时写的一个自由标注 |

- **迭代是批次**：一批题一起交付、往同一个分支合。全部做完才算这个迭代完成。
- **状态是进度**：只描述单道题的生命周期，和批次无关。看板的列就是状态。
- **标签是分工面**：maw 用它做并行分工边界 —— 同一标签的题由同一个 Agent 串行做，避免两个 Agent 同时改同一批文件（对应 `maw next --claim --lane`、`bound_lane`、`--release-lane`）。它在界面上只是一个筛选与卡片角标，不再当成第三个维度。

**为什么标签不并入迭代**（实测本机 393 题、26 个迭代）：

- 同一个标签会跨多个迭代：`环境大屏` 出现在 5 个迭代里，`整体验收` 4 个，`界面易用性` 4 个。并进迭代会把这些跨批次的分工面拆散。
- 同一个迭代有多个标签：`IT-HANDOFF-DUAL-END` 一个迭代就有 10 个（API / CONTRACT / DESIGN-DATA / FIGMA-PLUGIN / QA / UX-DESIGN / WEB-ADMIN / WEB-BROWSE / WEB-FIX / WEB-SHELL）。反过来也不成立。
- 每道题只有一个 `lane` 值（单值字符串），98/393 为空。单值、自由填、可留空 —— 这就是标签的形态。

界面上：迭代栏选批次 → 内容区只看这批；看板按状态分列 → 看到这批里每道题走到哪一步；标签作为筛选与角标 → 看到这批活怎么分给不同 Agent。

### 迭代状态是按任务推导的

maw 不会在题做完后自动关闭迭代，数据库里的 `status` 会长期停在 `running`，直接显示就会「所有迭代都在进行中」。所以插件在 Host 侧按任务完成度推导：

- maw 记录值已是终态（`closed` / `done` / `archived` 等）→ 以记录值为准，不推翻人的显式操作；
- 这个迭代下一道题都没有 → 「无任务」；
- 题全部完成或取消 → **已完成**；
- 有进行中 / 合入中的题 → 进行中；
- 有可开工的题 → 进行中（活已经能动了）；
- 剩下的全是阻塞 → 阻塞；
- 只有待办 → 规划中。

推导出来的状态与 maw 记录值不同时，悬停能看到「maw 记录状态：running（按任务完成度推导）」。
- **三个只读工具**：`maw_board`、`maw_task`、`maw_deps`，Agent 可在会话里直接查同样的数据。**默认只看调用会话自己的工程**（按会话工作目录匹配 maw 工程，含子目录归属）；会话不属于任何 maw 工程时明确报错，不会退回全局。
- **MAW 模式**：模式选择器里的一个 preset。进入后把用户交待的任务拆成 maw 任务清单、压入队列、再派给团队执行；进入即自动开启智能体团队协作。
- **压入工具**：`maw_plan_push`，只在 MAW 模式下可见可用；先校验再压入，默认只校验不落库。

## 安装

两种方式，任选：

```bash
# 1) 从仓库安装（推荐给其他机器）
#    DSH 的插件管理 → 添加插件 → 填仓库地址
https://github.com/kiwh77/dsh-maw

# 2) 从本地目录安装（开发时用）
#    本机 checkout 在 ~/Documents/Projects/dsh-plugins/dsh-maw，软链接进 profile
```

安装后在「插件」页能看到 **Multi-Agent Workspace** 一行；会话顶部的视图标签会多出一个「MAW看板」。
首次启动时若本机没有 maw，插件会在后台按官方 release 装好（见下节）。

## maw 运行时（背景依赖）

插件不打包 maw 二进制（约 18MB、分平台），而是把安装这件事一起管起来：

- **激活时检测**：查 PATH 与常见安装位置（`~/.local/bin`、`/opt/homebrew/bin`、`/usr/local/bin`、`~/go/bin`）。
- **缺失时自动安装**（`autoInstall: true`，默认开）：从官方 release 取本平台包，**校验 sha256** 后解包装到 `~/.local/bin/maw`，再跑一次 `maw --version` 自证。全程后台，不阻塞会话。
- **版本跟进**：装好之后不会自己变新，所以 `maw_setup` 的 `status` 会顺手查一次上游最新 release，直接告诉你「有新版本 vX.Y.Z」还是「已是最新」。判断只比数字骨架，`0.5.0-dev` 这类本地构建不会被拉回 release。查到的结果缓存 6 小时，`/health` 只回缓存、不联网，所以 4 秒一次的轮询不会去打 GitHub。
- **前端提示**：maw 缺失或安装失败时，看板页顶部出现一条提示与「安装 maw」按钮。
- **工具**：`maw_setup`，`action: status | install | go`。
- **接口**：`GET /dsh-maw/api/health`（状态，含 `upstream` 版本跟进结果）、`POST /dsh-maw/api/install`（安装，同源校验）。

取不到 checksums 或校验不匹配时**宁可失败也不安装**。想手工装：

```bash
# 官方预编译包：先去 releases 页确认当前版本号，资产名里带版本
# https://github.com/kiwh77/maw/releases/latest
curl -L -o maw.tgz https://github.com/kiwh77/maw/releases/download/v0.5.0/maw_0.5.0_darwin_arm64.tar.gz
# 或者用 Go
GOBIN=~/.local/bin go install github.com/kiwh77/maw/cmd/maw@latest
```

`releases/latest/download/<资产名>` 也常见，但资产名里必须写版本号，版本一换就会 404，所以上面写成显式 tag 更不容易踩坑。

## 工程隔离

maw 可以在一台机器上登记多个工程，而 `maw board` 本身是**跨工程**的全局看板。本插件所有入口都按「当前工程」收口，避免把别人的题当成自己的题：

| 入口 | 隔离方式 |
|---|---|
| 看板 / 拓扑界面 | 只展示会话工作目录对应的那个工程；不属于任何工程时只显示「暂无任务。」并隐藏问题入口 |
| `maw_board` / `maw_task` / `maw_deps` / `maw_plan_push` | 默认按调用会话的工程取数；没有匹配工程时报错，不退回全局 |
| 启动按钮 | 启动指令里写入工程 id，并要求 MAW 模式调用工具时带 `project` 参数 |
| 风险 / 问题 / 迭代 | 来自全局快照，取回后按工程 id 在本地裁剪 |

`maw board` 支持 `--project`，但本插件**不用**它：那条命令会把本机共用的 `~/.maw/board/snapshot.json` 覆盖写成单工程范围，影响其它读者（例如 `maw serve`）。所以改为取全局快照后本地裁剪。

需要查另一个工程时，显式传 `project` 参数（工程 id）—— 这是刻意保留的口子，不做成默认行为。

## 工具条按钮

工具条上的按钮**只在「当前工程已登记到 maw」时出现**。未登记的目录没有队列、没有 agent、没有 worktree，任何动作都无从谈起，按钮露出来只会误导 —— 所以整组（启动 + 预览）一起隐藏。判定看 `maw project list` 里有没有这个目录。

### 启动

**启动** 按钮用现有队列直接开一轮 MAW 执行：点下去会新建一个 MAW 模式的会话，把「按依赖顺序开工、只动自己 writeScope」的指令投进去，然后跳到那个会话。

什么时候可点，由 Host 侧算好随看板下发（`data.launch`）：

| 状态 | 按钮 | 说明文案 |
|---|---|---|
| 有可开工任务，且该工程没有在跑的 MAW 会话 | 可点 | — |
| 该工程已有 MAW 会话在执行 | 禁用 | 不占版面，仅悬停显示「任务执行中」 |
| 任务都在等依赖（没有可开工的） | 禁用 | 当前没有可开工的任务 |
| 工程里还没有任务 | 禁用 | 这个工程还没有任务 |

判定必须放 Host 侧：只有那里同时看得到 maw 看板、会话头和 agent 的运行状态。`POST /dsh-maw/api/launch` 落库前会再判一次，所以别的标签页刚启动过时，重复点击会拿到 `409`，不会开两个会话。

接口：`POST /dsh-maw/api/launch?project=<工程 id>`（同源校验），返回 `{ ok, sessionId, reason, error, launch }`。

### 自检 / 清理预览 / 一致性检查

三个预览按钮对应 maw 里**默认无副作用**的三条命令，点下去不需要二次确认：

| 按钮 | 命令 | 使用条件与保证 |
|---|---|---|
| 自检 | `maw doctor` | 只读配置与协议版本；报 `issues` 数量与明细 |
| 清理预览 | `maw prune` | 不带 `--yes` 即 dry-run，只列出残留工作树与分支，**不删除** |
| 一致性检查 | `maw reconcile` | 不带 `--apply` 即只报告，列出 `findings`，**不修复** |

结果在看板顶部展开，可关掉。

**刻意没做成按钮的操作**：`submit` / `merge` / `block` / `task cancel` / `interrupt` / `reassign` / `lease release` / `project rm` / `prune --yes` / `reconcile --apply`。这些会把任务推到终态、动 worktree 或删除登记，需要任务处在特定状态且后果由人确认，交给 MAW 模式的 Agent 用工具调用更合适。

执行器侧还有第二道闸：`isAllowedPreview` 只放行上述三条命令，且**参数级黑名单**会拒绝 `--yes` / `--force` / `--apply` / `--force-unmerged` / `--history`。即便前面的调用参数被改坏，也变不成真删。

接口：`POST /dsh-maw/api/preview?action=<doctor|prune|reconcile>&project=<工程 id>`（同源校验），返回 `{ ok, id, summary, lines, error }`。

## 数据来源

| 数据 | 来源 | 说明 |
|---|---|---|
| 全量任务（含依赖） | `maw task list -C <项目> --json` | 唯一能拿到全部任务的路径 |
| 看板摘要 / 风险 / 问题 | `maw board -C <项目> --json` → `snapshot` 指向的文件 | 摘要与健康度只有这里全 |
| Agent 列表 | `maw agents --json` | 任意目录可用 |

浏览器端不能执行进程，所以由 Host 侧跑 maw、再经 `/dsh-maw/api/*` 交给页面。这条路径与本机 `dshmarket` 一致。

## 配置

在 `~/.dsh/profiles/desktop/cordis.patch.yml` 里覆盖 `dsh-maw` 那一行的 `config`：

```yaml
- id: dsh-maw
  name: 'dsh-maw'
  config:
    projects: []          # 项目路径；空 = 用会话目录，再退回 maw 项目登记
    pollMs: 5000          # 前端刷新间隔（毫秒）
    cacheMs: 5000         # Host 侧命令缓存 TTL（毫秒）
    timeoutMs: 8000       # 单条命令超时（毫秒）
    showDone: false       # 看板默认是否显示已完成任务
    maxGraphNodes: 300    # 拓扑图节点上限，超出按状态折叠
    mawBinary: ''         # maw 可执行文件路径；空 = 从 PATH 与常见安装位置查找
    autoInstall: true     # maw 缺失时是否自动安装
    mawVersion: latest    # 安装的版本；可钉成具体 tag，如 v0.5.0
    installDir: ''        # 安装目录；空 = ~/.local/bin
    allowGoFallback: false # 自动安装失败后是否退到 go install
    modelGroups:          # MAW 子智能体能力等级。provider 和 model 须替换为本机 DSH 的 ID
      basic:
        - provider: your-provider
          model: your-small-model
      advanced:
        - provider: your-provider
          model: your-large-model
          reasoning_effort: high # 可选，取值由模型提供方决定
```

等级名由配置决定，使用小写字母、数字和连字符，并以字母开头。每组第一项是该等级的默认模型。按等级派发时，模型不可用或未授权会返回 DSH 错误。

在 DSH 的子智能体设置中启用「允许 Agent 为子智能体选择模型」，把要用的模型加入授权列表，再开一个新的 MAW 会话。可在会话中用 `list_subagent_models` 查提供方、模型和推理强度，用 `maw_model_groups` 查看本插件配置的等级。

## MAW 模式怎么走

1. 在模式选择器里选「MAW 模式」。
2. 交待任务。Agent 会拆成带 `writeScope` / `deps` / `acceptance` / `verify` 的题卡。
3. 先调 `maw_plan_push`（不带 `apply`）看校验结果与理论并行度，确认后再带 `apply: true` 压入。
4. 压入后按依赖层次调用 `maw_delegate`。插件根据已保存的题卡创建子智能体，子智能体按题号领取并执行。

题卡可选填 `capabilityTier: "basic"` 或 `capabilityTier: "advanced"`。需要指定具体模型时，填写 `model: { provider: "your-provider", model: "your-model" }`，也可以加 `reasoning_effort`。模型选择优先级依次为题卡的精确模型、能力等级的默认模型、DSH 的默认子智能体策略。

手写 CLI 蓝图时，把配置写在任务 `goal` 首行，正文另起一行。现有 maw 运行时会随任务目标保存这条声明，独立运行的 CLI worker 也可以从题卡中看到它。模型由 DSH 的 `maw_delegate` 应用。

```toml
goal = '''
[maw-model] {"capabilityTier":"advanced"}
检查跨模块状态迁移，修复并补齐验证。
'''
```

团队协作由插件在预设切到 MAW 时自动打开；开关失败只记诊断，不会让会话创建失败。

## 与 maw 的版本关系

插件不绑定某个特定 maw 版本：它只消费 maw 的 JSON 输出，字段读取全部走容错访问器，maw 多给字段会被忽略、少给字段不会崩。已实测的版本：

| 能力 | 0.4.1 | 0.5.0 |
|---|---|---|
| `task list` / `task show`（含 `deps`/`acceptance`/`extra`） | ✅ | ✅ |
| `board --json`（counts / snapshot） | ✅ | ✅ |
| `agents` / `project list` / `iteration list` | ✅ | ✅ |
| `plan check` / `plan apply` | ✅ | ✅ |
| `goal` 里的 `[maw-model]` 声明原样保留 | ✅ | ✅ |
| 全量测试套件 | 通过 | 通过（103 项） |

0.5.0 移除了 Lead/System/Managed 调度层、`node`/`stats` 子命令和 Pi 运行时。插件本来就没用到这些（`node list` 曾留在只读白名单里，已随 0.5.0 一起删掉），所以升级不需要改配置。

想跟最新行为就走 `mawBinary` 指到你自己的构建产物；用 `maw_setup status` 可以随时问「本机这份是不是最新的」。

## 限制

- 依赖 maw 的 JSON 输出格式，但**不绑定具体版本**。上游若改字段名，对应展示会留空而不是报错 —— 这是有意的降级策略，可用 `maw_setup status` 加上面那张表排查。
- 版本跟进只判断「本机是否落后于最新 release」，不会自动升级：装新版本是一次显式动作（`maw_setup action=install`）。
- 拓扑图默认只渲染未完成子图（本机约 60 个节点）；勾选「显示全部」才会渲染全部节点。
- 任一数据源失败时，该源标记为降级并在界面提示，其余部分照常渲染。
- 未实现 `maw status report` 心跳上报 —— 这是写操作，按设计排除。

## 卸载

在 **设置 → 插件** 里停用或移除 `dsh-maw`。插件只注册工具、HTTP 路由和两个界面挂载点，卸载后不留残留状态。
