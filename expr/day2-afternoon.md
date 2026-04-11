# 第二天下午：Buffer Pool 缓冲池

> 阅读说明：本文面向同学课前预习。重点不是记住所有类名，而是先形成页面生命周期的直觉：页面怎么读进来、怎么被修改、什么时候不能淘汰、什么时候需要刷盘。

## 一、引言

在讲 Buffer Pool 之前，先回顾一下操作系统是怎么帮你管理磁盘缓存的。

### 1.1 Page Cache：操作系统的缓存机制

当你调用 `read()` 和 `write()` 系统调用时，数据会经过操作系统的 Page Cache：

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

工作原理：

1. 当你调用 `read()` 时，操作系统不会每次都直接读磁盘
2. 先检查 Page Cache 中有没有这一页（4KB）
3. 如果有（缓存命中），直接从内存返回，速度极快
4. 如果没有（缓存未命中），从磁盘读取该页到 Page Cache，再返回给你
5. `write()` 同理——先写入 Page Cache，由操作系统择机刷回磁盘

这就是为什么 10GB 的电影能在 8GB 内存的电脑上播放：操作系统按需加载当前播放位置附近的几页到 Page Cache，播完就换下一页。

### 1.2 为什么数据库要自己管理 Buffer Pool？

既然操作系统有 Page Cache，为什么数据库还要自己实现 Buffer Pool？

几个关键原因：

1. 事务持久性。

数据库支持事务，事务有 ACID 特性，其中 D 是持久性（Durability）——事务提交后，数据必须真正保存下来，不能丢失。

问题是：当你执行 `INSERT INTO users VALUES(...)` 后，数据可能还在内存中（Page Cache），还没写入磁盘。这时候如果断电，数据就丢了。

数据库的解决方案是 **WAL（Write-Ahead Logging）**：在修改数据之前，先把修改记录写入日志文件。日志文件是顺序写入的，很快。事务提交时，确保日志已经刷到磁盘，数据页面可以稍后再写。

这样即使崩溃，也可以通过日志恢复数据。但前提是数据库要能控制什么时候刷日志、什么时候刷数据页面——这是 Page Cache 做不到的。

2. 预读策略。数据库知道查询模式，可以预读相关页面。操作系统只能做通用的预读。

3. 淘汰策略。数据库知道页面的重要性（如索引页 vs 数据页）。操作系统只能用通用的 LRU。

4. 避免双重缓存。如果数据库和操作系统都缓存，会浪费内存。

> 用 Page Cache 简单但控制力弱，自己管理 Buffer Pool 复杂但可以精细控制。数据库选择后者，因为需要保证数据安全性和性能。

> 实际上要完全绕过 Page Cache，需要在打开文件时加上 `O_DIRECT` 标志。MiniOB 作为教学项目没有使用 `O_DIRECT`，所以实际上有两层缓存。生产级数据库（如 MySQL InnoDB）会使用 `O_DIRECT` 来避免双重缓存。

学习目标：
- 理解 Buffer Pool 的工作原理
- 掌握页面管理机制（读取、写入、淘汰）
- 了解 MiniOB 中 Buffer Pool 的实现

---

## 二、Buffer Pool 核心概念

### 2.1 页面（Page）

Buffer Pool 管理的基本单位是页面。

```cpp
struct Page {
  LSN      lsn;        // 日志序列号（用于 WAL 恢复）
  CheckSum check_sum;  // 校验和（检测页面完整性）
  char     data[8KB];  // 实际数据
};
```

页面大小通常是 4KB 或 8KB，与磁盘块大小对齐。

### 2.2 页帧（Frame）

Frame 是内存中页面的管理结构：

```cpp
class Frame {
  Page          page_;        // 页面数据
  bool          dirty_;       // 脏页标记（是否被修改）
  int           pin_count_;   // 引用计数（防止被淘汰）
  unsigned long acc_time_;    // 访问时间（LRU 依据）
  Lock          lock_;        // 读写锁
};
```

关键字段：

| 字段 | 作用 |
|------|------|
| dirty_ | 标记页面是否被修改，淘汰时需要刷盘 |
| pin_count_ | 正在使用该页面的线程数，>0 时不能被淘汰 |
| acc_time_ | 最后访问时间，用于 LRU 淘汰算法 |
| lock_ | 读写锁，支持并发访问 |

### 2.3 Buffer Pool 结构

```
┌─────────────────────────────────────────────────────────────┐
│                    Buffer Pool                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Frame 数组                          │    │
│  │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐           │    │
│  │  │Frame 0│ │Frame 1│ │Frame 2│ │Frame 3│ ...       │    │
│  │  │Page A │ │Page B │ │Page C │ │Page D │           │    │
│  │  │dirty=Y│ │dirty=N│ │dirty=Y│ │dirty=N│           │    │
│  │  │pin=1  │ │pin=0  │ │pin=0  │ │pin=2  │           │    │
│  │  └───────┘ └───────┘ └───────┘ └───────┘           │    │
│  └─────────────────────────────────────────────────────┘    │
│                              ↓                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  LRU 链表                            │    │
│  │  最近使用 ← [Frame2] ← [Frame1] ← [Frame0] → 最久使用│    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                       磁盘文件                               │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                   │
│  │Page 0 │ │Page 1 │ │Page 2 │ │Page 3 │ ...               │
│  └───────┘ └───────┘ └───────┘ └───────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 页面地址：PageNum

如何在磁盘文件中定位一个页面？

文件偏移量 = PageNum × PageSize

```
PageNum = 0 → 偏移量 0
PageNum = 1 → 偏移量 8KB
PageNum = 2 → 偏移量 16KB
```

---

## 三、页面管理机制

### 3.1 页面读取流程

当需要读取一个页面时：

```
请求读取 Page 5
        ↓
┌───────────────────────────┐
│  在 Buffer Pool 中查找     │
│  （通过 Hash 表快速定位）   │
└───────────────────────────┘
        ↓
   ┌────┴────┐
   ↓         ↓
 命中       未命中
   ↓         ↓
┌───────┐ ┌───────────────────────────┐
│pin++  │ │ 分配空闲 Frame            │
│更新LRU│ │ 从磁盘加载 Page 5          │
│返回   │ │ 插入 Buffer Pool          │
└───────┘ │ pin=1，更新 LRU           │
          │ 返回                      │
          └───────────────────────────┘
```

### 3.2 页面写入流程

修改页面数据：

```
修改 Frame 中的数据
        ↓
┌───────────────────────────┐
│  标记 dirty = true        │
│  （不立即写磁盘）          │
└───────────────────────────┘
        ↓
┌───────────────────────────┐
│  unpin() 减少引用计数      │
└───────────────────────────┘
        ↓
   后续某时刻（淘汰或显式刷盘）
        ↓
┌───────────────────────────┐
│  将脏页写入磁盘            │
│  dirty = false            │
└───────────────────────────┘
```

> 延迟写入（Lazy Writing）：修改页面时不立即写磁盘，只标记 dirty，等到淘汰时或显式 flush 时才写磁盘，减少磁盘 I/O 次数。

### 3.3 页面淘汰机制

当 Buffer Pool 满了，需要淘汰页面：

```
需要分配新 Frame，但 Buffer Pool 已满
                ↓
┌─────────────────────────────────────────┐
│  从 LRU 链表尾部找可淘汰的 Frame         │
│  （pin_count == 0 的页面）              │
└─────────────────────────────────────────┘
                ↓
         ┌──────┴──────┐
         ↓             ↓
      找到了        没找到
         ↓             ↓
┌───────────────┐ ┌───────────────────┐
│ 如果 dirty=Y  │ │ 所有页面都在使用  │
│ 先刷盘        │ │ 报错或等待        │
│ 释放 Frame    │ └───────────────────┘
│ 分配给新页面  │
└───────────────┘
```

### 3.4 LRU 算法

LRU（Least Recently Used）：淘汰最久未使用的页面。

```
访问顺序：A → B → C → D → A

初始：[A] ← [B] ← [C] ← [D]  (D 最久未使用)
访问 A 后：[B] ← [C] ← [D] ← [A]  (A 移到队首)

淘汰时选择队尾（最久未使用）
```

为什么用 LRU？
- 局部性原理：最近访问的页面，很可能还会被访问
- 实现简单：双向链表 + Hash 表

> LRU 有什么问题？
> - 顺序扫描会污染整个 Buffer Pool
> - 可以考虑 LRU-K、Clock 等改进算法

---

## 四、MiniOB 中的 Buffer Pool 实现

### 4.1 代码结构

核心目录：`src/observer/storage/buffer/`

| 文件 | 说明 |
|------|------|
| `frame.h/cpp` | 页帧（Frame）管理类 |
| `disk_buffer_pool.h/cpp` | 磁盘缓冲池实现 |
| `page.h` | 页面（Page）数据结构 |
| `double_write_buffer.h/cpp` | Double Write Buffer |
| `buffer_pool_log.h/cpp` | Buffer Pool 日志 |

### 4.2 核心类结构

```
BufferPoolManager（全局管理器）
  ├── BPFrameManager              Frame 管理器（LRU 缓存）
  │     └── FrameLruCache         LRU 缓存实现
  ├── DoubleWriteBuffer           Double Write Buffer
  └── map<string, DiskBufferPool> 文件名 → 缓冲池映射

DiskBufferPool（单个文件的缓冲池）
  ├── BPFrameManager&             引用全局 Frame 管理器
  ├── Frame* hdr_frame_           文件头页帧
  └── BPFileHeader*               文件头（页面分配 bitmap）

Frame（页帧）
  ├── Page page_                  页面数据
  ├── bool dirty_                 脏页标记
  ├── int pin_count_              引用计数
  └── RecursiveSharedMutex lock_  读写锁
```

### 4.3 关键流程

#### 读取页面

```cpp
RC DiskBufferPool::get_this_page(PageNum page_num, Frame **frame) {
  // 1. 在 Frame 管理器中查找
  *frame = frame_manager_.get(buffer_pool_id_, page_num);
  if (*frame != nullptr) {
    // 命中，pin++ 并返回
    (*frame)->pin();
    return RC::SUCCESS;
  }
  
  // 2. 未命中，分配新 Frame
  *frame = frame_manager_.alloc(buffer_pool_id_, page_num);
  
  // 3. 从磁盘加载页面
  load_page(page_num, *frame);
  
  // 4. pin++ 并返回
  (*frame)->pin();
  return RC::SUCCESS;
}
```

#### 刷写脏页

```cpp
RC DiskBufferPool::flush_page(Frame &frame) {
  // 1. 确保日志已刷盘（WAL）
  log_handler_.flush_page(frame.page());
  
  // 2. 计算校验和
  frame.set_check_sum(crc32(frame.page()));
  
  // 3. 写入 Double Write Buffer
  dblwr_manager_.add_page(buffer_pool_id_, frame.page());
  
  // 4. 清除脏标记
  frame.clear_dirty();
}
```

### 4.4 Double Write Buffer

为什么需要 Double Write Buffer？

页面大小是 8KB，但磁盘写入可能不完整（如断电）：

```
完整写入：  [Page A - 8KB]
部分写入：  [Page A 前 4KB] [损坏数据]  ← 页面不一致！
```

解决方案：先写副本，再写原文件

```
写入流程：
1. 写入 Double Write Buffer 文件（副本）
2. 确保写入成功
3. 写入实际数据文件
4. 清除 Double Write Buffer 记录

恢复流程：
1. 启动时检查 Double Write Buffer
2. 如果有未完成的写入，用副本恢复原文件
```

### 4.5 关键断点位置

| 文件 | 行号 | 函数 | 说明 |
|------|------|------|------|
| `buffer/frame.cpp` | - | `pin() / unpin()` | 引用计数管理 |
| `buffer/disk_buffer_pool.cpp` | - | `get_this_page()` | 读取页面 |
| `buffer/disk_buffer_pool.cpp` | - | `allocate_page()` | 分配新页面 |
| `buffer/disk_buffer_pool.cpp` | - | `flush_page()` | 刷写脏页 |
| `common/lang/lru_cache.h` | - | `get() / put()` | LRU 缓存操作 |

---

## 五、调试观察建议

### 5.1 观察 Buffer Pool 行为

1. 在 `get_this_page()` 打断点，观察缓存命中情况
2. 在 `flush_page()` 打断点，观察脏页刷盘时机
3. 在 `purge_frames()` 打断点，观察页面淘汰过程

### 5.2 调试场景

场景一：缓存命中

1. 执行 `SELECT * FROM t1` 两次
2. 第二次应该命中缓存，不会触发磁盘读取

场景二：脏页刷盘

1. 执行 `INSERT INTO t1 VALUES(...)`
2. 观察页面被标记为 dirty
3. 执行 `SYNC` 或关闭数据库，观察刷盘

场景三：页面淘汰

1. 设置较小的 Buffer Pool 大小
2. 执行大量查询，观察淘汰过程

---

## 六、今日小结

今天我们从 Page Cache 出发，理解了为什么数据库要自己管理 Buffer Pool：事务持久性、预读策略、淘汰策略、避免双重缓存。

然后我们学习了 Buffer Pool 的核心概念：页面、页帧、pin_count、dirty 标记，以及页面读取、写入、淘汰的流程。LRU 算法决定淘汰哪些页面，Double Write Buffer 保证页面写入的原子性。

Buffer Pool 是数据库存储引擎的基石，所有页面操作都要经过它。理解 Buffer Pool，才能理解数据库如何平衡性能和数据安全。

---

## 七、核心要点

- Buffer Pool 是数据库管理页面缓存的机制
- Frame 管理内存中的页面，包含 dirty 标记、pin_count、锁
- LRU 算法决定淘汰哪些页面
- Double Write Buffer 保证页面写入的原子性

## 八、延伸思考

1. 为什么 MySQL 使用 LRU-K 而不是简单 LRU？
   - 防止顺序扫描污染缓存
   - 只有被访问 K 次以上的页面才进入热区域

2. 脏页什么时候刷盘？
   - 显式调用（如 `SYNC` 命令）
   - 页面淘汰时
   - 后台线程定期刷盘
   - Checkpoint 时

3. 如何提高 Buffer Pool 性能？
   - 增大 Buffer Pool 大小
   - 预读优化
   - 多个 Buffer Pool 实例减少锁竞争

---

## 九、参考资料

- [MiniOB 框架介绍](https://oceanbase.github.io/miniob/)
- `src/observer/storage/buffer/disk_buffer_pool.h` - Buffer Pool 核心定义
- `src/observer/storage/buffer/frame.h` - Frame 结构定义
- `src/observer/common/lang/lru_cache.h` - LRU 缓存实现
- MySQL 技术内幕：InnoDB 存储引擎（书籍）
