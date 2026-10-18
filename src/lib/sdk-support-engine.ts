/**
 * SDK 智能技术支持助手 — 模拟引擎（纯前端逻辑）
 *
 * 实现版本路由、平台检测、冲突判断、检索过滤与回答匹配。
 * 全部为确定性规则，不使用随机回答，不伪装真实 LLM 推理。
 *
 * 注意：这里的「平台检测」是基于关键词的确定性规则，
 * 不代表真实 LLM 语义理解。
 */

import {
  DEMO_KNOWLEDGE,
  PLATFORMS,
  RETRIEVAL_STEPS,
  type KnowledgeDoc,
  type Platform,
  type SdkVersion,
} from '../data/sdk-support-demo';

export interface ChatState {
  sdkVersion: SdkVersion | null;
  platform: Platform | null;
  confirmedPlatform: Platform | null;
  /** 最近一次用户查询文本，供确认平台后继续检索 */
  lastQuery?: string;
}

export interface ChatClarifyOption {
  label: string;
  value: Platform;
}

export type ChatEvent =
  | { type: 'steps'; steps: string[] }
  | { type: 'clarify'; text: string; options: ChatClarifyOption[] }
  | { type: 'answer'; text: string; sources: KnowledgeDoc[] }
  | { type: 'insufficient'; text: string };

export interface WorkflowVariables {
  query: string;
  sdk_version: string;
  platform: string;
  detected_platform: string;
  has_conflict: string;
  retrieval_query: string;
  matched_documents: string;
  evidence_status: string;
  answer: string;
}

export interface TurnResult {
  events: ChatEvent[];
  variables: WorkflowVariables;
  workflow: { path: string[]; branch: 'conflict' | 'clarify' | 'ok' | 'insufficient' };
}

/* ---------------- 平台 / 版本检测（集中维护的关键词规则） ---------------- */

const PLATFORM_RULES: Array<[RegExp, Platform]> = [
  [/android|安卓/, 'Android'],
  [/ios/, 'iOS'],
  [/unity/, 'Unity'],
  [/flutter/, 'Flutter'],
  [/cocos/, 'Cocos'],
  [/harmony|鸿蒙/, 'Harmony'],
];

const VERSION_RULES: Array<[RegExp, SdkVersion]> = [
  [/topon/, 'TopOn'],
  [/taku/, 'Taku'],
  [/酷盈|kuying/, '酷盈'],
];

/** 从问题文本中检测开发平台（关键词规则，命中多个取第一个） */
export function detectPlatformInQuery(query: string): Platform | null {
  const q = query.toLowerCase();
  for (const [re, platform] of PLATFORM_RULES) {
    re.lastIndex = 0;
    if (re.test(q)) return platform;
  }
  return null;
}

/** 从问题文本中检测 SDK 版本（仅用于提示，不用于切换检索版本） */
export function detectVersionInQuery(query: string): SdkVersion | null {
  const q = query.toLowerCase();
  for (const [re, version] of VERSION_RULES) {
    re.lastIndex = 0;
    if (re.test(q)) return version;
  }
  return null;
}

/* ---------------- 检索过滤 ---------------- */

/**
 * 判断演示记录是否与问题相关：
 * 版本 / 平台专属记录直接相关；
 * 「通用」记录需命中问题中的关键词（tags / 标题词），避免无关 FAQ 被误返回。
 */
function queryHits(query: string, doc: KnowledgeDoc): boolean {
  const q = query.toLowerCase();
  const words = doc.tags.concat(doc.title.split(/\s+/)).map((w) => w.toLowerCase());
  return words.some((w) => w.length >= 2 && q.includes(w));
}

/**
 * 按版本与平台过滤演示知识库，并做关键词相关性判断。
 * 未匹配到足够资料时返回空数组（触发资料不足拦截）。
 */
export function searchDocs(
  query: string,
  sdkVersion: SdkVersion | null,
  platform: Platform | null,
): KnowledgeDoc[] {
  return DEMO_KNOWLEDGE.filter((doc) => {
    const vOk = !sdkVersion || doc.sdkVersion === sdkVersion || doc.sdkVersion === '通用';
    const pOk = !platform || doc.platform === platform || doc.platform === '通用';
    if (!vOk || !pOk) return false;
    if (doc.sdkVersion === '通用' || doc.platform === '通用') {
      return queryHits(query, doc);
    }
    return true;
  });
}

/** 组合检索条件（用于工作流变量展示） */
export function buildRetrievalQuery(
  query: string,
  sdkVersion: SdkVersion | null,
  platform: Platform | null,
): string {
  return `版本=${sdkVersion ?? '未指定'} · 平台=${platform ?? '未指定'} · 问题=${query}`;
}

/* ---------------- 回答生成 ---------------- */

const EVIDENCE_NOTE = '以上为演示知识库中的示例内容，不代表官方 SDK 文档；具体参数请以官方文档为准。';

function buildAnswerText(matched: KnowledgeDoc[]): string {
  const titles = matched.map((d) => d.title).join('、');
  const steps = matched
    .map((d, i) => `${i + 1}. ${d.content.split('。')[0]}。`)
    .join('\n');
  return (
    `根据演示知识库中检索到的 ${matched.length} 份相关资料（${titles}），为你整理如下（示例内容）：\n\n` +
    `${steps}\n\n` +
    `注意事项：${EVIDENCE_NOTE}`
  );
}

/* ---------------- 消息常量 ---------------- */

export const MESSAGES = {
  conflict: (selected: string, detected: string) =>
    `你当前选择的开发平台是 ${selected}，但问题中提到了 ${detected}。为了避免提供错误平台的接入说明，请确认你想咨询哪一种平台。`,
  askPlatform: (detected: string | null) =>
    detected
      ? `当前尚未选择开发平台，检测到问题中提到了 ${detected}。为避免检索到不相关平台的文档，请确认你要咨询的开发平台。`
      : '当前尚未选择开发平台。为避免检索到不相关平台的文档，请确认你要咨询的开发平台。',
  insufficient:
    '当前演示知识库没有找到足够的参考资料，暂时无法可靠回答这个问题。你可以调整 SDK 版本、开发平台，或尝试更具体地描述问题。',
  insufficientVersion: (version: string, platform: string) =>
    `当前演示知识库暂未配置「${version} · ${platform}」的相关资料。你可以调整 SDK 版本或开发平台，或尝试更具体地描述问题。`,
};

function makeVariables(
  query: string,
  state: ChatState,
  detected: Platform | null,
  hasConflict: boolean,
  matched: KnowledgeDoc[] | null,
  evidenceStatus: string,
  answerStatus: string,
): WorkflowVariables {
  return {
    query,
    sdk_version: state.sdkVersion ?? '未指定',
    platform: state.platform ?? '未指定',
    detected_platform: detected ?? '未检测到',
    has_conflict: hasConflict ? '是（存在冲突）' : '否',
    retrieval_query: buildRetrievalQuery(query, state.sdkVersion, state.platform),
    matched_documents: matched === null ? '—' : `${matched.length} 份`,
    evidence_status: evidenceStatus,
    answer: answerStatus,
  };
}

/* ---------------- 主流程 ---------------- */

const BASE_PATH = ['user-input', 'version-router', 'platform-detect', 'conflict-check'];

/**
 * 处理一轮用户输入。
 * 返回需要追加的事件序列与工作流状态。
 */
export function runUserTurn(input: string, state: ChatState): TurnResult {
  const query = input.trim();
  const detected = detectPlatformInQuery(query);
  const selected = state.platform;

  // 1) 冲突判断
  const hasConflict = !!detected && !!selected && detected !== selected;

  if (hasConflict) {
    const options: ChatClarifyOption[] = [
      { label: `按问题中的 ${detected} 回答`, value: detected },
      { label: `按当前选择的 ${selected} 回答`, value: selected },
    ];
    return {
      events: [
        {
          type: 'clarify',
          text: MESSAGES.conflict(selected, detected),
          options,
        },
      ],
      variables: makeVariables(query, state, detected, true, null, '等待澄清', '待澄清'),
      workflow: { path: [...BASE_PATH, 'platform-clarify'], branch: 'conflict' },
    };
  }

  // 2) 平台上下文缺失 → 先澄清
  if (!selected) {
    const options: ChatClarifyOption[] = PLATFORMS.map((p) => ({
      label: p,
      value: p,
    }));
    return {
      events: [{ type: 'clarify', text: MESSAGES.askPlatform(detected), options }],
      variables: makeVariables(query, state, detected, false, null, '等待澄清', '待澄清'),
      workflow: { path: [...BASE_PATH, 'platform-clarify'], branch: 'clarify' },
    };
  }

  // 3) 平台明确（含检测一致或未检测到）→ 检索
  return runRetrieval(query, state);
}

/**
 * 在平台确定后执行检索流程（澄清确认后复用）。
 */
export function runRetrieval(query: string, state: ChatState): TurnResult {
  const detected = detectPlatformInQuery(query);
  const version = state.sdkVersion;
  const platform = state.platform;
  const mentionedVersion = detectVersionInQuery(query);
  const matched = searchDocs(query, version, platform);

  const steps: ChatEvent = { type: 'steps', steps: RETRIEVAL_STEPS };

  if (matched.length > 0) {
    const answer: ChatEvent = {
      type: 'answer',
      text: buildAnswerText(matched),
      sources: matched,
    };
    return {
      events: [steps, answer],
      variables: makeVariables(query, state, detected, false, matched, '有依据', '正常回答'),
      workflow: {
        path: [
          ...BASE_PATH,
          'retrieval-builder',
          'knowledge-retrieval',
          'evidence-check',
          'answer-generation',
          'final-answer',
        ],
        branch: 'ok',
      },
    };
  }

  // 无匹配资料
  const text =
    mentionedVersion && version && mentionedVersion !== version
      ? MESSAGES.insufficientVersion(version, platform ?? '未指定')
      : MESSAGES.insufficient;
  return {
    events: [steps, { type: 'insufficient', text }],
    variables: makeVariables(query, state, detected, false, matched, '依据不足', '资料不足'),
    workflow: {
      path: [
        ...BASE_PATH,
        'retrieval-builder',
        'knowledge-retrieval',
        'evidence-check',
        'insufficient',
      ],
      branch: 'insufficient',
    },
  };
}

/**
 * 用户确认平台后：更新平台上下文并进入检索。
 */
export function confirmPlatform(platform: Platform, state: ChatState): TurnResult {
  state.platform = platform;
  state.confirmedPlatform = platform;
  return runRetrieval(state.lastQuery ?? '', state);
}

/** 记录最后一次查询文本，供确认平台后检索使用（由 UI 调用） */
export function rememberQuery(state: ChatState, query: string) {
  state.lastQuery = query;
}
