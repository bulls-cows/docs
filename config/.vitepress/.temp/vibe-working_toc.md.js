import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"目录","description":"","frontmatter":{},"headers":[],"relativePath":"vibe-working/toc.md","filePath":"vibe-working/toc.md","lastUpdated":1776145823000}');
const _sfc_main = { name: "vibe-working/toc.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="目录" tabindex="-1">目录 <a class="header-anchor" href="#目录" aria-label="Permalink to “目录”">​</a></h1><ul><li>第一篇 工具基础 <ul><li><a href="./01-tools.html">常用 AI 工具介绍</a></li></ul></li><li>第二篇 核心应用 <ul><li><a href="./02-writing.html">AI 辅助写作</a></li><li><a href="./03-research.html">AI 辅助研究</a></li><li><a href="./04-data-analysis.html">AI 辅助数据分析</a></li></ul></li><li>第三篇 场景实践 <ul><li><a href="./06-presentation.html">AI 辅助演示文稿</a></li><li><a href="./05-meeting.html">AI 辅助会议</a></li><li><a href="./07-translation.html">AI 辅助翻译</a></li><li><a href="./08-creative.html">AI 辅助创意工作</a></li></ul></li><li>附录 <ul><li><a href="./09-productivity.html">效率提升技巧</a></li></ul></li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("vibe-working/toc.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const toc = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  toc as default
};
