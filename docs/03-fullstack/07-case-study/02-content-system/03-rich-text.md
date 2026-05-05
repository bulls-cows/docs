
# 富文本编辑

本文介绍文章编辑器的设计与实现，包括编辑器选择、图片上传和内容存储。

## 前置知识

- [Vue.js 实战](../../02-frontend/01-vue.md) - Vue 组件开发
- [文件上传../03-file-system/05-upload.md) - 文件上传实现

## 编辑器选择

### 主流编辑器对比

| 编辑器 | 特点 | 适用场景 |
|--------|------|---------|
| wangEditor | 国产、轻量、易用 | 中小型项目 |
| TinyMCE | 功能丰富、可定制 | 企业级应用 |
| Quill | 现代、模块化 | 现代Web应用 |
| TipTap | 基于ProseMirror | 高定制需求 |
| Markdown编辑器 | 简洁、开发者友好 | 技术博客 |

### 本系统选择

**选择 wangEditor**，理由：

1. **中文文档完善**：降低学习成本
2. **轻量易用**：开箱即用，配置简单
3. **功能够用**：满足文章编辑需求
4. **Vue支持**：提供 `@wangeditor/editor-for-vue` 组件

## 编辑器集成

### 安装依赖

```bash
npm install @wangeditor/editor @wangeditor/editor-for-vue
```

### 基础组件

```vue
<template>
  <div class="editor-container">
    <Toolbar :editor="editorRef" :defaultConfig="toolbarConfig" />
    <Editor
      v-model="valueHtml"
      :defaultConfig="editorConfig"
      @onCreated="handleCreated"
      @onChange="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const editorRef = shallowRef<IDomEditor>();
const valueHtml = ref(props.modelValue);

// 工具栏配置
const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: ['group-video'], // 排除视频
};

// 编辑器配置
const editorConfig: Partial<IEditorConfig> = {
  placeholder: props.placeholder || '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      // 图片上传配置
      async customUpload(file: File, insertFn: any) {
        const url = await uploadImage(file);
        insertFn(url);
      },
    },
  },
};

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor;
};

const handleChange = (editor: IDomEditor) => {
  emit('update:modelValue', editor.getHtml());
};

// 组件销毁时，销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor) {
    editor.destroy();
  }
});
</script>

<style scoped>
.editor-container {
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>
```

## 图片上传处理

### 上传配置

```typescript
// 编辑器图片上传配置
const editorConfig: Partial<IEditorConfig> = {
  MENU_CONF: {
    uploadImage: {
      // 自定义上传
      async customUpload(file: File, insertFn: any) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'article');

          const response = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData,
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          });

          const data = await response.json();
          if (data.code === 200) {
            insertFn(data.data.url);
          } else {
            ElMessage.error(data.message || '上传失败');
          }
        } catch (err) {
          ElMessage.error('上传失败');
        }
      },

      // 文件大小限制
      maxFileSize: 5 * 1024 * 1024, // 5MB

      // 文件类型限制
      allowedFileTypes: ['image/*'],

      // 上传错误处理
      onError(file: File, err: any) {
        console.error('上传错误', err);
        ElMessage.error('图片上传失败');
      },
    },
  },
};
```

### 后端上传接口

```typescript
// POST /api/files/upload
export const cUploadFile: ExpressRequestHandler = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      res.fail('请选择文件');
      return;
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      res.fail('不支持的文件类型');
      return;
    }

    // 验证文件大小
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      res.fail('文件大小不能超过5MB');
      return;
    }

    // 生成文件URL
    const url = await saveFile(file);

    res.success({ url });
  } catch (err) {
    next(err);
  }
};
```

## 内容存储策略

### 免费内容与付费内容分离

```vue
<template>
  <div class="article-editor">
    <!-- 免费内容编辑器 -->
    <div class="editor-section">
      <h3>免费内容</h3>
      <RichTextEditor
        v-model="article.free_content"
        placeholder="请输入免费内容，所有用户可见"
      />
    </div>

    <!-- 付费内容编辑器 -->
    <div class="editor-section">
      <h3>付费内容</h3>
      <RichTextEditor
        v-model="article.paid_content"
        placeholder="请输入付费内容，仅付费用户可见"
      />
    </div>

    <!-- 价格设置 -->
    <div class="price-section">
      <el-form-item label="文章价格（元）">
        <el-input-number
          v-model="article.price"
          :min="0"
          :precision="2"
        />
        <span class="hint">设置为 0 表示免费文章</span>
      </el-form-item>
    </div>
  </div>
</template>
```

### 保存时合并内容

```typescript
// 保存文章时，合并免费内容和付费内容
const saveArticle = async () => {
  // 合并内容用于全文搜索
  const content = [
    article.value.free_content || '',
    article.value.paid_content || '',
  ].join('\n');

  const data = {
    ...article.value,
    content,
    price: Math.round(article.value.price * 100), // 元转分
  };

  if (article.value.id) {
    await apiUpdateArticle(data);
  } else {
    await apiAddArticle(data);
  }
};
```

## 内容安全处理

### XSS 防护

```typescript
import DOMPurify from 'dompurify';

// 清理 HTML 内容
const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
  });
};

// 保存前清理内容
const cleanContent = (content: string): string => {
  return sanitizeHtml(content);
};
```

### 内容展示

```vue
<template>
  <div class="article-content" v-html="sanitizedContent"></div>
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify';

const props = defineProps<{
  content: string;
}>();

const sanitizedContent = computed(() => {
  return DOMPurify.sanitize(props.content);
});
</script>
```

## 相关章节

- [文章系统](./01-article.md) - 文章表设计和CRUD操作
- [分类与标签](./02-category-tag.md) - 分类和标签的设计
- [文件上传../03-file-system/05-upload.md) - 文件上传详细实现
