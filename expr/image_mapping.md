# AI 图片映射清单

以下对应关系基于对 `expr/img` 下 12 张 PNG 的逐张目视核对，按“图片主题 -> 文档/脚本位置”整理。

| 文件名 | 识别主题 | 对应部分 | 建议放置页 |
|---|---|---|---|
| `day1_am_p04_map_structure.png` | `map<string, string>` 内存结构图 | Day1 上午：从最简单的存储开始 | 第 4 页 |
| `day1_am_p08_sql_pipeline.png` | SQL 处理流程：`ParseStage -> ResolveStage -> Optimizer -> ExecuteStage -> Storage` | Day1 上午：SQL 处理流程 | 第 8 页 |
| `day1_am_p09_seda_architecture.png` | SEDA 三阶段架构图 | Day1 上午：SEDA 框架详解 | 第 9 页 |
| `day1_am_p11_volcano_model.png` | Volcano Model / `next()` 拉取模型 | Day1 上午：火山模型 | 第 11 页 |
| `day1_pm_p03_index_vs_scan.png` | 无索引 vs 有索引查询对比 | Day1 下午：为什么需要索引 | 第 3 页 |
| `day1_pm_p05_disk_units_read_patterns.png` | 磁盘 / 页块 / 扇区 与顺序读 / 随机读 | Day1 下午：磁盘的物理单位 | 第 5 页 |
| `day1_pm_p06_bplustree_vs_redblack.png` | B+ 树 vs 红黑树高度对比 | Day1 下午：为什么是 B+ 树 | 第 6 页 |
| `day1_pm_p07_bplustree_structure.png` | B+ 树结构图：内部节点、叶子节点、叶子链表 | Day1 下午：B+ 树结构 | 第 7 页 |
| `day1_pm_p11_create_index_flow.png` | `CREATE INDEX` 调用链 | Day1 下午：MiniOB 索引创建流程 | 第 11 页 |
| `day2_am_p03_storage_module_relations.png` | `Db -> Table -> 记录管理器/索引 -> 缓冲池 -> 磁盘文件` 关系图 | Day2 上午：从 Table 到磁盘文件 | 第 3 页 |
| `day2_am_p10_text_storage_strategy.png` | `TEXT` 复合存储 / LOB 文件示意图 | Day2 上午：`TEXT` 存储策略 | 第 10 页 |
| `day2_pm_p08_buffer_pool_structure.png` | Buffer Pool + LRU + 磁盘页面结构图 | Day2 下午：Buffer Pool 整体结构 | 第 8 页 |

## 结论

- Day1 上午使用了 4 张图。
- Day1 下午使用了 5 张图。
- Day2 上午使用了 2 张图。
- Day2 下午使用了 1 张图。

如果后续你要把这些文件重命名，建议直接按下面这一组语义名改：

- `day1_am_p04_map_structure.png`
- `day1_am_p08_sql_pipeline.png`
- `day1_am_p09_seda_architecture.png`
- `day1_am_p11_volcano_model.png`
- `day1_pm_p03_index_vs_scan.png`
- `day1_pm_p05_disk_units_read_patterns.png`
- `day1_pm_p06_bplustree_vs_redblack.png`
- `day1_pm_p07_bplustree_structure.png`
- `day1_pm_p11_create_index_flow.png`
- `day2_am_p03_storage_module_relations.png`
- `day2_am_p10_text_storage_strategy.png`
- `day2_pm_p08_buffer_pool_structure.png`
