// ============================================================
// 作品集交互演示台预设数据（基于 Hermes 的 SDK 包体增量检测工具）
// 仅用于前端模拟流程步骤，不代表真实构建过程，不包含任何真实数值。
// ============================================================

export interface SzcStep {
  id: string;
  label: string;
  desc: string;
  /** 未执行时的状态文案 */
  statusIdle: string;
  /** 完成时的状态文案 */
  statusDone: string;
}

/** 演示流程步骤（与真实脚本链路一致：参数提取 → 调用 → 构建 → 计算 → 通知） */
export const SZC_STEPS: SzcStep[] = [
  {
    id: 'parse',
    label: 'Hermes 参数提取',
    desc: '从自然语言需求中识别 SDK 名称、接入版本、基线分支等检测参数。',
    statusIdle: '等待',
    statusDone: '参数已提取',
  },
  {
    id: 'invoke',
    label: '本地脚本调用',
    desc: 'Hermes 调用本地 Python 检测脚本，传入解析后的参数。',
    statusIdle: '等待',
    statusDone: '脚本已调用',
  },
  {
    id: 'env',
    label: '环境检查与准备',
    desc: '检查 JAVA_HOME、ANDROID_HOME 等必要构建环境，必要时创建沙箱。',
    statusIdle: '等待',
    statusDone: '环境检查通过',
  },
  {
    id: 'baseline',
    label: '构建基线 APK',
    desc: '构建不含目标 SDK 的基线 APK。',
    statusIdle: '等待',
    statusDone: '基线 APK 已构建',
  },
  {
    id: 'with-sdk',
    label: '构建接入 SDK 后的 APK',
    desc: '构建引入目标 SDK 后的 APK。',
    statusIdle: '等待',
    statusDone: '接入后 APK 已构建',
  },
  {
    id: 'calc',
    label: '读取体积并计算增量',
    desc: '读取两个 APK 的体积，计算增量 = 接入后体积 − 基线体积。',
    statusIdle: '等待',
    statusDone: '增量已计算',
  },
  {
    id: 'notify',
    label: '钉钉结果通知',
    desc: '将检测结果发送到钉钉群，通知相关成员。',
    statusIdle: '等待',
    statusDone: '结果已通知',
  },
];

/** 演示台预设的示例任务输入（示意内容，非真实检测需求） */
export const SZC_DEMO_INPUT =
  '检测 TopOn SDK 的包体增量：基线分支 main，接入版本 6.3.5。';
