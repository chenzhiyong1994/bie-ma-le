# 微信云开发部署与真机验收

本项目的生产链路不再依赖自建 HTTP API 或第三方模型密钥。小程序使用 `wx.cloud` 访问同一个云开发环境中的存储与 `bml-api-v2` 云函数，云函数通过服务端 `@cloudbase/node-sdk` 调用该环境已启用的 AI 模型，并通过 `wx-server-sdk` 云调用生成分享海报所需的小程序码。

## 一次性配置

1. 用微信开发者工具导入仓库，选择你自己的小程序 AppID，并确认该 AppID 已关联目标云开发环境。仓库中的 `touristappid` 仅用于公开示例。
2. 复制控制台显示的环境 ID，填入 `apps/miniprogram/config/cloud.js` 的 `environmentId`。环境 ID 不是密钥，可以随小程序代码发布。
3. 进入云开发 AI+ 的模型页面，启用套餐中可用的模型。代码默认使用：
   - 模型组：`cloudbase`
   - 模型：`hy3`
4. 如果控制台显示的是其他模型组或模型，在 `bml-api-v2` 云函数的“函数配置 → 环境变量”中设置：
   - `CLOUDBASE_AI_PROVIDER`：模型组名称
   - `CLOUDBASE_AI_MODEL`：具体模型 ID

模型组不是厂商名。具体取值必须以当前环境控制台为准；例如小程序成长计划环境可能使用 `hunyuan-exp` 模型组。不要把腾讯云 SecretId、SecretKey 或任何第三方 API Key 写进小程序代码或仓库。

## 构建和部署云函数

在项目根目录执行：

```powershell
npm install
npm run build:cloud
```

微信开发者工具会根据 `project.config.json` 的 `cloudfunctionRoot` 显示 `dist/cloudfunctions/bml-api-v2`。产物中的 `config.json` 声明了 `wxacode.getUnlimited` 云调用权限，不能删除。先在云开发控制台创建同名普通云函数并选择 Node.js 20.19，再右键 `bml-api-v2`，选择“上传并部署：云端安装依赖”。部署设置建议：

- 运行时：Node.js 20.19；PDF 文本提取使用无原生 Canvas 依赖的 `unpdf`
- 小程序 AppID 必须与当前云开发环境关联，否则 `cloud.openapi.wxacode.getUnlimited` 无法生成小程序码
- 内存：至少 512 MB
- 函数超时：120 秒，为 AI 资源池 429 的 31 秒指数退避预留空间
- 环境变量：`AI_TIMEOUT_MS=55000`，让模型请求先于平台强制中断返回
- 入口：`index.main`

每次修改云函数、AI 角色或文件解析逻辑后，都要重新运行 `npm run build:cloud` 并重新部署。`dist/` 是可重复构建的部署产物，不提交 Git。

仅修改普通函数代码时，也可以使用 CloudBase CLI 在项目根目录按 `cloudbaserc.json` 精确更新，避免因离开配置文件目录而进入交互式推测流程：

```powershell
npm run build:cloud
npx --yes -p @cloudbase/cli@3.6.3 tcb fn code update bml-api-v2 --deployMode cos --env-id <环境 ID>
```

CloudBase CLI 的 `fn code update` 只更新函数代码和入口；新增或修改 `config.json` 中的微信 OpenAPI 权限时，必须改用微信开发者工具重新上传云函数。权限配置可能有约 10 分钟缓存。

部署后先用 `tcb fn invoke bml-api-v2 --data '{"action":"noop"}'` 做启动检查。返回业务错误 `UNKNOWN_ACTION` 表示进程和依赖已正常加载；如果返回 `code exit unexpected`，不要继续做 PDF 或 AI 复测。`noop` 不能证明新 Action 已部署，排错时还应使用 `tcb fn code download` 检查云端产物中是否存在对应 Action 及依赖。

`wxacode.getUnlimited` 云调用必须由小程序客户端触发。直接用 CLI 调用 `generateShareCode` 会因缺少微信云调用鉴权返回 `INVALID_WX_ACCESS_TOKEN`，不能作为分享功能失败的证据；应在开发者工具或真机中点“分享”，再检查函数日志和海报预览。CloudBase 的 `IgnoreSysLog` 配置不能阻止事件和返回值进入系统日志，隐私保护依赖临时文件协议，不能依赖日志开关。

## 真机业务验收

1. 把一份可复制文字、80 字以上、8 MB 以下的 PDF 发到微信聊天或文件传输助手。
2. 在小程序中选择角色和评审方式，点“选择评审文件”，选择该 PDF。
3. 页面应先显示上传解析中，成功后只显示文件名称、大小和格式，不展示解析正文，也不把正文回填到“粘贴文本”。
4. 分别切换文件与文本 Tab，确认提交只使用当前 Tab；当前 Tab 为空或未解析完成时必须拦截。随后勾选云端处理提示并开始真实评审。
5. 处理页完成后应展示带原文证据、修改建议和验收标准的报告。
6. 在云开发控制台确认：
   - `bml-api-v2` 有本次调用记录；事件和返回日志只包含随机 `fileID`，不含材料正文、目标背景或报告。
   - 云存储 `temporary-materials/`、`temporary-payloads/` 和 `temporary-results/` 下没有遗留本次文件。
   - AI 用量出现本次调用。
   - 数据库没有新增材料或报告集合。
7. 分别在首页和一份真实报告末尾生成海报，确认四角色总览图和单角色邀请图能预览、保存到相册；用另一台设备长按识别小程序码，分别进入首页和对应角色详情页。相册权限被拒绝时应出现设置引导，取消后不影响继续使用。

## 常见错误

| 提示 | 检查项 |
| --- | --- |
| 云开发环境未正确关联 | `config/cloud.js` 环境 ID、控制台小程序 AppID 关联关系 |
| 云函数尚未部署 | 是否已执行 `npm run build:cloud` 并部署 Node.js 20.19 的 `bml-api-v2` |
| 小程序码生成失败 | 日志为 `-604101` 时检查产物 `config.json` 是否声明 `wxacode.getUnlimited` 并已通过微信开发者工具重新上传；其次检查 AppID 关联、`wx-server-sdk` 和扫码目标页面 |
| 云开发环境尚未启用当前模型 | AI+ 控制台的模型开关，以及函数环境变量中的模型组/模型 ID |
| 文件没有拆开 | PDF 是否为扫描件、是否超过 8 MB、扩展名和内容是否一致 |
| 云开发 AI 响应超时 | 云函数超时设置、所选模型速度；生产验收优先使用套餐内快速模型 |

官方参考：[小程序调用 AI](https://docs.cloudbase.net/ai/model/miniprogram-access)、[Node SDK 调用 AI](https://docs.cloudbase.net/api-reference/server/node-sdk/ai)、[获取小程序码](https://docs.cloudbase.net/lowcode/practices/miniapp-guide/get-qrcode)、[云函数调用](https://docs.cloudbase.net/cloud-function/how-use)、[云函数环境变量](https://docs.cloudbase.net/cloud-function/function-configuration/env)。
