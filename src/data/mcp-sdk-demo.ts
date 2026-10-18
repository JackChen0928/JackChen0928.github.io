/**
 * MCP SDK 自动化集成助手 — 作品集交互原型预设场景（纯前端模拟数据）
 *
 * 仅用于演示「SDK 接入工作台」的交互路径：需求输入 → 方案生成 → 方案确认
 * → 变更预览 → 校验与编译验证 → 结果摘要。不连接真实 MCP 服务，
 * 不执行真实代码注入，不修改真实项目文件。
 */

/** 接入方案中的一个步骤 */
export interface McpPlanItem {
  id: string;
  title: string;
  detail: string;
}

/** 变更预览：示例配置文件或代码片段的前后对比 */
export interface McpChange {
  file: string;
  action: '新增' | '修改';
  before?: string;
  after: string;
}

/** 校验项 */
export interface McpValidateItem {
  id: string;
  label: string;
  detail: string;
  /** 是否为失败项（仅用于数据可读性标注；运行逻辑以 scenario.failValidateId 为准） */
  fail?: boolean;
}

/** 预设场景 */
export interface McpScenario {
  id: 'a' | 'b' | 'c';
  label: string;
  /** 点击场景按钮后填入输入框的示例需求文本 */
  input: string;
  /** 匹配关键词，用于自由输入时识别场景 */
  keywords: string[];
  /** 是否缺少必要参数（场景 B 异常案例：缺少 appId） */
  missingParam?: { param: string; hint: string; resolvedValue: string };
  plan: McpPlanItem[];
  changes: McpChange[];
  validate: McpValidateItem[];
  /** 校验失败项 id（场景 C 异常案例：版本配置错误） */
  failValidateId?: string;
  /** 编译失败的模拟日志（仅失败场景） */
  buildLog: string[];
  /** 结果摘要：已完成步骤 */
  summaryDone: string[];
  /** 结果摘要：未完成 / 失败步骤 */
  summaryUndone: string[];
}

export const SCENARIOS: McpScenario[] = [
  {
    id: 'a',
    label: '正常接入 · 全部通过',
    input:
      '帮我把 TopOn SDK 接入我的 Android 项目，需要初始化并展示开屏广告。项目路径 app，appId：a1234567890，SDK 版本 6.3.0。',
    keywords: ['a1234567890', 'appId'],
    plan: [
      {
        id: 'dep',
        title: '依赖配置',
        detail: '在 app/build.gradle 添加 TopOn SDK 依赖并配置仓库地址。',
      },
      {
        id: 'init',
        title: '初始化',
        detail: '在 Application.onCreate 中调用 TopOn SDK 初始化，并注册开屏广告回调。',
      },
      {
        id: 'feature',
        title: '功能代码接入',
        detail: '在启动页接入开屏广告展示逻辑，处理加载失败时的兜底跳转。',
      },
      {
        id: 'check',
        title: '校验步骤',
        detail: '核对 appId 配置、权限声明与生命周期回调是否完整。',
      },
    ],
    changes: [
      {
        file: 'app/build.gradle',
        action: '修改',
        before: `dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
}`,
        after: `dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.topon.sdk:topon:6.3.0'
}`,
      },
      {
        file: 'app/src/main/AndroidManifest.xml',
        action: '修改',
        before: `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:name=".MyApp"
        android:theme="@style/Theme.App">
        <activity android:name=".SplashActivity" />
    </application>
</manifest>`,
        after: `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:name=".MyApp"
        android:theme="@style/Theme.App">
        <activity android:name=".SplashActivity" />
        <activity android:name="com.topon.sdk.SplashAdActivity" />
    </application>
</manifest>`,
      },
      {
        file: 'app/src/main/java/com/example/MyApp.kt',
        action: '修改',
        before: `class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}`,
        after: `class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // 使用需求中提供的 appId 初始化 TopOn SDK（示例代码，参数为占位）
        TopOnSDK.init(this, "a1234567890", "topon_demo_app_key")
    }
}`,
      },
    ],
    validate: [
      { id: 'v-dep', label: '依赖与仓库地址', detail: 'topon:6.3.0 已加入 app/build.gradle，仓库地址可解析。' },
      { id: 'v-appid', label: 'appId 配置', detail: '初始化代码中的 appId 与需求输入一致。' },
      { id: 'v-perm', label: '权限声明', detail: 'INTERNET / ACCESS_NETWORK_STATE 权限已声明。' },
      { id: 'v-min', label: 'minSdkVersion 兼容', detail: '项目 minSdkVersion 23 ≥ TopOn SDK 要求 23。' },
    ],
    buildLog: [
      '[模拟] 执行 gradlew :app:assembleDebug',
      '[模拟] 编译 132 个源文件……',
      '[模拟] 生成 APK：app-debug.apk（2.84 MB）',
      '[模拟] 编译通过，无错误。',
    ],
    summaryDone: [
      '依赖配置：topon:6.3.0 已加入工程并解析成功',
      '初始化：TopOnSDK.init 已注入 Application.onCreate',
      '功能代码：开屏广告展示逻辑已接入启动页',
      '权限声明：INTERNET / ACCESS_NETWORK_STATE 已补充',
      '编译验证：assembleDebug 通过，无错误',
    ],
    summaryUndone: [],
  },
  {
    id: 'b',
    label: '异常 · 缺少必要参数',
    input: '帮我把 TopOn SDK 接入我的 Android 项目，需要初始化并展示开屏广告。',
    keywords: ['缺少', '接入我的'],
    missingParam: {
      param: 'appId',
      hint: 'SDK 初始化必须使用广告平台分配的 appId，未提供时无法生成可用的初始化代码。',
      resolvedValue: 'a1234567890',
    },
    plan: [
      {
        id: 'dep',
        title: '依赖配置',
        detail: '添加 TopOn SDK 依赖（不依赖 appId，可先生成）。',
      },
      {
        id: 'init',
        title: '初始化',
        detail: '需要 appId 才能生成初始化代码 —— 当前缺失。',
      },
      {
        id: 'feature',
        title: '功能代码接入',
        detail: '依赖初始化完成，暂缓。',
      },
      {
        id: 'check',
        title: '校验步骤',
        detail: 'appId 缺失，无法进入执行阶段。',
      },
    ],
    changes: [
      {
        file: 'app/build.gradle',
        action: '修改',
        before: `dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
}`,
        after: `dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.topon.sdk:topon:6.3.0'
}`,
      },
    ],
    validate: [
      { id: 'v-dep', label: '依赖与仓库地址', detail: 'topon:6.3.0 已加入工程。' },
      { id: 'v-appid', label: 'appId 配置', detail: '未提供 appId，初始化代码无法生成。' },
    ],
    buildLog: ['[模拟] 因必要参数缺失，未发起编译。'],
    summaryDone: ['依赖配置：topon:6.3.0 已加入工程（不依赖 appId）'],
    summaryUndone: [
      '初始化：缺少 appId，未生成初始化代码',
      '功能代码：未接入（依赖初始化）',
      '校验与编译：未执行',
    ],
  },
  {
    id: 'c',
    label: '异常 · 配置错误（编译失败）',
    input:
      '帮我把 TopOn SDK 接入我的 Android 项目并初始化。项目路径 app，appId：a1234567890，SDK 版本 6.3.0，项目 minSdkVersion 21。',
    keywords: ['minSdkVersion 21', '21'],
    plan: [
      {
        id: 'dep',
        title: '依赖配置',
        detail: '添加 TopOn SDK 依赖；检测到项目 minSdkVersion 为 21，低于 SDK 要求。',
      },
      {
        id: 'init',
        title: '初始化',
        detail: '在 Application.onCreate 注入初始化代码（示例）。',
      },
      {
        id: 'feature',
        title: '功能代码接入',
        detail: '接入开屏广告展示逻辑（示例）。',
      },
      {
        id: 'check',
        title: '校验步骤',
        detail: '版本兼容性校验将失败，需修正后重新编译。',
      },
    ],
    changes: [
      {
        file: 'app/build.gradle',
        action: '修改',
        before: `android {
    compileSdk 34
    defaultConfig {
        minSdk 21
        targetSdk 34
    }
}`,
        after: `android {
    compileSdk 34
    defaultConfig {
        minSdk 21   // ← 低于 TopOn SDK 要求的 23，校验将失败
        targetSdk 34
    }
}`,
      },
      {
        file: 'app/build.gradle',
        action: '修改',
        before: `dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
}`,
        after: `dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.topon.sdk:topon:6.3.0'
}`,
      },
    ],
    validate: [
      { id: 'v-dep', label: '依赖与仓库地址', detail: 'topon:6.3.0 已加入工程，仓库地址可解析。' },
      { id: 'v-appid', label: 'appId 配置', detail: '初始化代码中的 appId 与需求输入一致。' },
      { id: 'v-perm', label: '权限声明', detail: 'INTERNET / ACCESS_NETWORK_STATE 权限已声明。' },
      { id: 'v-min', label: 'minSdkVersion 兼容', detail: '项目 minSdkVersion 21 < TopOn SDK 要求 23。', fail: true },
    ],
    buildLog: [
      '[模拟] 执行 gradlew :app:assembleDebug',
      '[模拟] 编译中……',
      '[模拟] 错误：minSdkVersion 21 is lower than the library minSdkVersion 23',
      '[模拟] 编译失败：1 个错误（版本兼容性问题）。',
    ],
    summaryDone: [
      '依赖配置：topon:6.3.0 已加入工程并解析成功',
      '初始化：TopOnSDK.init 已注入 Application.onCreate',
      '权限声明：INTERNET / ACCESS_NETWORK_STATE 已补充',
    ],
    summaryUndone: [
      '校验：minSdkVersion 21 < SDK 要求 23（失败）',
      '编译验证：assembleDebug 失败（版本兼容性错误）',
    ],
  },
];

/** 需求解析模拟步骤（阶段指示器文案） */
export const FLOW_STEPS = [
  { id: 'input', label: '需求输入' },
  { id: 'generate', label: '方案生成' },
  { id: 'confirm', label: '方案确认' },
  { id: 'preview', label: '变更预览' },
  { id: 'validate', label: '校验与编译' },
  { id: 'result', label: '结果摘要' },
] as const;
