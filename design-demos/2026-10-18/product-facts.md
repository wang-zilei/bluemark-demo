# 本轮事实与来源

核验日期：2026-10-18。设计判断与事实分开记录。

1. BlueMark 本机运行于 `localhost:5173`，对应 checkout 为 `outputs/bluemark`。Vite 进程 cwd 已通过 `lsof` 核验，当前没有 Git 仓库。原型文件不会修改正式源码。
2. 山野气泡茶为项目内置虚构案例。默认实际可见 2 个项目、1 个案例、11 条内容，KPI 为规划目标，实测数据未采集。证据：本地网页、本地 `src/data.ts` 和本次 `before/` 截图。
3. Linear 官方产品介绍页存在并已抓取正文：<https://linear.app/>。本轮截图只能看到导航，主体未正常渲染，因此不把它作为已视觉核验的有效参考，也不借其配色为 BlueMark 定稿。
4. Asana 官方工作管理介绍页存在并已抓取正文：<https://asana.com/uses/work-management>。已通过 Ego 浏览器截图并亲眼检查 `refs/asana.png`：访客导航与类别大标题明显，登录和开始使用与产品内容分开。只借其页面身份与动作层级，不复制品牌色、登录表单或营销数据。
5. Radix 官方颜色分层页面已完整读取：<https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale>。1–2 用于背景，3–5 用于默认/悬停/按下或选中表面，6–8 用于边框，9–10 用于实底与悬停，11–12 用于文字。编号是语义用途，不是本项目复制来的十六进制值。
6. Ant Design、Atlassian、Carbon、W3C 的已抓取规范、精确默认值和建议映射见 `research.md`。来源默认值不直接等同 BlueMark 采用值。
7. Ant Design Button 官方页面已实际打开、截图并查看 `refs/antd.png`，用于核实按钮优先级与操作状态。`ref_board.py` 因缺少 Python Playwright 无法直接运行，使用现有 Ego Chromium 获取同等真实截图，不额外安装浏览器。
