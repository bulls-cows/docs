# 倾听世界规范

## Why
将耳部健康相关内容从《健康科普手册》的耳鼻喉科章节中独立出来，形成《倾听世界》专门书籍，以轻松亲切的方式向读者普及耳部健康、听力保护、耳聋防治等知识。

## What Changes
- 在 `docs/` 目录下创建新书籍根目录 `06-ear-health/`
- 将原有 `05-health-handbook/04-five-senses/23-ent/01-ear/` 下的内容迁移到新书籍目录
- 按书籍规范组织层级结构：前言(index.md) → 目录(toc.md) → 篇 → 章 → 节
- 更新 frontmatter 配置
- 移动附件资源到新位置
- 更新内部链接引用

## Impact
- Affected specs: 健康科普手册书籍规范
- Affected code: 侧边栏自动生成逻辑（新书籍将自动出现在导航栏）

## ADDED Requirements
### Requirement: 新书籍结构
新书籍 SHALL 遵循书籍命名规范，具备完整的三级结构（篇→章→节）。

#### Scenario: 成功创建独立书籍
- **WHEN** 用户访问 `/06-listening-world/`
- **THEN** 显示《倾听世界》的前言页面
- **AND** 导航栏显示"倾听世界"入口
- **AND** 侧边栏显示完整的书籍目录结构

### Requirement: 内容完整性
迁移过程 SHALL 保留所有原有内容，包括文本、图片链接、表格等。

#### Scenario: 内容迁移完整
- **WHEN** 对比新旧目录下的内容
- **THEN** 所有文本内容完全一致
- **AND** 所有图片资源可正常访问
- **AND** 所有内部链接正确更新

## MODIFIED Requirements
无

## REMOVED Requirements
无
