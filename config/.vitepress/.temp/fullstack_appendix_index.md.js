import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"附录","description":"","frontmatter":{},"headers":[],"relativePath":"fullstack/appendix/index.md","filePath":"fullstack/appendix/index.md","lastUpdated":1776145823000}');
const _sfc_main = { name: "fullstack/appendix/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="附录" tabindex="-1">附录 <a class="header-anchor" href="#附录" aria-label="Permalink to “附录”">​</a></h1><p>本附录提供开发环境搭建、部署上线指南和开发规范速查等内容。</p><h2 id="章节导航" tabindex="-1">章节导航 <a class="header-anchor" href="#章节导航" aria-label="Permalink to “章节导航”">​</a></h2><ul><li><a href="./01-development.html">开发环境搭建</a> - 本地开发环境配置</li><li><a href="./02-deployment.html">部署上线</a> - 生产环境部署指南</li><li><a href="./03-code-standards.html">开发规范速查</a> - 代码规范快速参考</li></ul><h2 id="快速开始" tabindex="-1">快速开始 <a class="header-anchor" href="#快速开始" aria-label="Permalink to “快速开始”">​</a></h2><p>如果你是第一次接触本项目，建议按以下顺序阅读：</p><ol><li>先阅读 <a href="./01-development.html">开发环境搭建</a> 配置本地环境</li><li>然后浏览 <a href="./03-code-standards.html">开发规范速查</a> 了解代码规范</li><li>最后参考 <a href="./02-deployment.html">部署上线</a> 部署到生产环境</li></ol><h2 id="项目结构" tabindex="-1">项目结构 <a class="header-anchor" href="#项目结构" aria-label="Permalink to “项目结构”">​</a></h2><div class="language-text line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({ "--shiki-light": "#24292e", "--shiki-dark": "#e1e4e8", "--shiki-light-bg": "#fff", "--shiki-dark-bg": "#24292e" })}" tabindex="0" dir="ltr"><code><span class="line"><span>project/</span></span>
<span class="line"><span>├── src/</span></span>
<span class="line"><span>│   ├── controllers/     # 控制器</span></span>
<span class="line"><span>│   ├── services/        # 服务层</span></span>
<span class="line"><span>│   ├── models/          # 数据模型</span></span>
<span class="line"><span>│   ├── routes/          # 路由定义</span></span>
<span class="line"><span>│   ├── middlewares/     # 中间件</span></span>
<span class="line"><span>│   └── scripts/         # 工具函数</span></span>
<span class="line"><span>├── typings/             # 类型定义</span></span>
<span class="line"><span>├── apps/                # 前端应用</span></span>
<span class="line"><span>│   ├── admin/           # 管理后台</span></span>
<span class="line"><span>│   └── web/             # 用户端</span></span>
<span class="line"><span>└── package.json</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br></div></div></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("fullstack/appendix/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
