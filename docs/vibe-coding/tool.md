---
order: 1
---

# 编程工具篇

包括编辑器、插件、cli 等 AI 编程工具的介绍和第三方 api key 的接入说明。

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

## Trae CN

可以配置**官方指定的第三方供应商**的 api key。

## OpenCode

在 `用户主目录/.config/opencode/opencode.jsonc` 中参考下面这样就可以配置自定义模型了：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "volcengine-plan/ark-code-latest",
  "provider": {
    "volcengine-plan": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Volcano Engine",
      "options": {
        "baseURL": "https://ark.cn-beijing.volces.com/api/coding/v3",
        "apiKey": "填你的 api key"
      },
      "models": {
        "ark-code-latest": {
          "name": "ark-code-latest",
          "limit": {
            "context": 256000,
            "output": 4096
          },
          "modalities": {
            "input": [
              "text",
              "image"
            ],
            "output": [
              "text"
            ]
          }
        },
        "doubao-seed-code": {
          "name": "doubao-seed-code",
          "limit": {
            "context": 256000,
            "output": 4096
          },
          "modalities": {
            "input": [
              "text",
              "image"
            ],
            "output": [
              "text"
            ]
          }
        },
        "glm-4.7": {
          "name": "glm-4.7",
          "limit": {
            "context": 200000,
            "output": 4096
          },
          "modalities": {
            "input": [
              "text"
            ],
            "output": [
              "text"
            ]
          }
        },
        "deepseek-v3.2": {
          "name": "deepseek-v3.2",
          "limit": {
            "context": 128000,
            "output": 4096
          }
        },
        "doubao-seed-2.0-code": {
          "name": "doubao-seed-2.0-code",
          "limit": {
            "context": 256000,
            "output": 4096
          },
          "modalities": {
            "input": [
              "text",
              "image"
            ],
            "output": [
              "text"
            ]
          }
        },
        "doubao-seed-2.0-pro": {
          "name": "doubao-seed-2.0-pro",
          "limit": {
            "context": 256000,
            "output": 4096
          },
          "modalities": {
            "input": [
              "text",
              "image"
            ],
            "output": [
              "text"
            ]
          }
        },
        "doubao-seed-2.0-lite": {
          "name": "doubao-seed-2.0-lite",
          "limit": {
            "context": 256000,
            "output": 4096
          },
          "modalities": {
            "input": [
              "text",
              "image"
            ],
            "output": [
              "text"
            ]
          }
        },
        "minimax-m2.5": {
          "name": "minimax-m2.5",
          "limit": {
            "context": 200000,
            "output": 4096
          },
          "modalities": {
            "input": [
              "text"
            ],
            "output": [
              "text"
            ]
          }
        },
        "kimi-k2.5": {
          "name": "kimi-k2.5",
          "limit": {
            "context": 256000,
            "output": 4096
          },
          "modalities": {
            "input": [
              "text",
              "image"
            ],
            "output": [
              "text"
            ]
          }
        }
      }
    }
  }
}
```
