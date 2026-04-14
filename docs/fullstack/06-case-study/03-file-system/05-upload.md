---
order: 50
---

# 文件上传

本文介绍文件上传的设计与实现，包括上传接口、存储策略和分片上传。

## 前置知识

- [API设计规范](../../02-backend/04-api-design.md) - RESTful API 设计

## 上传接口设计

### 单文件上传

```typescript
// POST /api/files/upload
// Content-Type: multipart/form-data

interface ParamsApiUploadFile {
  file: File; // 文件
  type: 'image' | 'document' | 'video'; // 文件类型
}

interface ReturnApiUploadFile {
  id: number; // 文件ID
  url: string; // 文件URL
  filename: string; // 文件名
  size: number; // 文件大小
  mimetype: string; // MIME类型
}
```

### 控制器实现

```typescript
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${randomUUID()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
});

export const cUploadFile: ExpressRequestHandler = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      res.fail('请选择文件');
      return;
    }

    const user = req.user;
    const type = req.body.type || 'image';

    // 保存文件记录
    const [fileRecord] = await knex('file').insert({
      user_id: user?.id || null,
      filename: file.filename,
      original_name: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      type,
    }).returning('*');

    // 生成访问URL
    const url = `${process.env.BASE_URL}/uploads/${file.filename}`;

    res.success<ReturnApiUploadFile>({
      id: fileRecord.id,
      url,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });
  } catch (err) {
    next(err);
  }
};
```

## 文件验证

### 类型验证

```typescript
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
};

const MAX_FILE_SIZE: Record<string, number> = {
  image: 5 * 1024 * 1024, // 5MB
  document: 20 * 1024 * 1024, // 20MB
  video: 100 * 1024 * 1024, // 100MB
};

export const validateFile = (file: Express.Multer.File, type: string): string | null => {
  // 验证类型
  const allowedTypes = ALLOWED_MIME_TYPES[type] || [];
  if (!allowedTypes.includes(file.mimetype)) {
    return `不支持的文件类型: ${file.mimetype}`;
  }

  // 验证大小
  const maxSize = MAX_FILE_SIZE[type] || 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return `文件大小超过限制: ${maxSize / 1024 / 1024}MB`;
  }

  return null;
};
```

## 分片上传

### 概念

对于大文件，采用分片上传策略：

1. 前端将文件分割成多个小块
2. 逐个上传每个分片
3. 服务端接收完成后合并文件

### 接口设计

```typescript
// 初始化分片上传
// POST /api/files/init-chunk
interface ParamsApiInitChunk {
  filename: string;
  total_chunks: number;
  file_size: number;
  file_hash: string;
}

interface ReturnApiInitChunk {
  upload_id: string;
}

// 上传分片
// POST /api/files/upload-chunk
interface ParamsApiUploadChunk {
  upload_id: string;
  chunk_index: number;
  chunk: File;
}

// 完成分片上传
// POST /api/files/complete-chunk
interface ParamsApiCompleteChunk {
  upload_id: string;
}
```

### 服务层实现

```typescript
// 初始化分片上传
export const initChunkUpload = async (
  filename: string,
  totalChunks: number,
  fileSize: number,
  fileHash: string
): Promise<string> => {
  const uploadId = randomUUID();
  
  await knex('file_chunk').insert({
    upload_id: uploadId,
    filename,
    total_chunks: totalChunks,
    file_size: fileSize,
    file_hash: fileHash,
    status: 'pending',
    chunks: JSON.stringify([]),
  });

  return uploadId;
};

// 上传分片
export const uploadChunk = async (
  uploadId: string,
  chunkIndex: number,
  chunk: Buffer
): Promise<void> => {
  // 保存分片到临时目录
  const chunkPath = path.join(process.cwd(), 'uploads', 'chunks', `${uploadId}-${chunkIndex}`);
  await fs.writeFile(chunkPath, chunk);

  // 更新已上传分片列表
  await knex('file_chunk')
    .where({ upload_id: uploadId })
    .update({
      chunks: knex.raw(`JSON_ARRAY_APPEND(chunks, '$', ?)`, [chunkIndex]),
    });
};

// 完成分片上传
export const completeChunkUpload = async (uploadId: string): Promise<string> => {
  const chunkRecord = await knex('file_chunk')
    .where({ upload_id: uploadId })
    .first();

  if (!chunkRecord) {
    throw new Error('上传记录不存在');
  }

  // 合并文件
  const finalPath = path.join(process.cwd(), 'uploads', chunkRecord.filename);
  const chunks = JSON.parse(chunkRecord.chunks);

  for (const chunkIndex of chunks) {
    const chunkPath = path.join(process.cwd(), 'uploads', 'chunks', `${uploadId}-${chunkIndex}`);
    const chunkData = await fs.readFile(chunkPath);
    await fs.appendFile(finalPath, chunkData);
    await fs.unlink(chunkPath); // 删除临时分片
  }

  // 更新状态
  await knex('file_chunk')
    .where({ upload_id: uploadId })
    .update({ status: 'completed' });

  return finalPath;
};
```

## 前端实现

```vue
<template>
  <div class="file-upload">
    <el-upload
      :action="uploadUrl"
      :headers="headers"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :show-file-list="false"
    >
      <el-button type="primary">选择文件</el-button>
    </el-upload>

    <!-- 上传进度 -->
    <div v-if="uploading" class="progress">
      <el-progress :percentage="progress" />
    </div>
  </div>
</template>

<script setup lang="ts">
const uploadUrl = '/api/files/upload';
const headers = {
  Authorization: `Bearer ${getToken()}`,
};

const uploading = ref(false);
const progress = ref(0);

const beforeUpload = (file: File) => {
  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('不支持的文件类型');
    return false;
  }

  // 验证文件大小
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过5MB');
    return false;
  }

  uploading.value = true;
  progress.value = 0;
  return true;
};

const handleSuccess = (response: any) => {
  uploading.value = false;
  if (response.code === 200) {
    emit('success', response.data);
    ElMessage.success('上传成功');
  } else {
    ElMessage.error(response.message || '上传失败');
  }
};

const handleError = () => {
  uploading.value = false;
  ElMessage.error('上传失败');
};
</script>
```

## 相关章节

- [权限控制](./06-permission.md) - 文件访问权限管理
