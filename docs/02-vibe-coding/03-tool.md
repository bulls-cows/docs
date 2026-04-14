
# 编程工具篇

包括编辑器、插件、cli 等 AI 编程工具的介绍和第三方 api key 的接入说明。

## CodeBuddy

- [CodeBuddy 文档](https://www.codebuddy.cn/docs/ide/Introduction)
- 工具形式：`VS Code` 衍生编辑器。
- 默认兼容 `AGENTS.md` 文档。
- 支持 `/技能名` 召唤技能。
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
            "name": "京东云",
            "vendor": "京东云",
            "apiKey": "填你的 api key",
            "maxInputTokens": 200000,
            "maxOutputTokens": 8192,
            "url": "https://modelservice.jdcloud.com/coding/openai/v1",
            "supportsToolCall": true,
            "supportsImages": true
        },
        {
            "id": "GLM-4.7",
            "name": "京东云",
            "vendor": "京东云",
            "apiKey": "填你的 api key",
            "maxInputTokens": 200000,
            "maxOutputTokens": 8192,
            "url": "https://modelservice.jdcloud.com/coding/openai/v1",
            "supportsToolCall": true,
            "supportsImages": true
        },
        {
            "id": "DeepSeek-V3.2",
            "name": "京东云",
            "vendor": "京东云",
            "apiKey": "填你的 api key",
            "maxInputTokens": 200000,
            "maxOutputTokens": 8192,
            "url": "https://modelservice.jdcloud.com/coding/openai/v1",
            "supportsToolCall": true,
            "supportsImages": true
        },
        {
            "id": "MiniMax-M2.5",
            "name": "京东云",
            "vendor": "京东云",
            "apiKey": "填你的 api key",
            "maxInputTokens": 200000,
            "maxOutputTokens": 8192,
            "url": "https://modelservice.jdcloud.com/coding/openai/v1",
            "supportsToolCall": true,
            "supportsImages": true
        },
        {
            "id": "Kimi-K2.5",
            "name": "京东云",
            "vendor": "京东云",
            "apiKey": "填你的 api key",
            "maxInputTokens": 200000,
            "maxOutputTokens": 8192,
            "url": "https://modelservice.jdcloud.com/coding/openai/v1",
            "supportsToolCall": true,
            "supportsImages": true
        },
        {
            "id": "Kimi-K2-Turbo",
            "name": "京东云",
            "vendor": "京东云",
            "apiKey": "填你的 api key",
            "maxInputTokens": 200000,
            "maxOutputTokens": 8192,
            "url": "https://modelservice.jdcloud.com/coding/openai/v1",
            "supportsToolCall": true,
            "supportsImages": true
        },
        {
            "id": "Qwen3-Coder",
            "name": "京东云",
            "vendor": "京东云",
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

- [Trae 官网](https://www.trae.com.cn/)
- 工具形式：独立 IDE（基于 VS Code 内核）
- 定位："The Real AI Engineer" — 真正的 AI 开发工程师

### 核心功能 {#trae-feature}

- **SOLO 模式**：AI 主导的全流程开发，理解需求 → 分解任务 → 自动执行
- **智能协作**：AI 与用户高效配合，支持上下文理解和工具调度
- **端到端支持**：覆盖需求分析、代码编写、测试部署的全生命周期
- **多模型支持**：可配置官方指定的第三方供应商 API Key

### 使用方式

1. 下载并安装 Trae IDE
2. 进入 SOLO 模式，输入任务目标
3. AI 自动分解并执行开发任务

### 适用场景

- 全流程项目开发（从需求到部署）
- 自动化处理重复性开发任务
- 团队协作增效

## OpenCode

- [OpenCode 官网](https://opencode.ai)
- [OpenCode 文档](https://opencode.ai/docs/zh-cn)
- 工具形式：CLI 终端工具 + IDE 扩展 + 桌面应用（Beta）
- 定位：开源 AI 编程代理，强调隐私保护

### 核心功能

- **LSP 支持**：自动为 LLM 加载合适的 Language Server Protocol，提升代码补全和分析能力
- **多会话并行**：可在同一项目中启动多个代理会话，独立处理不同任务
- **会话分享**：支持生成会话链接，便于分享、参考或调试
- **多模型支持**：支持 75+ LLM 提供商（包括本地模型），通过 Models.dev 连接
- **隐私保护**：不存储用户代码或上下文数据，适合对隐私敏感的环境

### 安装方式

**一键安装（Linux/macOS）：**

```bash
curl -fsSL https://opencode.ai/install | bash
```

**包管理器安装：**

```bash
# npm
npm install -g opencode

# Homebrew
brew install opencode
```

**桌面应用：**支持 macOS、Windows、Linux，可从官网下载 Beta 版

### 配置自定义模型

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
