# 修复文档内容风格违规 Spec

## Why
AGENTS.md 规定了文档内容风格要求，特别是禁止使用 `---` 水平分隔线。需要检查整个文档目录，找出不符合要求的部分并进行修复。

## What Changes
- 检查 `docs/` 目录下所有 Markdown 文件
- 找出使用 `---` 水平分隔线的文件
- 删除或替换所有违规的水平分隔线
- 验证其他内容风格要求（语言、语气、结构、链接）

## Impact
- Affected files: `docs/` 目录下所有 `.md` 文件
- Affected systems: 文档渲染、阅读体验

## ADDED Requirements
### Requirement: 内容风格一致性
所有文档 SHALL 遵循 AGENTS.md 中的内容风格要求。

#### Scenario: 检查水平分隔线
- **WHEN** 扫描所有 Markdown 文件
- **THEN** 不应找到任何 `---` 水平分隔线（frontmatter 除外）

#### Scenario: 验证内容风格
- **WHEN** 检查文档内容
- **THEN** 语言应为中文为主，技术术语保留英文
- **THEN** 语气应专业、友好、实用
- **THEN** 应使用清晰的标题层级（##、###）
- **THEN** 外部资源必须提供完整 URL

## MODIFIED Requirements
无

## REMOVED Requirements
无
