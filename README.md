# maw 看板（dsh-maw）

在 DeepSeek Harness 会话里直接看本机 [maw](https://github.com/) 多 Agent 看板：进度、任务泳道、依赖拓扑与 Agent 状态。

**默认只读。** 看板与拓扑不会领取（`next --claim`）、提交（`submit`）、合入（`merge`）、阻塞（`block`）或清理（`prune`）任何任务。

唯一的写路径是 **MAW 模式** 下的任务压入：把任务清单渲染成 blueprint，`maw plan check` 校验通过后增量 `plan apply`。它不带 `--reset`，不会清空既有任务。

## 功能

- **会话视图标签**：在会话主区的「对话」「轨迹」旁边多一个「看板」标签，点开就是看板。
- **按工作区自动选工程**：从某个工作区进入会话时，若该工作区对应一个 maw 工程，看板默认只显示那个工程；切到「全部」可看全局。
- **快捷键**：按标签位置切换视图 —— `⌘1/2/3` 或 `⌥1/2/3`（Windows、Linux 为 `Ctrl+1/2/3` 或 `Alt+1/2/3`）。浏览器把「单修饰键 + 数字」留给自己，改用 `⌘⌥1/2/3`（`Ctrl+Alt+1/2/3`）。
- **看板**：以任务状态为泳道（可开工 / 进行中 / 合入中 / 待办 / 阻塞 / 已完成 / 已取消），卡上带原泳道名；按 项目 / 泳道 / 状态 / Agent 四维筛选，可切换是否显示已完成任务。
- **依赖拓扑**：与 maw board 同款卡片（200×98，左侧状态色条、id + 状态徽章、两行标题、负责人与优先级）、平滑连线带中点圆点、跨视图依赖虚线；悬停高亮上下游，点击看详情。
- **任务详情**：状态、负责人、依赖上下游、读写范围、验收条目、验证命令、分支与工作树。
- **三个只读工具**：`maw_board`、`maw_task`、`maw_deps`，Agent 可在会话里直接查同样的数据。
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

安装后在「插件」页能看到 **maw 看板** 一行；会话顶部的视图标签会多出一个「看板」。
首次启动时若本机没有 maw，插件会在后台按官方 release 装好（见下节）。

## maw 运行时（背景依赖）

插件不打包 maw 二进制（约 18MB、分平台），而是把安装这件事一起管起来：

- **激活时检测**：查 PATH 与常见安装位置（`~/.local/bin`、`/opt/homebrew/bin`、`/usr/local/bin`、`~/go/bin`）。
- **缺失时自动安装**（`autoInstall: true`，默认开）：从官方 release 取本平台包，**校验 sha256** 后解包装到 `~/.local/bin/maw`，再跑一次 `maw --version` 自证。全程后台，不阻塞会话。
- **前端提示**：maw 缺失或安装失败时，看板页顶部出现一条提示与「安装 maw」按钮。
- **工具**：`maw_setup`，`action: status | install | go`。
- **接口**：`GET /dsh-maw/api/health`（状态）、`POST /dsh-maw/api/install`（安装，同源校验）。

取不到 checksums 或校验不匹配时**宁可失败也不安装**。想手工装：

```bash
# 官方预编译包
curl -L -o maw.tgz https://github.com/kiwh77/maw/releases/latest/download/maw_0.4.0_darwin_arm64.tar.gz
# 或者用 Go
GOBIN=~/.local/bin go install github.com/kiwh77/maw/cmd/maw@latest
```

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
  name: '@local/dsh-maw'
  config:
    projects: []          # 项目路径；空 = 用会话目录，再退回 maw 项目登记
    pollMs: 5000          # 前端刷新间隔（毫秒）
    cacheMs: 5000         # Host 侧命令缓存 TTL（毫秒）
    timeoutMs: 8000       # 单条命令超时（毫秒）
    showDone: false       # 看板默认是否显示已完成任务
    maxGraphNodes: 300    # 拓扑图节点上限，超出按状态折叠
    mawBinary: ''         # maw 可执行文件路径；空 = 从 PATH 与常见安装位置查找
    autoInstall: true     # maw 缺失时是否自动安装
    mawVersion: latest    # 安装的版本；可钉成 v0.4.0
    installDir: ''        # 安装目录；空 = ~/.local/bin
    allowGoFallback: false # 自动安装失败后是否退到 go install
```

## MAW 模式怎么走

1. 在模式选择器里选「MAW 模式」。
2. 交待任务。Agent 会拆成带 `writeScope` / `deps` / `acceptance` / `verify` 的题卡。
3. 先调 `maw_plan_push`（不带 `apply`）看校验结果与理论并行度，确认后再带 `apply: true` 压入。
4. 压入后按依赖层次用团队并行执行，收尾给一张结果表。

团队协作由插件在预设切到 MAW 时自动打开；开关失败只记诊断，不会让会话创建失败。

## 与 maw 的版本关系

插件在 maw `main`（本地 0.4.1-dev）上开发，官方 release 目前是 **v0.4.0**。两者都验过：

| 命令 | v0.4.0 | 0.4.1-dev |
|---|---|---|
| `task list --json`（含 `deps`/`acceptance`/`extra`） | ✅ | ✅ |
| `board --json`（counts / snapshot） | ✅ | ✅ |
| `plan check` / `plan apply` | ✅ | ✅ |

装哪个都行；想跟最新行为就走 `mawBinary` 指到你自己的构建产物。

## 限制

- 只支持 **maw 0.4.1** 的 JSON 输出格式。字段读取全部走容错访问器，maw 少给字段不会崩，但新版本若改字段名，对应展示会留空。
- 拓扑图默认只渲染未完成子图（本机约 60 个节点）；勾选「显示全部」才会渲染全部节点。
- 任一数据源失败时，该源标记为降级并在界面提示，其余部分照常渲染。
- 未实现 `maw status report` 心跳上报 —— 这是写操作，按设计排除。

## 卸载

在 **设置 → 插件** 里停用或移除 `@local/dsh-maw`。插件只注册工具、HTTP 路由和两个界面挂载点，卸载后不留残留状态。
