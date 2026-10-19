// ============================================================
// 作品集交互演示台逻辑（基于 Hermes 的 SDK 包体增量检测工具）
// 自动流程演示器：点击「开始演示」后自动播放整条流程，每步停留约 1.5 秒，可随时重置。
// 纯前端模拟：不执行真实构建，不调用真实 Hermes 服务。
// ============================================================
import { SZC_STEPS, SZC_DEMO_INPUT } from '../data/sdk-size-demo';

export function initSizeDemo(): void {
  const inputEl = document.getElementById('szc-demo-input') as HTMLTextAreaElement | null;
  const stepsEl = document.getElementById('szc-demo-steps');
  const nextEl = document.getElementById('szc-demo-next') as HTMLButtonElement | null;
  const resetEl = document.getElementById('szc-demo-reset') as HTMLButtonElement | null;
  const statusEl = document.getElementById('szc-demo-status');
  // DOM 契约不完整时直接返回，避免运行时错误
  if (!inputEl || !stepsEl || !nextEl || !resetEl || !statusEl) return;

  // current：下一个待执行的步骤下标（0 起步，等于总步数表示流程结束）
  let current = 0;
  // 自动演示的定时器句柄（非 null 表示正在播放）
  let timer: number | null = null;
  // 相邻两步之间的停留时长（毫秒）
  const STEP_DELAY = 1500;

  // 填充演示台预设的任务输入（示意内容，非真实检测需求）
  inputEl.value = SZC_DEMO_INPUT;

  const render = () => {
    stepsEl.innerHTML = SZC_STEPS.map((s, i) => {
      const state = i < current ? 'done' : i === current ? 'current' : 'idle';
      const statusText = i < current ? s.statusDone : i === current ? s.statusIdle : '';
      return (
        '<li class="szc-step szc-step--' + state + '" data-state="' + state + '">' +
        '<span class="szc-step-num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="szc-step-main">' +
        '<span class="szc-step-label">' + s.label + '</span>' +
        '<span class="szc-step-desc">' + s.desc + '</span>' +
        '</span>' +
        (statusText ? '<span class="szc-step-status">' + statusText + '</span>' : '') +
        '</li>'
      );
    }).join('');

    const playing = timer !== null;
    if (current === 0) {
      statusEl.textContent = '准备就绪：点击「开始演示」自动播放整条流程（模拟），每步停留约 1.5 秒。';
      statusEl.setAttribute('data-tone', 'normal');
    } else if (current < SZC_STEPS.length) {
      statusEl.textContent = '正在演示：' + SZC_STEPS[current].label + '（模拟）。';
      statusEl.setAttribute('data-tone', 'run');
    } else {
      statusEl.textContent = '流程演示完毕：所有步骤已依次展示（模拟）。';
      statusEl.setAttribute('data-tone', 'ok');
    }

    nextEl.disabled = playing || current >= SZC_STEPS.length;
    nextEl.textContent = playing
      ? '演示中…'
      : current >= SZC_STEPS.length
        ? '演示完成'
        : '开始演示';
  };

  const stop = () => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  const advance = () => {
    current += 1;
    if (current < SZC_STEPS.length) {
      timer = window.setTimeout(advance, STEP_DELAY);
    } else {
      timer = null;
    }
    render();
  };

  nextEl.addEventListener('click', () => {
    // 演示进行中或已结束时忽略
    if (timer !== null || current >= SZC_STEPS.length) return;
    advance();
  });

  resetEl.addEventListener('click', () => {
    stop();
    current = 0;
    render();
  });

  // 初始渲染
  render();
}
