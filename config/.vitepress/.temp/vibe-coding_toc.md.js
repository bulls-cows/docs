import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"目录","description":"","frontmatter":{},"headers":[],"relativePath":"vibe-coding/toc.md","filePath":"vibe-coding/toc.md","lastUpdated":1776145823000}');
const _sfc_main = { name: "vibe-coding/toc.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="目录" tabindex="-1">目录 <a class="header-anchor" href="#目录" aria-label="Permalink to “目录”">​</a></h1><ul><li>快速上手 <ul><li><a href="./01-getting-started.html">快速开始：15 分钟完成第一个项目</a></li></ul></li><li>第一篇 基础入门 <ul><li><a href="./02-mindset.html">编程思维转变</a></li><li><a href="./03-tool.html">编程工具篇</a></li></ul></li><li>第二篇 实践技巧 <ul><li><a href="./04-workflow.html">典型工作流程</a></li><li><a href="./05-prompt-engineering.html">提示词工程</a></li><li><a href="./06-best-practices.html">最佳实践</a></li></ul></li><li>第三篇 进阶应用 <ul><li><a href="./07-debugging.html">调试技巧</a></li><li><a href="./08-code-review.html">AI 代码审查</a></li><li><a href="./09-testing.html">AI 辅助测试</a></li><li><a href="./10-refactoring.html">AI 辅助重构</a></li><li><a href="./11-security.html">安全注意事项</a></li></ul></li><li>附录 <ul><li><a href="./12-cases.html">实战案例</a></li></ul></li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("vibe-coding/toc.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const toc = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  toc as default
};
