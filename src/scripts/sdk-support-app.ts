/**
 * SDK 智能技术支持助手 — 聊天与工作流面板交互（前端模拟）
 *
 * 负责：会话设置、消息渲染、平台澄清、模拟检索步骤、
 * 工作流高亮与变量面板联动。
 */

import {
  WORKFLOW_NODES,
  type KnowledgeDoc,
  type Platform,
  type SdkVersion,
} from '../data/sdk-support-demo';
import {
  confirmPlatform,
  runUserTurn,
  type WorkflowVariables,
} from '../lib/sdk-support-engine';

type UiMessage =
  | { id: number; kind: 'user'; text: string }
  | { id: number; kind: 'assistant'; text: string; sources: KnowledgeDoc[]; feedback: 'up' | 'down' | null }
  | { id: number; kind: 'steps'; steps: string[] }
  | { id: number; kind: 'clarify'; text: string; options: { label: string; value: Platform }[] }
  | { id: number; kind: 'insufficient'; text: string }
  | { id: number; kind: 'system'; text: string };

interface AppState {
  sdkVersion: SdkVersion | null;
  platform: Platform | null;
  confirmedPlatform: Platform | null;
  /** 最近一次用户查询文本，供确认平台后继续检索 */
  lastQuery: string;
  messages: UiMessage[];
  busy: boolean;
  msgSeq: number;
}

const VARIABLE_LABELS: Array<{ key: keyof WorkflowVariables; label: string }> = [
  { key: 'query', label: '用户问题（query）' },
  { key: 'sdk_version', label: 'SDK 版本（sdk_version）' },
  { key: 'platform', label: '开发平台（platform）' },
  { key: 'detected_platform', label: '检测到的平台（detected_platform）' },
  { key: 'has_conflict', label: '平台冲突（has_conflict）' },
  { key: 'retrieval_query', label: '检索条件（retrieval_query）' },
  { key: 'matched_documents', label: '匹配资料（matched_documents）' },
  { key: 'evidence_status', label: '依据状态（evidence_status）' },
  { key: 'answer', label: '答复状态（answer）' },
];

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function esc(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

export function initSdkChat(): void {
  const messagesEl = $('sdkai-chat-messages');
  if (!messagesEl) return;

  const state: AppState = {
    sdkVersion: 'TopOn',
    platform: 'Flutter',
    confirmedPlatform: null,
    lastQuery: '',
    messages: [],
    busy: false,
    msgSeq: 0,
  };

  /* ---------------- 渲染 ---------------- */

  function renderMessage(m: UiMessage): string {
    switch (m.kind) {
      case 'user':
        return `<div class="sdkai-msg sdkai-msg--user" data-id="${m.id}"><div class="sdkai-msg-label">我</div><div class="sdkai-bubble">${esc(m.text)}</div></div>`;
      case 'system':
        return `<div class="sdkai-msg sdkai-msg--system" data-id="${m.id}">${esc(m.text)}</div>`;
      case 'steps':
        return `<div class="sdkai-msg sdkai-msg--assistant" data-id="${m.id}">
          <div class="sdkai-msg-label">模拟检索流程</div>
          <div class="sdkai-bubble">
            ${m.steps.map((s) => `<div class="sdkai-step"><span class="sdkai-step-dot"></span>${esc(s)}</div>`).join('')}
          </div>
        </div>`;
      case 'clarify':
        return `<div class="sdkai-msg sdkai-msg--assistant" data-id="${m.id}">
          <div class="sdkai-msg-label">助手 · 需要确认</div>
          <div class="sdkai-bubble">${esc(m.text)}</div>
          <div class="sdkai-clarify-options">
            ${m.options.map((o) => `<button type="button" class="sdkai-btn sdkai-btn--chip" data-confirm="${esc(o.value)}">${esc(o.label)}</button>`).join('')}
          </div>
        </div>`;
      case 'insufficient':
        return `<div class="sdkai-msg sdkai-msg--assistant" data-id="${m.id}">
          <div class="sdkai-msg-label">助手 · 依据不足</div>
          <div class="sdkai-bubble sdkai-bubble--warn">${esc(m.text)}</div>
        </div>`;
      case 'assistant': {
        const fb = m.feedback
          ? `<span class="sdkai-fb-note">已记录：${m.feedback === 'up' ? '有帮助' : '没有帮助'}</span>`
          : `<button type="button" class="sdkai-fb" data-feedback="up" data-msg="${m.id}">有帮助</button>
             <button type="button" class="sdkai-fb" data-feedback="down" data-msg="${m.id}">没有帮助</button>`;
        const sources = m.sources
          .map(
            (d) => `
            <details class="sdkai-source">
              <summary>
                <span class="sdkai-source-title">${esc(d.title)}</span>
                <span class="sdkai-source-meta">${esc(d.sdkVersion)} · ${esc(d.platform)} · ${esc(d.documentType)}</span>
                <span class="sdkai-demo-tag">演示资料</span>
              </summary>
              <div class="sdkai-source-body">
                <p>${esc(d.content)}</p>
                <p class="sdkai-source-label">${esc(d.sourceLabel)}</p>
              </div>
            </details>`,
          )
          .join('');
        return `<div class="sdkai-msg sdkai-msg--assistant" data-id="${m.id}">
          <div class="sdkai-msg-label">助手</div>
          <div class="sdkai-bubble sdkai-whitespace">${esc(m.text)}</div>
          ${sources ? `<div class="sdkai-sources"><div class="sdkai-sources-title">参考资料</div>${sources}</div>` : ''}
          <div class="sdkai-feedback">${fb}</div>
        </div>`;
      }
    }
  }

  function renderMessages(): void {
    messagesEl.innerHTML = state.messages.map(renderMessage).join('');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function pushMessage(m: UiMessage): void {
    state.messages.push(m);
  }

  function addSystem(text: string): void {
    pushMessage({ id: ++state.msgSeq, kind: 'system', text });
  }

  /* ---------------- 工作流联动 ---------------- */

  function updateWorkflow(workflow: { path: string[]; branch: string }): void {
    document.querySelectorAll('.sdkai-wf-node').forEach((n) => {
      n.classList.remove('is-active', 'is-done', 'is-branch');
    });
    const last = workflow.path[workflow.path.length - 1];
    workflow.path.forEach((id) => {
      const node = document.querySelector(`[data-node="${id}"]`);
      if (!node) return;
      if (id === last) node.classList.add('is-active');
      else node.classList.add('is-done');
    });
    const branchNode =
      workflow.branch === 'conflict' || workflow.branch === 'clarify'
        ? 'platform-clarify'
        : workflow.branch === 'insufficient'
          ? 'insufficient'
          : null;
    if (branchNode) {
      document.querySelector(`[data-node="${branchNode}"]`)?.classList.add('is-branch');
    }
  }

  function updateVariables(vars: WorkflowVariables): void {
    const tbody = $('sdkai-wf-vars');
    if (!tbody) return;
    tbody.innerHTML = VARIABLE_LABELS.map(
      ({ key, label }) =>
        `<tr><td class="sdkai-var-key">${esc(label)}</td><td class="sdkai-var-value">${esc(vars[key])}</td></tr>`,
    ).join('');
  }

  function resetWorkflow(): void {
    document.querySelectorAll('.sdkai-wf-node').forEach((n) => {
      n.classList.remove('is-active', 'is-done', 'is-branch');
    });
    const tbody = $('sdkai-wf-vars');
    if (tbody) {
      tbody.innerHTML = VARIABLE_LABELS.map(
        ({ label }) =>
          `<tr><td class="sdkai-var-key">${esc(label)}</td><td class="sdkai-var-value">—</td></tr>`,
      ).join('');
    }
    const detail = $('sdkai-wf-detail');
    if (detail) {
      detail.innerHTML =
        '<div class="sdkai-wf-detail-empty">点击上方任意节点，查看节点作用、输入 / 输出变量、执行条件与下一步节点。当前为模拟工作流，非真实 Dify 运行日志。</div>';
    }
    addSystem('已重置工作流高亮与变量，可查看完整流程。');
    renderMessages();
  }

  /* ---------------- 引擎事件转消息 ---------------- */

  function applyTurn(result: {
    events: { type: string; steps?: string[]; text?: string; options?: { label: string; value: Platform }[]; sources?: KnowledgeDoc[] }[];
    variables: WorkflowVariables;
    workflow: { path: string[]; branch: string };
  }): void {
    for (const e of result.events) {
      switch (e.type) {
        case 'steps':
          pushMessage({ id: ++state.msgSeq, kind: 'steps', steps: e.steps ?? [] });
          break;
        case 'clarify':
          pushMessage({
            id: ++state.msgSeq,
            kind: 'clarify',
            text: e.text ?? '',
            options: e.options ?? [],
          });
          break;
        case 'answer':
          pushMessage({ id: ++state.msgSeq, kind: 'assistant', text: e.text ?? '', sources: e.sources ?? [], feedback: null });
          break;
        case 'insufficient':
          pushMessage({ id: ++state.msgSeq, kind: 'insufficient', text: e.text ?? '' });
          break;
      }
    }
    updateWorkflow(result.workflow);
    updateVariables(result.variables);
    renderMessages();
  }

  /* ---------------- 发送 / 确认 ---------------- */

  function send(text: string): void {
    const query = text.trim();
    if (!query || state.busy) return;

    const inputEl = $('sdkai-chat-query') as HTMLTextAreaElement | null;
    if (inputEl) inputEl.value = '';
    state.busy = true;
    syncSendBtn();

    pushMessage({ id: ++state.msgSeq, kind: 'user', text: query });
    state.lastQuery = query;
    const result = runUserTurn(query, {
      sdkVersion: state.sdkVersion,
      platform: state.platform,
      confirmedPlatform: state.confirmedPlatform,
      lastQuery: state.lastQuery,
    });
    applyTurn(result);
    state.busy = false;
    syncSendBtn();
  }

  function handleConfirm(platform: Platform): void {
    if (state.busy) return;
    state.busy = true;
    syncSendBtn();
    pushMessage({ id: ++state.msgSeq, kind: 'user', text: `确认开发平台：${platform}` });
    state.platform = platform;
    state.confirmedPlatform = platform;
    const result = confirmPlatform(platform, {
      sdkVersion: state.sdkVersion,
      platform,
      confirmedPlatform: platform,
      lastQuery: state.lastQuery,
    });
    applyTurn(result);
    state.busy = false;
    syncSendBtn();
  }

  /** 发送按钮禁用状态与「输入是否为空 / 是否正在处理」保持一致 */
  function syncSendBtn(): void {
    const btn = $('sdkai-chat-send') as HTMLButtonElement | null;
    const inputEl = $('sdkai-chat-query') as HTMLTextAreaElement | null;
    if (btn) btn.disabled = !inputEl || !inputEl.value.trim() || state.busy;
  }

  /* ---------------- 事件绑定 ---------------- */

  const versionSel = $('sdkai-version') as HTMLSelectElement | null;
  const platformSel = $('sdkai-platform') as HTMLSelectElement | null;
  const inputEl = $('sdkai-chat-query') as HTMLTextAreaElement | null;
  const sendBtn = $('sdkai-chat-send') as HTMLButtonElement | null;
  const newBtn = $('sdkai-chat-new') as HTMLButtonElement | null;
  const clearBtn = $('sdkai-chat-clear') as HTMLButtonElement | null;

  versionSel?.addEventListener('change', () => {
    state.sdkVersion = (versionSel.value || null) as SdkVersion | null;
    state.lastQuery = '';
    addSystem(`已切换 SDK 版本：${state.sdkVersion ?? '未选择'}。后续检索仅使用该版本的演示资料。`);
    renderMessages();
  });

  platformSel?.addEventListener('change', () => {
    state.platform = (platformSel.value || null) as Platform | null;
    state.lastQuery = '';
    addSystem(`已切换开发平台：${state.platform ?? '未选择'}。`);
    renderMessages();
  });

  if (sendBtn && inputEl) {
    sendBtn.addEventListener('click', () => send(inputEl.value));
    inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send(inputEl.value);
      }
    });
    inputEl.addEventListener('input', () => {
      sendBtn.disabled = !inputEl.value.trim() || state.busy;
    });
  }

  newBtn?.addEventListener('click', () => {
    state.messages = [];
    state.msgSeq = 0;
    state.sdkVersion = 'TopOn';
    state.platform = 'Flutter';
    state.confirmedPlatform = null;
    state.lastQuery = '';
    if (versionSel) versionSel.value = 'TopOn';
    if (platformSel) platformSel.value = 'Flutter';
    addSystem(
      '已新建会话。默认示例：TopOn + Flutter，问题「TopOn Android 如何接入开屏广告？」已为你准备好，点击「发送」即可观察平台冲突处理逻辑。',
    );
    resetWorkflow();
    renderMessages();
  });

  clearBtn?.addEventListener('click', () => {
    state.messages = [];
    state.msgSeq = 0;
    addSystem('已清空对话，可继续提问。');
    renderMessages();
  });

  document.querySelectorAll('[data-quick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = (btn as HTMLElement).dataset.quick ?? '';
      if (inputEl) inputEl.value = text;
      if (sendBtn) sendBtn.disabled = false;
      send(text);
    });
  });

  messagesEl.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const confirmBtn = target.closest<HTMLElement>('[data-confirm]');
    if (confirmBtn) {
      handleConfirm(confirmBtn.dataset.confirm as Platform);
      return;
    }
    const fbBtn = target.closest<HTMLElement>('[data-feedback]');
    if (fbBtn) {
      const msgId = Number(fbBtn.dataset.msg);
      const kind = fbBtn.dataset.feedback as 'up' | 'down';
      const msg = state.messages.find((m) => m.id === msgId && m.kind === 'assistant');
      if (msg && msg.kind === 'assistant') {
        msg.feedback = kind;
        renderMessages();
      }
    }
  });

  /* ---------------- 工作流节点详情 ---------------- */

  document.querySelectorAll('.sdkai-wf-node').forEach((node) => {
    node.addEventListener('click', () => {
      const id = (node as HTMLElement).dataset.node ?? '';
      const def = WORKFLOW_NODES.find((n) => n.id === id);
      const detail = $('sdkai-wf-detail');
      if (!detail || !def) return;
      detail.innerHTML = `
        <div class="sdkai-wf-detail-head"><span class="sdkai-wf-detail-title">${esc(def.label)}</span></div>
        <dl class="sdkai-wf-detail-grid">
          <dt>节点作用</dt><dd>${esc(def.role)}</dd>
          <dt>输入变量</dt><dd>${def.inputs.map(esc).join('、')}</dd>
          <dt>输出变量</dt><dd>${def.outputs.map(esc).join('、')}</dd>
          <dt>执行条件</dt><dd>${esc(def.condition)}</dd>
          <dt>下一步节点</dt><dd>${esc(def.next)}</dd>
        </dl>
      `;
    });
  });

  $('sdkai-wf-reset')?.addEventListener('click', resetWorkflow);

  /* ---------------- 初始状态 ---------------- */

  addSystem(
    '你好，我是 SDK 技术支持助手（演示）。当前会话已按示例填充：SDK 版本 TopOn、开发平台 Flutter、问题「TopOn Android 如何接入开屏广告？」。点击「发送」即可观察平台冲突澄清逻辑。',
  );
  resetWorkflow();
  renderMessages();
  syncSendBtn();
}
