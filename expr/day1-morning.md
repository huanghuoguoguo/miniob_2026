# 第一天上午：环境配置与 Drop Table 实现

## 教学目标

- 让学生完成 MiniOB 基本开发环境准备，知道最小可运行链路是什么
- 让学生建立从 SQL 输入到存储层执行的整体心智模型，而不是只记零散模块名
- 让学生掌握“通过调试理解系统”的基本方法，能沿着关键断点观察数据流
- 以 `DROP TABLE` 为案例，让学生理解 DDL 在 MiniOB 中的完整实现路径，以及 `CREATE`/`DROP` 的对称关系

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

### 1.2 安装 OpenCode AI 工具

OpenCode 是一款开源免费的终端 AI 编程助手，内置多个免费模型，**无需注册、无需 API Key**。

```bash
# 安装 Node.js（如果没有）
sudo apt install -y nodejs npm

# 安装 OpenCode
npm install -g opencode-ai

# 启动并连接免费模型
opencode
/connect zen
```

详细配置见 [AI IDE/CLI 配置指南](./ai-ide-cli-setup.md)。

### 1.3 VSCode 连接 WSL

1. 在 Windows 上安装 [Visual Studio Code](https://code.visualstudio.com/)

2. 安装 "WSL" 扩展插件

3. 在 VSCode 中按 `F1`，输入 `WSL: Connect to WSL`

4. 选择连接到 Ubuntu

5. 连接成功后，终端会自动切换到 WSL 环境

### 1.4 MiniOB 环境配置与编译

> **提示**：如果已配置好 OpenCode 工具，可以直接让 AI 辅助完成环境配置：
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

如果编译或运行遇到问题，可以直接向 OpenCode 描述问题：

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

> 存储层次结构（操作系统知识）
> - CPU 高速缓存：ns 级速度，MB 级容量，易失性
> - 内存（RAM）：较快，GB 级容量，易失性
> - 磁盘：慢，TB 级容量，非易失性（持久化）
>
> 数据库需要在"速度快的易失性介质"和"持久性介质"之间找到平衡。

怎么解决？引入序列化和转储功能，将数据保存到磁盘。

**问题 2：条件查询**

如果 `value` 是多列数据（如 `[书名, 售价, 出版年份]`），如何根据售价查询符合条件的书籍？

当前 `map` 只能根据 key 查询。如果要根据 value 查询，需要遍历整个数据集，效率是 O(n)。

怎么解决？引入索引——为售价字段单独建立一个映射。索引虽然占用额外空间，但能将查询效率从 O(n) 提升到 O(log n)，这是典型的"空间换时间"策略。

**问题 3：如何与磁盘打交道？**

既然要持久化数据到磁盘，我们面临一个关键问题：程序如何读写磁盘上的文件？

你可能用过 `read()` 和 `write()` 系统调用。一个 10GB 的电影文件，你的内存只有 8GB，为什么能正常播放？

答案是操作系统帮你做了缓存——Page Cache。当你调用 `read()` 时，操作系统不会每次都直接读磁盘，而是先检查内存中有没有缓存这一页数据。`write()` 同理，先写入内存中的 Page Cache，由操作系统择机刷回磁盘。

那数据库为什么不直接用 Page Cache，而要自己实现 Buffer Pool？

这是一个好问题，我们放到后面专门讲 Buffer Pool 的时候再展开。现在只需要知道：操作系统提供了基础的缓存机制，但数据库需要更精细的控制。

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

MiniOB 使用 SEDA（Staged Event-Driven Architecture）框架来组织各个处理阶段：

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
- SessionStage：接收网络请求，创建 SessionEvent
- ParseStage：词法+语法解析，输出 ParsedSqlNode
- ResolveStage：语义分析，创建 Statement
- ExecuteStage：执行 SQL

> 为什么用事件驱动？
> - 解耦各个处理阶段
> - 支持线程池复用
> - 便于扩展新的处理阶段

SQL 语句分为两类：

| 类型 | 说明 | MiniOB 处理路径 |
|------|------|-----------------|
| DDL（Data Definition Language） | CREATE/DROP TABLE, CREATE INDEX | 直接进入 Executor 执行 |
| DML（Data Manipulation Language） | SELECT/INSERT/UPDATE/DELETE | 进入优化器生成算子树 |

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

已定义的类型：int、float、char、text 等。

> 面向对象思想：将基本数据类型包装成类，提供统一的操作接口。这种做法在数据处理项目中很常见。

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

表达式类型：ValueExpr、FieldExpr、ArithmeticExpr 等。

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
| C/C++ (Microsoft) | C++ 语法支持、调试支持 |
| C/C++ Extension Pack | 包含 C/C++ 相关工具集 |
| CodeLLDB (可选) | macOS/Linux 下更流畅的调试体验 |

#### 启动调试

1. 打开 MiniOB 项目（VSCode 连接 WSL）
2. 按 `F5` 或点击"运行和调试"
3. 选择 "Debug" 配置（使用 cppdbg）或 "LLDB" 配置

调试配置说明（`.vscode/launch.json`）：
- 程序：`build/bin/observer`
- 参数：`-f etc/observer.ini -P cli`（CLI 模式，单线程，方便调试）
- 工作目录：`build/`

#### 调试模式下输入 SQL

在 CLI 模式下调试时，SQL 输入会出现在 VSCode 的调试控制台（Debug Console）中。

> 如果想在交互式终端中输入 SQL，可以在终端手动运行 `./bin/observer -f ../etc/observer.ini -P cli`，然后在另一个终端用 `./bin/obclient` 连接。

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

通过实现 `DROP TABLE` 语句，理解 SQL 语句的完整处理流程，以及数据库如何管理磁盘文件。

### 4.1 从调试 CREATE TABLE 到实现 DROP TABLE

在上一节调试 CREATE TABLE 时，你应该观察到：

1. 代码路径：Parser → Stmt → Executor → Db::create_table()
2. 创建的文件：xxx.table、xxx.data、xxx.lob
3. 内存变化：表名被加入 `opened_tables_` 映射

现在要实现 DROP TABLE，你觉得需要做什么？

> CREATE 和 DROP 是一对相反的操作。如果 CREATE 是创建，那 DROP 就是销毁。
>
> | 操作 | CREATE TABLE | DROP TABLE |
> |------|--------------|------------|
> | 内存 | 加入 opened_tables_ | 从 opened_tables_ 移除 |
> | 对象 | new Table() | delete Table |
> | 文件 | 创建 .table/.data/.lob | 删除 .table/.data/.lob |

所以实现 DROP TABLE，就是沿着 CREATE TABLE 的**反方向**走一遍：
- CREATE 在哪里创建文件，DROP 就在哪里删除
- CREATE 在哪里申请内存，DROP 就在哪里释放内存

### 4.2 确定需要删除的文件

在调试 CREATE TABLE 时，你可能看到了类似这样的文件创建：

```cpp
// Db::create_table() 中
string table_meta_path = table_meta_file(path_.c_str(), table_name);
string table_data_path = table_data_file(path_.c_str(), table_name);
```

所以数据库目录下会生成：

```
miniob/db/sys/
├── users.table     # 表元数据（字段定义）
├── users.data      # 表数据（记录）
└── users.lob       # 大对象数据（TEXT 类型等）
```

> 课外知识：当你执行 `rm large_file.txt` 时，为什么瞬间就完成了？
>
> 答案：`rm` 只是删除了文件目录项（directory entry），标记 inode 为可回收。实际的数据块并没有被擦除，只是变成了空闲空间。
>
> 这就是为什么删除大文件很快，恢复删除的文件有时可行——数据还在磁盘上，只是找不到入口了。

### 4.3 SQL 处理流程

对照 CREATE TABLE 的流程，DROP TABLE 的流程几乎一样：

```
DROP TABLE users
       ↓
┌──────────────┐
│   Parser     │  输出：ParsedSqlNode(SCF_DROP_TABLE)
│              │       .drop_table.relation_name = "users"
└──────────────┘
       ↓
┌──────────────┐
│   Stmt       │  输出：DropTableStmt
│              │       .table_name_ = "users"
└──────────────┘
       ↓
┌──────────────┐
│   Executor   │  调用：db->drop_table("users")
└──────────────┘
       ↓
┌──────────────┐
│   Storage    │  删除文件、清理内存
└──────────────┘
```

### 4.3 实现步骤一：DropTableStmt

Parser 输出的是 ParsedSqlNode，这是一个语法树节点。但语法树只是记录了 SQL 的结构，还没有进行语义检查。

比如：要删除的表是否存在？当前数据库是否有效？

这些检查在 Stmt 创建阶段进行。

#### DropTableStmt 类定义

创建文件 `src/observer/sql/stmt/drop_table_stmt.h`：

```cpp
#pragma once

#include "common/lang/string.h"
#include "sql/stmt/stmt.h"

class Db;

class DropTableStmt : public Stmt
{
public:
  DropTableStmt(const string &table_name) : table_name_(table_name) {}
  virtual ~DropTableStmt() = default;

  StmtType type() const override { return StmtType::DROP_TABLE; }
  const string &table_name() const { return table_name_; }

  static RC create(Db *db, const DropTableSqlNode &drop_table, Stmt *&stmt);

private:
  string table_name_;
};
```

这个类很简单，只保存了表名。为什么这么简单？

> CREATE TABLE 需要保存字段列表、字段类型等信息。而 DROP TABLE 只需要知道删哪个表，所以只需要表名。

#### DropTableStmt 创建函数

创建文件 `src/observer/sql/stmt/drop_table_stmt.cpp`：

```cpp
#include "sql/stmt/drop_table_stmt.h"
#include "storage/db/db.h"

RC DropTableStmt::create(Db *db, const DropTableSqlNode &drop_table, Stmt *&stmt)
{
  // 当前只保存表名，不做额外的存在性检查
  // 存在性检查可以在执行阶段做
  stmt = new DropTableStmt(drop_table.relation_name);
  return RC::SUCCESS;
}
```

> 设计决策：表是否存在，是在 Stmt 阶段检查，还是在 Executor 阶段检查？
>
> 两种方式都可以。MiniOB 倾向于在 Stmt 阶段做基本检查（如表名是否合法），执行阶段做实际操作检查（如表是否存在）。

### 4.4 实现步骤二：注册到 stmt.cpp

打开 `src/observer/sql/stmt/stmt.cpp`，找到 `create_stmt` 函数：

```cpp
RC Stmt::create_stmt(Db *db, StmtSqlNode &sql_node, Stmt *&stmt)
{
  switch (sql_node.flag) {
    case SCF_CREATE_TABLE: {
      return CreateTableStmt::create(db, sql_node.create_table, stmt);
    }
    // ... 其他 case ...

    case SCF_DROP_TABLE: {
      return DropTableStmt::create(db, sql_node.drop_table, stmt);
    }

    default:
      LOG_WARN("unknown sql statement type: %d", sql_node.flag);
      return RC::UNIMPLENMENT;
  }
}
```

这就是"分发器"模式：根据 SQL 类型，调用对应的 Stmt 创建函数。

### 4.5 实现步骤三：DropTableExecutor

执行器是真正干活的地方。创建 `src/observer/sql/executor/drop_table_executor.cpp`：

```cpp
#include "sql/executor/drop_table_executor.h"
#include "sql/stmt/drop_table_stmt.h"
#include "storage/db/db.h"
#include "session/session.h"

RC DropTableExecutor::execute(SQLStageEvent *sql_event)
{
  // 1. 获取 Stmt 对象
  Stmt *stmt = sql_event->stmt();
  DropTableStmt *drop_stmt = static_cast<DropTableStmt *>(stmt);

  // 2. 获取当前数据库
  Session *session = sql_event->session_event()->session();
  Db *db = session->get_current_db();

  // 3. 调用存储层删除表
  return db->drop_table(drop_stmt->table_name().c_str());
}
```

可以看到，Executor 只是"胶水代码"，把 Stmt 中的参数取出来，调用存储层接口。

### 4.6 实现步骤四：存储层删除逻辑

这是最核心的部分。打开 `src/observer/storage/db/db.cpp`：

```cpp
RC Db::drop_table(const char *table_name)
{
  RC rc = RC::SUCCESS;

  // 1. 检查表是否存在
  auto iter = opened_tables_.find(table_name);
  if (iter == opened_tables_.end()) {
    LOG_WARN("Table not exist. db=%s, table_name=%s", name_.c_str(), table_name);
    return RC::SCHEMA_TABLE_NOT_EXIST;
  }

  Table *table = iter->second;

  // 2. 从内存映射中移除
  opened_tables_.erase(iter);

  // 3. 获取文件路径
  string table_meta_path = table_meta_file(path_.c_str(), table_name);
  string table_data_path = table_data_file(path_.c_str(), table_name);
  string table_lob_path  = table_lob_file(path_.c_str(), table_name);

  // 4. 删除 Table 对象（释放内存，关闭文件句柄）
  delete table;

  // 5. 删除磁盘文件
  if (filesystem::exists(table_meta_path)) {
    filesystem::remove(table_meta_path);
  }
  if (filesystem::exists(table_data_path)) {
    filesystem::remove(table_data_path);
  }
  if (filesystem::exists(table_lob_path)) {
    filesystem::remove(table_lob_path);
  }

  return rc;
}
```

#### 代码解析

**步骤 1-2：内存清理**

`opened_tables_` 是一个 `map<string, Table*>`，缓存了所有打开的表。删除前必须先从 map 中移除。

**步骤 4：对象销毁**

`delete table` 会触发 Table 析构函数，关闭可能持有的文件句柄、释放缓冲区。

> 为什么先 delete table 再删文件？
>
> 想象一下：如果先删了文件，但 Table 对象还持有文件句柄，会发生什么？
> - Linux 允许删除已打开的文件，文件引用计数归零后才会真正删除
> - 但这不是好的实践——应该先关闭句柄，再删除文件

**步骤 5：文件删除**

使用 C++17 的 `std::filesystem` 库，比传统的 `unlink()` 更简洁安全。

### 4.7 完整调用链

```
DROP TABLE users
       ↓
ParseStage: 解析为 ParsedSqlNode(SCF_DROP_TABLE)
       ↓
ResolveStage: 调用 Stmt::create_stmt()
       ↓
DropTableStmt::create(): 创建 Stmt 对象
       ↓
ExecuteStage: 调用 CommandExecutor::execute()
       ↓
DropTableExecutor::execute(): 取出表名
       ↓
Db::drop_table():
  ├─ 检查表是否存在
  ├─ 从 opened_tables_ 移除
  ├─ delete Table 对象
  └─ 删除 .table, .data, .lob 文件
```

### 4.8 实践任务

1. 在 `feature/drop-table` 分支查看完整实现
2. 自己在新分支重新实现一遍
3. 添加断点调试，观察每一步的数据变化
4. 思考：如果要支持 `DROP TABLE IF EXISTS`（表不存在不报错），需要修改哪里？

### 4.9 扩展思考

> **问题 1**：如果有其他会话正在查询这个表，DROP TABLE 会怎样？
>
> 这涉及并发控制。当前 MiniOB 是简化的单线程模型，实际数据库需要处理这种情况。

> **问题 2**：DROP TABLE 可以回滚吗？
>
> 当前实现不行。要支持回滚，需要事务系统（WAL 日志、undo 信息）。

> **问题 3**：大表删除时如何优化？
>
> 删除大文件可能很慢。有些数据库采用"异步删除"：先标记删除，后台线程慢慢清理。

---

## 五、参考资料

- [MiniOB 框架介绍](https://oceanbase.github.io/miniob/)
- [如何编译 MiniOB](https://oceanbase.github.io/miniob/how_to_build.html)
- [如何运行 MiniOB](https://oceanbase.github.io/miniob/how_to_run.html)
- [VSCode 开发指南](https://oceanbase.github.io/miniob/how_to_dev_miniob_by_vscode.html)
- [如何新增 SQL 语句](https://oceanbase.github.io/miniob/miniob-how-to-add-new-sql.html)
