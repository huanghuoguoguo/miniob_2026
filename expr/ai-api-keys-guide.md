# AI 辅助开发工具 - 免费 API Key 获取指南

> 本文档记录如何获取免费或低成本的 AI 模型 API Key，用于辅助 MiniOB 开发学习。
>
> **推荐国内平台**，访问稳定，实名认证后即可领取免费额度。

---

## 一、DeepSeek（推荐）

DeepSeek 是国产大模型，性价比极高，代码能力强。

### 1. 注册账号

1. 访问官网：https://platform.deepseek.com
2. 用手机号或邮箱注册并登录

### 2. 获取 API Key

1. 登录后进入 **控制台**
2. 点击左侧 **"API Keys"**
3. 点击 **"创建 API Key"**
4. 复制保存密钥（**仅显示一次**）

**Key 格式**：`sk-xxxxxxxxxxxxxxxxxxxxxxxx`

### 3. 免费额度

- **新用户**：完成实名认证后，获得约 **10 元等值 Token 免费额度**（约 500 万 Token）
- **有效期**：30 天
- **价格**：DeepSeek-V3 约 ¥1/百万 tokens

### 4. API 调用

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-你的DeepSeek密钥",
    base_url="https://api.deepseek.com/v1"
)

response = client.chat.completions.create(
    model="deepseek-chat",  # 或 "deepseek-reasoner" (R1 推理模型)
    messages=[{"role": "user", "content": "解释 B+ 树的插入过程"}]
)

print(response.choices[0].message.content)
```

### 5. 支持模型

| 模型 | 说明 |
|------|------|
| `deepseek-chat` | 通用对话模型，适合日常开发 |
| `deepseek-reasoner` | 推理模型（R1），适合复杂问题分析 |

---

## 二、Kimi（月之暗面）

Kimi 长文本处理能力突出，适合文档分析、代码生成等场景。

### 1. 注册账号

1. 访问官网：https://platform.moonshot.cn
2. 用中国大陆手机号注册并登录

### 2. 获取 API Key

1. 登录后进入控制台
2. 点击 **"API 密钥管理"**
3. 点击 **"新建 API Key"**
4. 填写名称后生成并保存（**仅显示一次**）

### 3. 免费额度

- **新用户**：完成个人实名认证后，自动发放 **15 元代金券**
- **额度**：约 62.5 万–125 万 Token（视模型而定）
- **有效期**：3 个月

### 4. API 调用

```python
from openai import OpenAI

client = OpenAI(
    api_key="你的Kimi密钥",
    base_url="https://api.moonshot.cn/v1"
)

response = client.chat.completions.create(
    model="moonshot-v1-8k",
    messages=[{"role": "user", "content": "你好"}]
)
```

### 5. 支持模型

| 模型 | 上下文长度 | 说明 |
|------|-----------|------|
| `moonshot-v1-8k` | 8K | 日常对话 |
| `moonshot-v1-32k` | 32K | 长文本处理 |
| `moonshot-v1-128k` | 128K | 超长文本分析 |

---

## 三、阿里云百炼（通义千问）

### 1. 注册

1. 访问：https://bailian.console.aliyun.com/
2. 使用阿里云账号登录
3. 选择地域（如华北2北京）

### 2. 获取 API Key

1. 进入 **百炼控制台**
2. 点击左侧 **"API-KEY 管理"**
3. 点击 **"创建 API Key"**

### 3. 免费额度

- **新用户**：开通即送 **超 7000 万 Tokens**（90 天有效期）
- **魔搭社区**：实名用户享 **每日 2000 次免费调用**（长期有效）

### 4. API 调用

```python
from openai import OpenAI

client = OpenAI(
    api_key="你的阿里云API-Key",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

response = client.chat.completions.create(
    model="qwen-turbo",  # 或 qwen-plus, qwen-max
    messages=[{"role": "user", "content": "你好"}]
)
```

### 5. 支持模型

| 模型 | 说明 |
|------|------|
| `qwen-turbo` | 速度快，日常对话 |
| `qwen-plus` | 平衡性能与成本 |
| `qwen-max` | 最强能力 |
| `qwen-vl` | 多模态（图像理解） |

---

## 四、字节跳动·火山方舟（豆包）

### 1. 注册

1. 访问：https://console.volcengine.com/ark
2. 使用火山引擎账号登录

### 2. 获取 API Key

1. 进入方舟控制台
2. 左侧导航进入 **"API 密钥管理"**
3. 点击 **"创建 API 密钥"**
4. 命名并配置权限，保存 Secret Key

### 3. 免费额度

- **新用户**：注册享 **50 万 Tokens 免费体验**（安心体验模式）
- **协作奖励**：可领 **每日 200 万 Tokens**（按天重置）

### 4. 支持模型

| 模型 | 说明 |
|------|------|
| 豆包 seed 系列 | 轻量级模型 |
| 豆包 1.5 系列 | 主力模型 |
| GLM | 智谱模型 |

---

## 五、其他平台

| 平台 | 免费额度 | 获取入口 |
|------|---------|---------|
| **百度千帆** | ernie-speed 模型永久免费 | https://qianfan.cloud.baidu.com |
| **腾讯混元** | 新用户赠 100 万 Tokens | https://cloud.tencent.com/product/hunyuan |
| **智谱 AI** | 新用户赠免费额度 | https://open.bigmodel.cn |

---

## 六、Claude Code 配置国内模型

### 方案：使用 CCR 路由器

```bash
# 安装
npm install -g @anthropic-ai/claude-code
npm install -g @musistudio/claude-code-router

# 创建配置目录
mkdir -p ~/.claude-code-router

# 写入配置
cat > ~/.claude-code-router/config.json << 'EOF'
{
  "Providers": [
    {
      "name": "deepseek",
      "api_base_url": "https://api.deepseek.com/v1/chat/completions",
      "api_key": "sk-你的DeepSeek密钥",
      "models": ["deepseek-chat", "deepseek-reasoner"],
      "transformer": { "use": ["openai"] }
    }
  ],
  "Router": {
    "default": "deepseek,deepseek-chat"
  }
}
EOF

# 启动
ccr code
```

启动后用 `/model` 切换模型。

---

## 七、常见问题

| 问题 | 解决 |
|------|------|
| 免费额度未到账 | 检查是否完成实名认证（身份证+人脸识别） |
| API Key 忘记了 | 在控制台重新创建新的 Key |
| 调用失败 | 确认密钥正确、模型名正确、余额充足 |
| 响应慢 | 切换到其他模型，或调整 `max_tokens` |
| 额度用完了 | 可充值或等待每日免费额度重置 |

---

## 八、推荐配置

| 场景 | 推荐方案 |
|------|---------|
| **日常开发** | DeepSeek（免费额度大、价格低） |
| **长文本分析** | Kimi（支持 128K 上下文） |
| **多模型切换** | 阿里百炼（Qwen 全系列） |
| **预算有限** | 各平台免费额度轮流使用 |

---

## 九、安全提醒

1. **实名认证**：国内平台免费额度通常需实名认证，这是领取福利的前提
2. **密钥安全**：API Key 仅显示一次，务必保存到安全位置
3. **额度规划**：优先使用免费额度，超出后再按需付费
4. **不要泄露**：不要将 Key 上传到 GitHub 等公开平台