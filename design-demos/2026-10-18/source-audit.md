# BlueMark 源码视觉审计

**工作台删装饰，首页讲清产品。** 工作台删除解释性装饰；首页保留简洁、真实的产品类别、受众、工作流程和能力介绍，去掉口号与全大写装饰眉题，不做无差别删文案。

按钮反馈、Token 与 CSS 覆盖的源码发现不变。保留现有布局、真实工作台截图和山野案例图片；设计方向由主任务确定。本轮仅修订审计文档，不修改应用源码、不新增功能。下方大表是可选查证清单，不是批量删除指令。

## 1. 范围与证据

结论来自 2026-10-18 01:15 CST 的本地源码检查。浏览器视觉走查由主任务负责，本文件没有浏览器观察结论。

1. 已通读全部 5 个页面文件、`App.tsx`、2 个共享组件、3 份 CSS，以及 `main.tsx`、`data.ts`、`domain.ts`、`store.ts`、`persistence.ts`、`engine.ts`、`export.ts`。另检索现有 4 份单元测试的覆盖范围。
2. 路由见 [App.tsx:249](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/App.tsx:249)：11 个逻辑页面，另有不存在页和渲染失败页。`/landing` 是首页别名，不重复计数。
3. 标记：**源码事实**表示直接声明或调用；**静态计算**表示 CSS 色值计算；**风险判断**表示由源码推断，需主任务浏览器确认。没有点击、截图、视口或实际过渡效果的验证声明。
4. 只新增本文件；不修改 `src/`、服务端、配置、数据、构建产物或偏好记忆。不运行构建或真实模型调用。已有 `dist` 仅用于检查样式顺序，不代表当前源码的新构建。
5. 范围是单用户 Web 应用。源码中的“品牌”“客户”属于营销资料或声明，不引出客户端、客户门户、成员管理或权限功能。
6. 初版交付校验：18 个核心源码文件的 SHA-256 与检查开始时一致；文档中 168 个文件链接的路径与行号有效；41 个文案审阅 ID 无重复，加导出项共 42 处。项目目录没有 Git 元数据，本轮没有创建 Git 仓库。

## 2. 逐屏计数

计数按源码位置，不按屏幕中动态重复的 DOM 数量。42 处是文案审阅位置，包含删除装饰、精简改写和保留介绍，不是 42 处删除项；尤其不能将首页的 16 处全部计为缺陷。

| 页面 / 路由 | 文案审阅数 | 页面自身控件声明 B/L/A | 继承的主要问题 |
| --- | ---: | --- | --- |
| 产品首页 `/`、`/landing` | 16 | 0 / 8 / 3 | 按钮无按压态；去掉装饰眉题/口号，保留具体产品介绍 |
| 总览 `/app` | 5 | 0 / 5 / 0 | 表格行操作反馈弱；标题、元信息多为浅灰 |
| 项目 `/app/projects` | 2 | 0 / 1 / 0 | 同上，另有删除确认弹窗 |
| 新建 `/app/projects/new`，全部 6 步 | 9 | 6 / 1 / 0 | 次要操作近似；选项无 hover 过渡；小屏步骤字号过小 |
| 项目详情 `/app/projects/:id`，全部 10 个 tab | 3 | 17 / 2 / 0 | 页面主按钮与模块主按钮并存；局部重生成缺局部忙态 |
| 案例库 `/app/cases` | 2 | 2 / 5 / 0 | 收藏柔和态缺 hover；图标反馈弱 |
| 案例详情 `/app/cases/:id` | 3，复用详情位置 | 复用 17 / 2 / 0 | 与项目详情相同；复制为主操作 |
| 内容 `/app/content` | 1 | 9 / 0 / 0 | 批量审核/导出均 secondary；4 个同行图标同样式 |
| 使用记录 `/app/usage` | 1 | 1 / 0 / 0 | 继承基础表格低对比度；不应新增主按钮 |
| 模型配置 `/app/model-config` | 1 | 5 / 0 / 0 | 保存/测试有变体；加载宽度、色板与表单覆盖待统一 |
| 设置 `/app/settings` | 1 | 5 / 0 / 0 | 危险按钮缺 hover；安全说明不能作为装饰删除 |
| 不存在页、渲染失败页 | 0 | 返回链接 1；重载按钮 1 | 继承基础按钮状态 |
| HTML 导出，不是 Web 页面 | 1 | 不计页面控件 | 英文装饰标题另列，不影响导出数据 |

1. `B/L/A` 分别为原生 `<button>`、`<Link>`、`<a>` 的 JSX 声明数，包含条件分支与循环模板，不是当前可见数量，也不是缺陷数量。
2. 共享补充：Shell 为 3 B / 9 L / 3 NavLink；`ProjectActions` 为 6 B；`ProjectTable` 为 2 L；详情内容列表为 6 B；内容编辑器为 4 B；Modal、Toast 各 1 B。它们只在使用时展开。
3. 全部 TSX 共 **67 个 button、34 个 Link、3 个 NavLink、3 个 a 声明**。8 个 `PageHeader` 调用全部传英文 eyebrow；详情另有手写标题。
4. 下节共 **42 个独立源码审阅位置**，不等于删除数。案例详情的 3 个位置与项目详情相同，不重复累计；创意标签是 1 个循环位置，内置示例会重复 3 次。

## 3. 文案处理清单

以下建议供设计批准后处理，未执行源码修改。工作台删除解释性装饰；首页须能回答“这是什么、给谁用、怎样工作、能产出什么”，保留具体介绍，只压缩重复、口号和装饰标签。混合字符串只处理明确指定的部分，不改业务数据。改写示例仅说明边界，不替代主任务的设计与定稿。

### 3.1 产品首页，16 处

| ID | 精确文案 | 源码 | 建议 |
| --- | --- | --- | --- |
| L01 | `营销方案工作台 · 从想法到交付` | [Landing.tsx:42](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:42) | 保留“营销方案工作台”类别信息；删“从想法到交付”口号，不必继续做眉题；保留品牌标题 |
| L02 | `把一个营销 Brief，转化为一套可执行的增长方案。` | [Landing.tsx:48](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:48) | 保留核心产品介绍，改成简洁、字面的能力描述，例如“输入营销 Brief，生成策略、内容草稿和排期，供人工审核与导出。”不一概删除 |
| L03 | `营销的想法，在这里成为可执行的计划。` | [Landing.tsx:82](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:82) | 删除截图上的口号层；保留图片和原链接 |
| L04 | `ONE BRIEF. ONE WORKFLOW.` | [Landing.tsx:89](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:89) | 删除英文眉题 |
| L05 | `策划的每一步，都有明确的下一步。` | [Landing.tsx:90](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:90) | 标题精简为功能名“工作流程” |
| L06 | `为品牌团队与营销服务公司打造，从结构化输入到人工确认，保留每一次生成与修改。` | [Landing.tsx:92](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:92) | 保留受众、输入到人工确认的流程介绍，压缩重复表述；按单用户 Web 应用说明，不暗示多人协作或客户门户 |
| L07 | `YOUR CAMPAIGN, ORGANIZED.` | [Landing.tsx:114](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:114) | 删除英文眉题 |
| L08 | `一个工作空间，接住完整的营销项目。` | [Landing.tsx:116](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:116) | 精简为“工作台” |
| L09 | `项目、内容、案例与操作记录相互关联，让方案可以被审阅、被修改、被再次复用。` | [Landing.tsx:121](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:121) | 保留项目组织、审阅与复用的实际能力介绍；与下方能力项去重，不整段默认删除 |
| L10 | `完整 Brief、生成记录与案例版本，围绕同一个项目组织。` | [Landing.tsx:129](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:129) | 保留短句说明 Brief、生成记录和案例的组织方式；不扩张为未实现的版本管理承诺 |
| L11 | `小红书笔记、短视频脚本与公众号提纲，按渠道管理。` | [Landing.tsx:134](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:134) | 保留具体内容类型与渠道说明，这是辨识产品能力的信息；只压缩与相邻介绍重复的部分 |
| L12 | `Markdown、JSON 与 HTML，把完整方案带入现有交付流程。` | [Landing.tsx:149](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:149) | 保留支持 Markdown、JSON、HTML 导出的事实；精简后半句，不删除整条能力说明 |
| L13 | `保存、生成、修改、审核和导出，留下独立的操作记录。` | [Landing.tsx:154](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:154) | 保留操作记录能力的简短说明；可压缩动词枚举，真实日志保留 |
| L14 | `FEATURED CASE / 内置虚构示例` | [Landing.tsx:171](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:171) | 只删 `FEATURED CASE /`，保留“内置虚构示例” |
| L15 | `FROM BRIEF TO DELIVERY.` | [Landing.tsx:185](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:185) | 删除末尾英文眉题 |
| L16 | `下一个好方案，从你的 Brief 开始。` | [Landing.tsx:187](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:187) | 删除“创建项目”上方口号；不移除按钮 |

### 3.2 工作台，25 处

| ID | 页面与精确文案 | 源码 | 建议 |
| --- | --- | --- | --- |
| D01 | 总览 `WORKSPACE / OVERVIEW` | [Projects.tsx:248](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Projects.tsx:248) | 删除眉题 |
| D02 | `从一个好 Brief，开始下一次品牌增长。` | [Projects.tsx:250](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Projects.tsx:250) | 删除标题下口号 |
| D03 | 指标下 `策划与内容推进中` | [Projects.tsx:226](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Projects.tsx:226) | 删除与“进行中”重复的解释 |
| D04 | `精选案例 / CAMPAIGN SPOTLIGHT` | [Projects.tsx:276](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Projects.tsx:276) | 删除装饰英文与装饰点；案例名称、正文及入口保留 |
| D05 | 图上 `SHANYE · BRAND CONCEPT` | [Projects.tsx:306](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Projects.tsx:306) | 删除装饰图签，不替换图片 |
| P01 | 项目 `WORKSPACE / PROJECTS` | [Projects.tsx:413](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Projects.tsx:413) | 删除眉题 |
| P02 | `${projects.length} 个项目，每一次策划都有迹可循。` | [Projects.tsx:415](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Projects.tsx:415) | 保留动态数量；删除“每一次策划都有迹可循。” |
| C01 | 案例库 `WORKSPACE / CASE LIBRARY` | [Projects.tsx:488](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Projects.tsx:488) | 删除眉题 |
| C02 | `把完成的策划，变成下一次的起点。` | [Projects.tsx:490](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Projects.tsx:490) | 删除口号 |
| W01 | 新建 `WORKSPACE / NEW CAMPAIGN` | [BriefWizard.tsx:122](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/BriefWizard.tsx:122) | 删除眉题 |
| W02 | `营销 BRIEF` | [BriefWizard.tsx:139](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/BriefWizard.tsx:139) | 删除步骤上方重复微标签 |
| W03 | `每个好方案，都始于清晰的 Brief。` | [BriefWizard.tsx:160](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/BriefWizard.tsx:160) | 只删口号，保留下一行草稿状态 |
| W04 | `名称与项目背景` | [BriefWizard.tsx:19](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/BriefWizard.tsx:19) | 删除步骤副标题，不删“项目基本信息” |
| W05 | `卖点与品牌语气` | [BriefWizard.tsx:20](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/BriefWizard.tsx:20) | 删除步骤副标题，不删字段 |
| W06 | `用户需求与生活场景` | [BriefWizard.tsx:21](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/BriefWizard.tsx:21) | 同上 |
| W07 | `确定本次传播任务` | [BriefWizard.tsx:22](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/BriefWizard.tsx:22) | 同上 |
| W08 | `确定资源与传播周期` | [BriefWizard.tsx:23](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/BriefWizard.tsx:23) | 同上 |
| W09 | `核对信息，开始生成` | [BriefWizard.tsx:24](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/BriefWizard.tsx:24) | 同上 |
| T01 | 项目/案例详情 `MARKETING CAMPAIGN` / `CASE STUDY`，后接行业 | [ProjectDetail.tsx:459](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/ProjectDetail.tsx:459) | 删除装饰英文；行业作为元数据保留 |
| T02 | 概览 `CORE MESSAGE` | [ProjectDetail.tsx:679](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/ProjectDetail.tsx:679) | 删除英文微标签；保留实际传播主张与定位 |
| T03 | 创意方向 `CONCEPT 0{i + 1}` | [ProjectDetail.tsx:976](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/ProjectDetail.tsx:976) | 删除装饰英文标签；创意名称与内容保留 |
| O01 | 内容 `CONTENT` | [Operations.tsx:557](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:557) | 删除眉题 |
| O02 | 使用记录 `ACTIVITY` | [Operations.tsx:861](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:861) | 删除眉题 |
| O03 | 模型配置 `MODEL CONFIGURATION` | [Operations.tsx:1237](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:1237) | 删除眉题 |
| O04 | 设置 `WORKSPACE SETTINGS` | [Operations.tsx:1680](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:1680) | 删除眉题 |

### 3.3 导出，1 处

HTML 导出中的 `BLUEMARK / MARKETING SOLUTION` 是同类装饰标题，见 [export.ts:176](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/export.ts:176)。批准后可去掉该段，保留项目标题、品牌归属、状态、模型、时间与来源声明。此项不涉及导出结构契约。

## 4. 必须保留的信息

不能按“英文”“按钮旁文字”或 `eyebrow` 类名批量删除。以下承担数据口径、安全、来源、错误或操作状态的职责。

| 类别 / 页面 | 精确文本或动态字段 | 源码 | 处理边界 |
| --- | --- | --- | --- |
| 首页试用与保存 | `无需 API Key 即可试用`、`项目保存在本地` | [Landing.tsx:68](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:68)、[Landing.tsx:72](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:72) | 可压缩/降低占位，不与纯口号一并删掉；前者限定默认 Mock，后者不是“所有网络数据不外发”承诺 |
| 首页审核/模式边界 | `逐条检查内容与风险，审核通过后再标记为可交付。`、`默认本地 Mock，支持连接 OpenAI-Compatible 服务。` | [Landing.tsx:139](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:139)、[Landing.tsx:144](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:144) | 保留模式与人工确认边界，可就近浓缩；与 L10-L13 一样，真实能力介绍不因处于功能下方而删除 |
| 品牌、图片、虚构来源 | `BlueMark`、`蓝标智策`；`茶饮场景概念配图，非真实品牌产品图`；`内置虚构示例` | [Logo.tsx:8](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/components/Logo.tsx:8)、[Landing.tsx:168](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:168)、[Projects.tsx:288](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Projects.tsx:288) | 品牌英文不是装饰眉题；alt 与可见示例声明均保留 |
| 首页项目归属 | `独立面试展示项目 · 非蓝色光标官方产品 · 不含真实客户数据` | [Landing.tsx:199](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:199) | 来源/身份声明，不删 |
| 真实内容而非界面口号 | `给忙碌生活，加一点自然气。`；`p.solution.strategy.coreMessage`、内容标题/正文 | [Projects.tsx:279](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Projects.tsx:279)、[Landing.tsx:173](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Landing.tsx:173)、[data.ts:559](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/data.ts:559) | 属于山野示例创意及方案数据，保留；不能用全文替换删除同句 |
| 总览指标口径 | `含内置示例`、`发布前需要人工确认`；项目数量、周期、预算、平台、状态、时间 | [Projects.tsx:233](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Projects.tsx:233)、[Projects.tsx:240](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Projects.tsx:240)、[Projects.tsx:150](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Projects.tsx:150) | 与 D03 不同，不删口径和事实 |
| Shell 模式/保存 | `Mock 模式`、`本地示例已就绪`、`Mock 已就绪`、`已保存 {formatTime(...)}` | [App.tsx:129](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/App.tsx:129)、[App.tsx:167](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/App.tsx:167)、[App.tsx:172](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/App.tsx:172) | 信息可合并到已有状态位置；不能把模式变成隐式假设 |
| Shell 数据边界/恢复 | `本地工作空间 · 数据仅存于当前浏览器`、`saveError`、`导出备份` | [App.tsx:197](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/App.tsx:197)、[App.tsx:210](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/App.tsx:210) | 保存提示需能读到；真实模型下 Brief 会发往服务，文案应限定“项目持久化”而非泛指所有数据，见 engine.ts:587 |
| 新建步骤/草稿 | `STEP {…} / 06`、`草稿已保存` / `草稿编辑中` | [BriefWizard.tsx:161](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/BriefWizard.tsx:161)、[BriefWizard.tsx:167](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/BriefWizard.tsx:167) | 可中文化为数字进度；不能把全部进度信息作为装饰删除 |
| 新建外发边界 | `将使用 Mock 模式生成结构化方案，不会发送外部请求。` / `将把以上 Brief 发送至已配置的模型服务，请勿包含未经授权的敏感资料。` | [BriefWizard.tsx:386](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/BriefWizard.tsx:386) | 提交前保留；字段标签、必填标记与校验错误也保留 |
| 详情示例声明 | `内置虚构示例 · 非真实客户项目，预算与 KPI 均为规划值。示例操作记录不代表本机真实执行。` | [ProjectDetail.tsx:538](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/ProjectDetail.tsx:538) | 保留且需提高可读性，不是解释 UI 的废话 |
| 详情证据与 KPI | `市场判断与证据边界`；`以下为方案目标，不是已发生的投放数据。实际数据未接入，当前状态统一为未采集。` | [ProjectDetail.tsx:693](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/ProjectDetail.tsx:693)、[ProjectDetail.tsx:885](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/ProjectDetail.tsx:885) | `limitations/evidence/source/current` 及其数据全部保留 |
| 详情执行、审核、风险 | `正在生成`、`等待执行`、`s.error`、`已审核`、`高风险`、`确认已处理`、质检 summary/checks | [ProjectDetail.tsx:727](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/ProjectDetail.tsx:727)、[ProjectDetail.tsx:997](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/ProjectDetail.tsx:997)、[data.ts:863](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/data.ts:863) | 不能删评分限定、失败原因、审核门禁；质检分不是投放效果 |
| 内容页与编辑器 | `内容仅供审核与导出，不会自动发布`、`发现未提交草稿`、`正式内容已更新，请核对后再保存。`、`草稿暂存于` | [Operations.tsx:812](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:812)、[Operations.tsx:261](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:261)、[Operations.tsx:389](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:389) | 保留动作边界、版本冲突、草稿状态与行级错误 |
| 使用记录来源 | `条实际操作`、`示例记录`、`成功` / `失败`、`log.result` | [Operations.tsx:865](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:865)、[Operations.tsx:953](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:953)、[Operations.tsx:962](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:962) | 示例与实际记录不可混为真实执行 |
| 模型 Key、外发、费用 | `Key 仅保留在本次页面会话；推荐通过服务器环境变量配置`；`当前使用示例模板，不调用真实模型。` / `测试连接与生成会调用所配置的模型，可能产生费用。` | [Operations.tsx:1355](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:1355)、[Operations.tsx:1453](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:1453) | 保留；`API Key`、`Temperature`、`Token`、模型名是功能术语，不因英文删除 |
| 模型操作结果 | `未测试`、`连接失败`、`有未保存更改`、`上次测试`、`serverError` / `draft.error` | [Operations.tsx:1258](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:1258)、[Operations.tsx:1468](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:1468)、[Operations.tsx:1476](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:1476) | 保留服务状态、错误与保存状态 |
| 设置备份/删除/权限 | `API Key 已脱敏；备份仍可能包含品牌资料与未发布内容。`、`不可撤销。`、`本地单用户`、`未实现登录认证、成员管理或权限隔离` | [Operations.tsx:1780](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:1780)、[Operations.tsx:1796](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:1796)、[Operations.tsx:1823](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:1823) | 保留实际边界；“预留能力”句可压缩，不能暗示已实现管理员权限 |
| 删除确认/失败恢复 | `项目内容将被移除，历史操作记录会保留。`；`浏览器中的原始项目数据未被清除。` | [Projects.tsx:95](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Projects.tsx:95)、[App.tsx:233](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/App.tsx:233) | 保留后果、错误与恢复入口 |
| 导出与运行时提示 | `营销规划草案；目标值不代表实际效果，发布前需人工审核。`；存储失败、鉴权、超时、结构错误 | [export.ts:126](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/export.ts:126)、[store.ts:548](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/store.ts:548)、[engine.ts:545](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/engine.ts:545) | 所有业务与错误数据默认保留；不要通过 CSS 隐藏 Notice/Toast |

额外保留边界：新建表单的输入示例、产品事实核验提示、已有按钮名称、筛选标签、表头、空状态、链接 title/aria-label、图片 alt 不是本次装饰文案清理对象。账户弹层的“个人工作空间 · 管理员”见 [App.tsx:189](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/App.tsx:189)，与设置页的单用户边界不一致，后续宜改成准确身份名称，不新增权限系统。

## 5. 按钮与反馈

源码不是“所有按钮完全一样”，而是变体已有、状态不完整，部分场景的操作权重也没有区分。CSS 的 `.active` 选中态不等于 `:active` 按压态。

| 对象 | 已有源码事实 | 缺口 / 影响 | 位置 |
| --- | --- | --- | --- |
| 基础 `.button` | 高 38px，13px/500，5px 圆角；仅 background、border-color 150ms | 没有 transform/shadow/color 过渡、忙态尺寸契约 | [styles.css:147](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:147) |
| primary / secondary / ghost | 各自有 hover；primary 有轻阴影，secondary 有描边，ghost 透明 | 全部没有按压态；仅换底色难构成稳定触感 | [styles.css:164](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:164) |
| soft / danger | 有默认背景、前景色 | 没有专属 hover，仍继承基础过渡；danger 白字静态对比度仅 4.25:1 | [styles.css:188](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:188) |
| 图标 `.icon-button` | 30×30、透明、hover 灰底转蓝；运营行覆盖为 32×32 | 无 transition、无按压；编辑/复制/重生成/需修改完全共用视觉权重。多数有 title，勿写成“没有 tooltip” | [styles.css:202](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:202)、[Operations.tsx:745](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:745) |
| text-link / feature-link | 有文字变色 hover | 没有过渡或按压；avatar、截图链接、案例封面、Toast 关闭也没有专属 hover 反馈 | [styles.css:219](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:219)、[styles.css:993](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:993)、[styles.css:2085](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:2085) |
| 全局按压 | 3 份 CSS 的 `:active` 选择器共 0 个；同时关闭了原生 tap highlight | 所有页面缺显式按压反馈；这是源码结论，不是主观动效实测 | [styles.css:43](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:43) |
| 键盘焦点 | 全局 3px `#9db8ff` ring；运营页 2px `#245de8` ring | 不是没有 focus；存在两套规格。全局 ring 对白底静态比值 1.96:1，运营页 5.52:1 | [styles.css:70](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:70)、[operations.css:535](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/operations.css:535) |
| disabled | button 全局 opacity .5、not-allowed；模型 fieldset 可禁用 | loading 与真正不可用共用变淡方式；没有统一 aria-busy 或 button loading API。原生 disabled 门禁必须保留 | [styles.css:57](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:57)、[ui.tsx:160](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/components/ui.tsx:160) |
| loading | 有 Busy、spin；完整方案生成、内容重生成、模型测试/服务检查都有状态 | 不能声称“没有加载态”。但详情模块“重新生成”仅全局 running 禁用，局部按钮无 spinner；导出仅禁用、不换标签 | [ProjectDetail.tsx:505](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/ProjectDetail.tsx:505)、[ProjectDetail.tsx:832](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/ProjectDetail.tsx:832)、[ProjectDetail.tsx:524](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/ProjectDetail.tsx:524) |
| 忙态尺寸 | “生成方案/继续生成”切换为“生成中”，服务检查切换为“检查中”；button 无 min-width | 可能横向变化，需浏览器测；doExport 同步下载配合 React 批处理，不应承诺 exporting 必然肉眼可见 | [ProjectDetail.tsx:408](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/ProjectDetail.tsx:408)、[Operations.tsx:1382](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:1382) |
| 当前选择 | 导航/tab 有 `.active`，收藏有 fill/soft，表单选项有 selected，开关有 checked 滑动 | 这些是持久选中反馈，需保留。目标/渠道选项没有 hover/transition；收藏“仅收藏”缺 aria-pressed | [Projects.tsx:522](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Projects.tsx:522)、[styles.css:1389](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:1389)、[operations.css:402](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/operations.css:402) |
| 动效与降级 | modal 有 150ms 入场、侧栏 200ms、进度 250ms、switch 150ms；有 reduced-motion 规则 | 不需要加全页动效。只统一现有控件反馈；模态退出立即卸载，无退出过渡 | [styles.css:2036](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:2036)、[styles.css:2905](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:2905) |

逐屏操作权重补充：内容页“批量审核”“导出选中”同为 secondary，见 [Operations.tsx:627](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:627)；新建“清空”“暂存草稿”同为 ghost，见 [BriefWizard.tsx:394](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/BriefWizard.tsx:394)；详情顶部生成与模块审核同时 primary，见 [ProjectDetail.tsx:491](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/ProjectDetail.tsx:491)、[ProjectDetail.tsx:840](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/ProjectDetail.tsx:840)。这些是层级候选，不表示不同语义的所有按钮都要使用不同颜色。

## 6. Token 与层级

主要问题是浅灰文字、大量硬编码和局部色板并存，不是缺少更多装饰。以下均为源码事实或静态计算。

| 类别 | 发现与影响 | 证据 |
| --- | --- | --- |
| 颜色 | 3 份 CSS 共 337 次 hex 字面量、263 个不同值，包含透明色与语义状态色，不等于 263 个设计 token。全局 primary `#245bfa` 与 op-blue `#245de8` 并存，muted `#7f899b` 与 op-muted `#6a7585` 并存 | [styles.css:18](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:18)、[operations.css:10](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/operations.css:10) |
| 未消费 token | 根部 10 个不同 token；`--surface`、`--green`、`--orange`、`--radius` 在 3 份 CSS 中的 `var()` 引用均为 0。没有成组的字号、间距、投影、动效 token | [styles.css:18](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:18) |
| 文字对比 | 静态 fg/bg 比值：muted 对白 3.53:1；placeholder 对白 2.28:1；表头 `#98a2b2/#fbfcfe` 2.51:1；示例 notice `#a19a80/#faf9f4` 2.67:1。小字号必要信息被压得过弱 | [styles.css:89](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:89)、[styles.css:740](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:740)、[styles.css:1520](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:1520) |
| 按钮对比 | primary 白字 5.31:1，可保留；danger 白字 4.25:1，13px 普通文本低于 4.5:1。透明背景、disabled、图片叠字没有进行浏览器合成计算 | [styles.css:164](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:164)、[styles.css:193](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:193) |
| 字号层级 | 根字号 14px，h1 26px、h2 16px、h3 15px，但 section h2 又变 14px；正文 12px、元信息 9-10px，样例 notice 10px。许多层级依赖浅色而非足够的字重与间距差 | [styles.css:107](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:107)、[styles.css:669](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:669)、[styles.css:766](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:766) |
| 小屏压缩 | 小屏眉题 6px、图签 5px、步骤标题/时间 8px、模块操作 9px。图签可删，但进度/时间/操作不能靠持续缩小解决 | [styles.css:2624](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:2624)、[styles.css:2646](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:2646)、[styles.css:2712](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:2712)、[styles.css:2837](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:2837) |
| 字体/字距 | 系统字体栈含 Inter，数字/眉题/Logo 多次单独设 Arial；品牌 3px、眉题 1.4px、图签 2px、landing 1.3px 字距。运营区又通配设 0，跨页面不一致 | [styles.css:3](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:3)、[styles.css:298](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:298)、[styles.css:598](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:598)、[landing.css:41](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/landing.css:41) |
| 间距 | 主区 30/34/35、section 17/22、指标 18/21/17、wizard 32/38、module 22/27 等硬编码。没有可复用的标题-内容-操作间距尺度，局部改动容易越改越散 | [styles.css:563](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:563)、[styles.css:664](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:664)、[styles.css:1343](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:1343)、[styles.css:1769](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:1769) |
| 表面/投影 | `.section`、`.stat`、`.model-summary`、`.workflow-panel` 都是白底、相近浅边框和 6px 圆角。无需给每块加阴影；保留布局，用主标题、正文、边界和操作层级区分。菜单/modal 有投影但无共享 elevation 定义 | [styles.css:654](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:654)、[styles.css:894](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:894)、[styles.css:2027](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:2027) |
| 尺寸契约 | button 有 min-height 与 nowrap，icon 有固定宽高，图片有部分 aspect-ratio，都是应保留的基础。缺少统一控件尺寸、忙态宽度；案例尾部图标被缩成 24px | [styles.css:147](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:147)、[styles.css:1197](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:1197) |

## 7. CSS 覆盖问题

先明确入口与权重，再改 token；继续在文件尾追加补丁容易让设计稿无法稳定落地。

| 问题 | 可复核证据 | 影响与后续最小处理 |
| --- | --- | --- |
| 运营样式双入口 | [styles.css:1](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:1) `@import`；[Operations.tsx:48](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/Operations.tsx:48) 再 import；[main.tsx:5](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/main.tsx:5) 引入全局 | 源码双入口确定；已有 dist 只发出一套 op-page 基础块，不能声称生产 CSS 必然重复。后续保留单一明确入口 |
| 同权重顺序覆盖 | `.op-toolbar` 12px gap/end/0 margin，见 [operations.css:28](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/operations.css:28)；`.toolbar` 10px gap/center/18px margin，见 [styles.css:687](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:687) | 已有构建 CSS 顺序前者在后者之前，均为 0,1,0，后者覆盖。属于已有产物静态证据；当前浏览器 computed style 由主任务确认 |
| 表单间距与断点覆盖 | `.op-form-grid` 20px 24px、520px 下单列，见 [operations.css:292](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/operations.css:292)、[operations.css:566](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/operations.css:566)；后置 `.form-grid` 10px 20px、1000px 下 7px 14px，见 [styles.css:1227](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:1227)、[styles.css:2288](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:2288) | 在已有构建顺序中，同权重覆盖不仅改变间距，也能覆盖 481-520px 的 op 单列声明。后续不要单靠改 op token 修复 |
| 表单颜色/字号被覆盖 | `.op-filter select` 与 `.toolbar select` 均为 0,1,1，见 [operations.css:55](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/operations.css:55)、[styles.css:694](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:694) | 已有构建中后者让 13px/op-ink 回到 12px/浅灰；统一 field/filter 规则，避免两个位置争夺同一属性 |
| 选中行 hover 权重 | `.op-row-selected` 为 0,1,0；`.data-table tbody tr:hover` 为 0,2,2，见 [operations.css:137](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/operations.css:137)、[styles.css:757](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:757) | hover 背景会盖过选中背景，弱化“已选”反馈。需独立 selected+hover 规则或排除选中行，不改变选择逻辑 |
| 菜单重复改定位 | `.row-menu` 先 absolute/right/top，后 fixed/auto/transform，见 [styles.css:856](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:856)、[styles.css:882](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:882)，小屏还有 `.table-wrap .row-menu` 覆盖 | 定位规则难以推断，不能仅据此断言浏览器已错位。后续合并声明，主任务确认滚动/边缘情况 |
| 宽泛选择器与重要声明 | `.op-page *` 强制字距；`.section-head h2` 覆盖基础 h2；两处 danger text 使用 !important，见 [operations.css:5](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/operations.css:5)、[styles.css:669](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:669)、[styles.css:235](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:235)、[operations.css:472](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/pages/operations.css:472) | 后续改为受控的语义类/token。全局 reduced-motion 的 3 条 !important 是有意降级，不当作同类坏味道删除 |
| 默认焦点被清除 | 全局 `outline:none` 后再定义 focus-visible，见 [styles.css:64](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:64) | 当前有补偿 ring，不能说键盘不可用。后续保持 fallback，检查 tab 容器 overflow 对外扩焦点环的裁剪 |

已有构建顺序证据来自 [index-Dc-aTY1C.css](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/dist/assets/index-Dc-aTY1C.css:1) 的结构化解析，未重新构建。源码中只出现 `.active` 的规则不计为 `:active`。

## 8. 批准后的最小修复

只处理现有共享组件与皮肤。先拿到主任务设计批准，再实施以下顺序，不更换布局、图片、数据适配或业务流程。

1. **PageHeader 与文案**：工作台在 `ui.tsx` 及调用处去掉装饰 eyebrow 与解释性装饰；动态项目数量转为已有元信息样式，保留语义标题、操作和所有必要提示。手写详情标题同样处理。首页单独按“类别、受众、流程、能力”保留简洁介绍，仅去口号、全大写眉题与重复表述，不套用工作台删说明的规则；不用 CSS 全局隐藏 `.eyebrow` 或全部 `p`。
2. **基础 token 与 CSS 入口**：在 `styles.css` 定义必要的文字、表面、边框、语义色、字号/字重、间距、投影和时长；让运营页复用。明确 base → component → responsive 的顺序，修复上节同权重覆盖，不引入新 UI 框架。
3. **Button / IconButton 最小共用能力**：沿用现有 primary/secondary/ghost/soft/danger 语义，统一尺寸、hover、active、focus-visible、disabled、loading。优先共用 CSS；只有忙态/icon 重复处理确有收益时才在 `ui.tsx` 加薄组件，Link 仍保留链接语义与 href。
4. **状态反馈建议**：hover 120-160ms 改底色/边框/投影；active 60-100ms 轻微下压 1px 或缩至 .98，释放复位；键盘用统一高对比 ring。`:not(:disabled)` 保护禁用态，reduced-motion 下取消位移。loading 保留原位置宽度与图标槽，传递 aria-busy；不添加虚假等待。
5. **逐屏映射现有操作**：总览/项目/案例突出新建；向导突出下一步/生成；详情突出当前工作主动作；内容有选中项时区分审核与导出；模型/设置突出保存；危险操作保持明确警示和二次确认。使用记录没有主任务时不硬造主按钮。
6. **Modal / Notice / Status 保留语义**：保留现有 focus trap、Escape、焦点归还、role 与错误状态；提高必要提示可读性，合并样式而非删提示。修正选中行 hover 与菜单定位覆盖。

建议验收：保留桌面和窄屏原有区块顺序/布局关系；截图与案例图不替换；42 个审阅位置按批准范围逐项核对，首页仍清楚说明产品类别、受众、流程与能力，不以删光说明为通过标准；必要口径/来源/安全/错误信息仍可读；主/次/危险按钮可区分；hover、按压、Tab 焦点、忙态、禁用与减少动态模式分别可验证；运行现有单元测试并做浏览器回归。现有测试主要覆盖 data/engine/store/export，没有发现组件状态或视觉回归测试，本轮未执行测试。

## 9. 主任务浏览器核对

以下只列待验证问题，不是已观察到的缺陷。

1. 在实际桌面与手机视口检查：标题与主按钮是否足够突出，删口号后是否仍保持原图和内容布局；长标题、按钮文案与必要提示有无溢出。
2. 分别触发 hover、按住、释放、Tab 焦点、disabled、真实异步忙态；确认按钮尺寸是否变化，图标按钮是否可感知且有可访问名称。
3. 读取 `.op-toolbar`、`.op-form-grid`、`.op-filter select` 的 computed style，尤其 481-520px；核对现有构建顺序风险是否在当前开发服务复现。
4. 选中内容行后 hover；滚动表格并打开项目菜单；Tab 进入横向 tab 列表，核对选中反馈、菜单定位与焦点环裁剪。
5. 核对总览在 <=1000px 隐藏 `.feature-tags span:last-child` 的影响，见 [styles.css:2234](/Users/admin/Documents/Codex/2026-10-17/zhi/outputs/bluemark/src/styles.css:2234)。源码中最后一项恰是“内置虚构示例”；现有图片 alt 不等于可见来源标记。

当前没有浏览器截图编号、computed style 结果或主任务观察回填，因此不能把上述风险改写成“视觉已证实”。
