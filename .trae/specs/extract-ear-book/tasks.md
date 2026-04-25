# Tasks

- [x] Task 1: 创建新书籍根目录结构
  - [x] 创建 `06-listening-world/` 目录
  - [x] 创建书籍前言页 `index.md`（含 shortTitle: 倾听世界 frontmatter）
  - [x] 创建书籍目录页 `toc.md`
  - [x] 创建附录/术语表文件 `99-glossary.md`

- [x] Task 2: 创建篇目录结构
  - [x] 创建第一篇目录 `01-basics/`（基础篇）
  - [x] 创建第二篇目录 `02-diagnosis/`（诊断篇）
  - [x] 创建第三篇目录 `03-treatment/`（治疗篇）
  - [x] 在每个篇目录下创建 `index.md` 首页文件

- [x] Task 3: 迁移并重组内容文件
  - [x] 将 `01-hearing-loss.md` 内容迁移到基础篇作为第一章
  - [x] 将 `02-diagnosis.md` 内容迁移到诊断篇作为第一章
  - [x] 将 `04-tympanogram.md` 内容迁移到诊断篇作为第二章
  - [x] 将 `03-treatment.md` 内容迁移到治疗篇作为第一章
  - [x] 更新各文件的 frontmatter 和标题层级

- [x] Task 4: 迁移附件资源
  - [x] 移动 `_attachments/` 目录到新书籍根目录
  - [x] 更新所有图片引用路径

- [x] Task 5: 清理原目录
  - [x] 删除原 `01-ear/` 目录下的内容文件
  - [x] 更新原 `01-ear/index.md` 添加跳转说明

- [x] Task 6: 验证构建
  - [x] 执行 `npm run lint` 验证 Markdown 格式和类型检查
  - [x] 检查所有页面和链接可正常访问

# Task Dependencies
- Task 3 依赖 Task 2 完成
- Task 4 依赖 Task 3 完成
- Task 5 依赖 Task 4 完成
- Task 6 依赖所有前置任务完成
