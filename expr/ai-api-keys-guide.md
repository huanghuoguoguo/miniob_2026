# OpenCode 配置指南（零 API Key、免费模型直连）

> 本文档介绍如何配置 OpenCode，一款开源免费的终端 AI 编程助手。
>
> **核心优势**：无需注册、无需 API Key、无需绑卡，安装后直接使用内置免费模型。

---

## 一、前置检查

OpenCode 只需要 **Node.js 18+**，绝大多数 Linux 都能直接装。

### 安装 Node.js

```bash
# Ubuntu/Debian 系统
sudo apt update && sudo apt install -y nodejs npm

# CentOS/RHEL 系统
sudo yum install -y nodejs npm

# 没有权限/不想装系统包 → 用 nvm 安装（推荐）
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
```

验证是否安装成功：
```bash
node -v  # 必须 ≥ v18.0.0
npm -v
```

---

## 二、安装 OpenCode

```bash
npm install -g opencode-ai
```

安装完成后，直接输入 `opencode` 就能启动！

---

## 三、一键配置免费模型

启动后**不用手动填任何 API Key**，直接执行内置指令：

### 1. 启动 OpenCode

```bash
opencode
```

### 2. 连接免费模型池（Zen 模式）

```
/connect zen
```

### 3. 查看可用免费模型

```
/models
```

你会看到这些**免费可用**的编程模型：

| 模型 | 特点 |
|------|------|
| `kimi-k2.5-free` | 长文本、重构、读代码最强 |
| `glm-4.7-free` / `glm-5-free` | 中文编程首选 |
| `minimax-m2.7-free` | 速度快 |
| `gpt-5-nano` | 快速简单任务 |

全部**无密钥、无额度限制、国内直连**。

### 4. 切换模型

```
/use kimi-k2.5-free
```

---

## 四、基础使用指令

直接在 OpenCode 终端里输入：

```
# 查看帮助
/help

# 查看当前配置
/config

# 让 AI 读取当前项目所有代码
/read .

# 让 AI 修改指定文件
/write main.cpp

# 执行系统命令（Linux 原生）
! ls -l
! ./build.sh

# 清空上下文
/clear

# 退出
/exit
```

---

## 五、使用示例

### 辅助开发 MiniOB

```bash
cd /path/to/miniob_2026
opencode

# 让 AI 理解项目结构
> /read .

# 提问
> 帮我分析 MiniOB 的 SQL 处理流程
> drop table 的代码在哪里？
> 帮我实现 drop table 功能
```

### 代码生成示例

```
帮我写一个 C++ 函数，实现 B+ 树的插入操作
```

AI 会直接生成可用的代码。

---

## 六、常见问题

### 1. 安装权限报错

```bash
# 加 sudo 即可
sudo npm install -g opencode-ai
```

### 2. 连接免费模型失败

```
# 重新连接
/connect zen

# 或重置配置
/reset
```

### 3. 想用自己的 API Key

如需使用 DeepSeek、Kimi 等平台的 API Key：

```bash
# 创建配置文件
mkdir -p ~/.opencode

cat > ~/.opencode/providers.json << 'EOF'
{
  "deepseek": {
    "api_key": "sk-你的DeepSeek密钥",
    "base_url": "https://api.deepseek.com/v1",
    "models": ["deepseek-chat", "deepseek-reasoner"]
  }
}
EOF
```

启动后用 `/connect deepseek` 切换。

---

## 七、国内平台 API Key 获取（可选）

如需更多额度，可注册以下平台获取免费 API Key：

| 平台 | 免费额度 | 注册地址 |
|------|---------|---------|
| **DeepSeek** | 500 万 Token（新用户） | https://platform.deepseek.com |
| **Kimi** | 15 元代金券 | https://platform.moonshot.cn |
| **阿里百炼** | 7000 万 Token（90天） | https://bailian.console.aliyun.com |
| **百度千帆** | ernie-speed 永久免费 | https://qianfan.cloud.baidu.com |

---

## 极简总结

1. 安装：`npm install -g opencode-ai`
2. 启动：`opencode`
3. 免费模型：`/connect zen`
4. 直接写代码！

**全程不需要任何平台账号、不需要 API Key、国内直连。**