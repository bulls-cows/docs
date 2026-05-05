
# 充值流程

本文介绍用户充值的完整流程，包括创建支付订单、支付回调处理和余额更新。

## 前置知识

- [余额系统](./02-balance.md) - 余额账户设计
- [API设计规范](../../04-backend/04-api-design.md) - RESTful API 设计

## 充值流程图

```text
用户发起充值请求
    ↓
创建支付订单
    ↓
调用支付接口
    ↓
用户完成支付
    ↓
支付回调通知
    ↓
验证回调签名
    ↓
更新订单状态
    ↓
充值到余额
    ↓
发送通知
```

## 创建充值订单

### API 设计

```typescript
// POST /api/balance/recharge
interface ParamsApiCreateRechargeOrder {
  amount: number; // 充值金额（分）
  pay_type: 'wechat' | 'alipay'; // 支付方式
}

interface ReturnApiCreateRechargeOrder {
  order_no: string; // 订单号
  pay_url: string; // 支付链接
}
```

### 控制器实现

```typescript
export const cCreateRechargeOrder: ExpressRequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      res.fail('请先登录', 401);
      return;
    }

    const body: ParamsApiCreateRechargeOrder = sCreateRechargeOrder.parse(req.body);
    const { amount, pay_type } = body;

    // 验证金额
    if (amount < 100) {
      res.fail('充值金额不能少于1元');
      return;
    }

    // 创建订单
    const [err, result] = await createRechargeOrder({
      userId: user.id,
      amount,
      payType: pay_type,
    });

    if (err) {
      res.fail(err.message);
      return;
    }

    res.success<ReturnApiCreateRechargeOrder>(result);
  } catch (err) {
    next(err);
  }
};
```

### 服务层实现

```typescript
export const createRechargeOrder = async (params: {
  userId: number;
  amount: number;
  payType: string;
}): Promise<TReturn<{ order_no: string; pay_url: string }>> => {
  const { userId, amount, payType } = params;

  // 生成订单号
  const orderNo = generateOrderNo();

  // 创建订单记录
  await knex('order').insert({
    order_no: orderNo,
    user_id: userId,
    amount,
    pay_type: payType,
    pay_status: 0, // 待支付
  });

  // 调用支付接口
  const [payErr, payResult] = await createPayOrder({
    orderNo,
    amount,
    payType,
  });

  if (payErr) {
    return [payErr, undefined];
  }

  return [null, { order_no: orderNo, pay_url: payResult.pay_url }];
};
```

## 支付回调处理

### 回调接口

```typescript
// POST /api/balance/pay-callback
export const cPayCallback: ExpressRequestHandler = async (req, res, next) => {
  try {
    // 1. 验证签名
    const isValid = verifyCallbackSign(req.body);
    if (!isValid) {
      res.send('FAIL');
      return;
    }

    // 2. 解析回调数据
    const { order_no, pay_status, amount } = parseCallbackData(req.body);

    // 3. 查询订单
    const order = await knex('order').where({ order_no }).first();
    if (!order) {
      res.send('FAIL');
      return;
    }

    // 4. 检查订单状态
    if (order.pay_status === 1) {
      res.send('SUCCESS'); // 已处理
      return;
    }

    // 5. 更新订单状态
    await knex('order')
      .where({ order_no })
      .update({ pay_status: 1, paid_at: new Date() });

    // 6. 充值到余额
    await rechargeBalance(order.user_id, order.amount, order.id, '充值');

    res.send('SUCCESS');
  } catch (err) {
    console.error('支付回调处理失败:', err);
    res.send('FAIL');
  }
};
```

## 充值成功处理

```typescript
export const handleRechargeSuccess = async (orderNo: string) => {
  await knex.transaction(async (trx) => {
    // 1. 查询订单
    const order = await trx('order').where({ order_no: orderNo }).first();
    if (!order || order.pay_status === 1) {
      return; // 订单不存在或已处理
    }

    // 2. 更新订单状态
    await trx('order')
      .where({ order_no: orderNo })
      .update({ pay_status: 1, paid_at: new Date() });

    // 3. 充值到余额
    await rechargeBalance(order.user_id, order.amount, order.id, '充值');
  });
};
```

## 前端实现

### 充值页面

```vue
<template>
  <div class="recharge-page">
    <h2>充值余额</h2>

    <!-- 金额选择 -->
    <div class="amount-options">
      <div
        v-for="option in amountOptions"
        :key="option.value"
        :class="['amount-option', { active: selectedAmount === option.value }]"
        @click="selectedAmount = option.value"
      >
        {{ option.label }}
      </div>
    </div>

    <!-- 自定义金额 -->
    <el-input
      v-model.number="customAmount"
      type="number"
      placeholder="或输入自定义金额"
    />

    <!-- 支付方式 -->
    <div class="pay-type">
      <el-radio-group v-model="payType">
        <el-radio value="wechat">微信支付</el-radio>
        <el-radio value="alipay">支付宝</el-radio>
      </el-radio-group>
    </div>

    <!-- 充值按钮 -->
    <el-button type="primary" :loading="loading" @click="handleRecharge">
      立即充值
    </el-button>
  </div>
</template>

<script setup lang="ts">
const selectedAmount = ref(1000);
const customAmount = ref<number>();
const payType = ref<'wechat' | 'alipay'>('wechat');
const loading = ref(false);

const amountOptions = [
  { label: '10元', value: 1000 },
  { label: '50元', value: 5000 },
  { label: '100元', value: 10000 },
  { label: '500元', value: 50000 },
];

const handleRecharge = async () => {
  const amount = customAmount.value || selectedAmount.value;

  if (!amount || amount < 100) {
    ElMessage.error('充值金额不能少于1元');
    return;
  }

  loading.value = true;

  const [err, result] = await apiCreateRechargeOrder({
    amount,
    pay_type: payType.value,
  });

  loading.value = false;

  if (err) {
    ElMessage.error(err.message);
    return;
  }

  // 跳转支付页面
  window.location.href = result.pay_url;
};
</script>
```

## 相关章节

- [余额系统](./02-balance.md) - 余额账户设计
- [提现流程](./04-withdrawal.md) - 提现申请和审批
