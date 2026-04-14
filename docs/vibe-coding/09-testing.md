---
order: 70
---

# AI 辅助测试

测试是保证代码质量的重要手段。AI 可以帮助生成测试用例、编写测试代码、分析测试覆盖率，显著提高测试效率。本章介绍 AI 在测试领域的应用。

## AI 辅助测试的优势

### 传统测试 vs AI 辅助测试

| 传统测试 | AI 辅助测试 |
|---------|------------|
| 手动编写测试用例 | AI 自动生成测试用例 |
| 测试覆盖率难以保证 | AI 分析并补充缺失用例 |
| 边界情况容易遗漏 | AI 系统性识别边界情况 |
| 测试代码维护成本高 | AI 辅助维护和更新测试 |
| 测试数据准备繁琐 | AI 生成测试数据 |

### AI 测试的核心价值

1. **效率提升**：快速生成测试代码
2. **覆盖全面**：系统性覆盖各种场景
3. **边界发现**：识别容易遗漏的边界情况
4. **质量保证**：提高测试代码质量
5. **持续维护**：辅助测试代码的更新和维护

## 测试用例生成

### 单元测试生成

```markdown
// 提示词示例
"请为以下函数生成单元测试：

```typescript
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```text

要求：

- 使用 Jest 测试框架
- 覆盖正常情况和边界情况
- 包含描述性的测试名称"

// AI 生成的测试

```typescript
describe('validateEmail', () => {
  // 正常情况
  test('有效的邮箱地址返回 true', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co')).toBe(true);
    expect(validateEmail('user+tag@example.org')).toBe(true);
  });

  // 边界情况
  test('无效的邮箱地址返回 false', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('plaintext')).toBe(false);
    expect(validateEmail('missing@domain')).toBe(false);
    expect(validateEmail('@nodomain.com')).toBe(false);
    expect(validateEmail('spaces in@email.com')).toBe(false);
  });

  // 特殊字符
  test('包含特殊字符的邮箱', () => {
    expect(validateEmail('user!@example.com')).toBe(false);
    expect(validateEmail('user#@example.com')).toBe(false);
  });

  // 边界值
  test('边界长度邮箱', () => {
    const longEmail = 'a'.repeat(50) + '@example.com';
    expect(validateEmail(longEmail)).toBe(true);
    
    const tooLongEmail = 'a'.repeat(100) + '@example.com';
    expect(validateEmail(tooLongEmail)).toBe(true);
  });
});
```text

```text

### API 测试生成

```markdown
// 提示词示例
"请为以下 API 接口生成测试：

```typescript
// POST /api/users
// 创建用户接口
// 请求体：{ email: string, name: string, password: string }
// 成功响应：{ success: true, data: { id: string, email: string, name: string } }
// 失败响应：{ success: false, message: string }
```text

要求：

- 使用 supertest 测试库
- 测试成功和失败场景
- 包含参数验证测试"

// AI 生成的测试

```typescript
import request from 'supertest';
import app from '../app';

describe('POST /api/users', () => {
  // 成功场景
  test('创建用户成功', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.email).toBe('test@example.com');
  });

  // 参数验证
  test('缺少必填字段返回错误', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('邮箱格式错误返回错误', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'invalid-email',
        name: 'Test User',
        password: 'Password123!'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('email');
  });

  test('密码强度不足返回错误', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com',
        name: 'Test User',
        password: '123'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('password');
  });

  // 重复创建
  test('邮箱已存在返回错误', async () => {
    // 先创建一个用户
    await request(app)
      .post('/api/users')
      .send({
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'Password123!'
      });

    // 尝试创建相同邮箱的用户
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'existing@example.com',
        name: 'Another User',
        password: 'Password123!'
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toContain('already exists');
  });
});
```text

```text

### 组件测试生成

```markdown
// 提示词示例
"请为以下 React 组件生成测试：

```typescript
interface Props {
  items: { id: string; name: string }[];
  onSelect: (id: string) => void;
}

export const ItemList: React.FC<Props> = ({ items, onSelect }) => {
  if (items.length === 0) {
    return <div className="empty">暂无数据</div>;
  }

  return (
    <ul className="item-list">
      {items.map(item => (
        <li key={item.id} onClick={() => onSelect(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
};
```text

要求：

- 使用 React Testing Library
- 测试渲染和交互
- 测试边界情况"

// AI 生成的测试

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemList } from './ItemList';

describe('ItemList', () => {
  const mockItems = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' }
  ];

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  test('渲染列表项', () => {
    render(<ItemList items={mockItems} onSelect={mockOnSelect} />);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  test('点击项目触发 onSelect', () => {
    render(<ItemList items={mockItems} onSelect={mockOnSelect} />);
    
    fireEvent.click(screen.getByText('Item 1'));
    expect(mockOnSelect).toHaveBeenCalledWith('1');
  });

  test('空列表显示提示', () => {
    render(<ItemList items={[]} onSelect={mockOnSelect} />);
    
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  test('每个项目都有正确的 key', () => {
    const { container } = render(
      <ItemList items={mockItems} onSelect={mockOnSelect} />
    );
    
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(3);
  });

  test('多次点击正确触发', () => {
    render(<ItemList items={mockItems} onSelect={mockOnSelect} />);
    
    fireEvent.click(screen.getByText('Item 1'));
    fireEvent.click(screen.getByText('Item 2'));
    fireEvent.click(screen.getByText('Item 3'));
    
    expect(mockOnSelect).toHaveBeenCalledTimes(3);
    expect(mockOnSelect).toHaveBeenNthCalledWith(1, '1');
    expect(mockOnSelect).toHaveBeenNthCalledWith(2, '2');
    expect(mockOnSelect).toHaveBeenNthCalledWith(3, '3');
  });
});
```text

```text

## 测试覆盖率分析

### 识别未覆盖的代码

```markdown
// 提示词示例
"以下代码的测试覆盖率报告显示有些分支未覆盖：

```typescript
function calculateDiscount(price: number, level: string): number {
  if (price < 0) throw new Error('Invalid price');
  if (price > 10000) return price * 0.7;  // 未覆盖
  if (level === 'VIP') return price * 0.8;
  if (level === 'GOLD') return price * 0.9;
  return price;
}
```text

当前测试：

```typescript
test('VIP 用户折扣', () => {
  expect(calculateDiscount(100, 'VIP')).toBe(80);
});

test('普通用户无折扣', () => {
  expect(calculateDiscount(100, 'NORMAL')).toBe(100);
});
```text

请补充缺失的测试用例。"

// AI 生成的补充测试

```typescript
// 补充测试用例

test('价格超过 10000 享受额外折扣', () => {
  expect(calculateDiscount(15000, 'VIP')).toBe(10500);
  expect(calculateDiscount(15000, 'NORMAL')).toBe(10500);
});

test('GOLD 用户享受 9 折', () => {
  expect(calculateDiscount(100, 'GOLD')).toBe(90);
});

test('负数价格抛出错误', () => {
  expect(() => calculateDiscount(-100, 'VIP')).toThrow('Invalid price');
});

test('边界价格 10000', () => {
  expect(calculateDiscount(10000, 'VIP')).toBe(8000);
  expect(calculateDiscount(10001, 'VIP')).toBe(7000.7);
});

test('未知等级按原价', () => {
  expect(calculateDiscount(100, 'UNKNOWN')).toBe(100);
});
```text

```text

### 提高覆盖率

```markdown
// 提示词示例
"请分析以下代码并生成测试用例，目标覆盖率 90%：

```typescript
class UserService {
  async createUser(data: CreateUserDTO) {
    if (!data.email || !data.password) {
      throw new Error('Email and password are required');
    }
    
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new Error('Email already exists');
    }
    
    const hashedPassword = await this.hashPassword(data.password);
    const user = await this.repository.create({
      ...data,
      password: hashedPassword
    });
    
    await this.sendWelcomeEmail(user.email);
    return user;
  }
}
```text

请生成完整的测试套件。"

// AI 生成的测试套件

```typescript
describe('UserService.createUser', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<UserRepository>;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findByEmail: jest.fn()
    };
    mockEmailService = {
      sendWelcomeEmail: jest.fn()
    };
    service = new UserService(mockRepository, mockEmailService);
  });

  // 成功场景
  test('成功创建用户', async () => {
    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.create.mockResolvedValue({ id: '1', email: 'test@example.com' });
    mockEmailService.sendWelcomeEmail.mockResolvedValue(undefined);

    const result = await service.createUser({
      email: 'test@example.com',
      password: 'Password123'
    });

    expect(result).toHaveProperty('id');
    expect(mockRepository.create).toHaveBeenCalled();
    expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith('test@example.com');
  });

  // 参数验证
  test('缺少邮箱抛出错误', async () => {
    await expect(service.createUser({
      email: '',
      password: 'Password123'
    })).rejects.toThrow('Email and password are required');
  });

  test('缺少密码抛出错误', async () => {
    await expect(service.createUser({
      email: 'test@example.com',
      password: ''
    })).rejects.toThrow('Email and password are required');
  });

  // 重复邮箱
  test('邮箱已存在抛出错误', async () => {
    mockRepository.findByEmail.mockResolvedValue({ id: '1', email: 'test@example.com' });

    await expect(service.createUser({
      email: 'test@example.com',
      password: 'Password123'
    })).rejects.toThrow('Email already exists');
  });

  // 密码加密
  test('密码被正确加密', async () => {
    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.create.mockImplementation(async (data) => ({
      id: '1',
      ...data
    }));
    mockEmailService.sendWelcomeEmail.mockResolvedValue(undefined);

    await service.createUser({
      email: 'test@example.com',
      password: 'Password123'
    });

    const createCall = mockRepository.create.mock.calls[0][0];
    expect(createCall.password).not.toBe('Password123');
  });

  // 错误处理
  test('数据库错误正确传递', async () => {
    mockRepository.findByEmail.mockRejectedValue(new Error('Database error'));

    await expect(service.createUser({
      email: 'test@example.com',
      password: 'Password123'
    })).rejects.toThrow('Database error');
  });

  test('邮件发送失败不影响用户创建', async () => {
    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.create.mockResolvedValue({ id: '1', email: 'test@example.com' });
    mockEmailService.sendWelcomeEmail.mockRejectedValue(new Error('Email failed'));

    // 根据业务逻辑，可能需要调整这个测试
    const result = await service.createUser({
      email: 'test@example.com',
      password: 'Password123'
    });

    expect(result).toHaveProperty('id');
  });
});
```text

```text

## 测试数据生成

### 生成模拟数据

```markdown
// 提示词示例
"请为用户模块生成测试数据：

用户数据结构：
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
}
```text

要求：

- 生成 10 条测试数据
- 包含各种角色和状态
- 邮箱格式正确
- 时间合理分布"

// AI 生成的测试数据

```typescript
export const testUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    status: 'active',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'user-2',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'user',
    status: 'active',
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'user-3',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    role: 'user',
    status: 'active',
    createdAt: new Date('2024-02-01')
  },
  {
    id: 'user-4',
    email: 'guest.user@example.com',
    name: 'Guest User',
    role: 'guest',
    status: 'active',
    createdAt: new Date('2024-02-15')
  },
  {
    id: 'user-5',
    email: 'inactive.user@example.com',
    name: 'Inactive User',
    role: 'user',
    status: 'inactive',
    createdAt: new Date('2024-03-01')
  },
  {
    id: 'user-6',
    email: 'suspended.user@example.com',
    name: 'Suspended User',
    role: 'user',
    status: 'suspended',
    createdAt: new Date('2024-03-15')
  },
  {
    id: 'user-7',
    email: 'moderator@example.com',
    name: 'Moderator',
    role: 'admin',
    status: 'active',
    createdAt: new Date('2024-04-01')
  },
  {
    id: 'user-8',
    email: 'new.user@example.com',
    name: 'New User',
    role: 'user',
    status: 'active',
    createdAt: new Date('2024-04-15')
  },
  {
    id: 'user-9',
    email: 'vip.user@example.com',
    name: 'VIP User',
    role: 'user',
    status: 'active',
    createdAt: new Date('2024-05-01')
  },
  {
    id: 'user-10',
    email: 'test.user@example.com',
    name: 'Test User',
    role: 'guest',
    status: 'inactive',
    createdAt: new Date('2024-05-15')
  }
];
```text

```text

### 生成 Mock 对象

```markdown
// 提示词示例
"请为以下接口生成 Mock 对象：

```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserDTO): Promise<User>;
  update(id: string, data: UpdateUserDTO): Promise<User>;
  delete(id: string): Promise<void>;
}
```text

要求使用 Jest mock。"

// AI 生成的 Mock

```typescript
export const createMockUserRepository = (): jest.Mocked<UserRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
});

// 使用示例
describe('UserService', () => {
  let repository: jest.Mocked<UserRepository>;
  let service: UserService;

  beforeEach(() => {
    repository = createMockUserRepository();
    service = new UserService(repository);
  });

  test('findById returns user', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test' };
    repository.findById.mockResolvedValue(mockUser);

    const result = await service.findById('1');

    expect(result).toEqual(mockUser);
    expect(repository.findById).toHaveBeenCalledWith('1');
  });
});
```text

```text

## 测试最佳实践

### 实践一：测试命名规范

```typescript
// ❌ 不好的命名
test('test1', () => { ... });
test('user test', () => { ... });

// ✅ 好的命名
test('创建用户成功返回用户信息', () => { ... });
test('邮箱已存在时抛出错误', () => { ... });
test('密码强度不足时返回验证错误', () => { ... });
```text

### 实践二：测试结构清晰

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    test('成功创建用户', () => { ... });
    test('参数验证失败', () => { ... });
    test('重复邮箱错误', () => { ... });
  });

  describe('updateUser', () => {
    test('成功更新用户', () => { ... });
    test('用户不存在错误', () => { ... });
  });
});
```text

### 实践三：边界条件测试

```markdown
// 让 AI 识别边界条件
"请为以下函数识别所有边界条件：

```typescript
function calculatePrice(quantity: number, unitPrice: number): number {
  if (quantity < 0) throw new Error('Invalid quantity');
  if (quantity > 1000) return quantity * unitPrice * 0.9;
  if (quantity > 100) return quantity * unitPrice * 0.95;
  return quantity * unitPrice;
}
```text

请列出所有需要测试的边界值。"

// AI 分析结果
边界条件：

1. quantity = -1（负数）
2. quantity = 0（零值）
3. quantity = 1（最小正数）
4. quantity = 100（折扣边界）
5. quantity = 101（超过 100）
6. quantity = 1000（大额折扣边界）
7. quantity = 1001（超过 1000）
8. unitPrice = 0（零价格）
9. unitPrice 为负数
10. 数值为浮点数的情况

```text

## 小结

AI 辅助测试的关键点：

1. **测试用例生成**：让 AI 生成单元测试、API 测试、组件测试
2. **覆盖率分析**：识别未覆盖的代码分支
3. **测试数据生成**：生成模拟数据和 Mock 对象
4. **边界识别**：系统性识别边界条件
5. **最佳实践**：遵循测试命名规范和结构规范

AI 可以显著提高测试效率，但测试策略和质量把控仍需人工决策。

---

## 参考资料

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://testingjavascript.com/)
