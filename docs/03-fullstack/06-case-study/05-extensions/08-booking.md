
# 预约系统

预约系统提供在线预约功能，支持资源管理、时间段设置、预约审核等功能。

## 核心功能

- **资源管理**：创建和管理可预约的资源（如房间、设备、服务等）
- **时间段设置**：设置资源的可用时间段
- **预约管理**：用户提交预约、查看预约状态
- **审批流程**：管理员审核预约请求

## 数据库设计

### 资源表（booking_resource）

```sql
CREATE TABLE `booking_resource` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '资源名称',
  `description` text COMMENT '资源描述',
  `capacity` int(11) DEFAULT 1 COMMENT '容量',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约资源表';
```

### 预约表（booking）

```sql
CREATE TABLE `booking` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '预约用户ID',
  `resource_id` int(11) NOT NULL COMMENT '资源ID',
  `start_time` datetime NOT NULL COMMENT '开始时间',
  `end_time` datetime NOT NULL COMMENT '结束时间',
  `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending' COMMENT '状态',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_resource_time` (`resource_id`, `start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约表';
```

## 预约流程

```text
用户选择资源 → 选择时间段 → 提交预约 → 管理员审核 → 审核通过/驳回 → 预约完成
```

## 冲突检测

```typescript
export const checkBookingConflict = async (
  resourceId: number,
  startTime: Date,
  endTime: Date,
  excludeId?: number
): Promise<boolean> => {
  const query = knex('booking')
    .where('resource_id', resourceId)
    .where('status', 'in', ['pending', 'approved'])
    .where(function () {
      this.whereBetween('start_time', [startTime, endTime])
        .orWhereBetween('end_time', [startTime, endTime])
        .orWhere(function () {
          this.where('start_time', '<=', startTime)
            .where('end_time', '>=', endTime);
        });
    });

  if (excludeId) {
    query.whereNot('id', excludeId);
  }

  const conflict = await query.first();
  return !!conflict;
};
```

## 相关章节

- [导航系统](./07-navigation.md) - 导航网站管理
- [相册系统](./09-album.md) - 图片管理
