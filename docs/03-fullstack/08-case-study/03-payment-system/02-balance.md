
# 余额系统

本文介绍余额系统的核心设计，包括账户表、交易流水表的设计和核心操作。

## 前置知识

- [数据库设计](../../04-backend/03-database.md) - 数据库表设计规范

## 数据库设计

### 余额账户表（balance_account）

存储用户当前余额信息。

```sql
CREATE TABLE `balance_account` (
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '账户余额（元）',
  `frozen_balance` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '冻结余额',
  `last_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='余额账户表';
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | int | 用户ID，唯一主键 |
| balance | decimal(10,2) | 账户余额，单位：元 |
| frozen_balance | decimal(10,2) | 冻结余额，用于处理中的订单 |
| last_updated | datetime | 最后更新时间 |

### 交易流水表（balance_transaction）

记录所有余额变动记录。

```sql
CREATE TABLE `balance_transaction` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `transaction_type` enum('recharge','consume','refund','adjust','withdraw') NOT NULL COMMENT '交易类型',
  `amount` decimal(10,2) NOT NULL COMMENT '交易金额（正数增加，负数减少）',
  `balance_before` decimal(10,2) NOT NULL COMMENT '交易前余额',
  `balance_after` decimal(10,2) NOT NULL COMMENT '交易后余额',
  `status` enum('pending','success','failed','canceled') NOT NULL DEFAULT 'pending' COMMENT '交易状态',
  `order_id` int(11) DEFAULT NULL COMMENT '关联支付订单ID',
  `business_type` varchar(50) DEFAULT NULL COMMENT '业务类型',
  `business_id` int(11) DEFAULT NULL COMMENT '业务ID',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `fee` decimal(10,2) DEFAULT NULL COMMENT '手续费',
  `actual_amount` decimal(10,2) DEFAULT NULL COMMENT '实际到账金额',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`, `created_at`),
  KEY `idx_type` (`user_id`, `transaction_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='余额交易流水表';
```

## TypeScript 类型定义

```typescript
// 交易类型
type TransactionType = 'recharge' | 'consume' | 'refund' | 'adjust' | 'withdraw';

// 交易状态
type TransactionStatus = 'pending' | 'success' | 'failed' | 'canceled';

// 余额账户
interface BalanceAccount {
  user_id: number;
  balance: number;
  frozen_balance: number;
  last_updated: Date;
}

// 交易记录
interface BalanceTransaction {
  id: number;
  user_id: number;
  transaction_type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  status: TransactionStatus;
  order_id: number | null;
  business_type: string | null;
  business_id: number | null;
  remark: string | null;
  fee: number | null;
  actual_amount: number | null;
  created_at: Date;
}
```

## 核心操作

### 查询用户余额

```typescript
export const getUserBalance = async (userId: number) => {
  const account = await knex('balance_account')
    .where({ user_id: userId })
    .first();

  return {
    balance: account?.balance || 0,
    frozen_balance: account?.frozen_balance || 0,
    available_balance: (account?.balance || 0) - (account?.frozen_balance || 0),
  };
};
```

### 消费扣款

```typescript
export const consumeBalance = async (
  userId: number,
  amount: number,
  businessType: string,
  businessId: number,
  remark: string
): Promise<TReturn<BalanceTransaction>> => {
  try {
    return await knex.transaction(async (trx) => {
      // 1. 查询并锁定账户
      const account = await trx('balance_account')
        .where({ user_id: userId })
        .forUpdate()
        .first();

      if (!account || account.balance < amount) {
        return [new Error('余额不足'), undefined];
      }

      const balanceBefore = account.balance;
      const balanceAfter = balanceBefore - amount;

      // 2. 创建交易记录
      const [transaction] = await trx('balance_transaction').insert({
        user_id: userId,
        transaction_type: 'consume',
        amount: -amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        status: 'success',
        business_type: businessType,
        business_id: businessId,
        remark,
      }).returning('*');

      // 3. 更新余额
      await trx('balance_account')
        .where({ user_id: userId })
        .update({ balance: balanceAfter });

      return [null, transaction];
    });
  } catch (err) {
    return [getError(err), undefined];
  }
};
```

### 充值到余额

```typescript
export const rechargeBalance = async (
  userId: number,
  amount: number,
  orderId: number,
  remark: string
): Promise<TReturn<BalanceTransaction>> => {
  try {
    return await knex.transaction(async (trx) => {
      // 1. 查询账户
      const account = await trx('balance_account')
        .where({ user_id: userId })
        .forUpdate()
        .first();

      const balanceBefore = account?.balance || 0;
      const balanceAfter = balanceBefore + amount;

      // 2. 创建交易记录
      const [transaction] = await trx('balance_transaction').insert({
        user_id: userId,
        transaction_type: 'recharge',
        amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        status: 'success',
        order_id: orderId,
        remark,
      }).returning('*');

      // 3. 更新或创建账户
      if (account) {
        await trx('balance_account')
          .where({ user_id: userId })
          .update({ balance: balanceAfter });
      } else {
        await trx('balance_account').insert({
          user_id: userId,
          balance: balanceAfter,
          frozen_balance: 0,
        });
      }

      return [null, transaction];
    });
  } catch (err) {
    return [getError(err), undefined];
  }
};
```

## 注意事项

1. **事务处理**：所有余额操作必须在事务中进行
2. **行锁**：使用 `forUpdate()` 锁定行，避免并发问题
3. **精度处理**：使用 BigNumber 进行金额计算
4. **流水记录**：每笔操作都要记录交易流水

## 相关章节

- [充值流程](./03-recharge.md) - 充值接口和支付回调
- [提现流程](./04-withdrawal.md) - 提现申请和审批
