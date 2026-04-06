# MiniOB 数据库管理系统内核实践 - 教学指南

## 一、项目简介

本项目基于北京奥星贝斯科技有限公司研发的 MiniOB 开源数据库管理系统，引导学生学习数据库内核的设计与实现。MiniOB 中 B+树、Record Manager、Buffer Pool 等模块已完成基本实现，学生需要在**学习理解现有代码的基础上**，完成指定的赛题任务。

通过本项目训练，学生将：
- 深入理解数据库内核的关键机制
- 提升数据库系统层面的实践动手能力
- 积累企业级项目开发经验

---

## 二、授课时间与地点

| 日期 | 地点 | 时间 |
|------|------|------|
| 4月18日 | 7-219机房 | 上午 8:30-11:30，下午 1:00-4:00 |
| 5月12日 | 7-212机房 | 上午 8:30-11:30，下午 1:00-4:00 |

---

## 三、授课内容与进度安排

### 第一天（4月18日）

| 时间 | 内容 | 说明 |
|------|------|------|
| **上午** | 环境配置 + 项目介绍 + drop table 实现 | MiniOB 开发环境搭建、框架介绍、实现 drop table 功能 |
| **下午** | B+树介绍 + 多列索引实现 | 学习 B+树原理，完成多列索引赛题 |

### 第二天（5月12日）

| 时间 | 内容 | 说明 |
|------|------|------|
| **上午** | Record Manager + text 实现 | 学习 Record Manager 原理，实现 text 类型支持 |
| **下午** | Buffer Pool | 学习 Buffer Pool 原理，完成相关赛题 |

> **注意**：以上进度可根据学生学习情况动态调整。

---

## 四、实验内容

MiniOB 中 B+树、Record Manager、Buffer Pool 等模块已完成基本实现，本项目侧重于**学习理解现有代码**，并完成指定的赛题任务。

### 学习内容
- MiniOB 框架结构与源码解析
- Buffer Pool 缓冲池管理机制
- Record Manager 记录管理机制
- B+树索引结构与实现

### 赛题任务
- **必做**：drop table 功能实现
- **必做**：text 类型支持实现
- **选做**：多列索引实现

### 进阶任务（可选）
- 基于 MiniOB 内核技术的数据库系统实现
- 基于 2025 OceanBase 数据库大赛，完成 4 个及以上初赛题

---

## 五、学习资源

### MiniOB 核心文档
- [MiniOB 框架介绍](https://oceanbase.github.io/miniob/)
- [如何编译 MiniOB 源码](https://oceanbase.github.io/miniob/how_to_build.html)
- [如何运行 MiniOB](https://oceanbase.github.io/miniob/how_to_run.html)
- [doxygen 代码文档](https://oceanbase.github.io/miniob/doxygen/html/index.html)

### 视频与讲义
- 《从0到1数据库内核实战教程》视频教程
- 《从0到1数据库内核实战教程》基础讲义

### 内核理论基础
- **数据库存储结构**：存储设备概述、面向磁盘的 DBMS 概述、文件/页/记录的组织结构、缓冲池管理
- **数据库索引结构**：索引概述、B+树（结构、查找、插入、删除）、散列表
- **MiniOB 内核框架**：源码框架解析、存储结构框架源码解析、索引结构框架源码解析

### 开发工具参考
- flex/bison 手册
- cmake 官方手册
- libevent 官网

### AI 辅助开发工具
- 学习 OpenCode 等 AI 编程助手的使用
- 能够利用 AI 工具辅助解决开发过程中遇到的问题
- 参考 [OpenCode 配置指南](./ai-api-keys-guide.md)，零门槛使用免费模型

---

## 六、提测说明

MiniOB drop table、MiniOB B+Tree 以及数据库大赛题目，需通过 OceanBase 训练营提交测试：

1. 在 GitHub 上创建 Public 仓库
2. 邀请官方测试账号（参考 [使用 GitHub 参加训练营](https://oceanbase.github.io/miniob/how_to_use_github.html)）
3. 提交测试参考 [训练营使用说明](https://oceanbase.github.io/miniob/how_to_submit_test.html)

如有问题可在 [OceanBase 问答社区](https://ask.oceanbase.com/) 提问，问题分类选择”训练营”。

---

## 七、实验要求

### 代码要求
- 遵循 MiniOB 现有编码风格
- 关键算法与数据结构需添加清晰注释
- 模块化设计，与系统原有接口正确对接
- 通过基础测试用例
- 使用 git 进行版本管理，定期提交有意义的 commit 记录

### 报告要求
- **设计思路**：模块设计方案、核心数据结构、关键算法流程
- **实现过程**：开发环境配置、遇到的难点及解决方案、调试过程与测试用例
- **结果分析**：运行结果截图、模块正确性与性能分析
- **问题总结**：未解决的 bug、待改进点、个人收获与参考文献

> 每组提交 1 份实验报告，需注明分工及个人贡献度。

---

## 八、课前准备

学生需在课前完成：
1. 阅读相关文献资料
2. 注册 OceanBase 社区和训练营账号
3. 在 GitHub 上创建 Public 仓库
4. 熟悉 MiniOB 开发调试方法和内核框架
5. 完成预习报告并提交至 SPOC 平台

---

## 九、分组要求

- 3-5 人/组
- 每组选题不能重复

---

## 十、参考资料

- 《数据库管理系统实现基础讲义》
- [OceanBase 数据库文档](https://www.oceanbase.com/docs/)
- [OceanBase 开源网站](https://open.oceanbase.com/)
- [MiniOB GitHub Pages](https://oceanbase.github.io/miniob/)