---
order: 1
---

# 编程工具篇

包括编辑器、插件、cli 等 AI 编程工具。

## CodeBuddy

- [CodeBuddy 文档](https://www.codebuddy.cn/docs/ide/Introduction)
- 工具形式：`VS Code` 衍生编辑器。
- 默认兼容 `AGENTS.md` 文档。
- 支持 `/技能名` 召唤技能，但是没有提示。
- 支持规则。
- 支持生成 git 提交信息。
- 支持选中代码添加到对话框。
- 支持右键打开的文件 tab 将文件添加到对话框。
- 支持右键选择左侧资源管理器中的文件，将文件添加到对话框。
- 支持自动模式、问答模式、计划模式。
- 支持配置第三方 `openai` 兼容 api key。

在 `用户主目录/.codebuddy/models.json` 里参考下面这样就可以配置自定义模型了：

```json
{
    "models": [
        {
            "id": "GLM-5",
            "name": "GLM-5",
            "vendor": "京东云coding plan",
            "apiKey": "填你的 api key",
            "maxInputTokens": 200000,
            "maxOutputTokens": 8192,
            "url": "https://modelservice.jdcloud.com/coding/openai/v1",
            "supportsToolCall": true,
            "supportsImages": true
        }
    ]
}
```
