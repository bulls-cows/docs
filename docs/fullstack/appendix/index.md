# 附录

本附录提供开发环境搭建、部署上线指南和开发规范速查等内容。

## 章节导航

- [开发环境搭建](./development.md) - 本地开发环境配置
- [部署上线](./deployment.md) - 生产环境部署指南
- [开发规范速查](./code-standards.md) - 代码规范快速参考

## 快速开始

如果你是第一次接触本项目，建议按以下顺序阅读：

1. 先阅读 [开发环境搭建](./development.md) 配置本地环境
2. 然后浏览 [开发规范速查](./code-standards.md) 了解代码规范
3. 最后参考 [部署上线](./deployment.md) 部署到生产环境

## 项目结构

```text
project/
├── src/
│   ├── controllers/     # 控制器
│   ├── services/        # 服务层
│   ├── models/          # 数据模型
│   ├── routes/          # 路由定义
│   ├── middlewares/     # 中间件
│   └── scripts/         # 工具函数
├── typings/             # 类型定义
├── apps/                # 前端应用
│   ├── admin/           # 管理后台
│   └── web/             # 用户端
└── package.json
```
