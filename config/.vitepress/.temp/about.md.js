import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"关于牛牛文档","description":"","frontmatter":{},"headers":[],"relativePath":"about.md","filePath":"about.md","lastUpdated":1775487970000}');
const _sfc_main = { name: "about.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="关于牛牛文档" tabindex="-1">关于牛牛文档 <a class="header-anchor" href="#关于牛牛文档" aria-label="Permalink to “关于牛牛文档”">​</a></h1><h2 id="我们是谁" tabindex="-1">我们是谁 <a class="header-anchor" href="#我们是谁" aria-label="Permalink to “我们是谁”">​</a></h2><p><strong>牛牛文档</strong>（docs.verysites.com）是由<strong>牛牛团队</strong>创建和维护的技术知识库与产品文档站。</p><p>牛牛团队是一支小型技术团队，由<strong>滕先生</strong>和<strong>黄女士</strong>两名成员组成。我们拥有 15 年生物与信息技术交叉领域的从业经验，致力于将专业知识转化为易于理解的内容，帮助更多人提升技能、解决问题。</p><h2 id="这个站点是什么" tabindex="-1">这个站点是什么 <a class="header-anchor" href="#这个站点是什么" aria-label="Permalink to “这个站点是什么”">​</a></h2><p>牛牛文档是一个<strong>技术知识库与产品文档结合</strong>的平台，我们在这里发布：</p><ul><li><strong>原创技术书籍</strong>：涵盖 AI 应用、编程开发、认知提升等主题</li><li><strong>产品使用文档</strong>：帮助用户更好地使用我们在 <a href="https://www.verysites.com" target="_blank" rel="noreferrer">www.verysites.com</a> 上发布的产品</li></ul><p>无论你是开发者、AI 爱好者，还是希望提升工作效率的互联网用户，都能在这里找到有价值的内容。</p><h2 id="我们的内容" tabindex="-1">我们的内容 <a class="header-anchor" href="#我们的内容" aria-label="Permalink to “我们的内容”">​</a></h2><p>目前，牛牛文档提供以下四本原创书籍：</p><table tabindex="0"><thead><tr><th>书籍</th><th>简介</th></tr></thead><tbody><tr><td><a href="/vibe-working/">AI 辅助工作指南</a></td><td>让 AI 成为你的智能助手，从文档处理到科研工作，全面提升日常工作效率</td></tr><tr><td><a href="/vibe-coding/">AI 辅助编程指南</a></td><td>用自然语言描述需求，让 AI 帮你写代码。从需求到实现，编程从未如此简单</td></tr><tr><td><a href="/fullstack/">全栈开发指南</a></td><td>汇集牛牛团队 TypeScript 全栈开发的最佳实践，涵盖前后端开发、架构设计等核心内容</td></tr><tr><td><a href="/system-refactor/">重构你的系统</a></td><td>重塑认知体系，提升搜索、科研、技能运用能力。帮助你在瓶颈期找到突破口，实现自我进化</td></tr></tbody></table><h2 id="关于官网" tabindex="-1">关于官网 <a class="header-anchor" href="#关于官网" aria-label="Permalink to “关于官网”">​</a></h2><p>我们在 <a href="https://www.verysites.com" target="_blank" rel="noreferrer">www.verysites.com</a> 上开发和发布产品。如果你对我们的产品感兴趣，欢迎访问官网了解更多。</p><h2 id="联系我们" tabindex="-1">联系我们 <a class="header-anchor" href="#联系我们" aria-label="Permalink to “联系我们”">​</a></h2><p>如果你有任何问题、建议或合作意向，可以通过以下方式联系我们：</p><ul><li><strong>官网</strong>：<a href="https://www.verysites.com" target="_blank" rel="noreferrer">www.verysites.com</a></li><li><strong>打赏支持</strong>：<a href="https://www.verysites.com/donation" target="_blank" rel="noreferrer">打赏页面</a></li></ul><p>感谢你对牛牛文档的关注与支持！</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("about.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const about = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  about as default
};
