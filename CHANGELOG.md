# Changelog

## v1.0.5 (2026-06-17)

### 番茄钟
- 25 分钟专注 / 5 分钟休息自动轮换，圆形 SVG 进度环
- Web Audio API 生成结束提示音（上行/下行旋律）
- 系统通知（工作结束 / 休息结束）
- **桌面磁贴集成** — 番茄钟计时器直接显示在待办桌面磁贴窗中，无需独立窗口
- `startedAt` 时间戳精确同步，磁贴独立计算剩余时间

### 快捷键系统
- 全局：Ctrl+Shift+N 唤出窗口聚焦输入、Ctrl+Shift+M 切换显隐
- 应用内：Ctrl+N 聚焦输入、Ctrl+F 聚焦搜索、Esc 关闭面板、Ctrl+Enter 保存编辑
- `?` 弹出 kbd 风格快捷键速查面板

### 提醒系统
- 任务级提前提醒：准时 / 10分 / 30分 / 1小时 / 1天前
- 全局默认提醒设置、勿扰时段（支持跨夜）
- 通知去重（5 分钟窗口 + 持久化 tracking）
- Rust 侧 `remind_minutes` 字段，`TodoUpdate` 完整支持

### 子任务嵌套
- `SubItem` 递归组件，无限层级子任务
- 每层独立 ▸/▾ 展开折叠、＋ 内联添加子子任务
- 缩进递增（depth × 20px）
- 桌面磁贴显示子任务进度 `2/5` 绿色 Badge

### Markdown 描述
- 基于 marked + DOMPurify，支持 GFM 语法
- 按需懒加载（不与主包捆绑），首次渲染不加载 70KB 额外代码
- 完整 CSS：标题、代码块、表格、引用、列表、链接

### 搜索增强
- 实时匹配计数显示
- 分类 + 优先级筛选
- 匹配文字黄色 `<mark>` 高亮
- 搜索输入 200ms 防抖

### 自定义分类
- Rust 后端 `get_categories` / `add_category` / `delete_category`
- JSON 存储于 settings，默认四分类
- 设置页管理 UI（添加 + 删除确认）
- 所有分类下拉动态化

### 数据统计
- SVG 完成率圆环
- 分类饼图（带图例）
- 优先级条形图
- 30 天 GitHub 风格活跃热力图

### 导出
- Markdown 导出：Rust 生成格式化 MD，save dialog 选择路径
- 分组（进行中/已完成）、子任务缩进、分类标签、优先级标记、日期

### 日历交互
- 点击日期单元格 → 预填截止日期打开详情面板
- hover 显示蓝色 ＋ 按钮
- 星期列区分、当前周高亮

### 桌面磁贴增强
- 子任务进度显示
- HTML5 拖拽重排序
- 番茄钟实时计时环

### 性能优化
- StatsPage / CalendarApp / SettingsPage React.lazy 懒加载
- marked + DOMPurify 懒加载，main.js 119KB → 33KB（-72%）
- React/ReactDOM 独立 vendor chunk（浏览器缓存）
- TodoItem / TodoList React.memo
- 搜索 200ms 防抖

### 暗色模式
- `--overlay-bg` CSS 变量自适应深浅主题
- 全组件 CSS 变量体系，无硬编码颜色

### 交互优化
- 点击卡片内容区直接打开编辑详情
- 托盘右键"显示主界面"加 `unminimize()` 确保窗口弹出
- 桌面磁贴拖拽排序修复（`<li>` → `<div>` 避免无效嵌套）
- node_modules 清理（42 个包移除非必需依赖）

### 修复
- 修复 `add_todo_quick` / `add_subtask` 缺少 `remind_minutes` 字段
- 修复 TodoItem 编辑面板重复子任务输入块
- 修复 TodoList 缺少 `categories` prop
- 修复 `calendar-main.tsx` 缺少 `onAddTodo` prop
- 修复 esbuild CSS minify 警告
- TypeScript `tsc --noEmit` 零错误

---

## v1.0.4 (2026-06-11)

- 初始版本
- Tauri 2.x 迁移（从 Electron）
- 待办 CRUD、拖拽排序、分类、优先级
- 桌面磁贴（置顶/桌面模式）
- 日历视图
- 倒计时功能
- 深色/浅色/系统主题
- 系统托盘 + 通知
- JSON 数据导入导出
