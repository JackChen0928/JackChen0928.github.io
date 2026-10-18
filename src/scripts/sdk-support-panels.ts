/**
 * SDK 智能技术支持助手 — 知识库浏览器与评测面板交互（前端模拟）
 *
 * 知识库：按 SDK 版本 / 开发平台 / 文档类型 / 关键词筛选演示资料，支持相关文档跳转。
 * 评测：自动执行本地测试用例，按模拟规则计算指标并渲染结果。
 */

import {
  DEMO_KNOWLEDGE,
  type KnowledgeDoc,
} from '../data/sdk-support-demo';
import { runAllCases, type CaseResult } from '../lib/sdk-support-evaluation';

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function esc(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

/* ==========================================================
   知识库浏览器
   ========================================================== */

export function initSdkKnowledge(): void {
  const listEl = $('sdk-kb-list');
  if (!listEl) return;

  const versionSel = $('sdk-kb-version') as HTMLSelectElement | null;
  const platformSel = $('sdk-kb-platform') as HTMLSelectElement | null;
  const typeSel = $('sdk-kb-type') as HTMLSelectElement | null;
  const searchEl = $('sdk-kb-search') as HTMLInputElement | null;
  const countEl = $('sdk-kb-count');

  const state = { version: '', platform: '', type: '', keyword: '' };

  function docById(id: string): KnowledgeDoc | undefined {
    return DEMO_KNOWLEDGE.find((d) => d.id === id);
  }

  function render(): void {
    const filtered = DEMO_KNOWLEDGE.filter((d) => {
      if (state.version && d.sdkVersion !== state.version) return false;
      if (state.platform && d.platform !== state.platform) return false;
      if (state.type && d.documentType !== state.type) return false;
      if (state.keyword) {
        const kw = state.keyword.toLowerCase();
        const hay = `${d.title} ${d.content} ${d.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });

    if (countEl) {
      countEl.textContent = `共 ${filtered.length} 条 / ${DEMO_KNOWLEDGE.length} 条`;
    }

    if (filtered.length === 0) {
      listEl.innerHTML =
        '<div class="sdkai-empty">没有匹配的演示资料。可尝试清空筛选条件或更换关键词。</div>';
      return;
    }

    listEl.innerHTML = filtered
      .map((d) => {
        const related = (d.relatedIds ?? [])
          .map((rid) => docById(rid))
          .filter((x): x is KnowledgeDoc => Boolean(x))
          .map(
            (rd) =>
              `<button type="button" class="sdkai-kb-related" data-kb-related="${esc(rd.id)}">${esc(rd.title)}</button>`,
          )
          .join('');
        return `
          <article class="sdkai-kb-card" data-id="${esc(d.id)}">
            <div class="sdkai-kb-card-head">
              <h4>${esc(d.title)}</h4>
              <span class="sdkai-demo-tag">演示资料</span>
            </div>
            <div class="sdkai-kb-meta">
              <span>${esc(d.sdkVersion)}</span><span>${esc(d.platform)}</span><span>${esc(d.documentType)}</span>
            </div>
            <p class="sdkai-kb-content">${esc(d.content)}</p>
            <div class="sdkai-kb-tags">
              ${d.tags.map((t) => `<span class="sdkai-tag">${esc(t)}</span>`).join('')}
            </div>
            <p class="sdkai-kb-source">${esc(d.sourceLabel)} · ID ${esc(d.id)}</p>
            ${related ? `<div class="sdkai-kb-related-box"><span class="sdkai-kb-related-title">相关文档</span>${related}</div>` : ''}
          </article>`;
      })
      .join('');
  }

  versionSel?.addEventListener('change', () => {
    state.version = versionSel.value;
    render();
  });
  platformSel?.addEventListener('change', () => {
    state.platform = platformSel.value;
    render();
  });
  typeSel?.addEventListener('change', () => {
    state.type = typeSel.value;
    render();
  });
  searchEl?.addEventListener('input', () => {
    state.keyword = searchEl.value.trim();
    render();
  });

  // 点击相关文档：以该文档标题作为关键词，便于观察文档关联
  listEl.addEventListener('click', (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-kb-related]');
    if (!btn) return;
    const doc = docById(btn.dataset.kbRelated ?? '');
    if (!doc) return;
    if (searchEl) searchEl.value = doc.title;
    state.keyword = doc.title;
    state.version = '';
    state.platform = '';
    state.type = '';
    if (versionSel) versionSel.value = '';
    if (platformSel) platformSel.value = '';
    if (typeSel) typeSel.value = '';
    render();
    listEl.querySelector(`[data-id="${doc.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  render();
}

/* ==========================================================
   评测面板
   ========================================================== */

const SUGGESTIONS: Record<string, string> = {
  T01: '可为检索增加关键词相关度排序，避免同版本同平台下的无关文档混入。',
  T02: '—',
  T03: '—',
  T04: '—',
  T05: '—',
  T06: '—',
  T07: '—',
  T08: '—',
  T09:
    '扩展平台关键词规则（如「平板」「TV」「鸿蒙系统」等），并为无法识别的表述增加平台澄清兜底；新增对应测试用例验证。',
};

export function initSdkEvaluation(): void {
  const bodyEl = $('sdk-eval-body');
  if (!bodyEl) return;

  const { results, summary } = runAllCases();

  bodyEl.innerHTML = results
    .map((r: CaseResult) => {
      const statusClass =
        r.status === '通过' ? 'sdkai-status--pass' : r.status === '未通过' ? 'sdkai-status--fail' : 'sdkai-status--pending';
      return `
        <tr>
          <td class="sdkai-eval-id">${esc(r.id)}</td>
          <td>${esc(r.name)}</td>
          <td class="sdkai-eval-input">${esc(r.input)}</td>
          <td>${esc(r.expected)}</td>
          <td>${esc(r.actual)}</td>
          <td><span class="sdkai-status ${statusClass}">${esc(r.status)}</span></td>
          <td>${r.status === '未通过' ? esc(r.note) : '—'}</td>
          <td class="sdkai-eval-note">${esc(SUGGESTIONS[r.id] ?? '—')}</td>
        </tr>`;
    })
    .join('');

  const metricsEl = $('sdk-eval-metrics');
  if (metricsEl) {
    const items: Array<[string, string]> = [
      ['平台冲突识别通过率', summary.conflictRate],
      ['版本与平台过滤正确率', summary.filterRate],
      ['资料不足拦截率', summary.insufficientRate],
      ['测试用例通过率', summary.overallRate],
    ];
    metricsEl.innerHTML = items
      .map(
        ([label, value]) =>
          `<div class="sdkai-metric"><div class="sdkai-metric-value">${esc(value)}</div><div class="sdkai-metric-label">${esc(label)}</div></div>`,
      )
      .join('');
  }

  const summaryEl = $('sdk-eval-summary');
  if (summaryEl) {
    summaryEl.textContent = `用例总数 ${summary.total} · 通过 ${summary.passed} · 未通过 ${summary.failed} · 待验证 ${summary.pending}`;
  }
}
