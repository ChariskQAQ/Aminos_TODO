use chrono::Local;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Emitter, Manager, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use tauri_plugin_notification::NotificationExt;

// ── Data Model ──────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Todo {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub category: String,
    pub completed: i64,
    pub priority: i64,
    pub start_date: Option<String>,
    pub due_date: Option<String>,
    pub repeat_type: String,
    pub repeat_days: String,
    pub duration_minutes: Option<i64>,
    pub countdown_started_at: Option<String>,
    pub sort_order: i64,
    pub created_at: String,
    pub completed_at: Option<String>,
    #[serde(default)]
    pub parent_id: Option<i64>,
    #[serde(default)]
    pub remind_minutes: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TodoUpdate {
    pub title: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
    pub priority: Option<i64>,
    pub start_date: Option<Option<String>>,
    pub due_date: Option<Option<String>>,
    pub repeat_type: Option<String>,
    pub repeat_days: Option<String>,
    pub duration_minutes: Option<Option<i64>>,
    #[serde(default)]
    pub parent_id: Option<Option<i64>>,
    #[serde(default)]
    pub remind_minutes: Option<Option<i64>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AppData {
    next_id: i64,
    todos: Vec<Todo>,
    settings: std::collections::HashMap<String, String>,
}

impl AppData {
    fn db_path() -> PathBuf {
        let mut path = dirs_next().unwrap_or_else(|| PathBuf::from("."));
        path.push("aminos-todo.json");
        path
    }

    fn load() -> Self {
        let path = Self::db_path();
        if let Ok(raw) = fs::read_to_string(&path) {
            if let Ok(mut data) = serde_json::from_str::<AppData>(&raw) {
                // Migrate missing fields
                for t in &mut data.todos {
                    if t.description.is_empty() && t.description == "" {
                        t.description = String::new();
                    }
                    if t.category.is_empty() && t.category == "" {
                        t.category = String::new();
                    }
                    if t.repeat_type.is_empty() {
                        t.repeat_type = "none".into();
                    }
                    if t.repeat_days.is_empty() && t.repeat_days == "" {
                        t.repeat_days = String::new();
                    }
                }
                return data;
            }
        }
        AppData {
            next_id: 1,
            todos: vec![],
            settings: std::collections::HashMap::new(),
        }
    }

    fn save(&self) {
        let path = Self::db_path();
        if let Ok(json) = serde_json::to_string_pretty(self) {
            let _ = fs::write(&path, json);
        }
    }
}

fn dirs_next() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        std::env::var("APPDATA")
            .ok()
            .map(|p| PathBuf::from(p).join("Aminos_TODO"))
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::env::var("HOME")
            .ok()
            .map(|p| PathBuf::from(p).join(".aminos-todo"))
    }
}

// ── Database Commands ───────────────────────────────────────

#[tauri::command]
fn get_todos(state: tauri::State<'_, Mutex<AppData>>) -> Vec<Todo> {
    let data = state.lock().unwrap();
    let mut todos = data.todos.clone();
    todos.sort_by(|a, b| {
        a.completed
            .cmp(&b.completed)
            .then(a.sort_order.cmp(&b.sort_order))
            .then(b.created_at.cmp(&a.created_at))
    });
    todos
}

fn notify_todos_changed(app: &tauri::AppHandle) {
    let _ = app.emit("todos-updated", ());
}

#[tauri::command]
fn add_todo(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<AppData>>,
    title: String,
    description: String,
    category: String,
    priority: i64,
    start_date: Option<String>,
    due_date: Option<String>,
    repeat_type: String,
    repeat_days: String,
    duration_minutes: Option<i64>,
    remind_minutes: Option<i64>,
) -> Todo {
    let mut data = state.lock().unwrap();
    let max_order = data.todos.iter().map(|t| t.sort_order).max().unwrap_or(0);
    let todo = Todo {
        id: data.next_id,
        title,
        description,
        category,
        completed: 0,
        priority,
        start_date,
        due_date,
        repeat_type,
        repeat_days,
        duration_minutes,
        countdown_started_at: if duration_minutes.is_some() {
            Some(Local::now().to_rfc3339())
        } else {
            None
        },
        sort_order: max_order + 1,
        created_at: Local::now().format("%Y/%m/%d %H:%M:%S").to_string(),
        completed_at: None,
        parent_id: None,
        remind_minutes,
    };
    data.next_id += 1;
    data.todos.push(todo.clone());
    data.save();
    notify_todos_changed(&app);
    todo
}

#[tauri::command]
fn update_todo(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<AppData>>,
    id: i64,
    update: TodoUpdate,
) -> Option<Todo> {
    let mut data = state.lock().unwrap();
    if let Some(todo) = data.todos.iter_mut().find(|t| t.id == id) {
        if let Some(v) = update.title { todo.title = v; }
        if let Some(v) = update.description { todo.description = v; }
        if let Some(v) = update.category { todo.category = v; }
        if let Some(v) = update.priority { todo.priority = v; }
        if let Some(v) = update.start_date { todo.start_date = v; }
        if let Some(v) = update.due_date { todo.due_date = v; }
        if let Some(v) = update.repeat_type { todo.repeat_type = v; }
        if let Some(v) = update.repeat_days { todo.repeat_days = v; }
        if let Some(v) = update.duration_minutes {
            todo.duration_minutes = v;
            todo.countdown_started_at = if v.is_some() {
                Some(Local::now().to_rfc3339())
            } else {
                None
            };
        }
        if let Some(v) = update.parent_id { todo.parent_id = v; }
        if let Some(v) = update.remind_minutes { todo.remind_minutes = v; }
        let result = todo.clone();
        data.save();
        notify_todos_changed(&app);
        return Some(result);
    }
    None
}

#[tauri::command]
fn delete_todo(app: tauri::AppHandle, state: tauri::State<'_, Mutex<AppData>>, id: i64) {
    let mut data = state.lock().unwrap();
    // Collect child ids to delete
    let child_ids: Vec<i64> = data.todos.iter()
        .filter(|t| t.parent_id == Some(id))
        .map(|t| t.id)
        .collect();
    data.todos.retain(|t| t.id != id && !child_ids.contains(&t.id));
    data.save();
    notify_todos_changed(&app);
}

#[tauri::command]
fn toggle_todo(app: tauri::AppHandle, state: tauri::State<'_, Mutex<AppData>>, id: i64) -> Option<Todo> {
    let mut data = state.lock().unwrap();
    if let Some(todo) = data.todos.iter_mut().find(|t| t.id == id) {
        todo.completed = if todo.completed == 0 { 1 } else { 0 };
        todo.completed_at = if todo.completed == 1 {
            Some(Local::now().format("%Y/%m/%d %H:%M:%S").to_string())
        } else {
            None
        };
        let result = todo.clone();
        data.save();
        notify_todos_changed(&app);
        return Some(result);
    }
    None
}

#[tauri::command]
fn reorder_todos(app: tauri::AppHandle, state: tauri::State<'_, Mutex<AppData>>, ordered_ids: Vec<i64>) {
    let mut data = state.lock().unwrap();
    for (i, id) in ordered_ids.iter().enumerate() {
        if let Some(todo) = data.todos.iter_mut().find(|t| t.id == *id) {
            todo.sort_order = i as i64;
        }
    }
    data.save();
    notify_todos_changed(&app);
}

#[tauri::command]
fn get_setting(state: tauri::State<'_, Mutex<AppData>>, key: String) -> Option<String> {
    let data = state.lock().unwrap();
    data.settings.get(&key).cloned()
}

#[tauri::command]
fn set_setting(state: tauri::State<'_, Mutex<AppData>>, key: String, value: String) {
    let mut data = state.lock().unwrap();
    data.settings.insert(key, value);
    data.save();
}

// ── Categories ────────────────────────────────────────────

fn default_categories() -> Vec<String> {
    vec!["工作".into(), "个人".into(), "学习".into(), "其他".into()]
}

fn load_categories(settings: &std::collections::HashMap<String, String>) -> Vec<String> {
    settings
        .get("categories")
        .and_then(|s| serde_json::from_str::<Vec<String>>(s).ok())
        .unwrap_or_else(default_categories)
}

fn save_categories(data: &mut std::sync::MutexGuard<'_, AppData>, cats: &[String]) {
    data.settings.insert("categories".into(), serde_json::to_string(cats).unwrap());
}

#[tauri::command]
fn get_categories(state: tauri::State<'_, Mutex<AppData>>) -> Vec<String> {
    let data = state.lock().unwrap();
    load_categories(&data.settings)
}

#[tauri::command]
fn add_category(state: tauri::State<'_, Mutex<AppData>>, name: String) {
    let mut data = state.lock().unwrap();
    let mut cats = load_categories(&data.settings);
    if !cats.contains(&name) {
        cats.push(name);
        save_categories(&mut data, &cats);
        data.save();
    }
}

#[tauri::command]
fn delete_category(state: tauri::State<'_, Mutex<AppData>>, name: String) {
    let mut data = state.lock().unwrap();
    let mut cats = load_categories(&data.settings);
    if let Some(pos) = cats.iter().position(|c| c == &name) {
        cats.remove(pos);
        save_categories(&mut data, &cats);
        data.save();
    }
}

// ── App Commands ────────────────────────────────────────────

#[tauri::command]
fn show_main_window(app: tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
    }
}

#[tauri::command]
fn toggle_widget(app: tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("widget") {
        let _ = w.close();
    } else {
        create_widget_window(&app);
    }
}

#[tauri::command]
fn open_calendar(app: tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("calendar") {
        let _ = w.set_focus();
        return;
    }
    let win = WebviewWindowBuilder::new(&app, "calendar", WebviewUrl::App("calendar.html".into()))
        .title("Aminos TODO - 月历")
        .inner_size(800.0, 700.0)
        .min_inner_size(600.0, 500.0)
        .center()
        .resizable(false)
        .decorations(true)
        .closable(true)
        .maximizable(false)
        .build();
    match win {
        Ok(w) => { let _ = w.set_focus(); }
        Err(e) => { eprintln!("Failed to create calendar window: {}", e); }
    }
}

fn create_widget_window(app: &tauri::AppHandle) {
    let state = app.state::<Mutex<AppData>>();
    let (x, y, mode) = {
        let data = state.lock().unwrap();
        let x = data.settings.get("widget_x").and_then(|s| s.parse().ok()).unwrap_or(0i32);
        let y = data.settings.get("widget_y").and_then(|s| s.parse().ok()).unwrap_or(0i32);
        let mode = data.settings.get("widget_mode").cloned().unwrap_or_else(|| "always_on_top".into());
        (x, y, mode)
    };

    let always_on_top = mode == "always_on_top";

    let win = WebviewWindowBuilder::new(app, "widget", WebviewUrl::App("widget.html".into()))
        .title("Aminos TODO Widget")
        .inner_size(300.0, 380.0)
        .position(x as f64, y as f64)
        .decorations(false)
        .transparent(true)
        .always_on_top(always_on_top)
        .skip_taskbar(true)
        .resizable(true)
        .shadow(false)
        .visible(true)
        .build()
        .expect("failed to create widget window");

    // Save position on move
    let handle = app.app_handle().clone();
    win.on_window_event(move |event| {
        if let tauri::WindowEvent::Moved(pos) = event {
            let state = handle.state::<Mutex<AppData>>();
            let mut data = state.lock().unwrap();
            data.settings.insert("widget_x".into(), pos.x.to_string());
            data.settings.insert("widget_y".into(), pos.y.to_string());
            data.save();
        }
    });
}

#[tauri::command]
fn get_widget_enabled(state: tauri::State<'_, Mutex<AppData>>) -> bool {
    let data = state.lock().unwrap();
    data.settings.get("widget_enabled").map_or(true, |v| v != "false")
}

#[tauri::command]
fn set_widget_enabled(app: tauri::AppHandle, state: tauri::State<'_, Mutex<AppData>>, enabled: bool) {
    {
        let mut data = state.lock().unwrap();
        data.settings.insert("widget_enabled".into(), enabled.to_string());
        data.save();
    }
    if enabled {
        create_widget_window(&app);
    } else if let Some(w) = app.get_webview_window("widget") {
        let _ = w.close();
    }
}

#[tauri::command]
fn get_widget_mode(state: tauri::State<'_, Mutex<AppData>>) -> String {
    let data = state.lock().unwrap();
    data.settings.get("widget_mode").cloned().unwrap_or_else(|| "always_on_top".into())
}

#[tauri::command]
fn set_widget_mode(app: tauri::AppHandle, state: tauri::State<'_, Mutex<AppData>>, mode: String) {
    {
        let mut data = state.lock().unwrap();
        data.settings.insert("widget_mode".into(), mode.clone());
        data.save();
    }
    if let Some(w) = app.get_webview_window("widget") {
        let always_on_top = mode == "always_on_top";
        let _ = w.set_always_on_top(always_on_top);
    }
}

#[tauri::command]
fn set_theme(app: tauri::AppHandle, state: tauri::State<'_, Mutex<AppData>>, theme: String) {
    {
        let mut data = state.lock().unwrap();
        data.settings.insert("theme".into(), theme.clone());
        data.save();
    }
    let _ = app.emit("theme-changed", theme);
}

#[tauri::command]
fn add_todo_quick(app: tauri::AppHandle, state: tauri::State<'_, Mutex<AppData>>, title: String) {
    let mut data = state.lock().unwrap();
    let max_order = data.todos.iter().map(|t| t.sort_order).max().unwrap_or(0);
    let todo = Todo {
        id: data.next_id,
        title,
        description: String::new(),
        category: String::new(),
        completed: 0,
        priority: 0,
        start_date: None,
        due_date: None,
        repeat_type: "none".into(),
        repeat_days: String::new(),
        duration_minutes: None,
        countdown_started_at: None,
        sort_order: max_order + 1,
        created_at: Local::now().format("%Y/%m/%d %H:%M:%S").to_string(),
        completed_at: None,
        parent_id: None,
        remind_minutes: None,
    };
    data.next_id += 1;
    data.todos.push(todo);
    data.save();
    notify_todos_changed(&app);
}

#[tauri::command]
fn add_subtask(app: tauri::AppHandle, state: tauri::State<'_, Mutex<AppData>>, parent_id: i64, title: String) -> Todo {
    let mut data = state.lock().unwrap();
    let max_order = data.todos.iter()
        .filter(|t| t.parent_id == Some(parent_id))
        .map(|t| t.sort_order)
        .max()
        .unwrap_or(0);
    let todo = Todo {
        id: data.next_id,
        title,
        description: String::new(),
        category: String::new(),
        completed: 0,
        priority: 0,
        start_date: None,
        due_date: None,
        repeat_type: "none".into(),
        repeat_days: String::new(),
        duration_minutes: None,
        countdown_started_at: None,
        sort_order: max_order + 1,
        created_at: Local::now().format("%Y/%m/%d %H:%M:%S").to_string(),
        completed_at: None,
        parent_id: Some(parent_id),
        remind_minutes: None,
    };
    data.next_id += 1;
    data.todos.push(todo.clone());
    data.save();
    notify_todos_changed(&app);
    todo
}

#[tauri::command]
fn get_subtasks(state: tauri::State<'_, Mutex<AppData>>, parent_id: i64) -> Vec<Todo> {
    let data = state.lock().unwrap();
    let mut subs: Vec<Todo> = data.todos.iter()
        .filter(|t| t.parent_id == Some(parent_id))
        .cloned()
        .collect();
    subs.sort_by(|a, b| a.sort_order.cmp(&b.sort_order));
    subs
}

#[tauri::command]
fn export_data(state: tauri::State<'_, Mutex<AppData>>) -> Result<serde_json::Value, String> {
    let data = state.lock().unwrap();
    let json = serde_json::to_value(&*data).map_err(|e| e.to_string())?;
    Ok(json)
}

#[tauri::command]
fn export_markdown(state: tauri::State<'_, Mutex<AppData>>, path: String) -> Result<String, String> {
    let data = state.lock().unwrap();
    let now = chrono::Local::now().format("%Y-%m-%d %H:%M").to_string();

    let mut md = String::new();
    md.push_str(&format!("# Aminos TODO 导出\n\n> 导出时间：{}\n\n", now));

    // Active todos (not completed, top-level)
    let active: Vec<_> = data.todos.iter()
        .filter(|t| t.completed == 0 && t.parent_id.is_none())
        .collect();
    let completed: Vec<_> = data.todos.iter()
        .filter(|t| t.completed != 0 && t.parent_id.is_none())
        .collect();

    // Subtask helper
    let subtasks_of = |parent_id: i64| -> Vec<&Todo> {
        data.todos.iter()
            .filter(|t| t.parent_id == Some(parent_id))
            .collect()
    };

    if !active.is_empty() {
        md.push_str(&format!("## 进行中 ({})\n\n", active.len()));
        for t in &active {
            write_todo_md(&mut md, t, &subtasks_of(t.id));
        }
    }

    if !completed.is_empty() {
        md.push_str(&format!("## 已完成 ({})\n\n", completed.len()));
        for t in &completed {
            write_todo_md(&mut md, t, &subtasks_of(t.id));
        }
    }

    if active.is_empty() && completed.is_empty() {
        md.push_str("*暂无待办事项*\n");
    }

    // Write file
    let file_path = std::path::PathBuf::from(&path);
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let mut file = fs::File::create(&file_path).map_err(|e| e.to_string())?;
    file.write_all(md.as_bytes()).map_err(|e| e.to_string())?;

    Ok(format!("已导出到 {}", path))
}

fn write_todo_md(md: &mut String, t: &Todo, subs: &[&Todo]) {
    let checkbox = if t.completed != 0 { "x" } else { " " };
    md.push_str(&format!("- [{}] **{}**", checkbox, t.title));

    let mut tags = Vec::new();
    if !t.category.is_empty() { tags.push(format!("`{}`", t.category)); }
    if t.priority == 1 { tags.push("⚠️ 重要".into()); }
    else if t.priority == 2 { tags.push("🔴 紧急".into()); }
    if !tags.is_empty() {
        md.push_str(&format!(" {}", tags.join(" ")));
    }
    md.push('\n');

    if !t.description.is_empty() {
        md.push_str(&format!("  > {}\n", t.description));
    }

    if let Some(ref due) = t.due_date {
        md.push_str(&format!("  📅 截止：{}\n", due));
    }
    if let Some(ref start) = t.start_date {
        md.push_str(&format!("  📅 开始：{}\n", start));
    }

    for s in subs {
        let sc = if s.completed != 0 { "x" } else { " " };
        md.push_str(&format!("    - [{}] {}\n", sc, s.title));
    }

    md.push('\n');
}

#[tauri::command]
fn import_data(app: tauri::AppHandle, state: tauri::State<'_, Mutex<AppData>>, json: String) -> Result<(), String> {
    let imported: AppData = serde_json::from_str(&json).map_err(|e| e.to_string())?;
    if imported.todos.is_empty() && imported.settings.is_empty() {
        return Err("无效的数据文件".into());
    }
    let mut data = state.lock().unwrap();
    *data = imported;
    data.save();
    notify_todos_changed(&app);
    Ok(())
}

// ── Notification ────────────────────────────────────────────

fn check_due_notifications(app: &tauri::AppHandle) {
    let state = app.state::<Mutex<AppData>>();
    let data = state.lock().unwrap();

    if data.settings.get("notify_enabled").map_or(false, |v| v == "false") {
        return;
    }

    let today = Local::now().format("%Y-%m-%d").to_string();
    let last_key = data.settings.get("last_notify_date").cloned();
    let should_check_overdue = last_key.as_deref() != Some(&today);
    let dnd_start = data.settings.get("dnd_start").cloned().unwrap_or_default();
    let dnd_end = data.settings.get("dnd_end").cloned().unwrap_or_default();
    drop(data);

    let todos = {
        let data = state.lock().unwrap();
        data.todos.clone()
    };

    let now = Local::now();
    let now_ts = now.timestamp();

    // ── Do Not Disturb check ──
    if !dnd_start.is_empty() && !dnd_end.is_empty() {
        let now_time = now.format("%H:%M").to_string();
        if dnd_start <= dnd_end {
            if now_time >= dnd_start && now_time < dnd_end { return; }
        } else {
            if now_time >= dnd_start || now_time < dnd_end { return; }
        }
    }

    // ── Overdue check (once per day) ──
    if should_check_overdue {
        let overdue: Vec<&Todo> = todos
            .iter()
            .filter(|t| {
                if t.completed != 0 { return false; }
                if let Some(ref due) = t.due_date {
                    if let Ok(d) = chrono::NaiveDate::parse_from_str(due, "%Y-%m-%d") {
                        return d < now.date_naive();
                    }
                }
                false
            })
            .collect();

        if !overdue.is_empty() {
            let names: Vec<&str> = overdue.iter().take(3).map(|t| t.title.as_str()).collect();
            let body = format!("{} 项待办已过期：{}{}",
                overdue.len(),
                names.join("、"),
                if overdue.len() > 3 { "等" } else { "" }
            );
            let _ = app.notification().builder()
                .title("Aminos TODO - 过期提醒")
                .body(&body)
                .show();
        }

        let mut data = state.lock().unwrap();
        data.settings.insert("last_notify_date".into(), today);
        data.save();
    }

    // ── Reminder check (every cycle) ──
    // Load previously notified reminder ids
    let notified_json = {
        let data = state.lock().unwrap();
        data.settings.get("notified_reminders").cloned().unwrap_or_else(|| "{}".into())
    };
    let mut notified: std::collections::HashMap<i64, i64> =
        serde_json::from_str(&notified_json).unwrap_or_default();

    // Clean entries older than 1 hour to prevent unbounded growth
    notified.retain(|_, ts| now_ts - *ts < 3600);

    for t in &todos {
        if t.completed != 0 { continue; }
        if t.remind_minutes.is_none() { continue; }
        if t.due_date.is_none() { continue; }

        let remind_min = t.remind_minutes.unwrap();

        // Parse due_date and compute remind time
        let due_str = t.due_date.as_ref().unwrap();
        if let Ok(due_date) = chrono::NaiveDate::parse_from_str(due_str, "%Y-%m-%d") {
            // Reminder triggers at (due_date start of day) - remind_minutes
            // For "before" reminders (remind_minutes > 0): remind at due_date - remind_minutes
            // For "on time" reminders (remind_minutes == 0): remind at due_date start of day
            let due_dt = due_date.and_hms_opt(0, 0, 0).unwrap();
            let remind_time = due_dt - chrono::Duration::minutes(remind_min);
            let remind_ts = remind_time.and_utc().timestamp();

            if now_ts >= remind_ts {
                // Check if we already notified for this task recently
                if let Some(last_ts) = notified.get(&t.id) {
                    if now_ts - last_ts < 300 { continue; } // within 5 min window
                }

                let label = if remind_min == 0 {
                    "今天到期".to_string()
                } else if remind_min < 60 {
                    format!("{}分钟后到期", remind_min)
                } else if remind_min < 1440 {
                    format!("{}小时后到期", remind_min / 60)
                } else {
                    format!("{}天后到期", remind_min / 1440)
                };

                let _ = app.notification().builder()
                    .title("Aminos TODO - 待办提醒")
                    .body(&format!("「{}」{}", t.title, label))
                    .show();

                notified.insert(t.id, now_ts);
            }
        }
    }

    // Save updated notified list
    if let Ok(json) = serde_json::to_string(&notified) {
        let mut data = state.lock().unwrap();
        data.settings.insert("notified_reminders".into(), json);
        data.save();
    }
}

fn start_notification_checker(app: &tauri::AppHandle) {
    let handle = app.app_handle().clone();
    // Check after 5 seconds
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_secs(5));
        check_due_notifications(&handle);
        // Then every 5 minutes
        loop {
            std::thread::sleep(std::time::Duration::from_secs(300));
            check_due_notifications(&handle);
        }
    });
}

// ── App Entry ───────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Ensure data directory exists
    if let Some(dir) = dirs_next() {
        let _ = fs::create_dir_all(&dir);
    }

    let app_data = AppData::load();

    tauri::Builder::default()
        .manage(Mutex::new(app_data))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::default(),
            None,
        ))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Start notification checker
            start_notification_checker(app.handle());

            // Create tray
            let show_main = MenuItemBuilder::with_id("show_main", "显示主界面").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "退出").build(app)?;
            let menu = MenuBuilder::new(app)
                .item(&show_main)
                .item(&quit)
                .build()?;

            let icon = app.default_window_icon().cloned().unwrap();

            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .tooltip("Aminos TODO")
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "show_main" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.unminimize();
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { .. } = event {
                        if let Some(w) = tray.app_handle().get_webview_window("main") {
                            if w.is_visible().unwrap_or(false) {
                                let _ = w.hide();
                            } else {
                                let _ = w.unminimize();
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // Create widget if enabled
            {
                let state = app.state::<Mutex<AppData>>();
                let data = state.lock().unwrap();
                if data.settings.get("widget_enabled").map_or(true, |v| v != "false") {
                    drop(data);
                    create_widget_window(app.handle());
                }
            }

            // Close behavior: tray or quit
            if let Some(w) = app.get_webview_window("main") {
                let handle = app.handle().clone();
                w.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { .. } = event {
                        let state = handle.state::<Mutex<AppData>>();
                        let data = state.lock().unwrap();
                        let behavior = data.settings.get("close_behavior").cloned().unwrap_or_else(|| "tray".into());
                        drop(data);
                        if behavior == "quit" {
                            handle.exit(0);
                        } else {
                            if let Some(w) = handle.get_webview_window("main") {
                                let _ = w.hide();
                            }
                        }
                    }
                });
            }

            // ── Global shortcuts ──
            {
                let handle = app.handle().clone();
                let gs = app.global_shortcut();

                gs.on_shortcut("Ctrl+Shift+N", move |_app, _sc, event| {
                    if event.state() != ShortcutState::Pressed { return; }
                    if let Some(w) = handle.get_webview_window("main") {
                        let _ = w.unminimize();
                        let _ = w.show();
                        let _ = w.set_focus();
                        let _ = w.emit("focus-add-input", ());
                    }
                })?;

                let handle = app.handle().clone();
                gs.on_shortcut("Ctrl+Shift+M", move |_app, _sc, event| {
                    if event.state() != ShortcutState::Pressed { return; }
                    if let Some(w) = handle.get_webview_window("main") {
                        if w.is_visible().unwrap_or(false) {
                            let _ = w.hide();
                        } else {
                            let _ = w.unminimize();
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_todos,
            add_todo,
            update_todo,
            delete_todo,
            toggle_todo,
            reorder_todos,
            get_setting,
            set_setting,
            show_main_window,
            toggle_widget,
            get_widget_enabled,
            set_widget_enabled,
            get_widget_mode,
            set_widget_mode,
            set_theme,
            add_todo_quick,
            add_subtask,
            get_subtasks,
            get_categories,
            add_category,
            delete_category,
            export_data,
            import_data,
            export_markdown,
            open_calendar,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
