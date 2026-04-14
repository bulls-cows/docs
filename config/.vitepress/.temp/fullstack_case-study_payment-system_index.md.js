import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"支付系统","description":"","frontmatter":{},"headers":[],"relativePath":"fullstack/case-study/payment-system/index.md","filePath":"fullstack/case-study/payment-system/index.md","lastUpdated":1776145823000}');
const _sfc_main = { name: "fullstack/case-study/payment-system/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="支付系统" tabindex="-1">支付系统 <a class="header-anchor" href="#支付系统" aria-label="Permalink to “支付系统”">​</a></h1><p>支付系统是平台的核心功能之一，采用预付费余额模式，用户先充值到账户余额，然后在使用产品时按动作消耗余额。本章将详细介绍余额系统的设计与实现。</p><h2 id="系统概述" tabindex="-1">系统概述 <a class="header-anchor" href="#系统概述" aria-label="Permalink to “系统概述”">​</a></h2><h3 id="设计思路" tabindex="-1">设计思路 <a class="header-anchor" href="#设计思路" aria-label="Permalink to “设计思路”">​</a></h3><p>本系统采用<strong>预付费余额模式</strong>，主要优势：</p><ol><li><strong>简化计费逻辑</strong>：只需关注每个动作的费用和用户余额是否足够</li><li><strong>统一管理</strong>：所有产品的计费都通过余额系统</li><li><strong>灵活扩展</strong>：新增产品只需定义动作费用</li><li><strong>完整记录</strong>：所有充值和消费记录都有完整的流水</li></ol><h3 id="交易类型" tabindex="-1">交易类型 <a class="header-anchor" href="#交易类型" aria-label="Permalink to “交易类型”">​</a></h3><table tabindex="0"><thead><tr><th>类型</th><th>标识</th><th>说明</th></tr></thead><tbody><tr><td>充值</td><td>recharge</td><td>用户充值到余额</td></tr><tr><td>消费</td><td>consume</td><td>使用余额支付</td></tr><tr><td>退款</td><td>refund</td><td>消费退款/充值退款</td></tr><tr><td>调整</td><td>adjust</td><td>管理员手动调整</td></tr><tr><td>提现</td><td>withdraw</td><td>余额提现</td></tr></tbody></table><h2 id="章节导航" tabindex="-1">章节导航 <a class="header-anchor" href="#章节导航" aria-label="Permalink to “章节导航”">​</a></h2><ul><li><a href="./06-balance.html">余额系统</a> - 余额账户设计、交易流水</li><li><a href="./05-recharge.html">充值流程</a> - 充值接口、支付回调</li><li><a href="./07-withdrawal.html">提现流程</a> - 提现申请、审批流程</li></ul><h2 id="前置知识" tabindex="-1">前置知识 <a class="header-anchor" href="#前置知识" aria-label="Permalink to “前置知识”">​</a></h2><p>阅读本章节前，建议先了解：</p><ul><li><a href="./../../backend/03-database.html">数据库设计</a> - 数据库表设计规范</li><li><a href="./../../backend/04-api-design.html">API设计规范</a> - RESTful API 设计</li><li><a href="./../../backend/05-authentication.html">认证与授权</a> - 用户认证原理</li></ul><h2 id="业务流程概览" tabindex="-1">业务流程概览 <a class="header-anchor" href="#业务流程概览" aria-label="Permalink to “业务流程概览”">​</a></h2><div class="language-text line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({ "--shiki-light": "#24292e", "--shiki-dark": "#e1e4e8", "--shiki-light-bg": "#fff", "--shiki-dark-bg": "#24292e" })}" tabindex="0" dir="ltr"><code><span class="line"><span>用户充值 → 创建支付订单 → 支付成功 → 更新余额 → 消费扣款 → 业务处理</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br></div></div></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("fullstack/case-study/payment-system/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
