# AGENTS.md 更新计划

## 总结的经验

### 经验 1：Project Structure 需保持同步
实际目录中有 **6 本书籍**，但 AGENTS.md 中只列出了 5 本，导致遗漏第 6 本书 `06-listening-world/`。

### 经验 2：README.md 内容边界需更清晰
- 技术栈信息对普通读者无意义，不应放在 README.md 中
- 致谢开源项目对普通读者无意义，不应放在 README.md 中
- README.md 应只保留核心内容：项目介绍、书籍列表、特色亮点、联系方式等

## 更新步骤

### 步骤 1：更新 Project Structure

将 Project Structure 中的书籍目录列表从 5 本更新为 6 本，添加 `06-listening-world/`。

### 步骤 2：细化 README.md 更新原则

在 Quality Gate 中补充 README.md 应避免的内容类型，明确：
- 技术栈信息不应放在 README.md 中
- 致谢开源项目不应放在 README.md 中

## 具体修改内容

### 修改 1：Project Structure 部分

```text
docs/                          # 项目根目录
├── docs/                      # 文档源目录
│   ├── index.md               # 首页
│   ├── about.md               # 关于页面
│   ├── 01-vibe-working/       # AI辅助工作指南
│   ├── 02-vibe-coding/        # AI辅助编程指南
│   ├── 03-fullstack/          # 全栈开发指南
│   ├── 04-system-refactor/    # 重构你的系统
│   ├── 05-health-handbook/    # 健康科普手册
│   └── 06-listening-world/    # 倾听世界
```

### 修改 2：README.md 更新原则

在 README.md 更新原则中补充：
> - 不包含对普通读者无意义的内容（如技术栈、致谢开源项目等）

## 总结

通过这次经验，我们需要更新 AGENTS.md 以：
1. 确保 Project Structure 与实际目录同步
2. 进一步明确 README.md 的内容边界，避免包含对普通读者无意义的信息
