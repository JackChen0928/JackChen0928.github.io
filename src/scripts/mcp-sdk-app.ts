/**
 * MCP SDK 自动化集成助手 — SDK 接入工作台（前端模拟交互原型）
 *
 * 状态机：需求输入 → 方案生成 → 方案确认 → 变更预览 → 校验与编译 → 结果摘要。
 * 全部为纯前端预设场景，不连接真实 MCP 服务，不执行真实代码注入，
 * 不修改真实项目文件；所有输出均标注「模拟」。
 */

import { FLOW_STEPS, SCENARIOS, type McpScenario } from '../data/mcp-sdk-demo';

type Stage = 'idle' | 'parsing' | 'missing' | 'review' | 'preview' | 'validating' | 'done';

interface AppState {
  stage: Stage;
  scenario: McpScenario | null;
  /** 当前面板是否正在执行动画（防止并发操作） */
  busy: boolean;
  seq: number;
}

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function esc(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function initMcpWorkbench(): void {
  const inputEl = $('mcp-input') as HTMLTextAreaElement | null;
  const startBtn = $('mcp-start') as HTMLButtonElement | null;
  const cancelBtn = $('mcp-cancel') as HTMLButtonElement | null;
  const statusEl = $('mcp-status');
  const panelEl = $('mcp-panel');
  const stepsEl = $('mcp-steps');
  if (!inputEl || !startBtn || !cancelBtn || !statusEl || !panelEl || !stepsEl) return;

  const state: AppState = { stage: 'idle', scenario: null, busy: false, seq: 0 };

  /* ---------------- 步骤条 ---------------- */

  function renderSteps(): void {
    const order: Stage[] = ['idle', 'parsing', 'missing', 'review', 'preview', 'validating', 'done'];
    const idx = order.indexOf(state.stage);
    stepsEl.innerHTML = FLOW_STEPS.map((s, i) => {
      const stateClass =
        state.stage === 'done' || state.stage === 'missing'
          ? i === 5 || i === 3
            ? 'mcp-step mcp-step--current'
            : i <= 5
              ? 'mcp-step mcp-step--done'
              : 'mcp-step'
          : i < idx
            ? 'mcp-step mcp-step--done'
            : i === idx
              ? 'mcp-step mcp-step--current'
              : 'mcp-step';
      return `<div class="${stateClass}"><span class="mcp-step-num">${String(i + 1).padStart(2, '0')}</span><span class="mcp-step-label">${esc(s.label)}</span></div>`;
    }).join('');
    void order;
    void idx;
  }

  /* ---------------- 状态与按钮 ---------------- */

  function setStatus(text: string, tone: 'normal' | 'warn' | 'error' | 'ok' = 'normal'): void {
    statusEl.textContent = text;
    statusEl.dataset.tone = tone;
  }

  function syncButtons(): void {
    startBtn.disabled = state.busy || state.stage !== 'idle' || !inputEl.value.trim();
    cancelBtn.disabled = state.busy || state.stage === 'idle' || state.stage === 'done';
    inputEl.disabled = state.stage !== 'idle';
    document.querySelectorAll<HTMLButtonElement>('[data-scenario]').forEach((b) => {
      b.disabled = state.stage !== 'idle';
    });
  }

  /* ---------------- 场景识别 ---------------- */

  function detectScenario(text: string): McpScenario {
    const t = text.trim();
    const hit = SCENARIOS.find((s) => s.keywords.some((k) => t.includes(k)));
    // 包含 appId 且未命中 minSdk 异常 → 正常场景 A
    if (hit && hit.id !== 'a') return hit;
    if (t.includes('appId') || t.includes('a1234567890')) return SCENARIOS[0];
    // 缺必要信息（无 appId）→ 场景 B
    return SCENARIOS[1];
  }

  /* ---------------- 流程 ---------------- */

  async function runParsing(scenario: McpScenario): Promise<void> {
    state.stage = 'parsing';
    state.busy = true;
    renderSteps();
    syncButtons();
    setStatus('正在解析需求并生成接入方案（模拟）……');

    panelEl.innerHTML = `
      <div class="mcp-console">
        ${[
          '解析用户需求描述……',
          '提取必要参数：SDK 版本 / 开发平台 / appId / 项目路径',
          scenario.missingParam ? `检查参数完整性：缺少「${esc(scenario.missingParam.param)}」` : '生成结构化接入方案',
        ]
          .map((l) => `<div class="mcp-log-line mcp-log-line--pending" data-log>${esc(l)}</div>`)
          .join('')}
      </div>
    `;

    const lines = panelEl.querySelectorAll<HTMLElement>('[data-log]');
    for (let i = 0; i < lines.length; i++) {
      await wait(550);
      lines[i].classList.remove('mcp-log-line--pending');
      lines[i].classList.add('mcp-log-line--ok');
    }
    await wait(300);
  }

  function renderReview(scenario: McpScenario): void {
    state.stage = 'review';
    renderSteps();
    syncButtons();
    setStatus('方案已生成，等待你确认后才会执行（模拟）。', 'ok');

    panelEl.innerHTML = `
      <div class="mcp-card">
        <div class="mcp-card-head">
          <h4>生成的接入方案（示例）</h4>
          <span class="mcp-badge">模拟方案</span>
        </div>
        <div class="mcp-plan-list">
          ${scenario.plan
            .map(
              (p, i) => `
              <div class="mcp-plan-item">
                <span class="mcp-plan-num">${String(i + 1).padStart(2, '0')}</span>
                <div>
                  <strong>${esc(p.title)}</strong>
                  <p>${esc(p.detail)}</p>
                </div>
              </div>`,
            )
            .join('')}
        </div>
        <div class="mcp-card-actions">
          <button type="button" class="btn btn--outline" data-action="cancel">取消</button>
          <button type="button" class="btn btn--solid" data-action="confirm">确认方案，进入下一步</button>
        </div>
        <p class="mcp-card-hint">确认前不会执行任何注入或修改（模拟）。</p>
      </div>
    `;
  }

  function renderMissing(scenario: McpScenario): void {
    state.stage = 'missing';
    renderSteps();
    syncButtons();
    setStatus('缺少必要参数，流程已暂停（异常案例演示）。', 'warn');

    const mp = scenario.missingParam!;
    panelEl.innerHTML = `
      <div class="mcp-card mcp-card--error">
        <div class="mcp-card-head">
          <h4>缺少必要参数：${esc(mp.param)}</h4>
          <span class="mcp-badge mcp-badge--warn">异常案例</span>
        </div>
        <p class="mcp-card-text">${esc(mp.hint)}</p>
        <p class="mcp-card-text">Agent 不会在缺少必要参数时继续执行，而是先请求补充，避免生成不可用的接入代码。</p>
        <div class="mcp-card-actions">
          <button type="button" class="btn btn--outline" data-action="cancel">取消流程</button>
          <button type="button" class="btn btn--solid" data-action="resolve">补充 ${esc(mp.param)} 后继续（模拟）</button>
        </div>
        <p class="mcp-card-hint">补充参数为模拟操作，仅用于演示异常恢复路径。</p>
      </div>
    `;
  }

  function renderPreview(scenario: McpScenario): void {
    state.stage = 'preview';
    renderSteps();
    syncButtons();
    setStatus('变更预览：请核对以下示例改动，确认后进入执行（模拟）。', 'normal');

    panelEl.innerHTML = `
      <div class="mcp-card">
        <div class="mcp-card-head">
          <h4>变更预览（示例文件）</h4>
          <span class="mcp-badge">模拟内容 · 非真实工程文件</span>
        </div>
        ${scenario.changes
          .map(
            (c) => `
            <div class="mcp-diff">
              <div class="mcp-diff-head">
                <span class="mcp-diff-file">${esc(c.file)}</span>
                <span class="mcp-diff-action">${c.action}</span>
              </div>
              <div class="mcp-diff-cols">
                ${c.before ? `<div class="mcp-diff-col"><div class="mcp-diff-col-label">修改前</div><pre>${esc(c.before)}</pre></div>` : ''}
                <div class="mcp-diff-col mcp-diff-col--after"><div class="mcp-diff-col-label">修改后</div><pre>${esc(c.after)}</pre></div>
              </div>
            </div>`,
          )
          .join('')}
        <div class="mcp-card-actions">
          <button type="button" class="btn btn--outline" data-action="cancel">取消</button>
          <button type="button" class="btn btn--solid" data-action="execute">开始执行（模拟校验与编译）</button>
        </div>
        <p class="mcp-card-hint">以上为前端模拟的示例代码片段，不会写入任何真实项目文件。</p>
      </div>
    `;
  }

  async function runValidation(scenario: McpScenario): Promise<void> {
    state.stage = 'validating';
    state.busy = true;
    renderSteps();
    syncButtons();
    setStatus('正在执行校验与编译验证（模拟）……');

    panelEl.innerHTML = `
      <div class="mcp-card">
        <div class="mcp-card-head"><h4>校验与编译验证</h4><span class="mcp-badge">模拟执行</span></div>
        <div class="mcp-validate-list" id="mcp-validate-list">
          ${scenario.validate
            .map(
              (v, i) => `
              <div class="mcp-validate-item" data-validate-item>
                <span class="mcp-validate-status" data-vstatus="pending">待处理</span>
                <span class="mcp-validate-label">${esc(v.label)}</span>
                <span class="mcp-validate-detail">${esc(v.detail)}</span>
              </div>`,
            )
            .join('')}
        </div>
        <div class="mcp-console mcp-console--build" id="mcp-build-log"></div>
      </div>
    `;

    const items = panelEl.querySelectorAll<HTMLElement>('[data-validate-item]');
    const statusEls = panelEl.querySelectorAll<HTMLElement>('[data-vstatus]');
    const buildLogEl = panelEl.querySelector<HTMLElement>('#mcp-build-log');

    for (let i = 0; i < items.length; i++) {
      statusEls[i].dataset.vstatus = 'running';
      statusEls[i].textContent = '检查中';
      await wait(650);
      const fail = scenario.validate[i].id === scenario.failValidateId;
      statusEls[i].dataset.vstatus = fail ? 'fail' : 'pass';
      statusEls[i].textContent = fail ? '失败' : '通过';
    }

    if (buildLogEl) {
      for (const line of scenario.buildLog) {
        await wait(480);
        const div = document.createElement('div');
        div.className = 'mcp-log-line mcp-log-line--ok';
        div.textContent = line;
        buildLogEl.appendChild(div);
      }
    }

    await wait(300);
    renderResult(scenario);
  }

  function renderResult(scenario: McpScenario): void {
    state.stage = 'done';
    state.busy = false;
    renderSteps();
    syncButtons();
    const failed = scenario.summaryUndone.length > 0;
    setStatus(
      failed ? '流程完成：存在未通过步骤，请查看结果摘要（模拟）。' : '流程完成：全部步骤通过（模拟）。',
      failed ? 'error' : 'ok',
    );

    panelEl.innerHTML = `
      <div class="mcp-card">
        <div class="mcp-card-head">
          <h4>结果摘要（模拟）</h4>
          <span class="mcp-badge ${failed ? 'mcp-badge--warn' : ''}">${failed ? '部分未完成' : '全部通过'}</span>
        </div>
        <div class="mcp-summary-grid">
          <div class="mcp-summary-col">
            <h5>已完成</h5>
            <ul class="mcp-summary-list mcp-summary-list--ok">
              ${scenario.summaryDone.map((s) => `<li>${esc(s)}</li>`).join('')}
            </ul>
          </div>
          <div class="mcp-summary-col">
            <h5>未完成 / 失败</h5>
            ${
              scenario.summaryUndone.length > 0
                ? `<ul class="mcp-summary-list mcp-summary-list--fail">${scenario.summaryUndone.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`
                : `<p class="mcp-summary-empty">无未完成步骤</p>`
            }
          </div>
        </div>
        <div class="mcp-card-actions">
          <button type="button" class="btn btn--solid" data-action="restart">重新开始</button>
        </div>
        <p class="mcp-card-hint">以上结果均为前端模拟输出，不构成真实编译日志或真实项目变更记录。</p>
      </div>
    `;
  }

  /* ---------------- 事件分发 ---------------- */

  panelEl.addEventListener('click', async (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const actionBtn = target.closest<HTMLElement>('[data-action]');
    if (!actionBtn || state.busy) return;
    const action = actionBtn.dataset.action;

    if (action === 'cancel') {
      state.stage = 'idle';
      state.scenario = null;
      setStatus('流程已取消，可重新输入或选择预设场景。', 'warn');
      panelEl.innerHTML = '<div class="mcp-empty">已取消。点击「生成方案」重新开始。</div>';
      renderSteps();
      syncButtons();
      return;
    }
    if (action === 'confirm') {
      if (!state.scenario) return;
      renderPreview(state.scenario);
      return;
    }
    if (action === 'resolve') {
      if (!state.scenario || !state.scenario.missingParam) return;
      const mp = state.scenario.missingParam;
      // 补充参数后：更新输入框，切换为正常场景 A 继续流程
      state.scenario = SCENARIOS[0];
      if (inputEl) inputEl.value = SCENARIOS[0].input;
      setStatus(`已补充 ${esc(mp.param)}（模拟），重新生成方案。`, 'ok');
      await runParsing(state.scenario);
      renderReview(state.scenario);
      return;
    }
    if (action === 'execute') {
      if (!state.scenario) return;
      await runValidation(state.scenario);
      return;
    }
    if (action === 'restart') {
      state.stage = 'idle';
      state.scenario = null;
      state.busy = false;
      setStatus('已重置，可以开始新流程（模拟）。');
      panelEl.innerHTML = '<div class="mcp-empty">输入接入需求或选择一个预设场景，然后点击「生成方案」。</div>';
      renderSteps();
      syncButtons();
      return;
    }
  });

  /* ---------------- 输入与场景 ---------------- */

  document.querySelectorAll<HTMLButtonElement>('[data-scenario]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.scenario as 'a' | 'b' | 'c';
      const s = SCENARIOS.find((x) => x.id === id);
      if (!s) return;
      state.scenario = s;
      if (inputEl) inputEl.value = s.input;
      setStatus(`已载入预设场景「${s.label}」，可直接生成方案（模拟）。`, 'normal');
      syncButtons();
    });
  });

  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      if (state.stage !== 'idle' || !inputEl.value.trim() || state.busy) return;
      state.scenario = detectScenario(inputEl.value);
      setStatus('开始流程（模拟）……');
      await runParsing(state.scenario);
      if (state.scenario.missingParam) {
        renderMissing(state.scenario);
      } else {
        renderReview(state.scenario);
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      // 与面板内 data-action="cancel" 共用逻辑
      state.stage = 'idle';
      state.scenario = null;
      setStatus('流程已取消，可重新输入或选择预设场景。', 'warn');
      panelEl.innerHTML = '<div class="mcp-empty">已取消。点击「生成方案」重新开始。</div>';
      renderSteps();
      syncButtons();
    });
  }

  if (inputEl) {
    inputEl.addEventListener('input', () => syncButtons());
  }

  /* ---------------- 初始状态 ---------------- */

  setStatus('输入接入需求或选择一个预设场景，然后点击「生成方案」（模拟）。');
  panelEl.innerHTML =
    '<div class="mcp-empty">输入接入需求或选择一个预设场景，然后点击「生成方案」。<br>可演示：正常通过、缺少必要参数、配置错误导致编译失败。</div>';
  renderSteps();
  syncButtons();
}
