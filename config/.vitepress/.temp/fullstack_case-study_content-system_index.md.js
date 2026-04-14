import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"内容管理系统","description":"","frontmatter":{},"headers":[],"relativePath":"fullstack/case-study/content-system/index.md","filePath":"fullstack/case-study/content-system/index.md","lastUpdated":1776145823000}');
const _sfc_main = { name: "fullstack/case-study/content-system/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="内容管理系统" tabindex="-1">内容管理系统 <a class="header-anchor" href="#内容管理系统" aria-label="Permalink to “内容管理系统”">​</a></h1><p>内容管理系统（CMS）是网站的核心模块，负责文章、分类、标签等内容的创建、编辑、发布和管理。本章将详细介绍内容管理系统的设计与实现。</p><h2 id="系统概述" tabindex="-1">系统概述 <a class="header-anchor" href="#系统概述" aria-label="Permalink to “系统概述”">​</a></h2><h3 id="核心功能" tabindex="-1">核心功能 <a class="header-anchor" href="#核心功能" aria-label="Permalink to “核心功能”">​</a></h3><ul><li><strong>文章管理</strong>：文章创建、编辑、发布、删除</li><li><strong>分类管理</strong>：多级分类、分类排序</li><li><strong>标签管理</strong>：标签创建、文章标签关联</li><li><strong>富文本编辑</strong>：Markdown/富文本编辑器</li><li><strong>付费阅读</strong>：免费内容与付费内容分离</li></ul><h3 id="内容类型" tabindex="-1">内容类型 <a class="header-anchor" href="#内容类型" aria-label="Permalink to “内容类型”">​</a></h3><table tabindex="0"><thead><tr><th>类型</th><th>说明</th></tr></thead><tbody><tr><td>免费内容</td><td>所有用户可见</td></tr><tr><td>付费内容</td><td>仅会员可见</td></tr><tr><td>草稿</td><td>未发布，仅作者可见</td></tr><tr><td>已发布</td><td>公开可见</td></tr></tbody></table><h2 id="章节导航" tabindex="-1">章节导航 <a class="header-anchor" href="#章节导航" aria-label="Permalink to “章节导航”">​</a></h2><ul><li><a href="./03-article.html">文章系统</a> - 文章表设计、CRUD操作、付费阅读</li><li><a href="./04-category-tag.html">分类与标签</a> - 分类表、标签表、关联关系</li><li><a href="./05-rich-text.html">富文本编辑</a> - 编辑器选择、图片上传、内容存储</li></ul><h2 id="前置知识" tabindex="-1">前置知识 <a class="header-anchor" href="#前置知识" aria-label="Permalink to “前置知识”">​</a></h2><p>阅读本章节前，建议先了解：</p><ul><li><a href="./../../backend/03-database.html">数据库设计</a> - 数据库表设计规范</li><li><a href="./../../backend/04-api-design.html">API设计规范</a> - RESTful API 设计</li><li><a href="./../../frontend/02-vue.html">Vue.js 实战</a> - 前端组件开发</li></ul><h2 id="业务流程" tabindex="-1">业务流程 <a class="header-anchor" href="#业务流程" aria-label="Permalink to “业务流程”">​</a></h2><div class="language-text line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({ "--shiki-light": "#24292e", "--shiki-dark": "#e1e4e8", "--shiki-light-bg": "#fff", "--shiki-dark-bg": "#24292e" })}" tabindex="0" dir="ltr"><code><span class="line"><span>创建文章 → 编辑内容 → 设置分类/标签 → 设置付费内容 → 发布 → 用户阅读</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br></div></div></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("fullstack/case-study/content-system/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
