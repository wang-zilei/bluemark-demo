# BlueMark 架构与边界

BlueMark 是本地优先的响应式网页应用。React 工作台负责业务操作，Zustand 负责项目状态与顺序任务，Node / Express 负责模型代理；没有桌面或移动客户端，也没有已实现的多用户后端。

## 模块职责

任务生成、存储和导出相互独立，前后端共享任务数据契约。当前采用少量直接模块，不为展示项目引入额外微服务。

| 模块                 | 职责                                                                | 不负责                     |
| -------------------- | ------------------------------------------------------------------- | -------------------------- |
| `src/domain.ts`      | Brief、Project、Solution、ContentItem、UsageLog、模型配置与步骤类型 | 运行时数据校验             |
| `src/data.ts`        | 内置虚构案例、示例日志、按输入重算的 Mock 模板                      | 真实调研或投放结果         |
| `src/engine.ts`      | AIProvider、任务提示、JSON 解析与任务级 Zod 校验                    | 持久化或人工批准           |
| `src/persistence.ts` | 校验保存数据的字段形状、枚举及结构                                  | 云端迁移、备份导入         |
| `src/store.ts`       | 配置预检、顺序生成、状态、复用、操作记录与 localStorage             | 后台持续任务、跨浏览器同步 |
| `src/export.ts`      | Markdown/JSON/HTML 序列化、转义、浏览器下载                         | 外部发布、文件落盘完成证明 |
| `server/proxy.ts`    | 本机 `/api`、上游请求、配置、安全限制与响应校验                     | 用户登录、RBAC、费用审计   |
| `server/index.ts`    | loopback 服务入口、生产构建静态服务和 SPA 回退                      | 公网生产访问策略           |

## 数据与状态

案例是项目的一个标记，不是脱离项目的静态页面。方案、内容与日志都通过项目 ID 关联。

1. `Project` 包含 Brief、Solution、步骤状态和 `reviewedModules`；内容另有逐条审核状态。生成完成只进入待审核，人工确认才可标记交付。
2. 案例复制创建新项目和内容 ID，以 `sourceCaseId` 指向来源。保留业务正文，清空模块审核、内容审核和生成步骤，不复制原项目的成功操作记录。
3. `UsageLog.isExample` 区分内置历史。用户操作在示例项目上执行时也属于当前真实本地操作，但不等于调用过真实模型或产生了投放成果。
4. KPI 是目标与口径，不是观测值。未接入实际数据时写“未采集”，不能填充虚假完成率。

## 执行路径

编排器逐步保存已校验输出，失败在当前任务停止。它不是具备任意工具调用能力的通用自主 Agent。

```text
网页操作 → Zustand run(projectId, optionalStep)
  → 配置预检（真实模式才 GET /api/status）
  → validate → audience → market → opportunity → positioning
  → strategy → creatives → matrix → contents → timeline
  → kpis → compliance → quality
  → 每步校验 / 保存 / 记录 → 待审核 → 人工确认 → 导出

Mock：generateStep → MockProvider → 动态模板 → Zod
真实：generateStep → OpenAICompatibleProvider → POST /api/generate
      → Express → Chat Completions json_object → 解析 / Zod → 前端 Zod
```

1. 每个步骤消费 Brief 和已保存的前序方案，返回本步骤字段；步骤具有 pending、running、success、error、尝试次数和执行时间。
2. 已有成功步骤的项目从首个未完成步骤继续；指定单步只重试该模块。项目生成中阻止重复启动。
3. 缺少所有 Key 且预检成功时明确切换 Mock；代理连接失败、HTTP 错误或非法输出不自动降级，不写伪成功。
4. JSON mode 约束 JSON 格式，不保证任务内容正确。Zod 验证必需字段、枚举、数值和结构；有限修复不补造被截断的业务字段。
5. 刷新不会续接请求。加载时把“生成中”变为草稿，把 running 步骤变为可重试中断错误，保留成功步骤与方案。

## 密钥与代理

生产密钥不得进入网页 bundle。环境变量名使用服务端 `AI_*`，`VITE_BASE_PATH` 仅用于公开路径。

1. 存在 `AI_API_KEY` 时由服务端 `AI_BASE_URL`、`AI_MODEL` 等参数组成有效配置，覆盖网页参数。无服务端 Key 时可使用网页会话内存 Key。
2. localStorage 写入前强制清空 `config.apiKey`，读取旧快照也清空。工作空间与方案导出不应携带密钥；业务字段中由用户手动输入的秘密仍需自行清理。
3. API 为 `GET /api/status`、`POST /api/test`、`POST /api/generate`。连接测试由用户显式触发；仅查询状态不是一次成功模型调用。
4. 代理限制本机同源变更请求、JSON 请求体、模型参数、超时和响应大小。公网强制 HTTPS，默认拒绝内网、URL 凭证和重定向，并固定已校验的 DNS 解析结果以减少 SSRF 风险；`ALLOW_LOCAL_AI=true` 仅额外允许 loopback HTTP。
5. 上游错误使用受控错误类型，不回显原始响应体、授权头或密钥。生成文本仍是不可信业务数据，HTML 导出必须转义，不能直接执行。

## 持久化与部署

当前持久化只保障当前 origin 内的本地保存，不提供集中存储、历史版本恢复或不可篡改证据。

1. 保存版本为 1，键为 `bluemark.workspace.v1`。读取时校验项目、日志、配置、设置与草稿；损坏数据触发 `storageBlocked`，不覆盖原始快照。容量失败显示错误，内存内容仍可导出。
2. Vite 开发服务把 `/api` 转发至 8787；生产本机 Node 同时服务 `dist` 和 SPA 回退。`npm run preview` 不提供模型代理。
3. Netlify/Vercel 静态部署使用随库 SPA 回退配置，仅运行 Mock。Pages 子路径用 `VITE_BASE_PATH` 配合 BrowserRouter basename，还需 `404.html` 回退；CI 不部署这些产物。
4. 当前代理绑定 `127.0.0.1` 并校验本机 Host/Origin。公网部署必须重新设计经认证的 API 入口，不应直接放宽现有本机限制。

## 权限预留

用户、工作空间、项目和模型配置权限是建议的后续设计，尚未实现。UI 中“本地用户”“管理员”不代表有身份认证或权限隔离。

| 建议对象                      | 生产化约束                                                 |
| ----------------------------- | ---------------------------------------------------------- |
| User / Workspace / Membership | 服务端身份、租户归属和成员角色                             |
| Project / ProjectPermission   | 所有读写与导出在服务端检查工作空间和项目权限               |
| ModelCredential               | 独立配置权限、密钥托管、轮换与调用额度                     |
| GenerationRun / AuditEvent    | 后台任务状态、版本、真实执行者和不可由客户端随意改写的审计 |

## 验证边界

自动化回归区分业务编排、Provider、代理和导出，不以 Mock 成功冒充供应商联调。

1. `store.test.ts` 在 Node 环境通过 `vi.stubGlobal` 隔离 localStorage 和网络，保留真实 Schema，仅替换生成函数；覆盖项目、脱敏、恢复、审核、配置预检和失败记录。
2. `export.test.ts` 覆盖必需章节、JSON 数据保真、日志隔离与 HTML XSS 转义。下载 API 成功仅表示请求交给浏览器，不证明用户已将文件保存到磁盘。
3. engine/data/proxy 测试由对应模块维护，真实供应商验证需单独获得授权并记录结果。CI 只安装、类型检查、测试和构建，不调用付费模型或部署。
4. 上线前还需身份认证、RBAC、数据库、版本并发、后台队列、成本限额、审计和真实数据归因。模型的策略建议与合规检查均需人工复核。
