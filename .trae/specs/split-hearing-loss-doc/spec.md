# 耳聋文档拆分 Spec

## Why

`01-hearing-loss.md` 文件内容较长，包含多个主题。将【诊断方法】和【干预与治疗】拆分为独立文件，有助于：
- 提高文档可读性和维护性
- 便于读者快速定位特定内容
- 符合文档模块化的最佳实践

## What Changes

- 从 `01-hearing-loss.md` 提取【诊断方法】章节，创建新文件 `02-diagnosis.md`
- 从 `01-hearing-loss.md` 提取【干预与治疗】章节，创建新文件 `03-treatment.md`
- 在原文件中保留简要说明和链接指向新文件

## Impact

- Affected code: 
  - `docs/05-health-handbook/04-five-senses/23-ent/01-ear/01-hearing-loss.md`（修改）
  - `docs/05-health-handbook/04-five-senses/23-ent/01-ear/02-diagnosis.md`（新建）
  - `docs/05-health-handbook/04-five-senses/23-ent/01-ear/03-treatment.md`（新建）
  - `docs/05-health-handbook/04-five-senses/23-ent/01-ear/index.md`（修改）

## ADDED Requirements

### Requirement: 诊断方法文档
文件 `02-diagnosis.md` 应包含：
- 从原文件提取的完整【诊断方法】章节内容
- 保持原有内容结构和格式
- 添加适当的 frontmatter（title 字段）

### Requirement: 干预与治疗文档
文件 `03-treatment.md` 应包含：
- 从原文件提取的完整【干预与治疗】章节内容
- 保持原有内容结构和格式
- 添加适当的 frontmatter（title 字段）

### Requirement: 原文件修改
`01-hearing-loss.md` 应：
- 移除已拆分的章节内容
- 在相应位置添加指向新文件的链接
- 保持其他内容不变

### Requirement: 目录索引更新
`index.md` 应：
- 在章节内容表格中添加新文件的链接
- 保持表格格式一致
