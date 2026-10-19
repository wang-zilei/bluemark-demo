# BlueMark 视觉层级与交互反馈研究

检索与抓取日期：2026-10-18。范围：仅研究，不修改产品代码。本文基于官方页面正文，不以搜索摘要作为证据；未检查外部产品的实际渲染画面，也不把通用判断当作 BlueMark 的已确认视觉问题。

## 1. 结论与使用顺序

**扁平不是问题，所有元素使用相同视觉权重才是问题。** 应分别表达空间关系、信息分组、操作优先级和交互状态，而不是给所有区域加卡片和阴影。以下是官方规范支持的设计判断，BlueMark 是否存在对应问题，须由主任务的视觉审计确认。[S1] [S3] [S5]

1. **先审计，再映射。** 先记录页面截图、任务主线、动作分布和状态缺口，再用本文的语义与 token 校准方案。本文不替代主任务的浏览器审计，不决定最终方向或视觉资产。
2. **先建立静态层级。** 用位置、字号与字重、间距、表面明暗和动作样式区分对象。动效只解释变化，不能修复看不清主动作或内容分组的问题。[S1] [S3] [S5]
3. **阴影表达浮起或覆盖。** 普通页面、表格和表单默认保持平面；可移动对象可用 raised；菜单、弹窗等用 overlay。主按钮重要，不等于必须悬浮。[S1] [S3]
4. **反馈必须形成可辨认的状态序列。** Hover 是可交互提示，pressed 是按下确认，focus 是键盘位置，loading 是处理中，success 是已成功；不能用同一种浅底色代替所有状态。[S1] [S3] [S6] [S7]

## 2. 为什么界面会显得“平”

以下是待审计的成因假设，不是对 BlueMark 当前画面的观察结论。四个维度必须分开诊断，否则容易通过加阴影解决错误的问题。

| 维度 | 缺失时的表现 | 合适的设计手段 | 不应混淆 |
|---|---|---|---|
| 语义高度 elevation | 菜单像正文，弹层与底层难区分 | 对应表面、阴影、遮罩与正确堆叠 | z-index 只控制遮挡顺序，不等于视觉高度；同一 elevation 可有不同 z-index。[S3] |
| 表面明暗与分组 | 导航、内容、工具区连成一片，组内外关系不清 | 中性色表面、留白、必要分隔线 | 不要求每组都包卡片，也不要求每个相邻背景都达到 3:1。[S3] [S7] |
| 操作突出程度 | 保存、取消、帮助、删除都同等抢眼或同等微弱 | Primary / default / text / link，以及独立 danger 语义 | 重要性不应只靠尺寸、阴影或颜色深浅表达。[S1] |
| 状态与时间反馈 | 点后像没发生；hover、选中、处理中难区分 | 明确状态样式、原位反馈、短时过渡、完成/失败信息 | selected 是持续状态，pressed 是短暂按下；success 必须由真实结果触发。[S1] [S3] [S6] |

## 3. 官方规范与精确 token

下列是本次抓取到的官方值，不是 BlueMark 已采用值。Ant Design 页面显示版本 **6.6.6**；尚未核查 BlueMark 的组件库或版本。跨版本、主题及组件覆盖后应重新验证，不能照搬为项目现状。[S1] [S2]

### 3.1 Ant Design：动作优先级、表面与动效

按钮层级主要依赖样式和语义，不依赖大阴影。官方要求每个 section 至多一个 primary，并建议多按钮组合采用一个 primary 加多个 secondary；超过三个操作可考虑收进 Dropdown。[S1]

| 类型 | 官方定位 | 对 BlueMark 的候选映射，待审计确认 |
|---|---|---|
| `primary` | “used for the main action”; 每个 section 至多一个 | 当前任务的保存、创建、执行等主动作 |
| `default` | “a series of actions without priority” | 同级辅助操作，如取消、导入、预览 |
| `text` | “the most secondary action” | 行内或工具栏低优先级命令 |
| `link` | “used for external links” | 外链参考；不能因为命令较轻就把所有操作做成链接 |

补充边界：`danger` 表达删除、授权等风险；`ghost` 面向复杂背景，官方特别提及 home pages；`loading` 提供加载图标并避免重复提交。它们不是新增的优先级层级。[S1]

| 官方 token / 属性 | 本次抓取的默认值 | 证据 |
|---|---|---|
| `colorPrimary` / `colorPrimaryHover` / `colorPrimaryActive` | `#1677ff` / `#4096ff` / `#0958d9` | [S1] |
| `primaryColor` / `primaryShadow` | `#fff` / `0 2px 0 rgba(5,145,255,0.1)` | [S1] |
| `defaultBg` / `defaultBorderColor` / `defaultColor` | `#ffffff` / `#d9d9d9` / `rgba(0,0,0,0.88)` | [S1] |
| `defaultHoverBg` / `defaultHoverBorderColor` / `defaultHoverColor` | `#ffffff` / `#4096ff` / `#4096ff` | [S1] |
| `defaultActiveBg` / `defaultActiveBorderColor` / `defaultActiveColor` | `#ffffff` / `#0958d9` / `#0958d9` | [S1] |
| `defaultShadow` / `textHoverBg` / `linkHoverBg` | `0 2px 0 rgba(0,0,0,0.02)` / `rgba(0,0,0,0.04)` / `transparent` | [S1] |
| `colorBgLayout` / `colorBgContainer` / `colorBgElevated` | `#f5f5f5` / `#ffffff` / `#ffffff` | [S2] |
| `motionDurationFast` / `motionDurationMid` / `motionDurationSlow` | `0.1s` / `0.2s` / `0.3s` | [S2] |
| `motionEaseInOut` / `motionEaseOut` | `cubic-bezier(0.645,0.045,0.355,1)` / `cubic-bezier(0.215,0.61,0.355,1)` | [S2] |
| `motion` | 默认 `true`；设为 `false` 可关闭动效 | [S2] |
| `controlHeight` / `borderRadius` / `lineWidthFocus` | `32` / `6` / `3`，官方表为 number | [S1] |
| `loading` | `boolean \| { delay: number, icon: ReactNode }`，默认 `false`；未规定统一 delay 值 | [S1] |

`colorBgElevated` 官方用于 modal、popup、menu；暗色主题会比 `colorBgContainer` 更亮。浅色主题二者同为白色，并不意味着它们属于同一语义层。[S2]

以下为 [S2] 的完整阴影值。阴影 token 的存在不构成全站加阴影的建议。

```css
/* Ant Design 官方默认：boxShadow 与 boxShadowSecondary 当前相同 */
0 6px 16px 0 rgba(0,0,0,0.08),
0 3px 6px -4px rgba(0,0,0,0.12),
0 9px 28px 8px rgba(0,0,0,0.05)

/* Ant Design 官方默认：boxShadowTertiary */
0 1px 2px 0 rgba(0,0,0,0.05),
0 1px 6px -1px rgba(0,0,0,0.03),
0 2px 4px 0 rgba(0,0,0,0.03)
```

### 3.2 Atlassian：有语义的高度，而不是遍布卡片

Atlassian 用 sunken、default、raised、overlay 四个基本层级加 overflow 特例表达空间。暗色主题中阴影不够明显，因此更高的表面还会更亮；不是简单把浅色主题反色。[S3]

| 层级 | 官方使用边界 | 官方浅色 / 深色表面别名 [S4] |
|---|---|---|
| Sunken | 内容分组的凹槽，如看板列；只能放在 default 上，不再嵌入 raised 或 overlay | `elevation.surface.sunken` = `Neutral100` / `DarkNeutral0` |
| Default | 正文基线；平面卡片可以配边框 | `elevation.surface` = `Neutral0` / `DarkNeutral100` |
| Raised | 优先用于可移动卡片；特殊强调时限制在一个区域或焦点 | `elevation.surface.raised` = `Neutral0` / `DarkNeutral200` |
| Overlay | modal、dialog、dropdown、浮动工具栏；拖动中的对象也使用此层 | `elevation.surface.overlay` = `Neutral0` / `DarkNeutral250` |
| Overflow | 内容滚出可视区的提示；通常先用边框，表格等难发现时才用阴影 | `elevation.shadow.overflow`，不是新的容器层级 |

1. Raised 与 overlay 必须配套使用对应 surface 和 shadow；不要混搭高度。[S3]
2. 官方原文：“don’t use to group content when a border or white space would suffice.” 所以不能把每个内容区都改成浮起卡片。[S3]
3. Hover/pressed 优先使用 surface 对应状态 token。高度变化是 default/raised 的可选替代方式，应少用，不适用于小控件；不要同时叠加高度变化与 hovered/pressed 表面变化。[S3]
4. [S4] 明确提供 surface 的别名而非此处直接显示的十六进制值。本文保留原别名，不把旧版色板或第三方色值冒充当前官方值。

下列阴影来自 [S4] 的 Light value 列，并通过该页面表格列结构复核，不混入 Dark value：

```css
/* Atlassian 官方：elevation.shadow.raised，浅色主题 */
0px 1px 1px rgba(30,31,33,0.25),
0px 0px 1px rgba(30,31,33,0.31)

/* Atlassian 官方：elevation.shadow.overlay，浅色主题 */
0px 8px 12px rgba(30,31,33,0.15),
0px 0px 1px rgba(30,31,33,0.31)
```

### 3.3 Carbon：工作型动效与真实完成反馈

Carbon 将动效分为 productive 与 expressive。前者适合按钮、下拉、表格等任务操作，后者留给偶发的重要时刻；不能把每次点击都做成显眼表演。[S5]

| 官方 duration token | 时长 | 官方用途 [S5] |
|---|---|---|
| `duration-fast-01` | `70ms` | 按钮、toggle 等微交互 |
| `duration-fast-02` | `110ms` | 淡入淡出等微交互 |
| `duration-moderate-01` | `150ms` | 小范围展开、短距离移动 |
| `duration-moderate-02` | `240ms` | 展开、系统沟通、toast |
| `duration-slow-01` | `400ms` | 大范围展开、重要系统通知 |
| `duration-slow-02` | `700ms` | 背景变暗 |

Productive 曲线的官方值：standard `cubic-bezier(0.2,0,0.38,0.9)`；entrance `cubic-bezier(0,0,0.38,0.9)`；exit `cubic-bezier(0.2,0,1,0.9)`。时长随移动距离和尺寸变化，不应全局统一成一个数值。[S5]

需要保留的原文细节：同一页面的检查清单又建议微交互落在 `90–120ms`。这与 token 表中的按钮 `70ms` 不完全重合，应把表格理解为可选 token，把检查清单理解为评估建议，不能改写成“Carbon 强制所有按钮 70ms”。[S5]

Carbon inline loading 的四态为 inactive、active、finished、error。反馈替换内容时应保持原位置和对齐；处理中禁用相关重复操作。finished 状态会保持 **1.5 秒**后调用可选 `onSuccess`，未提供回调时可持续显示。此值属于该组件的成功反馈行为，不是请求耗时、通用 toast 时长，也不要求人为延迟真实数据更新。[S6]

## 4. BlueMark 候选映射，全部为建议

建议采用“平面工作区 + 克制表面差异 + 清晰动作优先级 + 原位状态反馈”。以下不是官方 token，也不是已确认需求；审计后可调整或放弃。不要同时引入 Ant 和 Carbon 两套时间系统，优先沿用项目已有系统。

### 4.1 静态语义

| 建议语义 | 候选值或规则 | 使用边界 |
|---|---|---|
| `surface.canvas` / `surface.base` | `#F6F7F9` / `#FFFFFF` | 前者用于工作区底色或边区，后者用于主要内容；不把每个 section 包成白卡 |
| `surface.sunken` | 仅在需要容纳重复对象的分组区域使用 | 不在弹窗内层层加深背景 |
| `surface.raised` / `surface.overlay` | 可移动对象 / 真正覆盖界面的 UI | 阴影仅按语义出现；普通表格、表单段落默认无阴影 |
| `action.primary` | 保留品牌色语义，每个任务 section 至多一个主动作 | 建议仅当前主任务突出；删除不因高风险自动成为默认主动作 |
| `text.secondary` | 候选 `#52606D`，白底计算约 `6.456:1` | 次级信息可以弱，但仍需可读；更低优先级优先改位置、字重、间距 |
| `border.control` | 需要靠轮廓识别的控件可候选 `#7B8794` | 对白底约 `3.662:1`，对 `#F6F7F9` 约 `3.416:1`；不要让全部装饰分隔线同样突出 |

若品牌蓝需要配小字号白字，一个**仅供验证的候选**是 default `#1D4ED8`、hover `#1E40AF`、pressed `#1E3A8A`。对白字计算分别约 `6.702:1`、`8.722:1`、`10.358:1`。它们不是 Ant 官方色，也未结合 BlueMark 现有品牌、主题或真实截图验证。

### 4.2 状态与时间

以下是 BlueMark 的候选状态契约。时间值明确为建议；无障碍语义不能等待视觉动画结束才更新。

| 状态 | 应表达什么 | BlueMark 建议 |
|---|---|---|
| Hover | 可操作、当前指向 | 有限的填充/文字/轮廓变化，`100ms`；无延迟启动，不让表格行或工具按钮普遍上浮 |
| Pressed | 用户正在按下 | 立即切换到 pressed 外观，建议 `0–70ms`；不移动周围布局，不冒充 selected |
| Focus-visible | 键盘所在位置 | 立即显示独立 focus ring，不依赖 hover；可试 `2px` 轮廓加 `2px` 间隔，但须按真实背景验证，不等同自动符合 AAA |
| Selected | 持续选择、当前导航 | 持续底色加边条、勾选或字重等非单一颜色线索；移开指针后仍保留 |
| Loading | 请求已受理、尚未完成 | 立即锁定重复提交并暴露 busy/处理中语义；图标可建议延迟 `150ms` 避免短请求闪烁，但不得延迟动作响应；不为展示 spinner 强行延长请求 |
| Success | 真实结果已确认 | 仅在成功响应后显示图标与“已保存”等明确文案；可借鉴 Carbon，原位确认约 `1500ms` 后恢复命令，业务结果立即更新；重要结果不能只留一条短暂 toast |
| Error | 未成功及下一步 | 原位显示原因与重试入口，不自动短时消失；保留用户输入，不能把失败动画结束当作问题已解决 |
| 菜单/小面板 | 新区域与触发点的关系 | 候选 `150–200ms`，短距离进入；较大抽屉可 `200–240ms`；关闭不额外增加等待 |
| Reduced motion | 保持信息，减少非必要运动 | 尊重 `prefers-reduced-motion: reduce`，取消滑动、缩放、弹跳与波纹；保留即时颜色、文字、焦点和状态播报。可用静态处理中指示替代持续旋转 |

Loading 的 `150ms`、hover 的 `100ms` 等是产品建议，不是 WCAG 阈值。若已有 Ant motion token，优先采用其 `100/200/300ms` 分级；不要为了匹配本文同时改全局动画与组件默认行为。[S1] [S2] [S5] [S6]

## 5. 对比与无障碍验收

**官方组件默认值不是整页合规证明。** 需要检查实际文字、背景、透明度和各交互状态；也不能把所有分隔线都按控件识别边界处理。[S7]

1. **文字 AA：** 普通文字至少 `4.5:1`；大文字至少 `3:1`。大文字定义为至少 18pt 或 14pt 粗体，CJK 字体按等效大小理解。常规 14px 按钮文字不能因属于按钮就用 3:1。[S7，1.4.3]
2. **控件与图形 AA：** 用于识别控件、状态和必要图形的视觉信息，应与相邻颜色至少 `3:1`。不活跃控件有例外。纯装饰分隔、不是识别所必需的边框或相邻 surface 本身，并非一律要达到 3:1。[S7，1.4.11]
3. **焦点：** AA 要求键盘焦点可见，且不能被作者内容完全遮住。焦点外观的“至少相当于 2 CSS px 周长面积”和同像素状态变化至少 `3:1` 属于 **AAA 的 2.4.13**，不是 AA 的统一 2px 规定。[S7，2.4.7 / 2.4.11 / 2.4.13]
4. **信息不只靠颜色：** 成功、失败、选择须有文案、图标或其他可辨认线索。状态信息应能由辅助技术感知，不必强行移动焦点。[S7，1.4.1 / 4.1.3]
5. **减少运动：** 禁用非必要交互运动属于 AAA 的 2.3.3。W3C C39 给出 `prefers-reduced-motion` 实现方式，但 Technique 是指导性方法，不是唯一强制实现。[S7] [S8]

按 [S7] 的 sRGB 相对亮度公式，本地计算得到下列值。它们是**计算结果**，不是官方宣称的对比度，也不是对真实 BlueMark 页面的渲染测试：

| 来自官方 token 的颜色组合 | 计算对比度 | 含义 |
|---|---|---|
| `#1677FF` 与白色 | `4.1041:1` | 不足普通小字 `4.5:1`；不能仅因是官方 primary 就认为小白字已过 AA |
| `#4096FF` 与白色 | `2.9895:1` | 不足 `3:1`，也不足 `4.5:1`；验收不可四舍五入为合格 |
| `#0958D9` 与白色 | `6.1593:1` | 此颜色组合达到普通文字的对比阈值，不代表整个控件自动合规 |
| `#D9D9D9` 与白色 | `1.4115:1` | 若此边界是识别控件的必要信息则不足 3:1；不能据此断言所有 default 按钮都违规 |

## 6. 营销落地页与操作工作区

以下为结合任务性质得出的设计建议，不是研究者看过 BlueMark 或外部产品渲染后得出的结论。Carbon 对 productive / expressive 的区分提供方法依据，但没有规定所有页面必须使用某一种布局。[S5]

| 决策项 | 营销落地页 | 操作工作区 |
|---|---|---|
| 首要任务 | 理解产品与决定是否进一步行动 | 完成重复任务、比较信息、处理状态 |
| 层级来源 | 品牌、产品画面、少数核心信息与 CTA | 稳定导航、页面标题、工具栏、内容结构与任务主动作 |
| 表面与密度 | 可有更强章节对比和更宽松留白 | 有组织的密度；以未框起的区域、表格和分隔为主 |
| 动效 | 可在少量关键叙事时刻使用 expressive | 以 productive 微交互和状态过渡为主 |
| 图片与装饰 | 可用于展示真实产品或品牌 | 仅在有任务作用时出现，不挤压核心数据或抢占操作注意力 |

主任务应分别检查落地页和工作区，不把 landing 的大字号、氛围背景、卡片排列和滚动动效整体搬进日常操作面板。最终取舍与方向资产由主任务完成。

## 7. 一手来源与复核记录

全部下列页面均于 **2026-10-18 实际 GET 抓取成功，HTTP 200**。检索入口使用匿名 AnySearch；`get_sub_domains --domain code` 在垂类检索前执行，`code.doc` 查询包含必填 `library`。搜索只用于发现来源，以上证据均来自随后抓取的官方正文。

| 来源 | 页面及简短原文证据 | 文档时效 / 本地证据 |
|---|---|---|
| [S1] | Ant Design Button：“at most one primary button in a section”；正文表格列出按钮状态、token 与 loading 参数 | 页面显示 6.6.6；`ant-button.txt` |
| [S2] | Ant Design Customize Theme：`motionDurationFast`=`0.1s`；`colorBgElevated` 用于 popup layer；`motion=false` 关闭动效 | 页面显示 6.6.6；`ant-theme.txt` |
| [S3] | Atlassian Elevation：“Raised elevations can create visual noise”；“the higher the elevation, the lighter the surface looks” 明确位于暗色主题说明中 | 抓取当前官方页面；`atlassian-elevation.txt` |
| [S4] | Atlassian All Design Tokens：以 `Light value` / `Dark value` 列列出 surface 别名、raised 与 overlay 阴影 | 抓取当前官方页面；`atlassian-tokens.txt`；`atlassian-elevation-rows.txt` 复核列结构 |
| [S5] | Carbon Motion：productive “subtle and out of the way”；duration 表含 `70ms`、`110ms`、`150ms`、`240ms`、`400ms`、`700ms` | 页面标注更新 2026-08-12；`carbon-motion.txt` |
| [S6] | Carbon Inline Loading：“The success state is active for 1.5 seconds”；无 `onSuccess` 时可持续显示 | 页面标注更新 2026-09-30；`carbon-inline-loading.txt` |
| [S7] | W3C WCAG 2.2：1.4.3 规定 `4.5:1`；1.4.11 规定必要非文字视觉信息 `3:1`；另含焦点、状态信息和运动条款 | 当前抓取版标注 Recommendation 2024-12-12；`w3c-wcag22.txt` |
| [S8] | W3C Technique C39：使用 `prefers-reduced-motion` 防止非必要运动；明确 Techniques “are not required” | 页面标注更新 2026-01-12；`w3c-reduced-motion.txt` |

复核方法：抓取正文保存在 `/Users/admin/Documents/Codex/2026-10-17/zhi/work/design-audit/`，每个页面文件含请求 URL、最终 URL、HTTP 状态、抓取日期、响应字节数和原响应 SHA-256。搜索记录同目录；`contrast_check.py` 可复算上述颜色对比。AnySearch 本地 CLI 已与 README 指向的官方仓库 `anysearch-ai/anysearch-skill` 的 `v3.0.1` 源码比对，SHA-256 均为 `912c8ea187c5cbdb7966a67ab1450523171ce99902de269f1a52a4520d9584e2`。未使用 runtime.conf，未写凭证、偏好或记忆，未修改 src、server、package 文件。

[S1]: https://ant.design/components/button/
[S2]: https://ant.design/docs/react/customize-theme/
[S3]: https://atlassian.design/foundations/elevation/
[S4]: https://atlassian.design/components/tokens/all-tokens/
[S5]: https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview
[S6]: https://www.carbondesignsystem.com/building-blocks/core/components/inline-loading/guidelines
[S7]: https://www.w3.org/TR/WCAG22/
[S8]: https://www.w3.org/WAI/WCAG22/Techniques/css/C39
