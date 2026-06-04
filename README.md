# Aminos TODO

Windows 桌面待办事项应用，基于 Tauri 2.x + React 18 构建。

## 功能

- **待办管理** — 增删改查、拖拽排序、分类（工作/个人/学习/其他）、搜索过滤
- **日期与重复** — 开始日期、截止日期、重复任务（按周几）
- **倒计时** — 任务可设置预计用时，支持倒计时计时
- **日历视图** — 独立月历窗口，按日期展示任务，跨日任务以色条显示
- **桌面磁贴** — 透明无边框桌面小窗，支持置顶或桌面模式
- **系统托盘** — 隐藏到托盘、托盘菜单快速操作
- **通知提醒** — 逾期待办自动推送系统通知
- **主题切换** — 深色 / 浅色 / 跟随系统
- **数据导入导出** — JSON 格式备份与恢复

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Tauri 2.x |
| 前端 | React 18 + TypeScript + Vite 6 |
| 后端 | Rust |
| 存储 | JSON 文件 (`%APPDATA%/Aminos_TODO/`) |

## 开发

### 环境要求

- Node.js >= 18
- Rust 工具链（[rustup](https://rustup.rs/)）
- Windows 10/11

### 启动开发环境

```bash
npm install
npm run tauri dev
```

### 构建生产版本

```bash
npm run tauri:build
```

安装包输出在 `src-tauri/target/release/bundle/`。

## 项目结构

```
src/
├── main.tsx              # 主窗口入口
├── App.tsx               # 主界面组件
├── CalendarApp.tsx        # 日历独立窗口
├── WidgetApp.tsx          # 桌面磁贴窗口
├── tauri-api.ts           # Tauri 命令封装层
├── types/index.ts         # 类型定义 & API 接口
├── hooks/
│   ├── useTodos.ts        # 待办数据 Hook
│   ├── useCountdown.ts    # 倒计时 Hook
│   └── useTheme.tsx       # 主题 Hook
├── components/
│   ├── AddTodo.tsx         # 添加待办表单
│   ├── TodoList.tsx        # 待办列表容器
│   ├── TodoItem.tsx        # 待办项卡片
│   ├── TodoTile.tsx        # 磁贴展示
│   └── SettingsPage.tsx    # 设置页面
└── styles/                 # CSS 样式

src-tauri/
├── src/lib.rs              # Rust 后端（数据模型、命令、托盘、通知）
├── src/main.rs             # 入口
├── Cargo.toml
└── tauri.conf.json         # Tauri 配置
```

## License

MIT
