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
        tab: 'MAW看板',
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
        graph: '依赖',
        filterLane: '标签',
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
        lane: '标签',
        priority: '优先级',
        mergeOrder: '合入序',
        attempts: '尝试',
        branch: '分支',
        worktree: '工作树',
        blockedReason: '阻塞原因',
        goal: '目标',
        capabilityTier: '能力等级',
        model: '指定模型',
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
        noTasks: '暂无任务。',
        iteration: '迭代',
        iterationAll: '全部迭代',
        iterationNone: '未归迭代',
        iterationHint: '只展示选中迭代的任务',
        iterationEmpty: '这个工程还没有迭代。',
        iterationTasks: '题',
        detailDrawer: '任务详情',
        laneHint: '标签（maw 的 lane）：压任务时写的一个自由标注，通常表示模块或分工面。maw 用它做并行分工边界 —— 同一标签的题由同一个 Agent 串行做，避免同时改到同一批文件',
        statusHint: '状态是单个任务的生命周期',
        iterationHintTitle: '迭代是按批次交付的时间维度',
        problemsPanel: '问题',
        problemsPanelTitle: '问题面板',
        noProblems: '没有发现问题。',
        risksSection: '风险',
        problemsSection: '问题',
        problemCount: '条',
        recordedStatus: 'maw 记录状态',
        derivedStatusHint: '按任务完成度推导',
        iterationProgressLabel: '完成',
        secApproach: '执行思路',
        secNotDoing: '不做',
        secFollowups: '后续建议',
        secBlock: '阻塞与终止',
        secScopeExpand: '范围扩张',
        blockHistory: '阻塞历史',
        cancelReason: '取消原因',
        supersededBy: '被替代为',
        scopeExpandedAt: '扩张时间',
        prevStatus: '前置状态',
        revision: '修订',
        heartbeat: '心跳',
        deliveryStrategy: '执行方式',
        deliveryId: '执行批次',
        runId: '运行',
        instanceId: '实例',
        statusChangedNote: '状态由任务推导，maw 记录值仅在没有任务或已关闭时生效',
        emptyIteration: '这个迭代下没有任务。',
        goDeps: '依赖视图',
        goBoard: '看板视图',
        depsFocus: '聚焦',
        depsClearFocus: '取消聚焦',
        depsEmpty: '没有可展示的依赖。',
        depsHint: '点节点看详情，双击邻居可换焦点',
        drawerHint: '选择左侧看板卡片或依赖节点',
      },
      en: {
        tab: 'MAW board',
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
        graph: 'Deps',
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
        capabilityTier: 'Capability tier',
        model: 'Requested model',
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
        noTasks: 'No tasks yet.',
        iteration: 'Iteration',
        iterationAll: 'All iterations',
        iterationNone: 'No iteration',
        iterationHint: 'Only tasks of the selected iteration are shown',
        iterationEmpty: 'This project has no iterations yet.',
        iterationTasks: 'tasks',
        detailDrawer: 'Task detail',
        laneHint: 'Tag (maw lane): a free-form label written when the task is pushed, usually a module or work surface. maw uses it as the parallel dispatch boundary — tasks sharing a tag are worked serially by one agent to avoid write conflicts',
        statusHint: 'Status is the lifecycle of a single task',
        iterationHintTitle: 'An iteration is the delivery batch dimension',
        problemsPanel: 'Problems',
        problemsPanelTitle: 'Problem panel',
        noProblems: 'Nothing found.',
        risksSection: 'Risks',
        problemsSection: 'Problems',
        problemCount: 'items',
        recordedStatus: 'Recorded status',
        derivedStatusHint: 'Derived from task completion',
        iterationProgressLabel: 'done',
        secApproach: 'How it will be done',
        secNotDoing: 'Not doing',
        secFollowups: 'Suggested follow-ups',
        secBlock: 'Blocking and termination',
        secScopeExpand: 'Scope expansion',
        blockHistory: 'Block history',
        cancelReason: 'Cancel reason',
        supersededBy: 'Superseded by',
        scopeExpandedAt: 'Expanded at',
        prevStatus: 'Previous status',
        revision: 'Revision',
        heartbeat: 'Heartbeat',
        deliveryStrategy: 'Delivery strategy',
        deliveryId: 'Delivery',
        runId: 'Run',
        instanceId: 'Instance',
        statusChangedNote: 'Derived from tasks; the recorded value applies only when there are no tasks or the iteration is closed',
        emptyIteration: 'No task in this iteration.',
        goDeps: 'Dependency view',
        goBoard: 'Board view',
        depsFocus: 'Focus',
        depsClearFocus: 'Clear focus',
        depsEmpty: 'No dependency to show.',
        depsHint: 'Click a node for detail',
        drawerHint: 'Pick a card or a dependency node',
      },
    }

    /** 状态的显示名：看板列名与人读的状态。 */
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

    /**
     * 迭代状态的显示名。
     *
     * 迭代状态与任务状态是两套枚举（running / planning / …），共用一张表会
     * 把 running 混成任务的「进行中」口径，所以单独一张。
     */
    const ITERATION_LABEL = {
      zh: {
        running: '进行中',
        planning: '规划中',
        active: '进行中',
        backlog: '待排',
        paused: '暂停',
        done: '已完成',
        completed: '已完成',
        archived: '已归档',
        cancelled: '已取消',
        empty: '无任务',
      },
      en: {
        running: 'Running',
        planning: 'Planning',
        active: 'Active',
        backlog: 'Backlog',
        paused: 'Paused',
        done: 'Done',
        completed: 'Done',
        archived: 'Archived',
        cancelled: 'Cancelled',
        empty: 'No tasks',
      },
    }

    /** 问题类型：maw 给的 kind 是英文枚举，界面显示中文。 */
    const PROBLEM_KIND = {
      zh: {
        'dep-wait': '等待依赖',
        stalled: '停滞',
        blocked: '阻塞',
        'missed-heartbeat': '心跳丢失',
        conflict: '冲突',
        dirty: '工作区不干净',
      },
      en: {
        'dep-wait': 'Waiting on dependency',
        stalled: 'Stalled',
        blocked: 'Blocked',
        'missed-heartbeat': 'Missed heartbeat',
        conflict: 'Conflict',
        dirty: 'Dirty worktree',
      },
    }

    /** 严重度：低 / 中 / 高。 */
    const SEVERITY_LABEL = {
      zh: { low: '低', medium: '中', high: '高' },
      en: { low: 'Low', medium: 'Medium', high: 'High' },
    }

    /** 状态列顺序：与 maw board 一致，先看可开工与在跑，阻塞单独一列。 */
    const STATUS_ORDER = ['ready', 'in_progress', 'merging', 'backlog', 'blocked', 'done', 'cancelled']

    let dict = TEXT.zh
    let statusLabel = STATUS_LABEL.zh
    let iterationLabel = ITERATION_LABEL.zh
    let problemKindLabel = PROBLEM_KIND.zh
    let severityLabel = SEVERITY_LABEL.zh

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
.maw-view { position: relative; display: flex; flex-direction: column; height: 100%; min-height: 0;
  color: var(--dsw-alias-label-primary); font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", var(--dsw-font-sans, sans-serif); }

.maw-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 8px 16px; border-bottom: 1px solid var(--dsw-alias-border-l1); flex: none; }
.maw-bar__title { font-weight: 600; font-size: 13px; }
.maw-bar__spacer { flex: 1; }
.maw-muted { color: var(--dsw-alias-label-secondary); font-size: 11px; white-space: nowrap; }
.maw-track { width: 120px; height: 4px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); overflow: hidden; }
.maw-track--rail { width: 100%; height: 3px; margin: 1px 0 2px; }
.maw-iteration__open { margin-left: 6px; color: var(--dsw-alias-label-secondary); }
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

/* ── 三块布局：迭代栏 | 内容（看板/依赖） | 详情抽屉 ── */
.maw-shell { display: flex; flex: 1; min-height: 0; }

/* 第一块：迭代栏 */
.maw-iterations { width: 208px; flex: none; display: flex; flex-direction: column;
  min-height: 0; border-right: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1); }
.maw-iterations__head { display: flex; align-items: center; gap: 6px; flex: none;
  padding: 10px 12px 6px; font-size: 10px; font-weight: 600; letter-spacing: .04em;
  text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
.maw-iterations__list { flex: 1; min-height: 0; overflow: auto; padding: 0 8px 10px; }
.maw-iteration { display: flex; flex-direction: column; gap: 3px; width: 100%;
  text-align: left; font: inherit; padding: 7px 9px; border-radius: 6px; cursor: pointer;
  color: inherit; background: transparent; border: 1px solid transparent; margin-bottom: 2px; }
.maw-iteration:hover { background: var(--dsw-alias-bg-layer-2); }
.maw-iteration:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.maw-iteration.is-active { background: var(--dsw-alias-bg-layer-2);
  border-color: var(--dsw-alias-brand-primary); }
.maw-iteration.is-active .maw-iteration__name { color: var(--dsw-alias-brand-primary); }
.maw-iteration__top { display: flex; align-items: center; gap: 6px; }
.maw-iteration__name { font-size: 12px; font-weight: 500; line-height: 1.35;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
.maw-iteration__count { font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--dsw-alias-label-secondary); flex: none; }
.maw-iteration__id { font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--dsw-alias-label-secondary); overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; }
.maw-iteration__status { font: 9px ui-monospace, SFMono-Regular, Menlo, monospace;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 3px; padding: 0 4px;
  color: var(--dsw-alias-label-secondary); white-space: nowrap; flex: none; }

/* 第二块：内容区（自带头部：看板/依赖切换 + 概要 + 筛选） */
.maw-content { position: relative; display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0; }
.maw-content__head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 8px 14px; border-bottom: 1px solid var(--dsw-alias-border-l1); flex: none; }
.maw-content__title { font-size: 12px; font-weight: 600; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.maw-switch { display: inline-flex; gap: 2px; padding: 3px; border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2); flex: none; }
.maw-switch__btn { border: 0; border-radius: 6px; height: 24px; padding: 0 10px; font: inherit;
  font-size: 12px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; }
.maw-switch__btn[aria-selected="true"] { background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-brand-primary); box-shadow: 0 1px 2px var(--dsw-alias-border-l1); font-weight: 600; }
.maw-switch__btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.maw-content__spacer { flex: 1; }
.maw-content__body { flex: 1; min-height: 0; position: relative; }

/* 问题面板：从工具条下方浮出，盖在内容区上，不挤占三块布局 */
.maw-panel { position: absolute; top: 8px; right: 12px; width: 400px; max-width: calc(100% - 24px);
  max-height: 62vh; display: flex; flex-direction: column; z-index: 30;
  border-radius: 10px; border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, .35); }
.maw-panel__head { display: flex; align-items: center; gap: 8px; flex: none;
  padding: 9px 12px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.maw-panel__title { font-size: 12px; font-weight: 600; }
.maw-panel__count { font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--dsw-alias-label-secondary); }
.maw-panel__body { flex: 1; min-height: 0; overflow: auto; padding: 10px 12px; }
.maw-panel__close { margin-left: auto; border: 0; background: transparent; cursor: pointer;
  padding: 2px 6px; border-radius: 4px; color: var(--dsw-alias-label-secondary);
  font-size: 14px; line-height: 1; }
.maw-panel__close:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.maw-panel__backdrop { position: absolute; inset: 0; z-index: 29; background: rgba(0, 0, 0, .12); }
/* 工具条上的「问题」按钮：有内容时带一个计数徽章 */
.maw-problem-btn { display: inline-flex; align-items: center; gap: 5px; }
.maw-problem-btn__badge { font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
  border-radius: 999px; padding: 0 5px; border: 1px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary); }
.maw-problem-btn[data-active="true"] { background: var(--dsw-alias-bg-layer-2);
  border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }

/* 第三块：详情抽屉 */
.maw-drawer { width: 320px; flex: none; display: flex; flex-direction: column; min-height: 0;
  border-left: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); }
.maw-drawer__head { display: flex; align-items: center; gap: 8px; flex: none;
  padding: 8px 12px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.maw-drawer__title { font-size: 11px; font-weight: 600; letter-spacing: .03em;
  text-transform: uppercase; color: var(--dsw-alias-label-secondary); min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.maw-drawer__close { border: 0; background: transparent; cursor: pointer; padding: 2px 6px;
  border-radius: 4px; color: var(--dsw-alias-label-secondary); font-size: 14px; line-height: 1; }
.maw-drawer__close:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.maw-drawer__close:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.maw-drawer__body { flex: 1; min-height: 0; overflow: auto; padding: 12px 14px; }

.maw-body { display: flex; flex: 1; min-height: 0; }
.maw-main { flex: 1; min-width: 0; overflow: auto; padding: 14px 16px; }
.maw-main--canvas { padding: 0; position: relative; overflow: hidden; }

/* 看板列 */
.maw-column { margin-bottom: 18px; }
.maw-column__head { display: flex; align-items: baseline; gap: 8px; font-weight: 600;
  font-size: 12px; padding: 6px 2px 8px; border-top: 1px solid var(--dsw-alias-border-l1); }
.maw-column__count { background: none; font-size: 11px; font-weight: 400; color: var(--dsw-alias-label-secondary); }
.maw-column__dot { width: 7px; height: 7px; border-radius: 999px; flex: none; }
.maw-column:first-child .maw-column__head { border-top-color: var(--dsw-alias-brand-primary); }
.maw-card__lane { max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.maw-card__iteration { max-width: 120px; overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; font: 9px ui-monospace, SFMono-Regular, Menlo, monospace;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 3px; padding: 0 3px; }
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
.maw-card__meta { display: flex; align-items: center; gap: 8px; row-gap: 3px; flex-wrap: wrap;
  margin-top: auto; font-size: 10px; color: var(--dsw-alias-label-secondary); }
/* 窄卡片里这些标签不能被压成竖排的一个字：不收缩 + 不换行，装不下就整项折行。 */
.maw-card__meta > span { flex: none; white-space: nowrap; }
.maw-card__owner { max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 状态色：一整块低饱和底色 + 左条。只靠左条时扫一屏看不出状态分布，
   所以给卡片/节点铺一层 6%–10% 的状态色；比例压住，避免变成刺眼的高亮块。 */
.maw-card[data-status="ready"], .maw-topo__node[data-status="ready"] {
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 8%, var(--dsw-alias-bg-layer-2));
  border-left-color: var(--dsw-alias-state-success-primary);
  border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 22%, var(--dsw-alias-border-l1));
}
.maw-card[data-status="in_progress"], .maw-topo__node[data-status="in_progress"] {
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 9%, var(--dsw-alias-bg-layer-2));
  border-left-color: var(--dsw-alias-state-warn-primary);
  border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 24%, var(--dsw-alias-border-l1));
}
.maw-card[data-status="merging"], .maw-topo__node[data-status="merging"] {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, var(--dsw-alias-bg-layer-2));
  border-left-color: var(--dsw-alias-brand-primary);
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 24%, var(--dsw-alias-border-l1));
}
.maw-card[data-status="blocked"], .maw-topo__node[data-status="blocked"] {
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, var(--dsw-alias-bg-layer-2));
  border-left-color: var(--dsw-alias-state-error-primary);
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 24%, var(--dsw-alias-border-l1));
}
.maw-card[data-status="backlog"], .maw-topo__node[data-status="backlog"] {
  background: color-mix(in srgb, var(--dsw-alias-state-idle-primary) 5%, var(--dsw-alias-bg-layer-2));
  border-left-color: var(--dsw-alias-state-idle-primary);
}
.maw-card[data-status="done"], .maw-topo__node[data-status="done"],
.maw-card[data-status="cancelled"], .maw-topo__node[data-status="cancelled"] {
  background: color-mix(in srgb, var(--dsw-alias-label-secondary) 4%, var(--dsw-alias-bg-layer-2));
  border-left-color: var(--dsw-alias-border-l2);
  opacity: .82;
}
[data-status="done"] .maw-card__status, [data-status="done"] .maw-topo__status { color: var(--dsw-alias-state-success-primary); }
/* 选中/悬停时底色再提一档，保证「选中」仍然比状态色更显眼。 */
.maw-card.is-selected, .maw-topo__node.active {
  border-color: var(--dsw-alias-brand-primary);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, var(--dsw-alias-bg-layer-2));
}

/* 拓扑 */
.maw-topo { position: relative; width: 100%; height: 100%; overflow: hidden;
  background: transparent; }
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
.maw-subsection__title { font-size: 10px; color: var(--dsw-alias-label-secondary); margin: 8px 0 4px; }
/* 详情正文：目标 / 阻塞原因这类长句，保持可读行高 */
.maw-prose { font-size: 11px; line-height: 1.6; color: var(--dsw-alias-label-primary);
  white-space: pre-wrap; overflow-wrap: anywhere; }
/* 依赖 chip：可点，点了切到那个任务 */
.maw-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.maw-chip { border: 1px solid var(--dsw-alias-border-l1); cursor: pointer; font: inherit;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px;
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary);
  padding: 2px 6px; border-radius: 4px; }
.maw-chip:hover:not([disabled]) { border-color: var(--dsw-alias-brand-primary);
  color: var(--dsw-alias-brand-primary); }
.maw-chip:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.maw-chip[disabled] { cursor: default; opacity: .8; }
.maw-item { font-size: 11px; line-height: 1.45; padding: 6px 8px; border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2); margin-bottom: 5px;
  border-left: 2px solid var(--dsw-alias-border-l2); }
.maw-item[data-sev="high"] { border-left-color: var(--dsw-alias-state-error-primary); }
.maw-item[data-sev="medium"] { border-left-color: var(--dsw-alias-state-warn-primary); }
.maw-item[data-sev="low"] { border-left-color: var(--dsw-alias-state-idle-primary); }
.maw-item__head { font-weight: 600; }
/* 问题面板里的条目本身是按钮：清掉按钮默认外观，只保留条目卡的样子 */
.maw-item--btn { display: block; width: 100%; text-align: left; font: inherit;
  color: inherit; cursor: pointer; }
.maw-item--btn:hover { background: var(--dsw-alias-bg-layer-1); }
.maw-item--btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
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

    /**
     * 迭代选择值。
     *
     * 迭代栏的选中值只有三种形态：全部、某个真实迭代 id、未归迭代。
     * 空串不能当「全部」用，因为任务上没有迭代时 `iterationId` 本身就是空串。
     * 这两个哨兵值与 Host 侧的 `__all__` / `__none__` 对齐，可以直接当查询参数发。
     */
    const ALL_CHOICE = '__all__'
    const NO_ITERATION_CHOICE = '__none__'

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
    /**
     * 任务详情。
     *
     * 详情要能回答「这题到底要做什么、怎么做、做到哪一步、为什么停了」，
     * 所以除了状态与负责人，还把执行思路（goal）、不做的事、验收条目、
     * 验证命令、后续建议、依赖、范围、阻塞与终止原因全部摊开。
     *
     * @param {object} props
     * @param {object|null} props.task 任务详情（含 upstream / downstream）
     * @param {(id: string) => void} [props.onSelect] 点依赖跳到那个任务
     */
    function TaskDetail({ task, onSelect, iterationName }) {
      if (task === null || task === undefined) {
        return h('div', { className: 'maw-empty' }, dict.noSelection)
      }

      const kv = []
      const row = (label, value, title) => {
        if (value === null || value === undefined || value === '') return
        kv.push(
          h('dt', { key: `dt-${label}`, title: title ?? '' }, label),
          h('dd', { key: `dd-${label}`, title: title ?? '' }, value),
        )
      }
      row(dict.iteration, task.iterationId === ''
        ? ''
        : (iterationName === undefined || iterationName === '' ? task.iterationId : `${iterationName}（${task.iterationId}）`))
      row(dict.lane, task.lane || dict.none, dict.laneHint)
      row(dict.owner, task.owner || dict.unassigned)
      row(dict.priority, `P${task.priority}`)
      row(dict.mergeOrder, String(task.mergeOrder))
      row(dict.attempts, String(task.attempts))
      row(dict.prevStatus, task.prevStatus === '' ? '' : (statusLabel[task.prevStatus] ?? task.prevStatus))
      row(dict.revision, String(task.revision))
      row(dict.deliveryStrategy, task.deliveryStrategy)
      row(dict.branch, task.branch === '' ? '' : h('span', { className: 'maw-code' }, task.branch))
      row(dict.worktree, task.worktree === '' ? '' : h('span', { className: 'maw-code' }, task.worktree))
      row(dict.heartbeat, task.heartbeat === '' ? '' : String(task.heartbeat).replace('T', ' ').replace('Z', ''))
      row(dict.deliveryId, task.deliveryId === '' ? '' : h('span', { className: 'maw-code' }, task.deliveryId))
      row(dict.runId, task.runId === '' ? '' : h('span', { className: 'maw-code' }, task.runId))
      row(dict.instanceId, task.instanceId === '' ? '' : h('span', { className: 'maw-code' }, task.instanceId))

      const section = (title, children) => h('div', { className: 'maw-section' },
        h('div', { className: 'maw-section__title' }, title), children)
      const list = items => h('ul', { className: 'maw-list' },
        items.map((item, index) => h('li', { key: index }, item)))
      const chipList = ids => h('div', { className: 'maw-chips' }, ids.map(id => h('button', {
        key: id,
        type: 'button',
        className: 'maw-code maw-chip',
        title: onSelect === undefined ? '' : `${dict.detailDrawer} · ${id}`,
        disabled: onSelect === undefined,
        onClick: onSelect === undefined ? undefined : () => onSelect(id),
      }, id)))

      const hasBlockInfo = task.blockedReason !== '' || task.blockCategory !== '' ||
        (task.blockHistory ?? []).length > 0
      // 只有「前置状态是 blocked」时不必单开一节：那只是历史状态，KV 里已经写了，
      // 单开一节会渲染出一个只有标题的空章节。
      const hasStopInfo = task.cancelReason !== '' || task.supersededBy !== ''

      return h('div', { className: 'maw-detail' },
        h('div', { className: 'maw-detail__id' },
          h('span', {
            className: 'maw-card__status',
            style: { color: colorOf(task.status), borderColor: colorOf(task.status) },
          }, statusLabel[task.status] ?? task.status),
          task.id),
        h('div', { className: 'maw-detail__title' }, task.title),
        kv.length > 0 ? h('dl', { className: 'maw-kv' }, kv) : null,
        // ── 执行思路：这题打算怎么做 ──
        section(dict.secApproach, task.goal === ''
          ? h('div', { className: 'maw-muted' }, dict.none)
          : h('div', { className: 'maw-prose' }, task.goal)),
        (task.notDoing ?? []).length > 0 && section(dict.secNotDoing, list(task.notDoing)),
        (task.acceptance ?? []).length > 0 && section(dict.acceptance, list(task.acceptance)),
        (task.verify ?? []).length > 0 && section(dict.verify,
          list(task.verify.map(item => h('span', { className: 'maw-code' }, item)))),
        (task.suggestedFollowups ?? []).length > 0 && section(dict.secFollowups,
          list(task.suggestedFollowups.map(item => h('span', { className: 'maw-code' }, item)))),
        task.capabilityTier && section(dict.capabilityTier,
          h('span', { className: 'maw-code' }, task.capabilityTier)),
        task.model && section(dict.model, h('span', { className: 'maw-code' },
          [`${task.model.provider}/${task.model.model}`, task.model.reasoning_effort].filter(Boolean).join(' · '))),
        // ── 依赖：点一下跳到那个任务 ──
        (task.upstream ?? []).length > 0 && section(dict.upstream, chipList(task.upstream)),
        (task.downstream ?? []).length > 0 && section(dict.downstream, chipList(task.downstream)),
        (task.writeScope ?? []).length > 0 && section(dict.scope,
          list(task.writeScope.map(item => h('span', { className: 'maw-code' }, item)))),
        (task.readScope ?? []).length > 0 && section(dict.readScope,
          list(task.readScope.map(item => h('span', { className: 'maw-code' }, item)))),
        // ── 为什么停下来 ──
        hasBlockInfo && section(dict.secBlock, h(React.Fragment, null,
          task.blockCategory !== '' && h('div', { className: 'maw-muted' },
            `${dict.blockCategory}：${task.blockCategory}`),
          task.blockedReason !== '' && h('div', { className: 'maw-prose' }, task.blockedReason),
          (task.blockHistory ?? []).length > 0 && h(React.Fragment, null,
            h('div', { className: 'maw-subsection__title' }, dict.blockHistory),
            (task.blockHistory ?? []).map((entry, index) => h('div', {
              className: 'maw-item', key: `bh-${index}`, 'data-sev': 'high',
            },
            h('div', { className: 'maw-item__head' }, String(entry.at ?? '').replace('T', ' ').replace('Z', '')),
            h('div', { className: 'maw-item__body' }, entry.reason)))))),
        hasStopInfo && section(dict.secBlock, h(React.Fragment, null,
          task.cancelReason !== '' && h('div', { className: 'maw-muted' },
            `${dict.cancelReason}：${task.cancelReason}`),
          task.supersededBy !== '' && h('div', { className: 'maw-muted' },
            `${dict.supersededBy}：`, h('span', { className: 'maw-code' }, task.supersededBy)))),
        // ── 执行中扩过范围 ──
        (task.scopeExpandReason !== '' || task.scopeExpandedAt !== '') && section(dict.secScopeExpand,
          h(React.Fragment, null,
            task.scopeExpandedAt !== '' && h('div', { className: 'maw-muted' },
              `${dict.scopeExpandedAt}：${String(task.scopeExpandedAt).replace('T', ' ').replace('Z', '')}`),
            task.scopeExpandReason !== '' && h('div', { className: 'maw-prose' }, task.scopeExpandReason))))
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

    function BoardPane({ data, filters, setFilters, selected, onSelect, showIteration }) {
      const tasks = data?.filteredTasks ?? data?.tasks ?? []

      // 看板按任务状态分列（不是 maw 的 lane），按流水线顺序排列；空状态不占位。
      const columns = useMemo(() => {
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

      const tagOptions = useMemo(() => {
        const set = new Set()
        for (const task of data?.tasks ?? []) if (task.lane !== '') set.add(task.lane)
        return [...set].sort()
      }, [data])

      const agentOptions = useMemo(() => {
        const set = new Set()
        for (const task of data?.tasks ?? []) if (task.owner !== '') set.add(task.owner)
        return [...set].sort()
      }, [data])

      // options 既可以是字符串，也可以是 { value, label }：状态筛选项必须显示中文，
      // 但提交给 Host 的仍然是英文枚举。
      const field = (label, key, options, hint) => h('label', { className: 'maw-field', title: hint ?? '' },
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
        'aria-pressed': selected === task.id,
        onClick: () => onSelect(task.id),
      },
      h('div', { className: 'maw-card__head' },
        h('span', { className: 'maw-card__id' }, task.id),
        h('span', { className: 'maw-card__status', title: task.status },
          statusLabel[task.status] ?? task.status)),
      h('h4', { className: 'maw-card__title' }, task.title),
      h('div', { className: 'maw-card__meta' },
        h('span', { className: 'maw-card__owner' }, task.owner || dict.unassigned),
        h('span', {}, `P${task.priority}`),
        task.lane !== '' ? h('span', { className: 'maw-card__lane', title: dict.laneHint }, task.lane) : null,
        showIteration && task.iterationId !== ''
          ? h('span', { className: 'maw-card__iteration', title: dict.iterationHintTitle }, task.iterationId)
          : null,
        task.deps.length > 0 ? h('span', {}, `${dict.deps} ${task.deps.length}`) : null))

      const renderColumn = ([status, columnTasks]) => h('div', { className: 'maw-column', key: status, 'data-status-group': status },
        h('div', { className: 'maw-column__head' },
          h('span', { className: 'maw-column__dot', style: { background: colorOf(status) } }),
          h('span', {}, statusLabel[status] ?? status),
          h('span', { className: 'maw-column__count' }, columnTasks.length)),
        h('div', { className: 'maw-cards' }, columnTasks.map(renderCard)))

      // 内容区只负责「当前迭代」的卡片：筛选栏在内容头部，详情在右侧抽屉，
      // 这里不再自带侧栏，也不再单独展示别的迭代的题。
      return h(React.Fragment, null,
        h('div', { className: 'maw-filters' },
          // 不再提供「切换工程」入口：看板只展示当前工作区对应的那个工程，
          // 换工程靠切换工作区的会话，而不是在这里挑。
          field(dict.filterLane, 'lane', tagOptions, dict.laneHint),
          field(dict.filterStatus, 'status',
            STATUS_ORDER.map(status => ({ value: status, label: statusLabel[status] ?? status })),
            dict.statusHint),
          field(dict.filterAgent, 'agent', agentOptions),
          h('label', { className: 'maw-check' },
            h('input', {
              type: 'checkbox',
              checked: filters.includeDone === true,
              onChange: event => setFilters({ ...filters, includeDone: event.target.checked }),
            }), dict.showDone)),
        h('div', { className: 'maw-main' },
          tasks.length === 0
            ? h('div', { className: 'maw-empty' }, dict.empty)
            : columns.map(renderColumn)))
    }

    /**
     * 第一块：迭代栏。
     *
     * 只列当前工程自己的迭代 —— 别工程的迭代不能出现在这里，否则选中后
     * 内容区会是空的，看起来像坏掉了。
     *
     * @param {object} props
     * @param {object[]} props.iterations 当前工程的迭代
     * @param {Record<string, number>} props.counts 每个迭代的题数（含已完成）
     * @param {string} props.value 选中的迭代 id（空串 = 全部迭代）
     * @param {(id: string) => void} props.onChange
     */
    function IterationPane({ iterations, counts, value, onChange, total }) {
      const list = Array.isArray(iterations) ? iterations : []

      // 排序：还在推进的排前面（进行中 → 阻塞 → 规划中），已完成的沉到后面。
      // 迭代状态是按任务推导出来的，所以这里看到的是「真实进度」，不是 maw 里
      // 那个永远停在 running 的记录值。
      const ordered = useMemo(() => {
        const rank = { running: 0, active: 0, blocked: 1, planning: 2, paused: 3, done: 4, completed: 4, closed: 4, archived: 5, cancelled: 5, empty: 6 }
        return [...list].sort((a, b) => {
          const ra = rank[a.status] ?? 3
          const rb = rank[b.status] ?? 3
          if (ra !== rb) return ra - rb
          const ua = a.updatedAt ?? ''
          const ub = b.updatedAt ?? ''
          if (ua !== ub) return ub.localeCompare(ua)
          return a.id.localeCompare(b.id)
        })
      }, [list])

      const noneCount = counts?.[''] ?? 0

      /**
       * 一行迭代。
       *
       * `choice` 是「选中语义」，`entryId` 是真实迭代 id（未归迭代为空串）。
       * 两者分开：全部迭代也要能被选中，不能只靠空 id 表达。
       */
      const item = (choice, entryId, name, entry) => {
        const open = entry.total - entry.done
        const percent = entry.total === 0 ? 0 : Math.round((entry.done / entry.total) * 100)
        const titleParts = [name]
        if (entry.goal !== '') titleParts.push(entry.goal)
        if (entry.recordedStatus !== '' && entry.statusDerived) {
          titleParts.push(`${dict.recordedStatus}：${entry.recordedStatus}（${dict.derivedStatusHint}）`)
        }
        return h('button', {
          key: choice,
          type: 'button',
          className: `maw-iteration${value === choice ? ' is-active' : ''}`,
          'aria-pressed': value === choice,
          title: titleParts.join('\n'),
          onClick: () => onChange(choice),
        },
        h('div', { className: 'maw-iteration__top' },
          h('span', { className: 'maw-iteration__name' }, name),
          h('span', { className: 'maw-iteration__count' }, `${entry.done}/${entry.total}`),
          entry.status === ''
            ? null
            : h('span', {
              className: 'maw-iteration__status',
              title: entry.statusDerived ? dict.statusChangedNote : entry.recordedStatus,
            }, iterationLabel[entry.status] ?? entry.status)),
        h('div', { className: 'maw-track maw-track--rail', title: `${dict.iterationProgressLabel} ${percent}%` },
          h('div', { className: 'maw-track__fill', style: { width: `${percent}%` } })),
        (entryId !== '' || open > 0) ? h('div', { className: 'maw-iteration__id' },
          entryId === '' ? null : entryId,
          open > 0 ? h('span', { className: 'maw-iteration__open' }, `${open} ${dict.iterationTasks}`) : null) : null)
      }

      // 「全部迭代」与「未归迭代」没有真实迭代记录，用最小结构喂给同一个渲染。
      const allEntry = { done: list.reduce((sum, entry) => sum + (entry.done ?? 0), 0), total, goal: '', status: '', recordedStatus: '', statusDerived: false }
      const noneEntry = { done: 0, total: noneCount, goal: '', status: '', recordedStatus: '', statusDerived: false }

      return h('div', { className: 'maw-iterations' },
        h('div', { className: 'maw-iterations__head' },
          h('span', { title: dict.iterationHintTitle }, dict.iteration),
          h('span', { className: 'maw-bar__spacer' }),
          h('span', { className: 'maw-iteration__count' }, total)),
        h('div', { className: 'maw-iterations__list' },
          // 全部迭代不展示 id 副行：它没有对应的真实迭代 id。
          h('button', {
            key: 'all',
            type: 'button',
            className: `maw-iteration${value === ALL_CHOICE ? ' is-active' : ''}`,
            'aria-pressed': value === ALL_CHOICE,
            title: dict.iterationHint,
            onClick: () => onChange(ALL_CHOICE),
          },
          h('div', { className: 'maw-iteration__top' },
            h('span', { className: 'maw-iteration__name' }, dict.iterationAll),
            h('span', { className: 'maw-iteration__count' }, `${allEntry.done}/${total}`)),
          h('div', { className: 'maw-track maw-track--rail' },
            h('div', { className: 'maw-track__fill', style: { width: `${total === 0 ? 0 : Math.round((allEntry.done / total) * 100)}%` } }))),
          ordered.map(entry => item(entry.id, entry.id, entry.name !== '' ? entry.name : entry.id, entry)),
          // 未归迭代只有在确实有这类题时才出现：空分组没有意义。
          noneCount > 0 ? item(NO_ITERATION_CHOICE, '', dict.iterationNone, noneEntry) : null,
          ordered.length === 0 && noneCount === 0
            ? h('div', { className: 'maw-empty' }, dict.iterationEmpty)
            : null))
    }

    /**
     * 问题面板：把「问题」与「风险」摊成一份清单。
     *
     * 这两类是排查入口而不是任务属性，所以放在工具条上按需展开，
     * 不占三块布局的位置。带 taskId 的条目可以直接点开对应任务。
     *
     * @param {object} props
     * @param {object|null} props.data 看板数据
     * @param {() => void} props.onClose
     * @param {(id: string) => void} [props.onSelect]
     */
    function ProblemPanel({ data, onClose, onSelect }) {
      const problems = data?.problems ?? []
      const risks = data?.risks ?? []
      const total = problems.length + risks.length

      const section = (title, items, prefix) => items.length === 0 ? null
        : h('div', { className: 'maw-section' },
          h('div', { className: 'maw-section__title' }, `${title}（${items.length}）`),
          items.slice(0, 50).map((entry, index) => h('button', {
            key: `${prefix}-${index}`,
            type: 'button',
            className: 'maw-item maw-item--btn',
            'data-sev': entry.severity,
            title: entry.taskId === '' ? '' : `${dict.detailDrawer} · ${entry.taskId}`,
            onClick: entry.taskId !== '' && onSelect !== undefined ? () => onSelect(entry.taskId) : undefined,
          },
          h('div', { className: 'maw-item__head' },
            [entry.taskId || '—',
              problemKindLabel[entry.kind] ?? entry.kind ?? '',
              severityLabel[entry.severity] ?? entry.severity ?? ''].filter(Boolean).join(' · ')),
          h('div', { className: 'maw-item__body' }, entry.message))))

      return h(React.Fragment, null,
        h('div', { className: 'maw-panel__backdrop', onClick: onClose }),
        h('aside', {
          className: 'maw-panel',
          role: 'dialog',
          'aria-modal': 'false',
          'aria-label': dict.problemsPanelTitle,
        },
        h('div', { className: 'maw-panel__head' },
          h('span', { className: 'maw-panel__title' }, dict.problemsPanelTitle),
          h('span', { className: 'maw-panel__count' }, `${total} ${dict.problemCount}`),
          h('button', {
            type: 'button', className: 'maw-panel__close', title: dict.close, onClick: onClose,
          }, '×')),
        h('div', { className: 'maw-panel__body' },
          total === 0
            ? h('div', { className: 'maw-empty' }, dict.noProblems)
            : h(React.Fragment, null,
              section(dict.problemsSection, problems, 'p'),
              section(dict.risksSection, risks, 'r')))))
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
    function TopologyPane({ data, selected, onSelect, canvasHeight }) {
      const canvasRef = useRef(null)
      const [transform, setTransform] = useState({ scale: 1, tx: 0, ty: 0 })
      const [showAll, setShowAll] = useState(false)
      const [hovered, setHovered] = useState(null)
      const dragRef = useRef(null)

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

      // 选中节点的详情由外层抽屉统一查询，这里只负责画布与选中。

      const nodes = [...layout.positions.entries()]

      // 有任务但一个节点都画不出来：只可能是这些题都已完成/取消，而画布默认
      // 不展示它们。空画布会让人以为坏了，所以直接把原因和出口说清楚。
      if (tasks.length > 0 && nodes.length === 0) {
        return h('div', { className: 'maw-empty' },
          h('div', {}, dict.depsEmpty),
          h('label', { className: 'maw-check', style: { marginTop: 10, justifyContent: 'center' } },
            h('input', {
              type: 'checkbox',
              checked: showAll,
              onChange: event => setShowAll(event.target.checked),
            }), dict.showAllNodes))
      }

      return h('div', { className: 'maw-topo' },
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
            'aria-pressed': selected === id,
            'aria-label': `${task.id} ${task.title}，${statusLabel[task.status] ?? task.status}`,
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
            h('span', { className: 'maw-topo__status', title: task.status },
              statusLabel[task.status] ?? task.status)),
          h('h4', { className: 'maw-topo__title' }, task.title),
          h('div', { className: 'maw-topo__meta' },
            h('span', { className: 'maw-topo__owner' }, task.owner || dict.unassigned),
            h('span', {}, task.priority === null ? dict.pNone : `P${task.priority}`)))
        })),
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
          }, dict.relayout),
          h('label', { className: 'maw-check' },
            h('input', {
              type: 'checkbox',
              checked: showAll,
              onChange: event => setShowAll(event.target.checked),
            }), dict.showAllNodes))))
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
      // 内容视图：看板 / 依赖，切换放在内容区自己的头部，不再占用顶栏。
      const [view, setView] = useState('board')
      // 不再有 project 维度：看的是哪个工程由会话自己的工作区决定，
      // 请求里也不带 project 参数，避免界面能把工程切走。
      const [filters, setFilters] = useState({ lane: '', status: '', agent: '', includeDone: false })
      // 当前迭代：ALL_CHOICE = 全部，NO_ITERATION_CHOICE = 未归迭代，其余是迭代 id。
      const [iteration, setIteration] = useState(ALL_CHOICE)
      const [selected, setSelected] = useState(null)
      // 预览动作：正在跑的那个、以及最近一次结果。
      const [busyAction, setBusyAction] = useState('')
      const [previewResult, setPreviewResult] = useState(null)
      // 问题面板：从工具条展开的问题 / 风险清单。
      const [panelOpen, setPanelOpen] = useState(false)

      const query = useMemo(() => {
        const params = new URLSearchParams()
        if (sessionId !== '') params.set('session', sessionId)
        if (filters.lane !== '') params.set('lane', filters.lane)
        if (filters.status !== '') params.set('status', filters.status)
        if (filters.agent !== '') params.set('agent', filters.agent)
        if (filters.includeDone) params.set('includeDone', 'true')
        // 迭代筛选交给 Host：内容区看到的题必须与迭代栏上选中的那个一致。
        params.set('iteration', iteration)
        const text = params.toString()
        return text === '' ? '/board' : `/board?${text}`
      }, [filters, iteration, sessionId])

      const { data, error, loading, refresh } = usePoll(query, 5000, true)
      // maw 缺失或安装失败时轮询健康状态，装好后自动恢复。
      const healthPoll = usePoll('/health', 4000, data === null || data?.sources?.tasks !== 'ok')

      const stale = Object.entries(data?.sources ?? {})
        .filter(([, state]) => state !== 'ok').map(([source]) => source)

      // 当前工程 id：详情查询与预览动作都要带上它，否则跨工程会 404。
      const projectId = String(data?.launch?.projectId ?? data?.defaultProjectId ?? '')

      // 选中的迭代一旦在数据里消失（切了工程），退回「全部」，避免内容区空着。
      useEffect(() => {
        if (data === null) return
        if (iteration === ALL_CHOICE || iteration === NO_ITERATION_CHOICE) return
        const exists = (data.iterations ?? []).some(entry => entry.id === iteration)
        if (!exists) setIteration(ALL_CHOICE)
      }, [data, iteration])

      // Esc 关掉问题面板：面板是浮层，键盘退出是基本预期。
      useEffect(() => {
        if (!panelOpen) return undefined
        const onKey = event => { if (event.key === 'Escape') setPanelOpen(false) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [panelOpen])

      // 详情抽屉：按任务 id 取一次完整详情（含上下游）。
      const [detail, setDetail] = useState({ task: null, error: null, loading: false })
      useEffect(() => {
        if (selected === null || selected === undefined) {
          setDetail({ task: null, error: null, loading: false })
          return undefined
        }
        let alive = true
        const controller = new AbortController()
        setDetail(previous => ({ ...previous, loading: true, error: null }))
        const params = new URLSearchParams({ id: selected })
        if (sessionId !== '') params.set('session', sessionId)
        if (projectId !== '') params.set('project', projectId)
        getJson(`/task?${params.toString()}`, controller.signal)
          .then(body => {
            if (alive) setDetail({ task: body?.task ?? null, error: null, loading: false })
          })
          .catch(caught => {
            if (!alive || caught?.name === 'AbortError') return
            setDetail({ task: null, error: String(caught?.message ?? caught), loading: false })
          })
        return () => { alive = false; controller.abort() }
      }, [selected, sessionId, projectId])

      const iterations = data?.iterations ?? []
      const iterationCounts = data?.iterationCounts ?? {}

      const content = () => {
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
        // 当前工作区不对应任何 maw 工程：只给一句「暂无任务」。
        // 不展示别人的看板，也不再解释怎么登记 —— 这类说明属于插件文档，不是界面文案。
        if (data.matched === false) {
          return h('div', { className: 'maw-empty' }, dict.noTasks)
        }
        if (view === 'graph') {
          return h(TopologyPane, { data, selected, onSelect: setSelected })
        }
        return h(BoardPane, {
          data, filters, setFilters, selected, onSelect: setSelected,
          // 看「全部迭代」时，卡片要标出自己属于哪个迭代，否则多迭代会混成一片。
          showIteration: iteration === ALL_CHOICE,
        })
      }

      // 工具条上的动作只对「已登记到 maw 的工程」出现：未登记的目录没有队列、
      // 没有 agent、没有 worktree，按钮露出来只会误导。
      const registered = data?.launch?.registered === true
      const problemTotal = (data?.problems?.length ?? 0) + (data?.risks?.length ?? 0)
      const showShell = data !== null && data.matched !== false
      const currentIteration = iterations.find(entry => entry.id === iteration)
      const contentTitle = iteration === ALL_CHOICE
        ? dict.iterationAll
        : iteration === NO_ITERATION_CHOICE
          ? dict.iterationNone
          : (currentIteration?.name ?? iteration)

      const drawer = h('aside', { className: 'maw-drawer', 'aria-label': dict.detailDrawer },
        h('div', { className: 'maw-drawer__head' },
          h('span', { className: 'maw-drawer__title' },
            selected === null ? dict.detailDrawer : `${dict.detailDrawer} · ${selected}`),
          selected === null ? null : h('button', {
            type: 'button', className: 'maw-drawer__close', title: dict.close,
            onClick: () => setSelected(null),
          }, '×')),
        h('div', { className: 'maw-drawer__body' },
          selected === null
            ? h('div', { className: 'maw-empty' },
              h('div', {}, dict.drawerHint),
              h('button', {
                type: 'button', className: 'maw-btn', style: { marginTop: 10 },
                onClick: () => setPanelOpen(true),
              }, `${dict.problemsPanel} ${(data?.problems?.length ?? 0) + (data?.risks?.length ?? 0)}`))
            : detail.error !== null
              ? h('div', { className: 'maw-error' },
                h('div', { className: 'maw-error__head' }, dict.failed), detail.error)
              : detail.task === null && detail.loading
                ? h('div', { className: 'maw-empty' }, dict.loading)
                : h(TaskDetail, {
                  task: detail.task,
                  onSelect: setSelected,
                  // 详情是异步取的：首帧 task 还是 null，这里必须容错，
                  // 否则「点开任务」这一步会直接抛空指针。
                  iterationName: iterations.find(entry => entry.id === detail.task?.iterationId)?.name ?? '',
                })))

      return h('div', { className: 'maw-view' },
        h('div', { className: 'maw-bar' },
          h('span', { className: 'maw-bar__title' }, dict.title),
          h('span', { className: 'maw-bar__spacer' }),
          // 问题面板入口：紧挨着自检，属于同一组「排查」动作。
          // 非 maw 工程时整条隐藏：那时没有问题数据可看，露个按钮只会误导。
          showShell && h('button', {
            type: 'button',
            className: 'maw-btn maw-problem-btn',
            'data-active': panelOpen,
            title: dict.problemsPanelTitle,
            'aria-expanded': panelOpen,
            onClick: () => setPanelOpen(open => !open),
          },
          dict.problemsPanel,
          problemTotal > 0 ? h('span', { className: 'maw-problem-btn__badge' }, problemTotal) : null),
          registered && h(PreviewActions, {
            actions: data.actions,
            projectId,
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
              type: 'button', className: 'maw-preview__close', title: dict.close,
              onClick: () => setPreviewResult(null),
            }, '×')),
          previewResult.ok
            ? h(React.Fragment, null,
              h('div', {}, previewResult.summary),
              previewResult.lines.length > 0 && h('ul', { className: 'maw-preview__lines' },
                previewResult.lines.map((line, index) => h('li', { key: `${index}-${line}` }, line))))
            : h('div', { className: 'maw-preview__err' },
              `${dict.actionFailed}：${previewResult.error}`)),
        // ── 三块：迭代 | 内容 | 详情抽屉 ──
        showShell
          ? h('div', { className: 'maw-shell' },
            h(IterationPane, {
              iterations,
              counts: iterationCounts,
              value: iteration,
              total: data.total,
              onChange: choice => {
                // 换迭代时清掉选中：上一个迭代的题可能已经不在视野里。
                setSelected(null)
                setIteration(choice)
              },
            }),
            h('section', { className: 'maw-content' },
              h('div', { className: 'maw-content__head' },
                h('div', { className: 'maw-switch', role: 'tablist', 'aria-label': dict.title },
                  h('button', {
                    type: 'button', className: 'maw-switch__btn', role: 'tab',
                    'aria-selected': view === 'board', onClick: () => setView('board'),
                  }, dict.board),
                  h('button', {
                    type: 'button', className: 'maw-switch__btn', role: 'tab',
                    'aria-selected': view === 'graph', onClick: () => setView('graph'),
                  }, dict.graph)),
                h('span', { className: 'maw-content__title', title: contentTitle }, contentTitle),
                h('span', { className: 'maw-content__spacer' }),
                h('span', { className: 'maw-muted' },
                  `${data.tasks.length} ${dict.tasks}`)),
              h('div', { className: 'maw-content__body' }, content()),
              // 问题面板挂在内容区里：浮在中间那块之上，右侧详情抽屉仍然可见。
              panelOpen && h(ProblemPanel, {
                data,
                onClose: () => setPanelOpen(false),
                onSelect: id => { setSelected(id); setPanelOpen(false) },
              })),
            drawer)
          : loading && data === null
            ? h('div', { className: 'maw-empty' }, dict.loading)
            : h('div', { className: 'maw-main' }, content()))
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
            iterationLabel = ITERATION_LABEL[active] ?? ITERATION_LABEL.zh
            problemKindLabel = PROBLEM_KIND[active] ?? PROBLEM_KIND.zh
            severityLabel = SEVERITY_LABEL[active] ?? SEVERITY_LABEL.zh
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
                aliases: [`view ${index}`, `标签 ${index}`, 'maw board', 'kanban', '看板', 'maw看板'],
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
