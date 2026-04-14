import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"用户管理系统","description":"","frontmatter":{},"headers":[],"relativePath":"fullstack/case-study/user-system/index.md","filePath":"fullstack/case-study/user-system/index.md","lastUpdated":1776145823000}');
const _sfc_main = { name: "fullstack/case-study/user-system/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="用户管理系统" tabindex="-1">用户管理系统 <a class="header-anchor" href="#用户管理系统" aria-label="Permalink to “用户管理系统”">​</a></h1><p>用户管理系统是后台管理系统的核心模块，提供用户信息管理、角色管理、权限控制等功能。本章将详细介绍用户系统的设计与实现。</p><h2 id="系统概述" tabindex="-1">系统概述 <a class="header-anchor" href="#系统概述" aria-label="Permalink to “系统概述”">​</a></h2><h3 id="核心功能" tabindex="-1">核心功能 <a class="header-anchor" href="#核心功能" aria-label="Permalink to “核心功能”">​</a></h3><ul><li><strong>用户列表管理</strong>：分页查询、搜索、状态管理</li><li><strong>角色管理</strong>：角色定义、权限分配</li><li><strong>权限控制</strong>：路由权限、接口权限</li><li><strong>认证授权</strong>：登录认证、Token管理</li></ul><h3 id="角色体系" tabindex="-1">角色体系 <a class="header-anchor" href="#角色体系" aria-label="Permalink to “角色体系”">​</a></h3><table tabindex="0"><thead><tr><th>角色</th><th>标识</th><th>说明</th></tr></thead><tbody><tr><td>超级管理员</td><td>super_admin</td><td>系统最高权限，不可修改</td></tr><tr><td>管理员</td><td>admin</td><td>后台管理权限</td></tr><tr><td>VIP会员</td><td>svip</td><td>高级会员权限</td></tr><tr><td>会员</td><td>vip</td><td>普通会员权限</td></tr><tr><td>普通用户</td><td>normal</td><td>基础用户权限</td></tr><tr><td>游客</td><td>guest</td><td>未登录用户</td></tr></tbody></table><h2 id="章节导航" tabindex="-1">章节导航 <a class="header-anchor" href="#章节导航" aria-label="Permalink to “章节导航”">​</a></h2><ul><li><a href="./02-user-table.html">用户表设计</a> - 用户表结构、角色表、关联关系</li><li><a href="./03-role-permission.html">角色与权限</a> - 角色设计、权限控制逻辑</li><li><a href="./04-authentication.html">认证与授权</a> - 登录流程、Token管理、中间件</li></ul><h2 id="前置知识" tabindex="-1">前置知识 <a class="header-anchor" href="#前置知识" aria-label="Permalink to “前置知识”">​</a></h2><p>阅读本章节前，建议先了解：</p><ul><li><a href="./../../backend/03-database.html">数据库设计</a> - 数据库表设计规范</li><li><a href="./../../backend/04-api-design.html">API设计规范</a> - RESTful API 设计</li><li><a href="./../../backend/05-authentication.html">认证与授权</a> - 认证原理</li></ul><h2 id="业务流程" tabindex="-1">业务流程 <a class="header-anchor" href="#业务流程" aria-label="Permalink to “业务流程”">​</a></h2><div class="language-text line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({ "--shiki-light": "#24292e", "--shiki-dark": "#e1e4e8", "--shiki-light-bg": "#fff", "--shiki-dark-bg": "#24292e" })}" tabindex="0" dir="ltr"><code><span class="line"><span>用户注册 → 邮箱/手机验证 → 分配默认角色 → 登录认证 → 权限验证 → 业务操作</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br></div></div></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("fullstack/case-study/user-system/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
