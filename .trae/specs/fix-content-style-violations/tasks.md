# Tasks

- [x] Task 1: 扫描所有 Markdown 文件，查找违规的水平分隔线
  - [x] SubTask 1.1: 使用 Grep 搜索 `---` 模式（排除 frontmatter）
  - [x] SubTask 1.2: 列出所有违规文件和位置
  - [x] SubTask 1.3: 统计违规数量

- [x] Task 2: 修复违规的水平分隔线
  - [x] SubTask 2.1: 修复 06-listening-world 目录下所有文件
  - [x] SubTask 2.2: 修复 05-health-handbook 目录下所有文件
  - [x] SubTask 2.3: 确保修复不影响文档结构

- [x] Task 3: 验证其他内容风格要求
  - [x] SubTask 3.1: 检查语言风格（中文为主，技术术语保留英文）
  - [x] SubTask 3.2: 检查标题层级是否清晰
  - [x] SubTask 3.3: 检查外部链接是否完整

- [x] Task 4: 运行 lint 检查确保修改正确

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 3
