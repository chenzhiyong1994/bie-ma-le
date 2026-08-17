# 多角色评审与材料 API

生产接口由微信云开发 Node.js 20.19 的 `bml-api-v2` 云函数承载，服务于四个公开暴君角色。它使用临时云存储、内存文件解析和云开发 AI，不提供长期历史存储。`services/api` 只保留为本地测试适配器。

小程序调用：`wx.cloud.callFunction({ name: 'bml-api-v2', data })`。涉及材料的事件与返回值只传操作名、随机 ID、文件类型和临时云存储 `fileID`，不直接传正文、目标背景或报告；海报码操作只传公开角色标识并返回公开二维码图片。

- `parseMaterial`：事件传原文件 `fileId` 和 `fileType`；函数删除原文件并返回结果 JSON 的 `resultFileId`。
- `createReview`：客户端先把评审输入写入临时私有 JSON，事件传 `requestFileId`；函数读取并删除输入，再返回报告 JSON 的 `resultFileId`。
- `generateShareCode`：事件只传 `posterType` 和可选的公开 `roleId`；函数生成固定入口的小程序码并返回公开图片 Base64，不接收页面路径、报告或材料内容。
- 解析和评审客户端读取结果 JSON 后立即删除结果文件。该协议用于避免 CloudBase 系统日志持久化敏感事件或返回值。

## 分享小程序码

云函数 action：`generateShareCode`

首页总览海报请求：

```json
{
  "action": "generateShareCode",
  "posterType": "home"
}
```

单角色海报请求：

```json
{
  "action": "generateShareCode",
  "posterType": "role",
  "roleId": "resume-terminator"
}
```

服务端只允许已发布的公开角色，并把入口固定为 `pages/home/index` 或 `pages/role/index`；客户端传入的其他页面字段会被忽略。响应中的 `imageBase64` 由前端临时写入本地文件并参与 Canvas 合成，二维码文件在导出海报后立即删除。

## 配置

| 环境变量 | 说明 |
| --- | --- |
| `CLOUDBASE_AI_PROVIDER` | 云开发 AI 模型组，默认 `cloudbase` |
| `CLOUDBASE_AI_MODEL` | 当前环境已启用的具体模型，默认 `hy3` |
| `AI_TIMEOUT_MS` | 单次模型调用超时，默认 55000 毫秒，需小于云函数 120 秒上限 |
| `AI_MAX_OUTPUT_TOKENS` | 最大输出 token，默认 6000 |

生产云函数使用环境临时凭证，不配置 SecretId、SecretKey 或第三方 API Key。本地调试适配器另需 `CLOUDBASE_ENV_ID`、`TENCENT_SECRET_ID` 和 `TENCENT_SECRET_KEY`。

云开发 AI 首次调用若在 5 秒内发生未分类的瞬时传输失败，服务端等待 300 毫秒后重试一次。明确的并发限制会按 1、2、4、8、16 秒指数退避，最多额外重试 5 次；这段 31 秒的等待由 120 秒云函数上限覆盖。模型未启用、额度耗尽、显式超时以及耗时超过 5 秒的未分类失败不会触发传输重试。该重试与报告专业质量校验失败时最多两次重建相互独立。

## 创建评审

云函数 action：`createReview`

```json
{
  "roleId": "resume-terminator",
  "reviewMode": "general",
  "contextText": "",
  "materialText": "80-20000 字的待评材料正文"
}
```

公开角色 ID：

- `resume-terminator`：简历暴君
- `report-debt-collector`：汇报暴君
- `copy-judge`：文案暴君
- `product-tyrant`：产品暴君

`reviewMode` 必须为 `general` 或 `targeted`。默认使用 `general`，服务端会忽略 `contextText`；`targeted` 必须提交 20-8000 字的目标或背景，例如完整 JD、汇报对象与决策、传播目标与受众、产品阶段与约束。

为兼容旧版简历客户端，服务端暂时接受 `jd`、`jobDescription` 和 `resumeText`，新客户端不应继续使用这些字段。

小程序在本地生成一次性任务 ID 并保持处理页状态；云函数完成后返回报告。响应不会回传 `materialText` 或 `contextText`。

## 报告协议

四个角色共用同一结构，并由角色包决定专业身份、四项评分维度和表达方式：

- `qualityBand`：`critical`（0-49）、`rebuilding`（50-79）或 `ready`（80-100）。
- `strengths`：0-3 条可保留优势，每条包含原文证据、分析和价值。
- `issues`：0-3 个聚类问题，每个包含严重度、1-8 条引用或缺失证据、诊断、影响、对应建议和验收标准。
- `scores`：四个角色专属维度及评分理由。

低质量材料聚焦关键问题；有明显改善的材料必须同时指出成立的优势；达到可用水平的材料不为维持“暴君感”而虚构问题或强塞侮辱。

## 解析材料文件

云函数 action：`parseMaterial`

小程序先通过 `wx.cloud.uploadFile` 把文件放入 `temporary-materials/`，再把 `fileId` 和原始文件名交给云函数。支持带可提取文字的 PDF 和 `.docx`，单文件最大 8MB；不支持扫描版 PDF 和旧版 `.doc`。

成功返回文件名、文件类型、提取字符数、纯文本和非阻断警告。云函数在 `finally` 中删除云存储原文件；下载后的 Buffer 只在函数内存中解析。客户端把解析文本保存在独立的文件输入状态中，界面只展示文件名称、大小和格式，不回填粘贴文本框；创建评审时只把当前选中 Tab 对应的正文作为 `materialText`。

## 查询评审

处理页在本次小程序进程内维护 `queued`、`analyzing`、`completed`、`failed` 状态。完成后只把结构化报告和调用元数据放入全局一次性展示状态；离开小程序后不提供恢复或历史查询。

## 安全约束

- 云函数不主动记录目标背景、材料、文件名或模型原始输出。
- 上传文件先进入同环境临时云存储，云函数下载后立即删除；原文件不会发送给模型，只有提取正文会发送给同环境云开发 AI。
- 材料、报告和任务不写云数据库；数据库套餐能力暂不进入当前一次性产品路径。
- 每条引用型证据必须能在原文中找到；缺失型证据必须明确标记“信息缺失”。
- 每条优势和问题都必须有材料证据；一个问题可聚合同类证据，但不能用数量替代判断。
- 每条问题必须包含对应修改建议和验收标准，不生成独立追问或重建清单。修改建议至少包含具体执行顺序与可套用结构，通过标准至少包含两项字段、数量、时间、对象或读者复述结果等客观检查条件。
- 报告可以使用真实职场里的尖刻反问、冷嘲、短命令和作品级狠词，但这些表达不设数量配额，也不参与通过校验。任何层级都不允许人格或智力嘲讽。
- 亲属攻击、身份歧视、疾病/残障羞辱、威胁和整体人类价值否定仍会被安全校验拦截。
- 输出结构缺失、质量分层矛盾、证据伪造或越界攻击时最多自动重建两次，再失败则终止展示；不会只因狠词次数、语气强弱或隐喻风格重建。
