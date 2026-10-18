/**
 * SDK 智能技术支持助手 — 演示数据
 *
 * 本文件仅包含作品集交互原型所需的演示数据：
 * - 演示知识库（标注「演示资料」，内容为通用示例，非官方 SDK 文档）
 * - 快捷问题、工作流节点定义、测试用例
 *
 * 不包含任何真实业务指标、正式上线数据或官方技术文档内容。
 */

export type SdkVersion = 'TopOn' | 'Taku' | '酷盈';
export type Platform = 'Android' | 'iOS' | 'Unity' | 'Flutter' | 'Cocos' | 'Harmony';
export type DocType = 'SDK 技术文档' | '常见问题（FAQ）';

export interface KnowledgeDoc {
  id: string;
  title: string;
  sdkVersion: SdkVersion | '通用';
  platform: Platform | '通用';
  documentType: DocType;
  tags: string[];
  /** 演示内容摘要（示例内容，具体 API / 参数以官方文档为准） */
  content: string;
  sourceLabel: string;
  isDemo: true;
  relatedIds?: string[];
}

export const SDK_VERSIONS: SdkVersion[] = ['TopOn', 'Taku', '酷盈'];
export const PLATFORMS: Platform[] = ['Android', 'iOS', 'Unity', 'Flutter', 'Cocos', 'Harmony'];
export const DOC_TYPES: DocType[] = ['SDK 技术文档', '常见问题（FAQ）'];

/**
 * 演示知识库
 *
 * 内容为通用示例占位，用于演示版本路由、平台过滤、检索与来源展示逻辑。
 * 未编造任何真实 SDK 的初始化参数、方法名、广告位配置或官方文档地址。
 */
export const DEMO_KNOWLEDGE: KnowledgeDoc[] = [
  {
    id: 'topon-flutter-001',
    title: 'TopOn Flutter 开屏广告接入说明',
    sdkVersion: 'TopOn',
    platform: 'Flutter',
    documentType: 'SDK 技术文档',
    tags: ['开屏广告', '接入'],
    content:
      '示例内容：在 Flutter 项目中完成 SDK 初始化后，通过聚合广告平台加载开屏广告。具体初始化参数、广告位 ID 与回调配置，请以官方发布的最新文档为准。本条仅用于演示「版本 + 平台」过滤与来源引用逻辑。',
    sourceLabel: '演示资料 · TopOn Flutter 文档',
    isDemo: true,
    relatedIds: ['faq-flutter-001', 'topon-flutter-002'],
  },
  {
    id: 'topon-flutter-002',
    title: 'TopOn Flutter 初始化配置说明',
    sdkVersion: 'TopOn',
    platform: 'Flutter',
    documentType: 'SDK 技术文档',
    tags: ['初始化', '配置'],
    content:
      '示例内容：初始化前需要确认应用标识与密钥配置正确，并在主入口调用初始化方法。本条内容为演示占位，不代表官方初始化流程。',
    sourceLabel: '演示资料 · TopOn Flutter 文档',
    isDemo: true,
    relatedIds: ['faq-flutter-001'],
  },
  {
    id: 'topon-android-001',
    title: 'TopOn Android 开屏广告接入说明',
    sdkVersion: 'TopOn',
    platform: 'Android',
    documentType: 'SDK 技术文档',
    tags: ['开屏广告', '接入'],
    content:
      '示例内容：在 Android 工程中完成 SDK 初始化后加载开屏广告。真实接入参数与广告位配置请参考官方文档，本条为演示占位内容。',
    sourceLabel: '演示资料 · TopOn Android 文档',
    isDemo: true,
    relatedIds: ['faq-android-001'],
  },
  {
    id: 'topon-android-002',
    title: 'TopOn Android 初始化失败排查',
    sdkVersion: 'TopOn',
    platform: 'Android',
    documentType: 'SDK 技术文档',
    tags: ['初始化', '失败', '排查'],
    content:
      '示例内容：初始化失败常见于配置缺失或网络异常，需要检查应用标识、密钥与依赖版本。本条为演示占位，非官方排查清单。',
    sourceLabel: '演示资料 · TopOn Android 文档',
    isDemo: true,
    relatedIds: ['faq-android-001'],
  },
  {
    id: 'topon-ios-001',
    title: 'TopOn iOS 初始化配置说明',
    sdkVersion: 'TopOn',
    platform: 'iOS',
    documentType: 'SDK 技术文档',
    tags: ['初始化', '配置'],
    content:
      '示例内容：iOS 端需要在启动流程中完成 SDK 初始化，并处理隐私相关配置。本条为演示占位内容，具体配置请参考官方文档。',
    sourceLabel: '演示资料 · TopOn iOS 文档',
    isDemo: true,
  },
  {
    id: 'taku-flutter-001',
    title: 'Taku Flutter 接入说明',
    sdkVersion: 'Taku',
    platform: 'Flutter',
    documentType: 'SDK 技术文档',
    tags: ['接入', '初始化'],
    content:
      '示例内容：Taku 在 Flutter 端的接入以官方文档为准，本条仅用于演示版本隔离：选择 Taku 版本时，只检索 Taku 演示资料，不混用 TopOn 内容。',
    sourceLabel: '演示资料 · Taku Flutter 文档',
    isDemo: true,
    relatedIds: ['taku-android-001'],
  },
  {
    id: 'taku-android-001',
    title: 'Taku Android 接入说明',
    sdkVersion: 'Taku',
    platform: 'Android',
    documentType: 'SDK 技术文档',
    tags: ['接入'],
    content:
      '示例内容：Taku Android 接入步骤为演示占位，实际参数请参考 Taku 官方文档。用于演示版本路由后的平台过滤逻辑。',
    sourceLabel: '演示资料 · Taku Android 文档',
    isDemo: true,
  },
  {
    id: 'kuying-flutter-001',
    title: '酷盈 Flutter 接入说明',
    sdkVersion: '酷盈',
    platform: 'Flutter',
    documentType: 'SDK 技术文档',
    tags: ['接入'],
    content:
      '示例内容：酷盈 Flutter 接入说明为演示占位内容，用于演示第三套 SDK 版本的独立检索空间。',
    sourceLabel: '演示资料 · 酷盈 Flutter 文档',
    isDemo: true,
  },
  {
    id: 'kuying-android-001',
    title: '酷盈 Android 接入说明',
    sdkVersion: '酷盈',
    platform: 'Android',
    documentType: 'SDK 技术文档',
    tags: ['接入'],
    content:
      '示例内容：酷盈 Android 接入说明为演示占位内容，具体参数请以官方文档为准。',
    sourceLabel: '演示资料 · 酷盈 Android 文档',
    isDemo: true,
  },
  {
    id: 'faq-flutter-001',
    title: 'FAQ：Flutter 初始化失败如何排查',
    sdkVersion: 'TopOn',
    platform: 'Flutter',
    documentType: '常见问题（FAQ）',
    tags: ['初始化', '失败', 'FAQ'],
    content:
      '示例内容：Flutter 初始化失败建议按「配置检查 → 日志分析 → 版本确认」的顺序排查。本条为演示 FAQ，非官方标准答案。',
    sourceLabel: '演示资料 · 清洗后的 FAQ（示例）',
    isDemo: true,
    relatedIds: ['topon-flutter-001', 'topon-flutter-002'],
  },
  {
    id: 'faq-android-001',
    title: 'FAQ：Android 初始化失败如何排查',
    sdkVersion: 'TopOn',
    platform: 'Android',
    documentType: '常见问题（FAQ）',
    tags: ['初始化', '失败', 'FAQ'],
    content:
      '示例内容：Android 初始化失败常见原因与排查顺序为演示占位内容，非官方清单。',
    sourceLabel: '演示资料 · 清洗后的 FAQ（示例）',
    isDemo: true,
    relatedIds: ['topon-android-001', 'topon-android-002'],
  },
  {
    id: 'faq-platform-001',
    title: 'FAQ：如何确认当前接入文档适用于哪个平台',
    sdkVersion: '通用',
    platform: '通用',
    documentType: '常见问题（FAQ）',
    tags: ['平台', '文档', 'FAQ'],
    content:
      '示例内容：确认文档适用平台，可以查看文档标题与目录中的平台标识，并核对所选 SDK 版本。本条为通用 FAQ，适用于所有演示版本。',
    sourceLabel: '演示资料 · 清洗后的 FAQ（示例）',
    isDemo: true,
  },
  {
    id: 'faq-no-solution-001',
    title: 'FAQ：没有找到对应解决方案怎么办',
    sdkVersion: '通用',
    platform: '通用',
    documentType: '常见问题（FAQ）',
    tags: ['解决方案', 'FAQ'],
    content:
      '示例内容：未找到对应方案时，建议补充更多上下文（SDK 版本、开发平台、报错信息），再重新检索。本条为通用 FAQ。',
    sourceLabel: '演示资料 · 清洗后的 FAQ（示例）',
    isDemo: true,
  },
];

/** 快捷问题（点击后填入输入框并发送） */
export const QUICK_QUESTIONS: string[] = [
  '如何接入开屏广告？',
  '初始化 SDK 需要哪些配置？',
  '接入时出现初始化失败怎么办？',
  '如何确认当前接入文档适用于哪个平台？',
  '我没有找到对应问题的解决方案。',
];

/** 模拟检索流程步骤（视觉过渡用，非真实推理） */
export const RETRIEVAL_STEPS = [
  '识别 SDK 版本与开发平台',
  '组合检索上下文',
  '从演示知识库查找相关资料',
  '基于演示资料生成回答',
];

/** 工作流节点定义（中文，用于 Workflow Explorer） */
export interface WorkflowNode {
  id: string;
  label: string;
  role: string;
  inputs: string[];
  outputs: string[];
  condition: string;
  next: string;
}

export const WORKFLOW_NODES: WorkflowNode[] = [
  {
    id: 'user-input',
    label: '用户输入问题',
    role: '接收用户的技术问题文本。',
    inputs: ['query'],
    outputs: ['query'],
    condition: '无',
    next: '识别 SDK 版本',
  },
  {
    id: 'version-router',
    label: '识别 SDK 版本',
    role: '确定本次回答使用的 SDK 版本，作为知识检索的第一道边界。',
    inputs: ['query', 'sdk_version'],
    outputs: ['sdk_version'],
    condition: '优先使用当前选定的版本，不跨版本混用资料',
    next: '识别开发平台',
  },
  {
    id: 'platform-detect',
    label: '识别开发平台',
    role: '通过关键词规则从问题文本中检测平台；同时读取当前选定的平台。',
    inputs: ['query', 'platform'],
    outputs: ['detected_platform'],
    condition: '关键词匹配（Android / iOS / Flutter 等）',
    next: '判断平台是否冲突',
  },
  {
    id: 'conflict-check',
    label: '判断平台是否冲突',
    role: '对比「选定平台」与「问题文本中检测到的平台」是否一致。',
    inputs: ['platform', 'detected_platform'],
    outputs: ['has_conflict'],
    condition: '检测到平台且与选定平台不同 → 冲突',
    next: '冲突 → 询问用户确认平台；一致 → 构建检索条件',
  },
  {
    id: 'platform-clarify',
    label: '询问用户确认平台',
    role: '不直接给出技术答案，先让用户确认真正要咨询的平台。',
    inputs: ['platform', 'detected_platform'],
    outputs: ['platform（更新后）'],
    condition: '存在平台冲突或平台上下文缺失',
    next: '已确认开发平台',
  },
  {
    id: 'retrieval-builder',
    label: '构建检索条件',
    role: '将版本与平台组合为检索条件，缩小知识范围。',
    inputs: ['sdk_version', 'platform', 'query'],
    outputs: ['retrieval_query'],
    condition: '版本 + 平台 + 问题关键词',
    next: '检索对应知识库',
  },
  {
    id: 'knowledge-retrieval',
    label: '检索对应知识库',
    role: '在演示知识库中按版本与平台过滤匹配资料。',
    inputs: ['retrieval_query'],
    outputs: ['matched_documents'],
    condition: '只检索当前版本与平台下的演示资料',
    next: '检查是否有足够依据',
  },
  {
    id: 'evidence-check',
    label: '检查是否有足够依据',
    role: '判断是否有可引用的资料支撑回答。',
    inputs: ['matched_documents'],
    outputs: ['evidence_status'],
    condition: '存在匹配资料 → 有依据；无匹配 → 依据不足',
    next: '有依据 → 生成技术答复；无依据 → 资料不足处理',
  },
  {
    id: 'answer-generation',
    label: '生成技术答复',
    role: '基于检索到的演示资料组织回答结构与来源引用。',
    inputs: ['matched_documents', 'evidence_status'],
    outputs: ['answer'],
    condition: '仅基于演示资料生成，无依据时不编造',
    next: '展示答案与参考资料',
  },
  {
    id: 'final-answer',
    label: '展示答案与参考资料',
    role: '展示结论、步骤、注意事项与来源引用卡片。',
    inputs: ['answer', 'matched_documents'],
    outputs: ['answer'],
    condition: '无',
    next: '结束',
  },
  {
    id: 'insufficient',
    label: '资料不足处理',
    role: '明确提示没有足够依据，并给出调整建议。',
    inputs: ['matched_documents'],
    outputs: ['evidence_status'],
    condition: '检索结果为空',
    next: '结束',
  },
];

export const WORKFLOW_FLOW = [
  'user-input',
  'version-router',
  'platform-detect',
  'conflict-check',
  'platform-clarify',
  'retrieval-builder',
  'knowledge-retrieval',
  'evidence-check',
  'answer-generation',
  'final-answer',
  'insufficient',
];

/** 测试用例（由评测面板按模拟规则自动执行） */
export interface TestCase {
  id: string;
  name: string;
  sdkVersion: SdkVersion | '';
  platform: Platform | '';
  query: string;
  expected: string;
  note: string;
}

export const TEST_CASES: TestCase[] = [
  {
    id: 'T01',
    name: '版本、平台与问题一致',
    sdkVersion: 'TopOn',
    platform: 'Flutter',
    query: 'Flutter 如何接入开屏广告？',
    expected: '进入检索流程并返回 Flutter 相关演示资料',
    note: '版本与平台一致，直接检索。',
  },
  {
    id: 'T02',
    name: '问题明确提及不同平台',
    sdkVersion: 'TopOn',
    platform: 'Flutter',
    query: 'TopOn Android 如何接入开屏广告？',
    expected: '拦截并澄清平台冲突',
    note: '选定 Flutter，问题提到 Android，应先澄清。',
  },
  {
    id: 'T03',
    name: '未选择平台',
    sdkVersion: 'TopOn',
    platform: '',
    query: '如何接入开屏广告？',
    expected: '请求补充开发平台',
    note: '平台上下文缺失，先澄清再检索。',
  },
  {
    id: 'T04',
    name: '资料不足',
    sdkVersion: 'Taku',
    platform: 'Cocos',
    query: 'Cocos 如何接入开屏广告？',
    expected: '提示资料不足，不返回其他平台答案',
    note: '演示知识库未配置该平台资料，应拦截。',
  },
  {
    id: 'T05',
    name: '跨版本问题',
    sdkVersion: 'TopOn',
    platform: 'Flutter',
    query: 'Taku 的初始化配置和 TopOn 一样吗？',
    expected: '不跨版本混用资料',
    note: '问题提到其他版本，仍应在选定版本内检索。',
  },
  {
    id: 'T06',
    name: '连续对话中的平台确认',
    sdkVersion: 'TopOn',
    platform: 'Flutter',
    query: 'Android 如何接入开屏广告？（先冲突，确认后继续）',
    expected: '确认平台后按新平台检索',
    note: '多轮上下文：澄清后应更新平台并继续检索。',
  },
  {
    id: 'T07',
    name: '知识库中存在相关文档',
    sdkVersion: 'TopOn',
    platform: 'Android',
    query: 'Android 初始化失败怎么办？',
    expected: '返回 Android 相关演示资料',
    note: '应命中 Android 初始化相关演示文档。',
  },
  {
    id: 'T08',
    name: '知识库中不存在相关文档',
    sdkVersion: '酷盈',
    platform: 'Harmony',
    query: 'Harmony 端如何配置隐私合规？',
    expected: '提示资料不足并给出调整建议',
    note: '无匹配资料时不得编造回答。',
  },
  {
    id: 'T09',
    name: '非标准平台表述（未知关键词）',
    sdkVersion: 'TopOn',
    platform: '',
    query: '平板设备上如何接入开屏广告？',
    expected: '检测到平台后直接检索',
    note: '「平板」不在平台关键词规则内，应暴露规则局限。',
  },
];

/** 演示知识库治理说明（真实背景，与演示资料区分） */
export const FAQ_GOVERNANCE_NOTE = {
  title: 'FAQ 清洗与整理（真实背景）',
  body: '在原项目实习中，我参与了历史 FAQ 的清洗与治理：将 600+ 条历史问答经过去重、归一化与质量筛选，整理为 100+ 条可用于知识库的 FAQ。清洗目的是减少重复与低质量条目，提升知识可用性。未编造清洗后的准确率或效果提升数据。',
};
