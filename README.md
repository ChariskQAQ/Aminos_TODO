# Aminos TODO v1.0.5

轻量级 Windows 桌面待办应用 — 快速录入、桌面磁贴常驻、番茄钟专注、日历统筹规划。基于 Tauri 2.x，安装包 < 3MB，数据 JSON 单文件存储。

## 功能

### 待办管理
- 增删改查、拖拽排序、自定义分类、搜索过滤
- 详情面板：优先级、分类、起止日期、重复提醒、倒计时、截止提醒
- Markdown 描述渲染（GFM 语法）
- 子任务无限层级嵌套，每层独立展开折叠 + 内联添加

### 番茄钟
- 25 分钟专注 / 5 分钟休息自动轮换，圆形进度环
- 结束 Web Audio 提示音 + 系统通知
- **桌面磁贴实时显示** — 与待办列表同窗，进度环同步计时

### 桌面磁贴
- 透明无边框桌面小窗，置顶 / 桌面模式
- 网格磁贴展示待办，拖拽排序，子任务进度
- 番茄钟运行时自动显示计时环

### 日历视图
- 内嵌月历，跨日任务色条展示，周末/当前周高亮
- 点击日期添加待办（预填截止日期）

### 快捷键
| 快捷键 | 功能 |
|---|---|
| Ctrl+Shift+N | 全局打开主窗口并聚焦输入 |
| Ctrl+Shift+M | 全局切换主窗口显隐 |
| Ctrl+N | 聚焦添加输入框 |
| Ctrl+F | 聚焦搜索框 |
| Esc | 关闭面板 / 返回主页 |
| Ctrl+Enter | 编辑模式保存 |
| `?` | 快捷键速查面板 |

### 数据统计
完成率圆环、分类饼图、优先级条形图、30 天活跃热力图

### 搜索与筛选
关键词搜索（标题+描述）、分类/优先级筛选、匹配高亮、实时计数

### 提醒系统
- 任务级提前提醒（准时 / 10分 / 30分 / 1小时 / 1天前）
- 默认提醒设置、勿扰时段
- 逾期待办每日通知

### 其他
- 深色 / 浅色 / 系统主题
- 自定义分类管理
- JSON 备份恢复 + Markdown 导出
- 开机自启动、关闭到托盘

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Tauri 2.x |
| 前端 | React 18 + TypeScript + Vite 6 |
| 后端 | Rust |
| Markdown | marked + DOMPurify（按需加载） |
| 存储 | JSON (`%APPDATA%/Aminos_TODO/aminos-todo.json`) |

## 开发

```bash
npm install
npm run tauri dev     # 开发模式
npm run tauri build   # 生产构建
```

## 项目结构

```
src/
├── App.tsx               # 主界面
├── CalendarApp.tsx       # 日历
├── StatsPage.tsx         # 统计（懒加载）
├── WidgetApp.tsx         # 桌面磁贴
├── tauri-api.ts          # Tauri 桥接
├── types/index.ts        # 类型定义
├── hooks/
│   ├── useTodos.ts       # 待办数据
│   ├── usePomodoro.ts    # 番茄钟（含 Tauri 事件同步）
│   ├── useCountdown.ts   # 倒计时
│   └── useTheme.tsx      # 主题
├── components/
│   ├── AddTodo.tsx       # 添加待办
│   ├── TodoList.tsx      # 待办列表（memo）
│   ├── TodoItem.tsx      # 待办卡片 + 子任务递归（memo）
│   ├── TodoTile.tsx      # 桌面磁贴
│   ├── TileGrid.tsx      # 磁贴网格（含拖拽）
│   ├── PomodoroPanel.tsx # 番茄钟主面板
│   ├── PomodoroTile.tsx  # 番茄钟磁贴组件
│   ├── HelpPanel.tsx     # 快捷键面板
│   ├── Highlight.tsx     # 搜索高亮
│   ├── Markdown.tsx      # Markdown 渲染（懒加载）
│   └── SettingsPage.tsx  # 设置（懒加载）
├── utils/sound.ts        # Web Audio 提示音
└── styles/               # CSS
```

## License

MIT
