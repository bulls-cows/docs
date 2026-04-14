import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"企业级实战","description":"","frontmatter":{},"headers":[],"relativePath":"fullstack/case-study/index.md","filePath":"fullstack/case-study/index.md","lastUpdated":1776145823000}');
const _sfc_main = { name: "fullstack/case-study/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="企业级实战" tabindex="-1">企业级实战 <a class="header-anchor" href="#企业级实战" aria-label="Permalink to “企业级实战”">​</a></h1><p>本篇将基于真实项目（峰云CMS）的业务模块，深入讲解企业级Web应用的实战开发。每个模块都包含完整的设计思路、数据库设计、API设计和代码实现。</p><h2 id="学习目标" tabindex="-1">学习目标 <a class="header-anchor" href="#学习目标" aria-label="Permalink to “学习目标”">​</a></h2><p>通过本篇学习，你将掌握：</p><ul><li><strong>用户系统设计</strong>：用户表设计、角色权限、认证授权</li><li><strong>内容管理系统</strong>：文章系统、分类标签、富文本编辑</li><li><strong>支付系统</strong>：余额系统、充值消费、提现流程</li><li><strong>文件管理</strong>：文件上传、权限控制、分片上传</li><li><strong>扩展功能</strong>：预约系统、导航系统、相册系统等</li></ul><h2 id="案例背景" tabindex="-1">案例背景 <a class="header-anchor" href="#案例背景" aria-label="Permalink to “案例背景”">​</a></h2><h3 id="峰云cms简介" tabindex="-1">峰云CMS简介 <a class="header-anchor" href="#峰云cms简介" aria-label="Permalink to “峰云CMS简介”">​</a></h3><p>峰云CMS是一个面向中小微企业的建站程序，集成了用户管理、内容管理、支付系统、文件管理等核心功能。本篇各章节均来源于该项目的实际业务模块，经过提炼和整理，形成可供学习的实战案例。</p><h3 id="技术栈" tabindex="-1">技术栈 <a class="header-anchor" href="#技术栈" aria-label="Permalink to “技术栈”">​</a></h3><table tabindex="0"><thead><tr><th>类别</th><th>技术</th></tr></thead><tbody><tr><td>前端</td><td>Vue 3 + TypeScript + Element Plus</td></tr><tr><td>后端</td><td>Node.js + Express + TypeScript</td></tr><tr><td>数据库</td><td>MySQL</td></tr><tr><td>缓存</td><td>Redis</td></tr></tbody></table><h3 id="项目特点" tabindex="-1">项目特点 <a class="header-anchor" href="#项目特点" aria-label="Permalink to “项目特点”">​</a></h3><ul><li><strong>完整的业务闭环</strong>：从用户注册到支付提现，涵盖完整业务流程</li><li><strong>清晰的代码结构</strong>：采用 MVC 分层架构，代码组织清晰</li><li><strong>详细的文档说明</strong>：每个模块都有完整的设计文档</li></ul><h2 id="章节结构" tabindex="-1">章节结构 <a class="header-anchor" href="#章节结构" aria-label="Permalink to “章节结构”">​</a></h2><p>本篇按照业务模块划分，每个模块包含以下内容：</p><ol><li><strong>系统概述</strong>：功能介绍、业务流程</li><li><strong>数据库设计</strong>：表结构设计、字段说明</li><li><strong>API设计</strong>：接口定义、请求响应格式</li><li><strong>核心实现</strong>：关键代码示例</li></ol><h2 id="前置知识" tabindex="-1">前置知识 <a class="header-anchor" href="#前置知识" aria-label="Permalink to “前置知识”">​</a></h2><p>阅读本篇前，建议先掌握以下知识：</p><ul><li><a href="./../backend/02-nodejs.html">后端技术栈</a> - Node.js、Express 基础</li><li><a href="./../backend/03-database.html">数据库设计</a> - 数据库设计规范</li><li><a href="./../backend/04-api-design.html">API设计规范</a> - RESTful API 设计</li><li><a href="./../backend/05-authentication.html">认证与授权</a> - 用户认证原理</li></ul><h2 id="约定说明" tabindex="-1">约定说明 <a class="header-anchor" href="#约定说明" aria-label="Permalink to “约定说明”">​</a></h2><p>本篇代码示例遵循以下约定：</p><ul><li><strong>类型定义</strong>：使用 TypeScript 接口定义类型</li><li><strong>API响应</strong>：统一使用 <code>{ code, message, data }</code> 格式</li><li><strong>错误处理</strong>：使用 <code>TReturn&lt;T&gt;</code> 类型返回错误和数据</li><li><strong>数据库操作</strong>：使用 Knex.js 进行数据库操作</li></ul><hr><p>接下来，让我们从用户管理系统开始，逐步深入各个业务模块的实现细节。</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("fullstack/case-study/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
