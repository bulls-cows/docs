
# 提现流程

本文介绍用户提现的完整流程，包括提现申请、审批处理和账户管理。

## 前置知识

- [余额系统](./06-balance.md) - 余额账户设计
- [认证与授权](../../02-backend/05-authentication.md) - 用户认证原理

## 提现流程图

```text
用户发起提现请求
    ↓
验证提现金额
    ↓
检查可用余额
    ↓
计算手续费
    ↓
创建提现记录
    ↓
创建审批记录
    ↓
扣除余额
    ↓
等待管理员审批
    ↓
批准 → 标记已提现 → 发送通知
驳回 → 退回余额
```

## 系统配置

```typescript
// src/scripts/ConstantUtils.mts

// 最小提现金额（元）
export const MIN_WITHDRAW_AMOUNT = 10;

// 提现手续费费率（0.01 表示 1%）
export const WITHDRAW_FEE_PERCENT = 0.01;

// 单笔最低手续费（元）
export const MIN_WITHDRAW_FEE = 1;

// 提现到账时间（工作日）
export const WITHDRAW_TO_ACCOUNT_TIME = 3;
```

## 提现账户管理

### 提现账户表

```sql
CREATE TABLE `balance_withdraw_account` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `account_type` enum('bank_card','alipay','wechat') NOT NULL COMMENT '账户类型',
  `account_name` varchar(100) NOT NULL COMMENT '账户名称',
  `account_number` varchar(100) NOT NULL COMMENT '账户号码',
  `bank_name` varchar(100) DEFAULT NULL COMMENT '银行名称',
  `bank_branch` varchar(200) DEFAULT NULL COMMENT '开户行',
  `is_default` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否默认',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现账户表';
```

### TypeScript 类型

```typescript
type AccountType = 'bank_card' | 'alipay' | 'wechat';

interface WithdrawAccount {
  id: number;
  user_id: number;
  account_type: AccountType;
  account_name: string;
  account_number: string;
  bank_name: string | null;
  bank_branch: string | null;
  is_default: number;
}
```

## 提现申请

### API 设计

```typescript
// POST /api/balance/withdraw
interface ParamsApiWithdraw {
  amount: number; // 提现金额（元）
  withdraw_account_id?: number; // 提现账户ID
  remark?: string; // 备注
}

interface ReturnApiWithdraw {
  transaction_id: number; // 交易ID
  amount: number; // 提现金额
  fee: number; // 手续费
  actual_amount: number; // 实际到账
}
```

### 服务层实现

```typescript
import BigNumber from 'bignumber.js';

export const withdrawBalance = async (
  userId: number,
  amount: number,
  withdrawAccountId?: number,
  remark?: string
): Promise<TReturn<ReturnApiWithdraw>> => {
  try {
    return await knex.transaction(async (trx) => {
      // 1. 查询并锁定账户
      const account = await trx('balance_account')
        .where({ user_id: userId })
        .forUpdate()
        .first();

      if (!account) {
        return [new Error('账户不存在'), undefined];
      }

      const balanceBefore = Number(account.balance);
      const frozenBalance = Number(account.frozen_balance);
      const availableBalance = new BigNumber(balanceBefore)
        .minus(frozenBalance)
        .toNumber();

      // 2. 验证提现金额
      if (amount < MIN_WITHDRAW_AMOUNT) {
        return [new Error(`提现金额不能少于${MIN_WITHDRAW_AMOUNT}元`), undefined];
      }

      if (availableBalance < amount) {
        return [new Error(`可用余额不足，当前可用: ${availableBalance}元`), undefined];
      }

      // 3. 计算手续费
      const fee = BigNumber.max(
        new BigNumber(amount).times(WITHDRAW_FEE_PERCENT),
        MIN_WITHDRAW_FEE
      ).toNumber();
      const actualAmount = new BigNumber(amount).minus(fee).toNumber();

      if (actualAmount < 0) {
        return [new Error('提现金额不足以支付手续费'), undefined];
      }

      const balanceAfter = new BigNumber(balanceBefore).minus(amount).toNumber();

      // 4. 创建提现交易记录
      const [transactionId] = await trx('balance_transaction').insert({
        user_id: userId,
        transaction_type: 'withdraw',
        amount: -amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        status: 'pending',
        withdraw_account_id: withdrawAccountId || null,
        fee,
        actual_amount: actualAmount,
        remark: remark || '余额提现',
      }).returning('id');

      // 5. 创建审批记录
      await trx('balance_withdraw_audit').insert({
        transaction_id: transactionId,
        user_id: userId,
        audit_status: 'pending',
        is_withdrawn: false,
        original_amount: amount,
      });

      // 6. 更新余额
      await trx('balance_account')
        .where({ user_id: userId })
        .update({ balance: balanceAfter });

      return [null, {
        transaction_id: transactionId,
        amount,
        fee,
        actual_amount: actualAmount,
      }];
    });
  } catch (err) {
    return [getError(err), undefined];
  }
};
```

## 提现审批

### 审批表设计

```sql
CREATE TABLE `balance_withdraw_audit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_id` int(11) NOT NULL COMMENT '交易ID',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `audit_status` enum('pending','approved','rejected','deleted') NOT NULL DEFAULT 'pending',
  `is_withdrawn` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已提现',
  `auditor_id` int(11) DEFAULT NULL COMMENT '审批人ID',
  `audited_at` datetime DEFAULT NULL COMMENT '审批时间',
  `original_amount` decimal(10,2) NOT NULL COMMENT '原始金额',
  `adjusted_amount` decimal(10,2) DEFAULT NULL COMMENT '调整后金额',
  `remark` varchar(500) DEFAULT NULL COMMENT '审批备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_audit_status` (`audit_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现审批表';
```

### 审批操作

```typescript
// 批准提现
export const approveWithdraw = async (
  transactionId: number,
  auditorId: number,
  remark?: string
): Promise<TReturn<void>> => {
  // 更新审批状态
  await knex('balance_withdraw_audit')
    .where({ transaction_id: transactionId })
    .update({
      audit_status: 'approved',
      auditor_id: auditorId,
      audited_at: new Date(),
      remark,
    });

  // 更新交易状态
  await knex('balance_transaction')
    .where({ id: transactionId })
    .update({ status: 'success' });

  return [null, undefined];
};

// 驳回提现
export const rejectWithdraw = async (
  transactionId: number,
  auditorId: number,
  remark: string
): Promise<TReturn<void>> => {
  return await knex.transaction(async (trx) => {
    // 1. 查询交易记录
    const transaction = await trx('balance_transaction')
      .where({ id: transactionId })
      .first();

    if (!transaction) {
      return [new Error('交易记录不存在'), undefined];
    }

    // 2. 退回余额
    const account = await trx('balance_account')
      .where({ user_id: transaction.user_id })
      .forUpdate()
      .first();

    const balanceBefore = Number(account.balance);
    const balanceAfter = balanceBefore + Math.abs(Number(transaction.amount));

    await trx('balance_account')
      .where({ user_id: transaction.user_id })
      .update({ balance: balanceAfter });

    // 3. 创建退款交易记录
    await trx('balance_transaction').insert({
      user_id: transaction.user_id,
      transaction_type: 'refund',
      amount: Math.abs(Number(transaction.amount)),
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      status: 'success',
      original_transaction_id: transactionId,
      remark: `提现驳回退款：${remark}`,
    });

    // 4. 更新审批状态
    await trx('balance_withdraw_audit')
      .where({ transaction_id: transactionId })
      .update({
        audit_status: 'rejected',
        auditor_id: auditorId,
        audited_at: new Date(),
        remark,
      });

    // 5. 更新交易状态
    await trx('balance_transaction')
      .where({ id: transactionId })
      .update({ status: 'failed' });

    return [null, undefined];
  });
};
```

## 前端实现

```vue
<template>
  <div class="withdraw-page">
    <h2>余额提现</h2>

    <!-- 余额信息 -->
    <div class="balance-info">
      <p>可用余额：<span class="amount">{{ availableBalance }} 元</span></p>
    </div>

    <!-- 提现表单 -->
    <el-form :model="form" :rules="rules" ref="formRef">
      <el-form-item label="提现金额" prop="amount">
        <el-input-number
          v-model="form.amount"
          :min="10"
          :precision="2"
          placeholder="请输入提现金额"
        />
        <span class="hint">最低提现 {{ minWithdrawAmount }} 元</span>
      </el-form-item>

      <el-form-item label="提现账户" prop="withdraw_account_id">
        <el-select v-model="form.withdraw_account_id" placeholder="请选择提现账户">
          <el-option
            v-for="account in withdrawAccounts"
            :key="account.id"
            :label="getAccountLabel(account)"
            :value="account.id"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <!-- 手续费提示 -->
    <div class="fee-info" v-if="form.amount">
      <p>手续费：{{ fee }} 元</p>
      <p>实际到账：{{ actualAmount }} 元</p>
    </div>

    <el-button type="primary" :loading="loading" @click="handleWithdraw">
      提交申请
    </el-button>
  </div>
</template>

<script setup lang="ts">
import BigNumber from 'bignumber.js';

const form = reactive({
  amount: 0,
  withdraw_account_id: undefined as number | undefined,
});

const loading = ref(false);
const availableBalance = ref(0);
const withdrawAccounts = ref<WithdrawAccount[]>([]);

// 计算手续费
const fee = computed(() => {
  if (!form.amount) return 0;
  return BigNumber.max(
    new BigNumber(form.amount).times(0.01),
    1
  ).toNumber();
});

// 计算实际到账
const actualAmount = computed(() => {
  if (!form.amount) return 0;
  return new BigNumber(form.amount).minus(fee.value).toNumber();
});

const handleWithdraw = async () => {
  // 提现逻辑...
};
</script>
```

## 注意事项

1. **并发安全**：使用事务和行锁保证余额操作的原子性
2. **精度处理**：使用 BigNumber 进行金额计算
3. **最小金额**：设置最小提现金额限制
4. **手续费计算**：`max(金额 × 费率, 最低手续费)`
5. **审批流程**：提现需要管理员审批
6. **余额退回**：驳回时自动退回余额

## 相关章节

- [余额系统](./06-balance.md) - 余额账户设计
- [充值流程](./05-recharge.md) - 充值接口和支付回调
