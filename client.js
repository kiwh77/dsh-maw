window.__ModuleLoader__.load({
  id: 'dsh-maw',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } = React

    const API = '/dsh-maw/api'

    // ── 文案 ─────────────────────────────────────────────
    const TEXT = {
      zh: {
        tab: '看板',
        switchTo: '切换到',
        title: 'Multi-Agent Workspace',
        progress: '进度',
        tasks: '题',
        activeAgents: '活跃 Agent',
        frontier: '可开工',
        loading: '正在读取 maw…',
        empty: '没有符合条件的任务。',
        failed: '读取 maw 失败',
        stale: '数据源降级',
        retry: '重试',
        board: '看板',
        graph: '拓扑',
        filterLane: '泳道',
        filterStatus: '状态',
        filterAgent: 'Agent',
        all: '全部',
        showDone: '显示已完成',
        showAllNodes: '显示全部节点',
        risks: '风险',
        problems: '问题',
        iterations: '迭代',
        detail: '任务详情',
        deps: '依赖',
        upstream: '上游',
        downstream: '下游',
        scope: '写范围',
        readScope: '读范围',
        acceptance: '验收',
        verify: '验证命令',
        owner: '负责人',
        lane: '泳道',
        priority: '优先级',
        mergeOrder: '合入序',
        attempts: '尝试',
        branch: '分支',
        worktree: '工作树',
        blockedReason: '阻塞原因',
        goal: '目标',
        none: '(无)',
        unassigned: '(未分配)',
        cycles: '循环依赖',
        dangling: '悬空依赖',
        blockedChains: '阻塞链',
        criticalPath: '关键路径',
        generatedAt: '更新于',
        noSelection: '点一个节点看详情',
        layers: '层',
        nodes: '节点',
        edges: '依赖',
        fit: '适应画布',
        relayout: '重布局',
        legend: '依赖方向：前置 → 后续',
        legendCross: '虚线：当前视图外的依赖',
        stubTitle: '筛选外 / 历史依赖',
        stubHint: '不在当前视图',
        pNone: 'P—',
        healthMissing: '未检测到 maw',
        healthMissingHint: '看板与压测需要本机 maw。点安装会下载官方 release 并校验 sha256。',
        install: '安装 maw',
        installing: '正在安装…',
        installDone: '已装好 maw',
        installFailed: '安装失败',
        healthReady: 'maw',
        launch: '启动',
        launching: '正在启动…',
        launchHint: '以 MAW 模式发起一次会话，按依赖顺序开工',
        launchRunningTitle: '任务执行中',
        launchDisabledNothingReady: '当前没有可开工的任务',
        launchDisabledNoTasks: '这个工程还没有任务',
        launchDisabledNoProject: '没有解析到这个工程的目录',
        launchFailed: '启动失败',
        actionDoctor: '自检',
        actionDoctorHint: '只读体检：检查 maw 配置与协议版本',
        actionPrune: '清理预览',
        actionPruneHint: '只列出残留工作树与分支，不删除任何东西',
        actionReconcile: '一致性检查',
        actionReconcileHint: '只报告生命周期残留，不做修复',
        actionFailed: '执行失败',
        actionRunning: '执行中…',
        actionEmpty: '没有发现问题',
        close: '关闭',
        notMawProject: '当前工作区不是 maw 工程，没有看板可展示。',
        notMawProjectHint: '把该目录登记进 maw（maw project add）后，这里会显示它的队列。',
      },
      en: {
        tab: 'Board',
        switchTo: 'Switch to',
        title: 'Multi-Agent Workspace',
        progress: 'progress',
        tasks: 'tasks',
        activeAgents: 'active agents',
        frontier: 'ready',
        loading: 'Reading maw…',
        empty: 'No task matches the filters.',
        failed: 'Failed to read maw',
        stale: 'data source degraded',
        retry: 'Retry',
        board: 'Board',
        graph: 'Topology',
        filterLane: 'Lane',
        filterStatus: 'Status',
        filterAgent: 'Agent',
        all: 'All',
        showDone: 'Show done',
        showAllNodes: 'Show every node',
        risks: 'Risks',
        problems: 'Problems',
        iterations: 'Iterations',
        detail: 'Task detail',
        deps: 'Deps',
        upstream: 'Upstream',
        downstream: 'Downstream',
        scope: 'Write scope',
        readScope: 'Read scope',
        acceptance: 'Acceptance',
        verify: 'Verify',
        owner: 'Owner',
        lane: 'Lane',
        priority: 'Priority',
        mergeOrder: 'Merge order',
        attempts: 'Attempts',
        branch: 'Branch',
        worktree: 'Worktree',
        blockedReason: 'Blocked reason',
        goal: 'Goal',
        none: '(none)',
        unassigned: '(unassigned)',
        cycles: 'Cycles',
        dangling: 'Dangling deps',
        blockedChains: 'Blocked chains',
        criticalPath: 'Critical path',
        generatedAt: 'Updated',
        noSelection: 'Select a node for detail',
        layers: 'layers',
        nodes: 'nodes',
        edges: 'edges',
        fit: 'Fit',
        relayout: 'Relayout',
        legend: 'Dependency direction: predecessor → successor',
        legendCross: 'Dashed: dependency outside this view',
        stubTitle: 'Filtered out / historical',
        stubHint: 'Not in this view',
        pNone: 'P—',
        healthMissing: 'maw not detected',
        healthMissingHint: 'The board and push need a local maw. Installing downloads the official release and verifies its sha256.',
        install: 'Install maw',
        installing: 'Installing…',
        installDone: 'maw installed',
        installFailed: 'Install failed',
        healthReady: 'maw',
        launch: 'Launch',
        launching: 'Launching…',
        launchHint: 'Start a MAW-mode session that works the queue in dependency order',
        launchRunningTitle: 'Task in progress',
        launchDisabledNothingReady: 'No task is ready to start',
        launchDisabledNoTasks: 'This project has no tasks yet',
        launchDisabledNoProject: 'Could not resolve this project directory',
        launchFailed: 'Launch failed',
        actionDoctor: 'Self-check',
        actionDoctorHint: 'Read-only health check of maw config and protocol version',
        actionPrune: 'Prune preview',
        actionPruneHint: 'List leftover worktrees and branches; nothing is deleted',
        actionReconcile: 'Reconcile check',
        actionReconcileHint: 'Report lifecycle leftovers; nothing is repaired',
        actionFailed: 'Action failed',
        actionRunning: 'Running…',
        actionEmpty: 'Nothing found',
        close: 'Close',
        notMawProject: 'This workspace is not a maw project, so there is no board to show.',
        notMawProjectHint: 'Register the directory with maw (maw project add) to see its queue here.',
      },
    }

    /** 状态的显示名：看板泳道名与人读的状态。 */
    const STATUS_LABEL = {
      zh: {
        backlog: '待办',
        ready: '可开工',
        in_progress: '进行中',
        merging: '合入中',
        blocked: '阻塞',
        done: '已完成',
        cancelled: '已取消',
      },
      en: {
        backlog: 'Backlog',
        ready: 'Ready',
        in_progress: 'In progress',
        merging: 'Merging',
        blocked: 'Blocked',
        done: 'Done',
        cancelled: 'Cancelled',
      },
    }

    /** 泳道顺序：与 maw board 一致，先看可开工与在跑，阻塞单独一列。 */
    const STATUS_ORDER = ['ready', 'in_progress', 'merging', 'backlog', 'blocked', 'done', 'cancelled']

    let dict = TEXT.zh
    let statusLabel = STATUS_LABEL.zh

    /**
     * 跳到某个会话。
     *
     * 槽位组件拿不到插件 ctx，而启动成功后要立刻把用户带到新会话，
     * 所以在 apply 里把 uiWorkspace 的能力放进这个模块级钩子。
     * 服务缺失时退化成「不跳转」：会话已经建好，用户能在侧栏里看到它。
     * @param {string} _sessionId
     */
    let openSession = () => {}

    // ── 样式（对齐 maw board 的看板与拓扑视觉） ───────────
    const CSS = `
.maw-view { display: flex; flex-direction: column; height: 100%; min-height: 0;
  color: var(--dsw-alias-label-primary); font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", var(--dsw-font-sans, sans-serif); }

.maw-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 8px 16px; border-bottom: 1px solid var(--dsw-alias-border-l1); flex: none; }
.maw-bar__title { font-weight: 600; font-size: 13px; }
.maw-tabs { display: inline-flex; gap: 2px; padding: 3px; border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2); margin-left: 6px; }
.maw-tab { border: 0; border-radius: 6px; height: 24px; padding: 0 10px; font: inherit;
  font-size: 12px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; }
.maw-tab[aria-selected="true"] { background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-brand-primary); box-shadow: 0 1px 2px var(--dsw-alias-border-l1); font-weight: 600; }
.maw-tab:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.maw-bar__spacer { flex: 1; }
.maw-muted { color: var(--dsw-alias-label-secondary); font-size: 11px; white-space: nowrap; }
.maw-track { width: 120px; height: 4px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); overflow: hidden; }
.maw-track__fill { height: 100%; background: var(--dsw-alias-brand-primary); border-radius: 999px; }

.maw-filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 8px 16px; border-bottom: 1px solid var(--dsw-alias-border-l1); flex: none; }
.maw-field { display: inline-flex; align-items: center; gap: 6px; font-size: 11px;
  color: var(--dsw-alias-label-secondary); }
.maw-select { font: inherit; font-size: 11px; height: 26px; padding: 0 24px 0 8px;
  border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); max-width: 200px; }
.maw-check { display: inline-flex; align-items: center; gap: 5px; font-size: 11px;
  color: var(--dsw-alias-label-secondary); cursor: pointer; }

.maw-body { display: flex; flex: 1; min-height: 0; }
.maw-main { flex: 1; min-width: 0; overflow: auto; padding: 14px 16px; }
.maw-side { width: 300px; flex: none; overflow: auto; padding: 14px 16px;
  border-left: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); }

/* 看板列 */
.maw-lane { margin-bottom: 18px; }
.maw-lane__head { display: flex; align-items: baseline; gap: 8px; font-weight: 600;
  font-size: 12px; padding: 6px 2px 8px; border-top: 1px solid var(--dsw-alias-border-l1); }
.maw-lane__count { background: none; font-size: 11px; font-weight: 400; color: var(--dsw-alias-label-secondary); }
.maw-lane__dot { width: 7px; height: 7px; border-radius: 999px; flex: none; }
.maw-lane:first-child .maw-lane__head { border-top-color: var(--dsw-alias-brand-primary); }
.maw-card__lane { max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.maw-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }

/* 任务卡：id + 状态徽章 / 标题 / 负责人 + 优先级 */
.maw-card { display: flex; flex-direction: column; gap: 4px; text-align: left; font: inherit;
  padding: 10px 12px; border-radius: 8px; cursor: pointer; color: inherit;
  background: var(--dsw-alias-bg-layer-2);
  border: 1px solid var(--dsw-alias-border-l1); border-left: 2px solid var(--dsw-alias-border-l2); }
.maw-card:hover { border-color: var(--dsw-alias-border-l2); }
.maw-card:focus-visible { outline: 1px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.maw-card.is-selected { border-color: var(--dsw-alias-brand-primary); }
.maw-card__head { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.maw-card__id { font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--dsw-alias-label-secondary); }
.maw-card__status { font: 9px ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--dsw-alias-label-secondary); border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 3px; padding: 0 4px; white-space: nowrap; }
.maw-card__title { margin: 0; font-size: 12px; font-weight: 500; line-height: 1.4;
  overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden; }
.maw-card__meta { display: flex; align-items: center; gap: 10px; margin-top: auto;
  font-size: 10px; color: var(--dsw-alias-label-secondary); }
.maw-card__owner { max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 状态色：与 maw board 一致（就绪/合入强调色，阻塞红，进行中黄） */
[data-status="ready"], [data-status="merging"] { border-left-color: var(--dsw-alias-brand-primary) !important; }
[data-status="in_progress"] { border-left-color: var(--dsw-alias-state-warn-primary) !important; }
[data-status="blocked"] { border-left-color: var(--dsw-alias-state-error-primary) !important; }
[data-status="done"], [data-status="cancelled"] { opacity: .72; }
[data-status="done"] .maw-card__status { color: var(--dsw-alias-state-success-primary); }

/* 拓扑 */
.maw-topo { position: relative; width: 100%; overflow: hidden;
  background: transparent;
  height: clamp(360px, calc(100vh - 210px), 1200px); }
.maw-topo__canvas { position: absolute; inset: 0; overflow: hidden;
  cursor: grab; user-select: none; }
.maw-topo__canvas:active { cursor: grabbing; }
.maw-topo__scene { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
.maw-topo__edges { position: absolute; top: 0; left: 0; overflow: visible; }
.maw-topo__node { position: absolute; box-sizing: border-box; display: flex;
  flex-direction: column; gap: 4px; padding: 8px 10px; overflow: hidden;
  background: var(--dsw-alias-bg-layer-2);
  border: 1px solid var(--dsw-alias-border-l1);
  border-left: 2px solid var(--dsw-alias-border-l2);
  border-radius: 8px; transition: border-color .15s, background .15s;
  color: var(--dsw-alias-label-primary); }
.maw-topo__node.clickable { cursor: pointer; }
.maw-topo__node.clickable:hover { border-color: var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-1); }
.maw-topo__node.clickable:focus-visible { outline: 1px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.maw-topo__node.active { border-color: var(--dsw-alias-brand-primary); }
.maw-topo__node.stub { border-style: dashed; background: transparent;
  color: var(--dsw-alias-label-secondary); }
.maw-topo__node.hot { border-color: var(--dsw-alias-brand-primary); }
.maw-topo__node.dim { opacity: .28; }
.maw-topo__head { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.maw-topo__id { font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.maw-topo__status { font: 9px ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--dsw-alias-label-secondary); border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 3px; padding: 0 4px; white-space: nowrap; }
.maw-topo__title { margin: 0; font-size: 12px; font-weight: 500; line-height: 1.4;
  overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden; }
.maw-topo__meta { display: flex; align-items: center; gap: 10px; margin-top: auto;
  font-size: 10px; color: var(--dsw-alias-label-secondary); }
.maw-topo__owner { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.maw-topo__node[data-status="done"] .maw-topo__status { color: var(--dsw-alias-state-success-primary); }
.maw-topo__node[data-status="blocked"] .maw-topo__status { color: var(--dsw-alias-state-error-primary); }
.maw-topo__node[data-status="in_progress"] .maw-topo__status { color: var(--dsw-alias-state-warn-primary); }
.maw-topo__node[data-status="ready"] .maw-topo__status,
.maw-topo__node[data-status="merging"] .maw-topo__status { color: var(--dsw-alias-brand-primary); }

.maw-topo__legend { position: absolute; left: 12px; top: 12px; display: flex;
  align-items: center; gap: 12px; flex-wrap: wrap; max-width: calc(100% - 200px);
  font-size: 11px; color: var(--dsw-alias-label-secondary); pointer-events: none; }
.maw-topo__legend span { display: inline-flex; align-items: center; gap: 5px; }
.maw-topo__legend i { display: inline-block; width: 18px; height: 0;
  border-top: 1.25px solid var(--dsw-alias-border-l2); }
.maw-topo__legend i.cross { border-top-style: dashed; }
.maw-topo__bar { position: absolute; right: 12px; top: 10px; display: flex; gap: 6px; }
.maw-btn { height: 26px; padding: 0 10px; font: inherit; font-size: 11px; border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary); cursor: pointer; }
.maw-btn:hover { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.maw-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
/* 启动按钮：可点时是主色，禁用时退成静态灰，并且不接 hover。 */
.maw-launch { height: 26px; padding: 0 12px; font: inherit; font-size: 12px; font-weight: 600;
  border-radius: 6px; border: 1px solid var(--dsw-alias-brand-primary);
  background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-inverse, #fff);
  cursor: pointer; white-space: nowrap; }
.maw-launch:hover { filter: brightness(1.06); }
.maw-launch:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.maw-launch[disabled] { cursor: not-allowed; opacity: .45; filter: none;
  border-color: var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary); }
.maw-launch__wrap { display: inline-flex; }
.maw-launch__reason { font-size: 11px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.maw-launch__err { font-size: 11px; color: var(--dsw-alias-state-error-primary); white-space: nowrap; }
/* 预览按钮组：次要样式，视觉上从属于启动按钮。 */
.maw-actions { display: inline-flex; align-items: center; gap: 4px; }
.maw-action { height: 26px; padding: 0 9px; font: inherit; font-size: 11px; border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l1); background: transparent;
  color: var(--dsw-alias-label-secondary); cursor: pointer; white-space: nowrap; }
.maw-action:hover { background: var(--dsw-alias-bg-layer-2);
  border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
.maw-action:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.maw-action[disabled] { cursor: progress; opacity: .55; }
.maw-action[data-active="true"] { background: var(--dsw-alias-bg-layer-2);
  border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
/* 预览结果面板：贴在看板顶部，可关掉。 */
.maw-preview { margin: 0 16px 10px; padding: 10px 12px; border-radius: 8px; font-size: 11px;
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2);
  line-height: 1.5; }
.maw-preview__head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.maw-preview__title { font-weight: 600; font-size: 12px; }
.maw-preview__close { margin-left: auto; border: 0; background: transparent; cursor: pointer;
  color: var(--dsw-alias-label-secondary); font-size: 14px; line-height: 1; padding: 2px 4px;
  border-radius: 4px; }
.maw-preview__close:hover { background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary); }
.maw-preview__lines { margin: 0; padding-left: 16px; color: var(--dsw-alias-label-secondary); }
.maw-preview__err { color: var(--dsw-alias-state-error-primary); }
.maw-check--floating { position: absolute; right: 12px; top: 44px;
  background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 6px; padding: 3px 8px; }

/* 详情 */
.maw-detail { font-size: 12px; }
.maw-detail__id { font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 6px; }
.maw-detail__title { margin: 4px 0 10px; line-height: 1.45; }
.maw-kv { display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; font-size: 11px; margin: 0 0 12px; }
.maw-kv dt { color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.maw-kv dd { margin: 0; overflow-wrap: anywhere; }
.maw-code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px;
  background: var(--dsw-alias-bg-layer-2); padding: 1px 4px; border-radius: 4px;
  overflow-wrap: anywhere; }
.maw-list { margin: 0; padding-left: 16px; font-size: 11px; line-height: 1.55; }
.maw-section { margin-bottom: 14px; }
.maw-section__title { font-size: 10px; font-weight: 600; letter-spacing: .04em;
  text-transform: uppercase; color: var(--dsw-alias-label-secondary); margin-bottom: 6px; }
.maw-item { font-size: 11px; line-height: 1.45; padding: 6px 8px; border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2); margin-bottom: 5px;
  border-left: 2px solid var(--dsw-alias-border-l2); }
.maw-item[data-sev="high"] { border-left-color: var(--dsw-alias-state-error-primary); }
.maw-item[data-sev="medium"] { border-left-color: var(--dsw-alias-state-warn-primary); }
.maw-item[data-sev="low"] { border-left-color: var(--dsw-alias-state-idle-primary); }
.maw-item__head { font-weight: 600; }
.maw-item__body { color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.maw-empty { padding: 32px; text-align: center; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.maw-empty__hint { margin-top: 6px; font-size: 11px; opacity: .8; }
.maw-error { padding: 12px; border-radius: 8px; font-size: 12px; line-height: 1.5;
  border: 1px solid var(--dsw-alias-state-error-primary);
  background: var(--dsw-alias-bg-layer-2); }
.maw-error__head { font-weight: 600; color: var(--dsw-alias-state-error-primary); margin-bottom: 4px; }
.maw-warn { padding: 6px 10px; border-radius: 6px; font-size: 11px;
  border: 1px solid var(--dsw-alias-state-warn-primary); }
.maw-setup { display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 10px 14px; margin: 14px 16px; border-radius: 8px;
  border: 1px solid var(--dsw-alias-state-warn-primary);
  background: var(--dsw-alias-bg-layer-2); font-size: 12px; }
.maw-setup__title { font-weight: 600; }
.maw-setup__hint { color: var(--dsw-alias-label-secondary); font-size: 11px; flex: 1 1 240px; }
.maw-setup__err { color: var(--dsw-alias-state-error-primary); font-size: 11px; flex-basis: 100%; }
`

    /** 状态色（节点左条与徽章）。 */
    const STATUS_COLOR = {
      backlog: '#8b93a7',
      ready: '#3fb950',
      in_progress: '#d29922',
      merging: '#2f6fed',
      blocked: '#e5534b',
      done: '#6b7280',
      cancelled: '#4b5563',
    }

    const colorOf = status => STATUS_COLOR[status] ?? STATUS_COLOR.backlog

    /** 拉一个 JSON 接口。 */
    async function getJson(path, signal) {
      const response = await fetch(`${API}${path}`, { signal, headers: { accept: 'application/json' } })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`)
      return body
    }

    /** 轮询；页面隐藏时暂停。 */
    function usePoll(path, intervalMs, enabled) {
      const [state, setState] = useState({ data: null, error: null, loading: true })
      const [tick, setTick] = useState(0)

      useEffect(() => {
        if (!enabled) return undefined
        let alive = true
        const controller = new AbortController()
        const run = async () => {
          if (document.visibilityState === 'hidden') return
          try {
            const data = await getJson(path, controller.signal)
            if (alive) setState({ data, error: null, loading: false })
          } catch (error) {
            if (!alive || error?.name === 'AbortError') return
            setState(previous => ({ data: previous.data, error: String(error?.message ?? error), loading: false }))
          }
        }
        void run()
        const timer = window.setInterval(run, Math.max(1000, intervalMs))
        const onVisible = () => { if (document.visibilityState === 'visible') void run() }
        document.addEventListener('visibilitychange', onVisible)
        return () => {
          alive = false
          controller.abort()
          window.clearInterval(timer)
          document.removeEventListener('visibilitychange', onVisible)
        }
      }, [path, intervalMs, enabled, tick])

      return { ...state, refresh: () => setTick(n => n + 1) }
    }

    /** 注入样式（卸载时移除）。 */
    function useStyle() {
      useEffect(() => {
        const element = document.createElement('style')
        element.setAttribute('data-dsh-maw', '')
        element.textContent = CSS
        document.head.appendChild(element)
        return () => { element.remove() }
      }, [])
    }

    // ── 任务详情 ──────────────────────────────────────────
    function TaskDetail({ task }) {
      if (task === null || task === undefined) {
        return h('div', { className: 'maw-empty' }, dict.noSelection)
      }
      const kv = []
      const row = (label, value) => kv.push(
        h('dt', { key: `dt-${label}` }, label),
        h('dd', { key: `dd-${label}` }, value),
      )
      row(dict.lane, task.lane || dict.none)
      row(dict.owner, task.owner || dict.unassigned)
      row(dict.priority, String(task.priority))
      row(dict.mergeOrder, String(task.mergeOrder))
      row(dict.attempts, String(task.attempts))
      if (task.branch !== '') row(dict.branch, h('span', { className: 'maw-code' }, task.branch))
      if (task.worktree !== '') row(dict.worktree, h('span', { className: 'maw-code' }, task.worktree))
      if (task.blockedReason !== '') row(dict.blockedReason, task.blockedReason)

      const section = (title, children) => h('div', { className: 'maw-section' },
        h('div', { className: 'maw-section__title' }, title), children)
      const list = items => h('ul', { className: 'maw-list' },
        items.map((item, index) => h('li', { key: index }, item)))
      const chips = ids => h('div', {}, ids.map(id => h('span', {
        key: id, className: 'maw-code', style: { marginRight: 4, display: 'inline-block' },
      }, id)))

      return h('div', { className: 'maw-detail' },
        h('div', { className: 'maw-detail__id' },
          h('span', {
            className: 'maw-card__status',
            style: { color: colorOf(task.status), borderColor: colorOf(task.status) },
          }, task.status),
          task.id),
        h('div', { className: 'maw-detail__title' }, task.title),
        h('dl', { className: 'maw-kv' }, kv),
        task.goal !== '' && section(dict.goal, h('div', { className: 'maw-muted' }, task.goal)),
        task.upstream.length > 0 && section(dict.upstream, chips(task.upstream)),
        task.downstream.length > 0 && section(dict.downstream, chips(task.downstream)),
        task.writeScope.length > 0 && section(dict.scope,
          list(task.writeScope.map(item => h('span', { className: 'maw-code' }, item)))),
        task.readScope.length > 0 && section(dict.readScope,
          list(task.readScope.map(item => h('span', { className: 'maw-code' }, item)))),
        task.acceptance.length > 0 && section(dict.acceptance, list(task.acceptance)),
        task.verify.length > 0 && section(dict.verify,
          list(task.verify.map(item => h('span', { className: 'maw-code' }, item)))))
    }

    /**
     * maw 缺失时的安装提示。
     * @param {{health: object|null, onInstalled: () => void}} props
     */
    function SetupNotice({ health, onInstalled }) {
      const [state, setState] = useState({ busy: false, error: '' })
      if (health === null) return null
      const found = health?.maw?.found === true
      const install = health?.install ?? {}
      if (found && install.status !== 'failed') return null

      const run = async () => {
        setState({ busy: true, error: '' })
        try {
          const response = await fetch(`${API}/install`, { method: 'POST', headers: { accept: 'application/json' } })
          const body = await response.json().catch(() => null)
          if (!response.ok || body?.ok !== true) {
            setState({ busy: false, error: String(body?.error ?? `HTTP ${response.status}`) })
            return
          }
          setState({ busy: false, error: '' })
          onInstalled()
        } catch (error) {
          setState({ busy: false, error: String(error?.message ?? error) })
        }
      }

      return h('div', { className: 'maw-setup' },
        h('span', { className: 'maw-setup__title' }, dict.healthMissing),
        h('span', { className: 'maw-setup__hint' }, dict.healthMissingHint),
        h('button', {
          type: 'button',
          className: 'maw-btn',
          disabled: state.busy,
          onClick: run,
        }, state.busy ? dict.installing : dict.install),
        state.error !== '' && h('span', { className: 'maw-setup__err' }, `${dict.installFailed}：${state.error}`),
        install.status === 'failed' && install.error !== '' && h('span', { className: 'maw-setup__err' }, install.error))
    }

    // ── 看板 ─────────────────────────────────────────────
    /**
     * 启动按钮：以 MAW 模式发起一次会话。
     *
     * 能不能点由 Host 算好随看板下发（`data.launch`），这里不自己推断 ——
     * 「有没有可开工的题」与「这个工程是不是已经在跑」都要看 Host 侧的活 agent，
     * 浏览器侧拿不到，自己猜就会亮着按钮点了没反应。
     *
     * @param {object} props
     * @param {object|null} props.launch Host 下发的启动状态
     * @param {AbortSignal} [props.signal] 组件卸载时取消请求
     * @param {() => void} props.onDone 启动结束后请调用方刷新数据
     * @param {(sessionId: string) => void} [props.onOpened] 跳到新会话
     */
    function LaunchButton({ launch, onDone, onOpened }) {
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')

      const canLaunch = launch?.canLaunch === true
      const reason = String(launch?.reason ?? '')
      const projectId = String(launch?.projectId ?? '')

      // 禁用原因的分工：
      //  - 执行中只是「暂时」，不占版面，靠 hover 的 title 说明；
      //  - 「没题可开工 / 工程没任务」是稳定状态，留在按钮旁边讲清楚。
      const reasonText = () => {
        if (reason === 'nothing-ready') return dict.launchDisabledNothingReady
        if (reason === 'no-tasks') return dict.launchDisabledNoTasks
        if (reason === 'no-project') return dict.launchDisabledNoProject
        return ''
      }

      const run = async () => {
        if (busy || !canLaunch) return
        setBusy(true)
        setError('')
        try {
          const params = new URLSearchParams()
          if (projectId !== '') params.set('project', projectId)
          const query = params.toString()
          const response = await fetch(`${API}/launch${query === '' ? '' : `?${query}`}`, {
            method: 'POST',
            headers: { accept: 'application/json' },
          })
          const body = await response.json().catch(() => null)
          if (!response.ok || body?.ok !== true) {
            // 409 是「已经有人在跑」的常见结局：把原因显示出来，不当异常。
            setError(String(body?.error ?? '') || reasonText() || `HTTP ${response.status}`)
            return
          }
          onDone?.()
          if (typeof body.sessionId === 'string' && body.sessionId !== '') onOpened?.(body.sessionId)
        } catch (caught) {
          setError(String(caught?.message ?? caught))
        } finally {
          setBusy(false)
        }
      }

      const disabled = busy || !canLaunch
      // 执行中这条不占版面：只在悬停时用 title 提示一句，按钮旁边不再常驻文字。
      const running = !busy && !canLaunch && reason === 'already-running'
      const title = canLaunch
        ? dict.launchHint
        : (running ? dict.launchRunningTitle : (reasonText() || dict.launchHint))
      // 其余禁用原因（没题可开工等）仍留在旁边说明，它们不是「暂时」状态。
      const inlineReason = !busy && !canLaunch && !running && reasonText() !== ''

      const button = h('button', {
        type: 'button',
        className: 'maw-launch',
        disabled,
        title,
        'aria-disabled': disabled,
        onClick: run,
      }, busy ? dict.launching : dict.launch)

      return h(React.Fragment, null,
        // disabled 的按钮在部分浏览器里不派发悬停事件，套一层带 title 的壳
        // 保证「任务执行中」这句提示稳定能看到。
        disabled ? h('span', { className: 'maw-launch__wrap', title }, button) : button,
        inlineReason && h('span', { className: 'maw-launch__reason' }, reasonText()),
        error !== '' && h('span', { className: 'maw-launch__err' }, `${dict.launchFailed}：${error}`))
    }

    /**
     * 预览按钮组：自检 / 清理预览 / 一致性检查。
     *
     * 三条命令默认都不改任何东西，所以点下去不需要二次确认；真正会删会改的
     * 参数（`--yes`、`--apply`）由 Host 侧白名单硬拦，界面上也没有入口。
     *
     * 动作清单由 Host 下发（`data.actions`），这里只负责渲染与展示结果。
     *
     * @param {object} props
     * @param {object[]} props.actions Host 下发的动作清单
     * @param {string} props.projectId 当前工程 id
     * @param {(id: string) => string} props.labelOf 取按钮文案
     * @param {(result: object) => void} props.onResult 把结果交回看板展示
     * @param {string} props.busyId 正在跑的动作 id
     * @param {(id: string) => void} props.setBusyId
     */
    function PreviewActions({ actions, projectId, labelOf, onResult, busyId, setBusyId }) {
      const list = Array.isArray(actions) ? actions : []
      if (list.length === 0) return null

      const run = async action => {
        if (busyId !== '') return
        setBusyId(action.id)
        try {
          const params = new URLSearchParams({ action: action.id })
          if (projectId !== '') params.set('project', projectId)
          const response = await fetch(`${API}/preview?${params.toString()}`, {
            method: 'POST',
            headers: { accept: 'application/json' },
          })
          const body = await response.json().catch(() => null)
          onResult({
            id: action.id,
            label: labelOf(action),
            ok: body?.ok === true,
            summary: String(body?.summary ?? ''),
            lines: Array.isArray(body?.lines) ? body.lines : [],
            error: String(body?.error ?? (response.ok ? '' : `HTTP ${response.status}`)),
          })
        } catch (error) {
          onResult({
            id: action.id,
            label: labelOf(action),
            ok: false,
            summary: '',
            lines: [],
            error: String(error?.message ?? error),
          })
        } finally {
          setBusyId('')
        }
      }

      return h('div', { className: 'maw-actions' },
        list.map(action => h('button', {
          key: action.id,
          type: 'button',
          className: 'maw-action',
          // 一次只跑一个：这些命令都会扫盘，并发跑只会互相拖慢。
          disabled: busyId !== '',
          'data-active': busyId === action.id,
          title: dict[action.hintKey] ?? '',
          onClick: () => void run(action),
        }, busyId === action.id ? dict.actionRunning : (dict[action.labelKey] ?? action.id))))
    }

    function BoardPane({ data, filters, setFilters, selected, onSelect }) {
      const tasks = data?.filteredTasks ?? data?.tasks ?? []

      // 泳道 = 任务状态，按流水线顺序排列；空状态不占位。
      const lanes = useMemo(() => {
        const groups = new Map()
        for (const task of tasks) {
          const key = task.status ?? 'backlog'
          if (!groups.has(key)) groups.set(key, [])
          groups.get(key).push(task)
        }
        const ordered = []
        for (const status of STATUS_ORDER) {
          const bucket = groups.get(status)
          if (bucket !== undefined && bucket.length > 0) ordered.push([status, bucket])
          groups.delete(status)
        }
        for (const [status, bucket] of groups) ordered.push([status, bucket])
        return ordered
      }, [tasks])

      const laneOptions = useMemo(() => {
        const set = new Set()
        for (const task of data?.tasks ?? []) if (task.lane !== '') set.add(task.lane)
        return [...set].sort()
      }, [data])

      const agentOptions = useMemo(() => {
        const set = new Set()
        for (const task of data?.tasks ?? []) if (task.owner !== '') set.add(task.owner)
        return [...set].sort()
      }, [data])

      const field = (label, key, options) => h('label', { className: 'maw-field' },
        h('span', {}, label),
        h('select', {
          className: 'maw-select',
          value: filters[key] ?? '',
          onChange: event => setFilters({ ...filters, [key]: event.target.value }),
        }, h('option', { value: '' }, dict.all), ...options.map(option => h('option', {
          key: option.value ?? option, value: option.value ?? option,
        }, option.label ?? option))))

      const renderCard = task => h('button', {
        key: task.id,
        type: 'button',
        className: `maw-card${selected === task.id ? ' is-selected' : ''}`,
        'data-status': task.status,
        onClick: () => onSelect(task.id),
      },
      h('div', { className: 'maw-card__head' },
        h('span', { className: 'maw-card__id' }, task.id),
        h('span', { className: 'maw-card__status' }, task.status)),
      h('h4', { className: 'maw-card__title' }, task.title),
      h('div', { className: 'maw-card__meta' },
        h('span', { className: 'maw-card__owner' }, task.owner || dict.unassigned),
        h('span', {}, `P${task.priority}`),
        task.lane !== '' ? h('span', { className: 'maw-card__lane' }, task.lane) : null,
        task.deps.length > 0 ? h('span', {}, `${dict.deps} ${task.deps.length}`) : null))

      const renderLane = ([status, laneTasks]) => h('div', { className: 'maw-lane', key: status, 'data-lane': status },
        h('div', { className: 'maw-lane__head' },
          h('span', { className: 'maw-lane__dot', style: { background: colorOf(status) } }),
          h('span', {}, statusLabel[status] ?? status),
          h('span', { className: 'maw-lane__count' }, laneTasks.length)),
        h('div', { className: 'maw-cards' }, laneTasks.map(renderCard)))

      const main = tasks.length === 0
        ? h('div', { className: 'maw-empty' }, dict.empty)
        : lanes.map(renderLane)

      return h(React.Fragment, null,
        h('div', { className: 'maw-filters' },
          // 不再提供「切换工程」入口：看板只展示当前工作区对应的那个工程，
          // 换工程靠切换工作区的会话，而不是在这里挑。
          field(dict.filterLane, 'lane', laneOptions),
          field(dict.filterStatus, 'status',
            ['backlog', 'ready', 'in_progress', 'merging', 'blocked', 'done', 'cancelled']),
          field(dict.filterAgent, 'agent', agentOptions),
          h('label', { className: 'maw-check' },
            h('input', {
              type: 'checkbox',
              checked: filters.includeDone === true,
              onChange: event => setFilters({ ...filters, includeDone: event.target.checked }),
            }), dict.showDone)),
        h('div', { className: 'maw-body' },
          h('div', { className: 'maw-main' }, main),
          h('div', { className: 'maw-side' }, h(SidePanels, { data }))))
    }

    /** 右侧风险 / 问题 / 迭代。 */
    function SidePanels({ data }) {
      const section = (title, items, render) => items.length === 0 ? null
        : h('div', { className: 'maw-section' },
          h('div', { className: 'maw-section__title' }, `${title}（${items.length}）`),
          items.slice(0, 30).map(render))

      return h(React.Fragment, null,
        section(dict.risks, data?.risks ?? [], (item, index) => h('div', {
          className: 'maw-item', key: `r-${index}`, 'data-sev': item.severity,
        },
        h('div', { className: 'maw-item__head' }, `${item.taskId || '—'} · ${item.severity}`),
        h('div', { className: 'maw-item__body' }, item.message))),
        section(dict.problems, data?.problems ?? [], (item, index) => h('div', {
          className: 'maw-item', key: `p-${index}`, 'data-sev': item.severity,
        },
        h('div', { className: 'maw-item__head' }, `${item.taskId || '—'} · ${item.kind || item.severity}`),
        h('div', { className: 'maw-item__body' }, item.message))),
        (data?.iterations ?? []).length === 0 ? null : h('div', { className: 'maw-section' },
          h('div', { className: 'maw-section__title' }, `${dict.iterations}（${data.iterations.length}）`),
          data.iterations.map(item => h('div', { className: 'maw-item', key: item.id },
            h('div', { className: 'maw-item__head' }, `${item.id} · ${item.status}`),
            h('div', { className: 'maw-item__body' }, item.name)))))
    }

    // ── 拓扑（对齐 maw board：200×98 卡片、平滑边、中点圆点、虚线跨视图） ──
    const NODE_W = 200
    const NODE_H = 98
    const GAP_X = 56
    const GAP_Y = 40
    const PAD = 24

    /**
     * 分层布局。返回节点坐标、边、以及跨视图桩节点。
     */
    function layoutTopology(tasks, showAll, maxNodes) {
      const byId = new Map(tasks.map(task => [task.id, task]))
      const visible = new Set()

      if (showAll) {
        for (const task of tasks) visible.add(task.id)
      } else {
        // 未完成 + 它们的直接依赖，控制在节点上限内。
        for (const task of tasks) {
          if (task.status === 'done' || task.status === 'cancelled') continue
          visible.add(task.id)
        }
        for (const task of [...visible].map(id => byId.get(id))) {
          for (const dep of task?.deps ?? []) {
            if (visible.size >= maxNodes) break
            if (byId.has(dep)) visible.add(dep)
          }
        }
      }

      const levels = new Map()
      for (const id of visible) {
        const task = byId.get(id)
        if (task === undefined) continue
        const level = task.level ?? 0
        if (!levels.has(level)) levels.set(level, [])
        levels.get(level).push(task)
      }

      const sortedLevels = [...levels.keys()].sort((a, b) => a - b)
      const positions = new Map()
      let maxRows = 0

      // 跨视图依赖做成桩节点，保留「链到这里还在继续」的信息。
      const stubs = new Map()
      const nodeIndexAtLevel = new Map()

      sortedLevels.forEach((level, columnIndex) => {
        const bucket = levels.get(level).sort((a, b) => {
          const ma = a.mergeOrder ?? 100
          const mb = b.mergeOrder ?? 100
          return ma === mb ? a.id.localeCompare(b.id) : ma - mb
        })
        // 为桩节点预留行位：把桩插在该层末尾。
        const stubDeps = []
        for (const task of bucket) {
          for (const dep of task.deps) {
            if (visible.has(dep)) continue
            if (!stubs.has(dep) && stubs.size < 40) {
              stubs.set(dep, { level: Math.max(0, level - 1) })
              stubDeps.push(dep)
            }
          }
        }
        nodeIndexAtLevel.set(level, bucket.length)
        maxRows = Math.max(maxRows, bucket.length)
        bucket.forEach((task, rowIndex) => {
          positions.set(task.id, {
            x: PAD + columnIndex * (NODE_W + GAP_X),
            y: PAD + rowIndex * (NODE_H + GAP_Y),
            task,
            stub: false,
          })
        })
        // 桩节点放到本层左下方；仅用于展示，不参与布局高度。
        stubDeps.forEach((dep, i) => {
          if (positions.has(dep)) return
          positions.set(dep, {
            x: PAD + Math.max(0, columnIndex - 1) * (NODE_W + GAP_X),
            y: PAD + (bucket.length + i) * (NODE_H + GAP_Y),
            task: { id: dep, title: '', status: '', owner: '', priority: null, deps: [] },
            stub: true,
          })
          maxRows = Math.max(maxRows, bucket.length + i + 1)
        })
      })

      const edges = []
      for (const [id, pos] of positions) {
        if (pos.stub) continue
        for (const dep of pos.task.deps) {
          if (!positions.has(dep)) continue
          edges.push({ from: dep, to: id, cross: positions.get(dep).stub })
        }
      }

      const width = PAD * 2 + Math.max(1, sortedLevels.length) * (NODE_W + GAP_X) - GAP_X
      const height = PAD * 2 + Math.max(1, maxRows) * (NODE_H + GAP_Y) - GAP_Y
      return { positions, edges, width, height, nodeCount: positions.size }
    }

    /** 平滑贝塞尔边 + 中点圆点 + 箭头。 */
    function Edge({ from, to, cross, dim, hot }) {
      const x1 = from.x + NODE_W
      const y1 = from.y + NODE_H / 2
      const x2 = to.x
      const y2 = to.y + NODE_H / 2
      const midX = (x1 + x2) / 2
      const stroke = hot ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-border-l2)'
      const opacity = dim ? 0.16 : (cross ? 0.7 : 1)
      return h('g', { opacity },
        h('path', {
          d: `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`,
          fill: 'none',
          stroke,
          strokeWidth: hot ? 1.6 : 1.25,
          strokeDasharray: cross ? '4 3' : undefined,
          markerEnd: 'url(#maw-arrow)',
        }),
        // maw board 在边的中点画一个小圆点。
        h('circle', {
          cx: midX,
          cy: (y1 + y2) / 2,
          r: 3.5,
          fill: hot ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-border-l2)',
        }))
    }

    /** 拓扑画布。 */
    function TopologyPane({ data, selected, onSelect, session, project }) {
      const canvasRef = useRef(null)
      const [transform, setTransform] = useState({ scale: 1, tx: 0, ty: 0 })
      const [showAll, setShowAll] = useState(false)
      const [hovered, setHovered] = useState(null)
      const dragRef = useRef(null)
      const [detail, setDetail] = useState(null)
      const [detailError, setDetailError] = useState(null)

      const tasks = data?.tasks ?? []
      const maxNodes = data?.config?.maxGraphNodes ?? 300
      const layout = useMemo(() => layoutTopology(tasks, showAll, maxNodes), [tasks, showAll, maxNodes])

      // 悬停高亮：当前节点 + 直接相连的节点与边。
      const highlight = useMemo(() => {
        if (hovered === null) return null
        const nodes = new Set([hovered])
        const edges = new Set()
        layout.edges.forEach((edge, index) => {
          if (edge.from === hovered || edge.to === hovered) {
            edges.add(index)
            nodes.add(edge.from)
            nodes.add(edge.to)
          }
        })
        return { nodes, edges }
      }, [hovered, layout])

      const fit = useCallback(() => {
        const canvas = canvasRef.current
        if (canvas === null) return
        const box = canvas.getBoundingClientRect()
        if (box.width === 0 || box.height === 0) return
        const scale = Math.min(
          (box.width - 24) / Math.max(1, layout.width),
          (box.height - 24) / Math.max(1, layout.height),
          1.2,
        )
        const clamped = Math.max(0.15, scale)
        setTransform({
          scale: clamped,
          tx: Math.max(0, (box.width - layout.width * clamped) / 2),
          ty: Math.max(0, (box.height - layout.height * clamped) / 2),
        })
      }, [layout])

      // 首次渲染或数据规模变化时自动适应画布。
      useLayoutEffect(() => {
        fit()
      }, [fit])

      const onWheel = useCallback(event => {
        event.preventDefault()
        const canvas = canvasRef.current
        if (canvas === null) return
        const box = canvas.getBoundingClientRect()
        const px = event.clientX - box.left
        const py = event.clientY - box.top
        setTransform(previous => {
          const next = Math.max(0.15, Math.min(2.5, previous.scale * (event.deltaY < 0 ? 1.1 : 0.9)))
          const ratio = next / previous.scale
          return {
            scale: next,
            tx: px - (px - previous.tx) * ratio,
            ty: py - (py - previous.ty) * ratio,
          }
        })
      }, [])

      useEffect(() => {
        const canvas = canvasRef.current
        if (canvas === null) return undefined
        canvas.addEventListener('wheel', onWheel, { passive: false })
        return () => canvas.removeEventListener('wheel', onWheel)
      }, [onWheel])

      // 选中节点的详情。
      useEffect(() => {
        if (selected === null || selected === undefined) { setDetail(null); return undefined }
        let alive = true
        const controller = new AbortController()
        // 带上会话与当前工程：看板按工程取数，详情也必须查同一个工程，
        // 否则跨工程时会 404（任务明明就在看板上）。
        const params = new URLSearchParams({ id: selected })
        if (typeof session === 'string' && session !== '') params.set('session', session)
        if (typeof project === 'string' && project !== '') params.set('project', project)
        getJson(`/task?${params.toString()}`, controller.signal)
          .then(body => { if (alive) { setDetail(body.task); setDetailError(null) } })
          .catch(error => {
            if (!alive || error?.name === 'AbortError') return
            setDetailError(String(error?.message ?? error))
          })
        return () => { alive = false; controller.abort() }
      }, [selected])

      const nodes = [...layout.positions.entries()]

      return h('div', { className: 'maw-body' },
        h('div', { className: 'maw-main', style: { padding: 0, position: 'relative', overflow: 'hidden' } },
          h('div', { className: 'maw-topo' },
            h('div', {
              className: 'maw-topo__canvas',
              ref: canvasRef,
              onPointerDown: event => {
                if (event.button !== 0) return
                // 不在这里捕获指针：setPointerCapture 会把后续 click 重定向到画布，
                // 节点上的 onClick 就再也收不到。等到真的拖动超过阈值再捕获。
                dragRef.current = {
                  x: event.clientX,
                  y: event.clientY,
                  tx: transform.tx,
                  ty: transform.ty,
                  pointerId: event.pointerId,
                  active: false,
                }
              },
              onPointerMove: event => {
                const drag = dragRef.current
                if (drag === null) return
                const dx = event.clientX - drag.x
                const dy = event.clientY - drag.y
                if (!drag.active && Math.hypot(dx, dy) < 4) return
                if (!drag.active) {
                  drag.active = true
                  event.currentTarget.setPointerCapture?.(drag.pointerId)
                }
                setTransform(previous => ({
                  ...previous,
                  tx: drag.tx + dx,
                  ty: drag.ty + dy,
                }))
              },
              onPointerUp: event => {
                const drag = dragRef.current
                dragRef.current = null
                if (drag?.active === true) {
                  event.currentTarget.releasePointerCapture?.(drag.pointerId)
                }
              },
              onPointerLeave: () => { dragRef.current = null; setHovered(null) },
            },
            h('div', {
              className: 'maw-topo__scene',
              style: {
                width: layout.width,
                height: layout.height,
                transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
              },
            },
            // 边层
            h('svg', {
              className: 'maw-topo__edges',
              width: layout.width,
              height: layout.height,
            },
            h('defs', null,
              h('marker', {
                id: 'maw-arrow',
                markerWidth: 8,
                markerHeight: 6,
                refX: 8,
                refY: 3,
                orient: 'auto',
                markerUnits: 'userSpaceOnUse',
              }, h('path', { d: 'M0,0 L8,3 L0,6 Z', fill: 'var(--dsw-alias-border-l2)' }))),
            layout.edges.map((edge, index) => {
              const from = layout.positions.get(edge.from)
              const to = layout.positions.get(edge.to)
              if (from === undefined || to === undefined) return null
              const isHot = highlight !== null && highlight.edges.has(index)
              const isDim = highlight !== null && !isHot
              return h(Edge, { key: `e-${index}`, from, to, cross: edge.cross, dim: isDim, hot: isHot })
            })),
            // 节点层
            nodes.map(([id, pos]) => {
              if (pos.stub) {
                return h('div', {
                  key: `s-${id}`,
                  className: 'maw-topo__node stub',
                  style: { left: pos.x, top: pos.y, width: NODE_W, height: NODE_H },
                  title: dict.stubHint,
                },
                h('div', { className: 'maw-topo__head' }, h('span', { className: 'maw-topo__id' }, id)),
                h('h4', { className: 'maw-topo__title' }, dict.stubTitle),
                h('div', { className: 'maw-topo__meta' }, h('span', {}, dict.stubHint)))
              }
              const task = pos.task
              const isHot = highlight !== null && highlight.nodes.has(id)
              const isDim = highlight !== null && !isHot
              return h('div', {
                key: id,
                className: `maw-topo__node clickable${selected === id ? ' active' : ''}${isDim ? ' dim' : ''}${isHot ? ' hot' : ''}`,
                'data-status': task.status,
                role: 'button',
                tabIndex: 0,
                'aria-label': `${task.id} ${task.title}，${task.status}`,
                style: { left: pos.x, top: pos.y, width: NODE_W, height: NODE_H },
                onMouseEnter: () => setHovered(id),
                onMouseLeave: () => setHovered(null),
                onClick: () => onSelect(id),
                onKeyDown: event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(id)
                  }
                },
              },
              h('div', { className: 'maw-topo__head' },
                h('span', { className: 'maw-topo__id' }, task.id),
                h('span', { className: 'maw-topo__status' }, task.status)),
              h('h4', { className: 'maw-topo__title' }, task.title),
              h('div', { className: 'maw-topo__meta' },
                h('span', { className: 'maw-topo__owner' }, task.owner || dict.unassigned),
                h('span', {}, task.priority === null ? dict.pNone : `P${task.priority}`)))
            }))),
            // 图例
            h('div', { className: 'maw-topo__legend' },
              h('span', null, h('i'), dict.legend),
              h('span', null, h('i', { className: 'cross' }), dict.legendCross)),
            // 工具条
            h('div', { className: 'maw-topo__bar' },
              h('button', { type: 'button', className: 'maw-btn', onClick: fit }, dict.fit),
              h('button', {
                type: 'button',
                className: 'maw-btn',
                onClick: () => setTransform({ scale: 1, tx: 0, ty: 0 }),
              }, dict.relayout)),
            h('label', { className: 'maw-check maw-check--floating' },
              h('input', {
                type: 'checkbox',
                checked: showAll,
                onChange: event => setShowAll(event.target.checked),
              }), dict.showAllNodes))),
        (selected === null || selected === undefined) ? null : h('div', { className: 'maw-side' },
          detailError !== null
            ? h('div', { className: 'maw-error' },
              h('div', { className: 'maw-error__head' }, dict.failed), detailError)
            : h(TaskDetail, { task: detail })))
    }

    /** 读出当前会话的视图标签（顺序即位置）。 */
    function viewTabs() {
      const strip = document.querySelector('[data-conversation-tabs]')
      if (strip === null) return []
      return [...strip.querySelectorAll('button[role="tab"]')]
    }

    /**
     * 切到第 index 个视图标签（1 起）。
     *
     * 没有公开的「选中视图」服务：视图选择是 ui-conversation 自己的 store，
     * `binding.activate()` 只登记目标、不切标签。标签栏 DOM 上带
     * `data-conversation-tabs`（产品自己标注的稳定锚点，窗口 chrome 与之共用），
     * 所以按位置点它，是我们能走的唯一稳定路径。
     * @param {number} index 1 起的标签位置。
     * @returns {boolean} 是否成功切换（已在该标签也算成功）。
     */
    function activateViewTab(index) {
      const tabs = viewTabs()
      const target = tabs[index - 1]
      if (target === undefined) return false
      if (target.getAttribute('aria-selected') === 'true') return true
      target.click()
      return true
    }

    /** 第 index 个标签的当前标题，用于快捷键标签文案。 */
    function viewTabLabel(index) {
      const target = viewTabs()[index - 1]
      return (target?.innerText || '').trim()
    }

    // ── 主视图（会话内「对话 / 轨迹」旁的第三个标签） ────────
    function MawView(props) {
      useStyle()
      const sessionId = typeof props?.sessionId === 'string' ? props.sessionId : ''
      const [tab, setTab] = useState('board')
      // 不再有 project 维度：看的是哪个工程由会话自己的工作区决定，
      // 请求里也不带 project 参数，避免界面能把工程切走。
      const [filters, setFilters] = useState({ lane: '', status: '', agent: '', includeDone: false })
      const [selected, setSelected] = useState(null)
      // 预览动作：正在跑的那个、以及最近一次结果。
      const [busyAction, setBusyAction] = useState('')
      const [previewResult, setPreviewResult] = useState(null)

      const query = useMemo(() => {
        const params = new URLSearchParams()
        if (sessionId !== '') params.set('session', sessionId)
        if (filters.lane !== '') params.set('lane', filters.lane)
        if (filters.status !== '') params.set('status', filters.status)
        if (filters.agent !== '') params.set('agent', filters.agent)
        if (filters.includeDone) params.set('includeDone', 'true')
        const text = params.toString()
        return text === '' ? '/board' : `/board?${text}`
      }, [filters, sessionId])

      const { data, error, loading, refresh } = usePoll(query, 5000, true)
      // maw 缺失或安装失败时轮询健康状态，装好后自动恢复。
      const healthPoll = usePoll('/health', 4000, data === null || data?.sources?.tasks !== 'ok')

      const stale = Object.entries(data?.sources ?? {})
        .filter(([, state]) => state !== 'ok').map(([source]) => source)

      const body = () => {
        if (error !== null && data === null) {
          return h('div', { className: 'maw-main' },
            h('div', { className: 'maw-error' },
              h('div', { className: 'maw-error__head' }, dict.failed),
              h('div', {}, error),
              h('button', {
                type: 'button', className: 'maw-btn', onClick: refresh,
                style: { marginTop: 8 },
              }, dict.retry)))
        }
        if (data === null) return h('div', { className: 'maw-empty' }, dict.loading)
        // 当前工作区不对应任何 maw 工程：整块留白，不展示别人的看板。
        // 顺带把「怎么才能看到」说清楚，否则空白让人以为坏了。
        if (data.matched === false) {
          return h('div', { className: 'maw-empty' },
            h('div', {}, dict.notMawProject),
            h('div', { className: 'maw-empty__hint' }, dict.notMawProjectHint))
        }
        return tab === 'board'
          ? h(BoardPane, { data, filters, setFilters, selected, onSelect: setSelected })
          // 详情查询要带上当前工程，否则跨工程时会 404（题就在看板上却查不到）。
          : h(TopologyPane, {
            data, selected, onSelect: setSelected, session: sessionId,
            project: String(data?.launch?.projectId ?? data?.defaultProjectId ?? ''),
          })
      }

      // 工具条上的动作只对「已登记到 maw 的工程」出现：
      // 未登记的目录没有队列、没有 agent、没有 worktree，按钮露出来只会误导。
      const registered = data?.launch?.registered === true
      const actionProjectId = String(data?.launch?.projectId ?? data?.defaultProjectId ?? '')

      return h('div', { className: 'maw-view' },
        h('div', { className: 'maw-bar' },
          h('span', { className: 'maw-bar__title' }, dict.title),
          h('div', { className: 'maw-tabs', role: 'tablist' },
            h('button', {
              type: 'button', className: 'maw-tab', role: 'tab',
              'aria-selected': tab === 'board', onClick: () => setTab('board'),
            }, dict.board),
            h('button', {
              type: 'button', className: 'maw-tab', role: 'tab',
              'aria-selected': tab === 'graph', onClick: () => setTab('graph'),
            }, dict.graph)),
          h('span', { className: 'maw-bar__spacer' }),
          registered && h(PreviewActions, {
            actions: data.actions,
            projectId: actionProjectId,
            labelOf: action => dict[action.labelKey] ?? action.id,
            onResult: setPreviewResult,
            busyId: busyAction,
            setBusyId: setBusyAction,
          }),
          registered && h(LaunchButton, {
            launch: data.launch,
            onDone: refresh,
            onOpened: openSession,
          }),
          data !== null && h(React.Fragment, null,
            h('div', { className: 'maw-track', role: 'progressbar', 'aria-valuenow': data.percent,
              'aria-valuemin': 0, 'aria-valuemax': 100 },
            h('div', { className: 'maw-track__fill',
              style: { width: `${Math.max(0, Math.min(100, data.percent))}%` } })),
            h('span', { className: 'maw-muted' },
              `${data.percent}% · ${data.total} ${dict.tasks} · ${dict.activeAgents} ${data.activeAgents} · ${dict.frontier} ${data.graph?.frontier?.length ?? 0}`),
            h('span', { className: 'maw-muted' },
              `${dict.generatedAt} ${String(data.generatedAt ?? '').slice(11, 19)}`))),
        stale.length > 0 && h('div', { style: { padding: '8px 16px 0' } },
          h('div', { className: 'maw-warn' }, `${dict.stale}：${stale.join(', ')}`)),
        h(SetupNotice, { health: healthPoll.data, onInstalled: () => { healthPoll.refresh(); refresh() } }),
        previewResult !== null && h('div', { className: 'maw-preview' },
          h('div', { className: 'maw-preview__head' },
            h('span', { className: 'maw-preview__title' }, previewResult.label),
            h('button', {
              type: 'button', className: 'maw-preview__close', title: dict.close ?? '关闭',
              onClick: () => setPreviewResult(null),
            }, '×')),
          previewResult.ok
            ? h(React.Fragment, null,
              h('div', {}, previewResult.summary),
              previewResult.lines.length > 0 && h('ul', { className: 'maw-preview__lines' },
                previewResult.lines.map((line, index) => h('li', { key: `${index}-${line}` }, line))))
            : h('div', { className: 'maw-preview__err' },
              `${dict.actionFailed}：${previewResult.error}`)),
        loading && data === null ? h('div', { className: 'maw-empty' }, dict.loading) : body())
    }

    // ── 工具结果卡片 ─────────────────────────────────────
    const toolCard = label => function MawToolCard(props) {
      useStyle()
      // 契约：phase 是 props 的同级字段，结果节点在 props.block 上。
      const phase = props.phase
      const result = props.block
      const text = useMemo(() => {
        if (phase !== 'result') return null
        const content = result?.content ?? []
        return content.map(part => part?.text ?? '').join('\n').trim()
      }, [phase, result])
      if (text === null || text === '') return null
      const isError = result?.isError === true
      return h('div', {
        style: {
          border: `1px solid ${isError ? 'var(--dsw-alias-state-error-primary)' : 'var(--dsw-alias-border-l1)'}`,
          borderRadius: 8, padding: '8px 10px', margin: '4px 0',
          background: 'var(--dsw-alias-bg-layer-1)', fontSize: 12, lineHeight: 1.5,
        },
      },
      h('div', {
        style: { fontWeight: 600, fontSize: 11, marginBottom: 4, color: 'var(--dsw-alias-label-secondary)' },
      }, label),
      h('pre', {
        style: {
          margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 11, color: 'var(--dsw-alias-label-primary)',
        },
      }, text))
    }

    // ── 挂载 ─────────────────────────────────────────────
    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        try {
          const sync = () => {
            const active = ctx.locale.getSnapshot().active
            dict = TEXT[active] ?? TEXT.zh
            statusLabel = STATUS_LABEL[active] ?? STATUS_LABEL.zh
          }
          sync()
          ctx.effect(() => ctx.locale.subscribe(sync), 'dsh-maw: locale sync')
        } catch {
          dict = TEXT.zh
        }

        // 启动成功后跳进新会话：槽位组件没有 ctx，能力从这里注入。
        // 用可选注入而不是写进 inject 列表：没有工作区服务的部署也该能用看板，
        // 只是点了启动不自动跳转。
        ctx.inject(['uiWorkspace'], scope => {
          const workspace = scope.get('uiWorkspace')
          if (workspace === undefined || typeof workspace.openSession !== 'function') return
          openSession = sessionId => {
            try {
              workspace.openSession(sessionId)
            } catch {
              // 跳转失败不该影响启动结果本身：会话已经在侧栏里。
            }
          }
        })

        // 会话内第三个视图标签，紧挨「对话」「轨迹」。
        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: 'maw',
          order: 20,
          label: () => dict.tab,
        }, MawView))

        // 快捷键：⌘3 / ⌥3 切到看板（与标签栏第 3 个位置对应）。
        // 两个命令同一动作：ShortcutCommand 每个 profile 只能有一个默认绑定，
        // 要同时支持 command 与 option 就注册两条。
        // 快捷键：按位置切视图标签（1 起），与标签栏顺序一致。
        // 每个 profile 只能有一个默认绑定，所以「command + 数字」与「option + 数字」
        // 各注册一条；Web 端浏览器占用单修饰键 + 数字，退到双修饰键。
        ctx.inject(['shortcuts'], shortcutCtx => {
          // 诊断用：注册失败的原因留在 window 上，便于排查「按了没反应」。
          const diagnostics = []
          window.__dshMawShortcuts = diagnostics

          const bind = (index, modifiers, webModifiers) => {
            const id = `dsh-maw.view.${index}.${modifiers.join('-')}`
            try {
              return shortcutCtx.effect(() => shortcutCtx.shortcuts.register({
                id,
                // 文案跟着标签标题走：设置里显示「切换到 看板」而不是干巴巴的序号。
                label: () => {
                  const title = viewTabLabel(index)
                  return title === '' ? `View ${index}` : `${dict.switchTo} ${title}`
                },
                aliases: [`view ${index}`, `标签 ${index}`, 'maw board', 'kanban', '看板'],
                defaults: {
                  'desktop:macos': { code: `Digit${index}`, modifiers },
                  'desktop:windows': { code: `Digit${index}`, modifiers },
                  'desktop:linux': { code: `Digit${index}`, modifiers },
                  // Web 的 Linux 准入表只认极少数组合，声明它会让整条命令被拒；
                  // 与产品内其它插件一致，只声明 web 的 macos / windows。
                  ...(webModifiers === null ? {} : {
                    'web:macos': { code: `Digit${index}`, modifiers: webModifiers },
                    'web:windows': { code: `Digit${index}`, modifiers: webModifiers },
                  }),
                },
                regions: ['page', 'editable'],
                modals: [],
                resolve: () => (activateViewTab(index)
                  ? { status: 'handled', run: () => {} }
                  : { status: 'pass' }),
              }), `dsh-maw: ${id}`)
            } catch (error) {
              diagnostics.push({ id, error: String(error?.message ?? error) })
              return undefined
            }
          }

          for (const index of [1, 2, 3]) {
            bind(index, ['primary'], null)
            bind(index, ['alt'], null)
            bind(index, ['primary', 'alt'], ['primary', 'alt'])
          }
          diagnostics.push({ id: 'registered', errors: diagnostics.length })
        })

        // 工具结果卡片。
        for (const [key, label] of [['maw_board', 'Multi-Agent Workspace'], ['maw_task', 'maw 任务'], ['maw_deps', 'maw 依赖拓扑']]) {
          ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
            name: 'tool.call.toolview',
            key,
          }, toolCard(label)))
        }
      },
    }
  },
})
