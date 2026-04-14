import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"牛气腾腾的文档","description":"","frontmatter":{"layout":"home","title":"牛气腾腾的文档","hero":{"name":"牛气腾腾的文档","text":"与热爱不期而遇","tagline":"这个站点由滕先生和黄女士 2 名成员维护。\\n他们拥有 15 年生物 + 信息技术从业经验。","image":{"src":"/earth.svg","alt":"峰间的云"},"actions":[{"theme":"brand","text":"打赏支持我们","link":"https://www.verysites.com/donation"},{"theme":"alt","text":"关于牛牛文档","link":"/about"}]},"features":[{"title":"AI 辅助工作指南","link":"/vibe-working/","details":"让 AI 成为你的智能助手，从文档处理到科研工作，全面提升日常工作效率。","linkText":"开始阅读","icon":{"src":"/vibe-working-logo.svg"}},{"title":"AI 辅助编程指南","link":"/vibe-coding/","details":"用自然语言描述需求，让 AI 帮你写代码。从需求到实现，编程从未如此简单。","linkText":"开始阅读","icon":{"src":"/vibe-coding-logo.svg"}},{"title":"全栈开发指南","link":"/fullstack/","details":"汇集牛牛团队 TypeScript 全栈开发的最佳实践，涵盖前后端开发、架构设计等核心内容。","linkText":"开始阅读","icon":{"src":"/fullstack-logo.svg"}},{"title":"重构你的系统","link":"/system-refactor/","details":"重塑认知体系,提升搜索、科研、技能运用能力。帮助你在瓶颈期找到突破口,实现自我进化。","linkText":"开始阅读","icon":{"src":"/system-refactor-logo.svg"}}]},"headers":[],"relativePath":"index.md","filePath":"index.md","lastUpdated":1774709673000}');
const _sfc_main = { name: "index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
