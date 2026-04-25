# 添加上海"阳光宝宝"政策章节 Spec

## Why
上海"阳光宝宝"政策是针对听力障碍儿童的重要救助政策，为0-16岁听力障碍儿童提供康复救助。在听力健康科普手册中添加此章节，帮助读者了解政府救助政策，减轻家庭经济负担，促进听力障碍儿童的早期干预和康复。

## What Changes
- 在治疗篇（03-treatment）下新增"上海阳光宝宝政策"章节（02-shanghai-sunshine-baby.md）
- 更新治疗篇首页的章节列表
- 更新书籍根目录的 toc.md 目录结构

## Impact
- Affected docs: 06-listening-world 听力健康手册
- Affected files:
  - `docs/06-listening-world/03-treatment/02-shanghai-sunshine-baby.md`
  - `docs/06-listening-world/03-treatment/index.md`
  - `docs/06-listening-world/toc.md`

## ADDED Requirements
### Requirement: 上海阳光宝宝政策介绍
系统 SHALL 提供上海"阳光宝宝"政策的详细介绍，包括政策背景、救助对象、补贴标准、申请流程等内容。

#### Scenario: 读者了解政策详情
- **WHEN** 读者阅读"上海阳光宝宝政策"章节
- **THEN** 读者能够了解政策的救助对象范围、补贴金额标准、申请所需材料和流程
- **AND** 了解政策实施效果和社会意义

### Requirement: 可操作的申请指南
系统 SHALL 提供清晰可操作的申请指南，包括申请条件、所需材料、办理地点和联系方式。

#### Scenario: 家长准备申请
- **WHEN** 听力障碍儿童家长阅读政策章节
- **THEN** 家长能够根据指南准备申请材料，并了解具体的申请渠道和流程
