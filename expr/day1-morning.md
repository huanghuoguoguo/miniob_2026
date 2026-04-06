# 第一天上午：环境配置与 Drop Table 实现

## 一、环境配置

### 1.1 Windows + WSL 安装

#### 安装 WSL2

1. 打开 PowerShell（管理员权限），执行：
```powershell
wsl --install
```

2. 重启电脑后，WSL2 会自动安装 Ubuntu。

3. 设置 Ubuntu 用户名和密码。

4. 验证 WSL 版本：
```powershell
wsl -l -v
```
确认 VERSION 为 2。

#### 常见问题

- 如果默认不是 Ubuntu，可以手动安装：
```powershell
wsl --install -d Ubuntu
```

- 如果需要更新 WSL：
```powershell
wsl --update
```

### 1.2 安装 Claude Code AI 工具

Claude Code 是 Anthropic 官方推出的命令行 AI 编程助手，可以辅助开发、调试、阅读代码。

#### 安装步骤

1. 在 WSL Ubuntu 中安装 Node.js：
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 安装 Node.js 20+
nvm install 20
nvm use 20
```

2. 安装 Claude Code：
```bash
npm install -g @anthropic-ai/claude-code
```

3. 配置 Claude Code：

**方式一：直接登录**
```bash
claude
```
按提示完成 Anthropic 账号登录认证。

**方式二：使用 OpenRouter API Key（推荐，免费额度）**

1. 注册 [OpenRouter](https://openrouter.ai/) 获取 API Key
2. 在项目目录下创建 `.claude/settings.local.json`：
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://openrouter.ai/api/v1",
    "ANTHROPIC_API_KEY": "你的OpenRouter API Key"
  }
}
```

**辅助 AI 工具推荐**：
- [千问（通义灵码）](https://tongyi.aliyun.com/) - 阿里云 AI 编程助手
- [豆包](https://www.doubao.com/) - 字节跳动 AI 助手
- 可用于辅助理解代码、解答疑问、生成代码片段

#### 使用 Claude Code 辅助开发

```bash
# 进入项目目录
cd /path/to/miniob_2026

# 启动 Claude Code
claude

# 示例提问
> 帮我分析 MiniOB 的项目结构
> 如何编译运行 MiniOB？
> drop table 的代码在哪里？
```

### 1.3 VSCode 连接 WSL

1. 在 Windows 上安装 [Visual Studio Code](https://code.visualstudio.com/)

2. 安装 "WSL" 扩展插件

3. 在 VSCode 中按 `F1`，输入 `WSL: Connect to WSL`

4. 选择连接到 Ubuntu

5. 连接成功后，终端会自动切换到 WSL 环境

### 1.4 MiniOB 环境配置与编译

> **提示**：如果已配置好 Claude Code 工具，可以直接让 AI 辅助完成环境配置：
> ```
> > 帮我安装 MiniOB 所需的依赖并编译项目
> ```

#### 安装依赖

在 WSL Ubuntu 中执行：

```bash
# 更新包管理器
sudo apt update

# 安装编译工具链
sudo apt install -y build-essential cmake git

# 安装 MiniOB 依赖
sudo apt install -y flex bison libevent-dev
```

#### 克隆项目

```bash
# 克隆 MiniOB 项目（或使用已有项目）
git clone https://github.com/oceanbase/miniob.git
cd miniob
```

#### 编译项目

```bash
# 创建 build 目录
mkdir build && cd build

# 生成构建文件
cmake ..

# 编译
make -j4
```

#### 运行测试

```bash
# 运行 observer 服务端
./bin/observer -f ../etc/observer.ini

# 运行 obclient 客户端（另一个终端）
./bin/obclient

# 测试 SQL 命令
> CREATE DATABASE test_db;
> USE test_db;
> CREATE TABLE test_table(id int, name char(10));
> INSERT INTO test_table VALUES(1, 'hello');
> SELECT * FROM test_table;
```

#### 使用 AI 辅助排查问题

如果编译或运行遇到问题，可以直接向 Claude Code 描述问题：

```bash
> 编译报错了：[粘贴错误信息]
> observer 启动失败，帮我分析原因
```

---

## 二、MiniOB 项目结构介绍

### 2.1 从最小存储结构开始理解

在学习 MiniOB 之前，我们先思考一个问题：**一个最简单的数据存储程序是什么样的？**

#### 最小存储结构：Map

最简单的存储结构可以是一个 `map`：

```cpp
map<string, string> dataMap;

void set(string& key, string& value) {
    dataMap[key] = value;
}

string get(string& key) {
    if (dataMap.find(key) != dataMap.end()) {
        return dataMap[key];
    }
    return "Key not found";
}
```

这个 `map` 实际上就是一个最基础的 NoSQL 数据库：
- 接受用户输入的 key
- 返回相应的 value

#### 但是问题来了...

**问题 1：数据持久化**

当前 `map` 仅工作在内存中。当程序关闭后，内存中的数据都会消失。作为一个数据库，是否应该有数据持久化的功能？

> **思考**：存储层次结构（操作系统知识）
> - CPU 高速缓存：ns 级速度，MB 级容量，易失性
> - 内存（RAM）：较快，GB 级容量，易失性
> - 磁盘：慢，TB 级容量，非易失性（持久化）
> 
> 数据库需要在"速度快的易失性介质"和"持久性介质"之间找到平衡。

解决方案：引入**序列化和转储**功能，将数据保存到磁盘。

**问题 2：条件查询**

如果 `value` 是多列数据（如 `[书名, 售价, 出版年份]`），如何根据售价查询符合条件的书籍？

当前 `map` 只能根据 key 查询。如果要根据 value 查询，需要遍历整个数据集，效率是 O(n)。

解决方案：引入**索引**（空间换时间）。

> **Trade-off 思考**：
> - 索引占用额外空间，但能加速查询（从 O(n) 到 O(log n)）
> - 这是典型的"空间换时间"策略

**问题 3：如何与磁盘打交道？**

既然要持久化数据到磁盘，我们面临一个关键问题：**程序如何读写磁盘上的文件？**

你可能已经用过 `read()` 和 `write()` 系统调用。但先思考几个问题：

1. **`read()` 会把整个文件载入内存吗？** 不会。它只读取指定字节数。
2. **`lseek()` 是什么作用？** 移动文件指针，实现按需读取指定位置。
3. **一个 10GB 的电影文件，你的内存只有 8GB，为什么能正常播放？**

答案在于：**Page Cache（页缓存）**。

#### Page Cache：操作系统层的"缓冲池"

```
┌─────────────────────────────────────────────────────────────┐
│                      用户程序                                │
│                    read() / write()                          │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Page Cache                                │
│              （内存中，通常几 GB）                             │
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│   │Page │ │Page │ │Page │ │Page │ │Page │ ...              │
│   │ 4KB │ │ 4KB │ │ 4KB │ │ 4KB │ │ 4KB │                  │
│   └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                       磁盘                                   │
│                    （文件系统）                               │
└─────────────────────────────────────────────────────────────┘
```

**工作原理**：

1. 当你调用 `read()` 时，操作系统不会每次都直接读磁盘
2. 先检查 Page Cache 中有没有这一页（4KB）
3. 如果有（缓存命中），直接从内存返回，速度极快
4. 如果没有（缓存未命中），从磁盘读取该页到 Page Cache，再返回给你
5. `write()` 同理——先写入 Page Cache，由操作系统择机刷回磁盘

**这就是为什么 10GB 的电影能在 8GB 内存的电脑上播放**：操作系统按需加载当前播放位置附近的几页到 Page Cache，播完就换下一页。

> **思考**：Page Cache 是操作系统帮你管理的。那数据库为什么要自己实现 Buffer Pool？
>
> 提示：数据库需要更精细的控制——何时刷盘、如何保证事务持久性、如何实现预读策略...

#### 不同的文件 I/O 方式

| 方式 | 特点 | 适用场景 |
|------|------|----------|
| `read()` / `write()` | 标准系统调用，经过 Page Cache | 通用文件读写 |
| `mmap()` | 将文件映射到内存地址空间，像访问数组一样访问文件 | 随机访问、共享内存 |
| `O_DIRECT` | 绕过 Page Cache，直接读写磁盘 | 数据库、高性能 I/O |

> **问题**：MiniOB 用的是哪种方式？为什么要这样选择？

我们将在 Buffer Pool 模块深入讨论这个问题。

### 2.2 目录结构概览

```
miniob_2026/
├── src/                  # 源代码目录
│   ├── observer/         # 核心服务端代码
│   │   ├── sql/          # SQL 处理模块
│   │   │   ├── parser/   # SQL 解析器（词法+语法）
│   │   │   ├── stmt/     # Statement 语句处理
│   │   │   ├── executor/ # 执行器
│   │   │   ├── operator/ # 物理算子
│   │   │   └── expr/     # 表达式处理
│   │   ├── storage/      # 存储引擎
│   │   │   ├── db/       # 数据库管理
│   │   │   ├── table/    # 表管理
│   │   │   ├── buffer/   # 缓冲池
│   │   │   ├── record/   # 记录管理
│   │   │   └── index/    # 索引管理
│   │   ├── session/      # 会话管理
│   │   └── net/          # 网络通信
│   ├── obclient/         # 客户端程序
│   └── common/           # 公共基础库（含 DataType）
│   └── common/type/      # 数据类型定义（int, float, char 等）
├── deps/                 # 第三方依赖
├── docs/                 # 文档
├── test/                 # 测试用例
├── etc/                  # 配置文件
└── build.sh              # 构建脚本
```

### 2.3 SQL 处理流程

```
SQL 字符串
    ↓
┌─────────────────┐
│   Parser        │  词法解析 (lex_sql.l) + 语法解析 (yacc_sql.y)
│   解析器        │  输出：ParsedSqlNode（语法树）
└─────────────────┘
    ↓
┌─────────────────┐
│   Resolver      │  语义分析：将 ParsedSqlNode 转换为 Statement
│   语句解析      │  输出：Stmt 对象（DDL → Executor，DML → 优化器）
└─────────────────┘
    ↓
┌─────────────────┐
│   Optimizer     │  DML 语句进入优化器，生成逻辑算子 → 物理算子
│   优化器        │
└─────────────────┘
    ↓
┌─────────────────┐
│   Executor      │  执行算子树，调用存储层
│   执行器        │  输出：执行结果
└─────────────────┘
    ↓
┌─────────────────┐
│   Storage       │  存储引擎实际操作
│   存储层        │
└─────────────────┘
```

### 2.4 关键概念补充

#### SEDA 框架与事件流转

MiniOB 使用 **SEDA（Staged Event-Driven Architecture）** 框架来组织各个处理阶段：

```
┌─────────────────────────────────────────────────┐
│              线程池（ThreadPool）                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ Stage 1 │→ │ Stage 2 │→ │ Stage 3 │         │
│  │ (事件队列)│  │ (事件队列)│  │ (事件队列)│         │
│  └─────────┘  └─────────┘  └─────────┘         │
│       ↑            ↓                            │
│    Event        Event                           │
└─────────────────────────────────────────────────┘
```

每个 Stage 对应一个处理阶段：
- **SessionStage**：接收网络请求，创建 SessionEvent
- **ParseStage**：词法+语法解析，输出 ParsedSqlNode
- **ResolveStage**：语义分析，创建 Statement
- **ExecuteStage**：执行 SQL

> **思考**：为什么用事件驱动？
> - 解耦各个处理阶段
> - 支持线程池复用
> - 便于扩展新的处理阶段

#### DDL vs DML

SQL 语句分为两类：

| 类型 | 说明 | MiniOB 处理路径 |
|------|------|-----------------|
| **DDL**（Data Definition Language） | CREATE/DROP TABLE, CREATE INDEX | 直接进入 Executor 执行 |
| **DML**（Data Manipulation Language） | SELECT/INSERT/UPDATE/DELETE | 进入优化器生成算子树 |

#### 数据类型（DataType）

MiniOB 将基本数据类型包装成类：

```cpp
class DataType {
  virtual int compare(const Value &left, const Value &right) const;
  virtual RC add(const Value &left, const Value &right, Value &result) const;
  virtual RC subtract(...);
  virtual RC multiply(...);
};
```

已定义的类型：`int`、`float`、`char`、`text` 等。

> **面向对象思想**：将基本数据类型包装成类，提供统一的操作接口。这种做法在数据处理项目中很常见。

#### 表达式（Expression）

表达式可以被递归分解：

```
SELECT c1 + c2 FROM t1 WHERE c1 > 10

表达式树：
    +
   / \
  c1  c2

条件树：
    >
   / \
  c1  10
```

表达式类型：`ValueExpr`、`FieldExpr`、`ArithmeticExpr` 等。

#### Tuple（行）

Tuple 代表一行数据，与表的 Schema 对应：

```cpp
class RowTuple {
  Table *table_;     // 所属表
  Record record_;    // 原始记录数据
};
```

算子之间通过 Tuple 传递数据。

### 2.5 关键模块说明

| 模块 | 目录 | 职责 |
|------|------|------|
| Parser | `sql/parser/` | SQL 词法和语法解析，生成语法树 |
| Stmt | `sql/stmt/` | 语法树转换为内部语句对象 |
| Executor | `sql/executor/` | 执行语句，调用存储层 |
| Storage | `storage/` | 数据存储、索引、缓冲池管理 |

---

## 三、MiniOB 调试讲解

在进入 Drop Table 实现之前，我们需要先熟悉 MiniOB 的运行机制。通过调试 CREATE TABLE 和 SELECT 语句，理解数据流向。

### 3.1 调试准备

MiniOB 项目已配置好 VSCode 调试环境（`.vscode/launch.json`），可以直接使用。

#### 安装 VSCode 插件

在 VSCode 中安装以下插件：

| 插件 | 作用 |
|------|------|
| **C/C++** (Microsoft) | C++ 语法支持、调试支持 |
| **C/C++ Extension Pack** | 包含 C/C++ 相关工具集 |
| **CodeLLDB** (可选) | macOS/Linux 下更流畅的调试体验 |

#### 启动调试

1. 打开 MiniOB 项目（VSCode 连接 WSL）
2. 按 `F5` 或点击"运行和调试"
3. 选择 "Debug" 配置（使用 cppdbg）或 "LLDB" 配置

调试配置说明（`.vscode/launch.json`）：
- **程序**：`build/bin/observer`
- **参数**：`-f etc/observer.ini -P cli`（CLI 模式，单线程，方便调试）
- **工作目录**：`build/`

#### 调试模式下输入 SQL

在 CLI 模式下调试时，SQL 输入会出现在 VSCode 的**调试控制台**（Debug Console）中。

> **提示**：如果想在交互式终端中输入 SQL，可以在终端手动运行 `./bin/observer -f ../etc/observer.ini -P cli`，然后在另一个终端用 `./bin/obclient` 连接。

### 3.2 SQL 处理完整流程

一条 SQL 从用户输入到执行完成的完整流程：

```
用户输入 SQL
      ↓
┌─────────────────────────────────────────────┐
│  SessionStage::handle_request()             │  接收网络请求
│  session/session_stage.cpp:35               │
└─────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────┐
│  ParseStage                                 │  词法+语法解析
│  parser/parse_stage.cpp                     │  输出 ParsedSqlNode
└─────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────┐
│  ResolveStage                               │  语义分析
│  parser/resolve_stage.cpp:48                │  调用 Stmt::create_stmt()
└─────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────┐
│  Stmt::create_stmt()                        │  创建具体 Stmt 对象
│  stmt/stmt.cpp:48                           │  如 CreateTableStmt
└─────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────┐
│  ExecuteStage::handle_request()             │  执行入口
│  executor/execute_stage.cpp:28              │
└─────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────┐
│  CommandExecutor::execute()                 │  分发到具体执行器
│  executor/command_executor.cpp:30           │
└─────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────┐
│  CreateTableExecutor::execute()             │  执行建表
│  executor/create_table_executor.cpp:24      │  调用存储层
└─────────────────────────────────────────────┘
```

### 3.3 关键断点位置

建议在以下位置打断点，观察数据流向：

#### 网络请求接收
| 文件 | 行号 | 函数 | 说明 |
|------|------|------|------|
| `session/session_stage.cpp` | 35 | `SessionStage::handle_request()` | 网络请求入口 |
| `session/session_stage.cpp` | 58 | `SessionStage::handle_request2()` | 处理 SQL 请求 |

#### SQL 解析阶段
| 文件 | 行号 | 函数 | 说明 |
|------|------|------|------|
| `parser/parse_stage.cpp` | 49 | `ParsedSqlNode` 创建 | 解析完成后的语法树节点 |
| `parser/yacc_sql.y` | 327 | `SCF_CREATE_TABLE` | CREATE TABLE 语法规则 |

#### Resolver 阶段（语义分析）
| 文件 | 行号 | 函数 | 说明 |
|------|------|------|------|
| `parser/resolve_stage.cpp` | 45 | `ResolveStage::handle_request()` | Resolver 入口 |
| `parser/resolve_stage.cpp` | 48 | `Stmt::create_stmt()` | 创建 Statement |

#### Statement 创建（重要）
| 文件 | 行号 | 函数 | 说明 |
|------|------|------|------|
| `stmt/stmt.cpp` | 48 | `Stmt::create_stmt()` | **核心分发函数** |
| `stmt/stmt.cpp` | 72 | `CreateTableStmt::create()` | 创建建表语句对象 |
| `stmt/select_stmt.cpp` | 34 | `SelectStmt::create()` | 创建查询语句对象 |
| `stmt/insert_stmt.cpp` | 24 | `InsertStmt::create()` | 创建插入语句对象 |

#### 执行器阶段
| 文件 | 行号 | 函数 | 说明 |
|------|------|------|------|
| `executor/execute_stage.cpp` | 28 | `ExecuteStage::handle_request()` | 执行入口 |
| `executor/execute_stage.cpp` | 34 | `handle_request_with_physical_operator()` | 物理算子执行 |
| `executor/command_executor.cpp` | 30 | `CommandExecutor::execute()` | **核心分发函数** |
| `executor/create_table_executor.cpp` | 24 | `CreateTableExecutor::execute()` | 建表执行器 |

#### 物理算子执行（SELECT 流程）
| 文件 | 行号 | 函数 | 说明 |
|------|------|------|------|
| `operator/table_scan_physical_operator.cpp` | 21 | `open()` | 打开表扫描 |
| `operator/table_scan_physical_operator.cpp` | 31 | `next()` | 获取下一行记录 |
| `operator/project_physical_operator.cpp` | 27 | `open()` | 打开投影算子 |
| `operator/project_physical_operator.cpp` | 43 | `next()` | 投影下一行 |
| `operator/predicate_physical_operator.cpp` | 36 | `next()` | 过滤下一行 |

### 3.4 调试步骤示例

#### 调试 CREATE TABLE

1. 在 `stmt/stmt.cpp:72` 打断点（`CreateTableStmt::create`）
2. 在 `executor/create_table_executor.cpp:24` 打断点
3. 启动 observer，用 obclient 连接
4. 执行：`CREATE TABLE test(id int, name char(10));`
5. 观察断点处的调用栈和数据结构

#### 调试 SELECT

1. 在 `stmt/select_stmt.cpp:34` 打断点
2. 在 `operator/table_scan_physical_operator.cpp:31` 打断点
3. 在 `operator/project_physical_operator.cpp:43` 打断点
4. 执行：`SELECT * FROM test;`
5. 观察 SELECT 如何生成算子树，以及火山模型的拉取驱动过程

### 3.5 火山模型理解

MiniOB 使用火山模型（Volcano Model）执行查询：

```
   PROJECT（投影）
       ↓ next()
   PREDICATE（过滤）
       ↓ next()
   TABLE SCAN（扫描）
       ↓ next()
   存储层返回记录
```

每个算子通过 `next()` 向子算子"拉取"数据：
- 上层算子调用 `next()` 请求一行数据
- 子算子返回一行或 EOF
- 从叶子算子（TableScan）开始，逐层向上传递

**断点建议**：在 `TableScanPhysicalOperator::next()` 和 `ProjectPhysicalOperator::next()` 打断点，观察数据如何从存储层流向输出层。

---

## 四、Drop Table 实现

### 4.1 当前实现状态

Drop Table 的**解析层已完成**，但**执行层和存储层未实现**。

| 层级 | 状态 |
|------|------|
| 词法解析 | ✅ 已实现 |
| 语法解析 | ✅ 已实现 |
| Statement 创建 | ❌ 未实现 |
| 执行器 | ❌ 未实现 |
| 存储层 | ❌ 未实现 |

### 4.2 关键代码位置

#### 词法解析

**文件**: `src/observer/sql/parser/lex_sql.l`

定义 `DROP` 和 `TABLE` 关键字的词法规则。

#### 语法解析

**文件**: `src/observer/sql/parser/yacc_sql.y`

```yacc
drop_table_stmt:    /*drop table 语句的语法解析树*/
    DROP TABLE ID {
      $$ = new ParsedSqlNode(SCF_DROP_TABLE);
      $$->drop_table.relation_name = $3;
    };
```

#### 解析结果数据结构

**文件**: `src/observer/sql/parser/parse_defs.h`

```cpp
struct DropTableSqlNode
{
  string relation_name;  ///< 要删除的表名
};
```

#### Statement 类型

**文件**: `src/observer/sql/stmt/stmt.h`

已定义 `StmtType::DROP_TABLE`。

#### Statement 创建（待实现）

**文件**: `src/observer/sql/stmt/stmt.cpp`

需要在 `Stmt::create_stmt()` 中添加 `DROP_TABLE` 的处理分支。

#### 执行器（待实现）

**文件**: `src/observer/sql/executor/command_executor.cpp`

需要在 `CommandExecutor::execute()` 中添加 `DROP_TABLE` 的处理分支。

#### 存储层接口（待实现）

**文件**: `src/observer/storage/default/default_handler.cpp`

`drop_table()` 函数当前返回 `RC::UNIMPLEMENTED`，需要实现实际删除逻辑。

### 4.3 实现思路

实现 Drop Table 需要补全以下部分：

1. **创建 DropTableStmt 类**
   - 参考 `CreateTableStmt` 的实现方式
   - 位置：`src/observer/sql/stmt/`

2. **在 stmt.cpp 中添加处理**
   - 解析 `SCF_DROP_TABLE` 类型
   - 创建 `DropTableStmt` 对象

3. **在执行器中添加处理**
   - 调用存储层的 `drop_table()` 接口

4. **实现存储层删除逻辑**
   - 删除表文件
   - 清理元数据
   - 释放资源

详细实现步骤请参考文档：
- `docs/design/miniob-how-to-add-new-sql.md`

---

## 五、参考资料

- [MiniOB 框架介绍](https://oceanbase.github.io/miniob/)
- [如何编译 MiniOB](https://oceanbase.github.io/miniob/how_to_build.html)
- [如何运行 MiniOB](https://oceanbase.github.io/miniob/how_to_run.html)
- [VSCode 开发指南](https://oceanbase.github.io/miniob/how_to_dev_miniob_by_vscode.html)
- [如何新增 SQL 语句](https://oceanbase.github.io/miniob/miniob-how-to-add-new-sql.html)