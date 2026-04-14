import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"目录","description":"","frontmatter":{},"headers":[],"relativePath":"system-refactor/toc.md","filePath":"system-refactor/toc.md","lastUpdated":1776145823000}');
const _sfc_main = { name: "system-refactor/toc.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="目录" tabindex="-1">目录 <a class="header-anchor" href="#目录" aria-label="Permalink to “目录”">​</a></h1><ul><li><a href="./10-cases.html">案例分享</a></li><li>第一篇 认知重构 <ul><li><a href="./mindset/">认知升级的重要性</a></li><li><a href="./mindset/02-growth.html">成长型思维</a></li><li><a href="./mindset/03-learning.html">高效学习法</a></li><li><a href="./mindset/04-decision-making.html">决策框架</a></li></ul></li><li>第二篇 搜索能力 <ul><li><a href="./search/">信息检索艺术</a></li><li><a href="./search/02-search-engines.html">搜索引擎技巧</a></li><li><a href="./search/03-academic.html">学术资源获取</a></li><li><a href="./search/04-fact-checking.html">信息验证</a></li></ul></li><li>第三篇 研究能力 <ul><li><a href="./research/">系统化研究方法</a></li><li><a href="./research/02-reading.html">快速阅读技巧</a></li><li><a href="./research/03-note-taking.html">知识管理</a></li><li><a href="./research/04-writing.html">学术写作</a></li></ul></li><li>第四篇 技能运用 <ul><li><a href="./skills/">技能迁移理论</a></li><li><a href="./skills/02-deliberate-practice.html">刻意练习</a></li><li><a href="./skills/03-feedback-loop.html">反馈循环</a></li><li><a href="./skills/04-teaching.html">费曼学习法</a></li></ul></li><li>第五篇 工具系统 <ul><li><a href="./tools/">工具思维</a></li><li><a href="./tools/02-automation.html">自动化工作流</a></li><li><a href="./tools/03-ai-tools.html">AI 工具整合</a></li><li><a href="./tools/04-productivity.html">效率工具箱</a></li></ul></li><li>第六篇 习惯系统 <ul><li><a href="./habits/">习惯的力量</a></li><li><a href="./habits/02-morning-routine.html">晨间惯例</a></li><li><a href="./habits/03-time-management.html">时间管理</a></li><li><a href="./habits/04-review-system.html">复盘系统</a></li></ul></li><li>附录 <ul><li><a href="./10-cases.html">重构案例分享</a></li></ul></li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("system-refactor/toc.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const toc = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  toc as default
};
