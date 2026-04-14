import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"扩展功能","description":"","frontmatter":{},"headers":[],"relativePath":"fullstack/case-study/extensions/index.md","filePath":"fullstack/case-study/extensions/index.md","lastUpdated":1776145823000}');
const _sfc_main = { name: "fullstack/case-study/extensions/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="扩展功能" tabindex="-1">扩展功能 <a class="header-anchor" href="#扩展功能" aria-label="Permalink to “扩展功能”">​</a></h1><p>本章介绍系统的其他扩展功能模块，包括预约系统、导航系统、相册系统和日志监控。</p><h2 id="章节导航" tabindex="-1">章节导航 <a class="header-anchor" href="#章节导航" aria-label="Permalink to “章节导航”">​</a></h2><ul><li><a href="./08-booking.html">预约系统</a> - 在线预约功能设计</li><li><a href="./07-navigation.html">导航系统</a> - 导航网站管理</li><li><a href="./09-album.html">相册系统</a> - 相册和图片管理</li><li><a href="./10-monitoring.html">日志监控</a> - 系统日志和错误监控</li></ul><h2 id="功能概览" tabindex="-1">功能概览 <a class="header-anchor" href="#功能概览" aria-label="Permalink to “功能概览”">​</a></h2><table tabindex="0"><thead><tr><th>功能模块</th><th>核心功能</th><th>适用场景</th></tr></thead><tbody><tr><td>预约系统</td><td>资源预约、时间管理</td><td>服务预约、场地预约</td></tr><tr><td>导航系统</td><td>网站收藏、分类管理</td><td>导航网站、书签管理</td></tr><tr><td>相册系统</td><td>图片上传、相册管理</td><td>图片展示、作品集</td></tr><tr><td>日志监控</td><td>错误追踪、性能监控</td><td>系统运维、问题排查</td></tr></tbody></table><h2 id="前置知识" tabindex="-1">前置知识 <a class="header-anchor" href="#前置知识" aria-label="Permalink to “前置知识”">​</a></h2><p>阅读本章节前，建议先了解：</p><ul><li><a href="./../../backend/03-database.html">数据库设计</a> - 数据库表设计规范</li><li><a href="./../../backend/04-api-design.html">API设计规范</a> - RESTful API 设计</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("fullstack/case-study/extensions/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
