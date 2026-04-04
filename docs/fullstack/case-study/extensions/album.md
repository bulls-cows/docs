# 相册系统

相册系统提供图片上传、相册管理和批量操作功能。

## 核心功能

- **相册管理**：创建、编辑、删除相册
- **图片上传**：单张/批量上传图片
- **图片管理**：移动、删除、排序图片
- **影集功能**：创建影集展示

## 数据库设计

### 相册表（album）

```sql
CREATE TABLE `album` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `name` varchar(100) NOT NULL COMMENT '相册名称',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `cover` varchar(255) DEFAULT NULL COMMENT '封面',
  `photo_count` int(11) DEFAULT 0 COMMENT '照片数量',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='相册表';
```

### 照片表（album_photo）

```sql
CREATE TABLE `album_photo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `album_id` int(11) NOT NULL COMMENT '相册ID',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `name` varchar(200) DEFAULT NULL COMMENT '照片名称',
  `url` varchar(500) NOT NULL COMMENT '照片URL',
  `thumbnail` varchar(500) DEFAULT NULL COMMENT '缩略图',
  `size` int(11) DEFAULT NULL COMMENT '文件大小',
  `width` int(11) DEFAULT NULL COMMENT '宽度',
  `height` int(11) DEFAULT NULL COMMENT '高度',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_album` (`album_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='照片表';
```

## 批量上传

```typescript
export const batchUploadPhotos = async (
  albumId: number,
  userId: number,
  files: Express.Multer.File[]
): Promise<number[]> => {
  const photoIds: number[] = [];

  for (const file of files) {
    // 生成缩略图
    const thumbnail = await generateThumbnail(file.path);

    // 获取图片尺寸
    const { width, height } = await getImageSize(file.path);

    // 插入记录
    const [photoId] = await knex('album_photo').insert({
      album_id: albumId,
      user_id: userId,
      name: file.originalname,
      url: file.path,
      thumbnail,
      size: file.size,
      width,
      height,
    }).returning('id');

    photoIds.push(photoId);
  }

  // 更新相册照片数量
  await knex('album')
    .where({ id: albumId })
    .increment('photo_count', files.length);

  return photoIds;
};
```

## 相关章节

- [文件上传](../file-system/upload.md) - 文件上传实现
- [预约系统](./booking.md) - 在线预约
