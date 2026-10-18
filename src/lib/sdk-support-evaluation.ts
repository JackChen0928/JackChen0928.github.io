/**
 * SDK 智能技术支持助手 — 评测模块（前端模拟规则自动执行）
 *
 * 基于演示引擎的确定性规则，逐条执行测试用例并计算统计指标。
 * 结果仅反映前端模拟规则的表现，不代表真实大模型准确率。
 */

import { TEST_CASES, type KnowledgeDoc, type TestCase } from '../data/sdk-support-demo';
import {
  confirmPlatform,
  detectPlatformInQuery,
  rememberQuery,
  runUserTurn,
  type ChatEvent,
  type ChatState,
} from './sdk-support-engine';

export type TestStatus = '通过' | '未通过' | '待验证';

export interface CaseResult {
  id: string;
  name: string;
  input: string;
  expected: string;
  actual: string;
  status: TestStatus;
  note: string;
}

export interface EvaluationSummary {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  /** 平台冲突识别通过率 */
  conflictRate: string;
  /** 版本与平台过滤正确率 */
  filterRate: string;
  /** 资料不足拦截率 */
  insufficientRate: string;
  /** 测试用例通过率 */
  overallRate: string;
}

interface SimOutcome {
  events: ChatEvent[];
  conflict: boolean;
  answerSources: KnowledgeDoc[];
  clarifiedThenAnswered: boolean;
  answeredAfterConfirm: boolean;
}

function simulate(test: TestCase): SimOutcome {
  const state: ChatState = {
    sdkVersion: test.sdkVersion || null,
    platform: test.platform || null,
    confirmedPlatform: null,
  };
  rememberQuery(state, test.query);

  const first = runUserTurn(test.query, state);
  const events: ChatEvent[] = [...first.events];
  const conflict = first.variables.has_conflict.startsWith('是');
  const answerSources: KnowledgeDoc[] = [];
  let clarifiedThenAnswered = false;
  let answeredAfterConfirm = false;

  // 冲突 / 澄清分支：模拟用户点击确认（按问题中检测到的平台）
  if (first.workflow.branch === 'conflict' || first.workflow.branch === 'clarify') {
    const detected = detectPlatformInQuery(test.query);
    if (detected) {
      const second = confirmPlatform(detected, state);
      clarifiedThenAnswered = second.events.some((e) => e.type === 'answer');
      if (clarifiedThenAnswered) {
        answeredAfterConfirm = true;
        for (const e of second.events) {
          events.push(e);
          if (e.type === 'answer') answerSources.push(...e.sources);
        }
      } else {
        events.push(...second.events);
      }
    }
  }

  for (const e of first.events) {
    if (e.type === 'answer') answerSources.push(...e.sources);
  }

  return { events, conflict, answerSources, clarifiedThenAnswered, answeredAfterConfirm };
}

function describeActual(outcome: SimOutcome): string {
  const hasClarify = outcome.events.some((e) => e.type === 'clarify');
  const hasAnswer = outcome.events.some((e) => e.type === 'answer');
  const hasInsufficient = outcome.events.some((e) => e.type === 'insufficient');

  if (hasClarify && outcome.conflict && hasAnswer) {
    return '拦截回答，进入平台澄清（确认后继续检索）';
  }
  if (hasClarify && outcome.conflict) {
    return '拦截回答，进入平台澄清';
  }
  if (hasClarify) {
    return '请求补充开发平台';
  }
  if (hasAnswer && outcome.answerSources.length > 0) {
    return `返回 ${outcome.answerSources.length} 份演示资料`;
  }
  if (hasInsufficient) {
    return '提示资料不足，未返回答案';
  }
  return '未产生可识别的答复事件';
}

function evaluate(test: TestCase, outcome: SimOutcome): { status: TestStatus; actual: string; note: string } {
  const actual = describeActual(outcome);
  const hasAnswer = outcome.events.some((e) => e.type === 'answer');
  const hasClarify = outcome.events.some((e) => e.type === 'clarify');
  const hasInsufficient = outcome.events.some((e) => e.type === 'insufficient');

  switch (test.id) {
    case 'T01':
      return {
        actual,
        status: hasAnswer && outcome.answerSources.some((d) => d.platform === 'Flutter') ? '通过' : '未通过',
        note: test.note,
      };
    case 'T02':
      return {
        actual,
        status: hasClarify && outcome.conflict ? '通过' : '未通过',
        note: test.note,
      };
    case 'T03':
      return {
        actual,
        status: hasClarify && !outcome.conflict ? '通过' : '未通过',
        note: test.note,
      };
    case 'T04':
      return {
        actual,
        status: hasInsufficient ? '通过' : '未通过',
        note: test.note,
      };
    case 'T05':
      return {
        actual,
        status:
          hasAnswer &&
          outcome.answerSources.every((d) => d.sdkVersion === 'TopOn' || d.sdkVersion === '通用')
            ? '通过'
            : '未通过',
        note: test.note,
      };
    case 'T06':
      return {
        actual: outcome.answeredAfterConfirm
          ? '拦截回答，进入平台澄清 → 确认平台后继续检索并返回对应资料'
          : '未完成澄清后的检索',
        status:
          hasClarify &&
          outcome.conflict &&
          outcome.answeredAfterConfirm &&
          outcome.answerSources.every((d) => d.platform === 'Android' || d.platform === '通用')
            ? '通过'
            : '未通过',
        note: test.note,
      };
    case 'T07':
      return {
        actual,
        status: hasAnswer && outcome.answerSources.some((d) => d.platform === 'Android') ? '通过' : '未通过',
        note: test.note,
      };
    case 'T08':
      return {
        actual,
        status: hasInsufficient ? '通过' : '未通过',
        note: test.note,
      };
    case 'T09':
      return {
        actual,
        status: hasAnswer ? '通过' : '未通过',
        note: `${test.note} 当前平台检测为关键词规则，无法识别「平板」等非标准表述，体现了规则引擎的边界。`,
      };
    default:
      return { actual, status: '待验证', note: '未覆盖的用例，需补充模拟规则。' };
  }
}

const CONFLICT_IDS = ['T02', 'T06'];
const FILTER_IDS = ['T01', 'T05', 'T07'];
const INSUFFICIENT_IDS = ['T04', 'T08'];

function pct(pass: number, total: number): string {
  if (total === 0) return '—';
  return `${Math.round((pass / total) * 100)}%`;
}

export function runAllCases(): { results: CaseResult[]; summary: EvaluationSummary } {
  const results: CaseResult[] = TEST_CASES.map((test) => {
    const outcome = simulate(test);
    const { status, actual, note } = evaluate(test, outcome);
    return {
      id: test.id,
      name: test.name,
      input: `${test.sdkVersion || '未选择'} · ${test.platform || '未选择'} · ${test.query}`,
      expected: test.expected,
      actual,
      status,
      note,
    };
  });

  const total = results.length;
  const passed = results.filter((r) => r.status === '通过').length;
  const failed = results.filter((r) => r.status === '未通过').length;
  const pending = results.filter((r) => r.status === '待验证').length;

  const conflictPass = results.filter((r) => CONFLICT_IDS.includes(r.id) && r.status === '通过').length;
  const filterPass = results.filter((r) => FILTER_IDS.includes(r.id) && r.status === '通过').length;
  const insufficientPass = results.filter((r) => INSUFFICIENT_IDS.includes(r.id) && r.status === '通过').length;

  return {
    results,
    summary: {
      total,
      passed,
      failed,
      pending,
      conflictRate: pct(conflictPass, CONFLICT_IDS.length),
      filterRate: pct(filterPass, FILTER_IDS.length),
      insufficientRate: pct(insufficientPass, INSUFFICIENT_IDS.length),
      overallRate: pct(passed, total),
    },
  };
}
