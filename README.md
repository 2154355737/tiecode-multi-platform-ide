# Tiecode Multi-Platform IDE

Tiecode 编程语言的开发套件，提供可视化开发界面和布局支持。

## 功能特性

- **可视化编辑器**：提供基于 Webview 的可视化开发界面
- **活动栏视图**：在 VS Code 活动栏中显示 Tiecode IDE 功能视图
- **状态栏管理**：显示编译平台和状态信息
- **欢迎页面**：首次启动时显示欢迎和帮助信息

## 开发

### 构建

```bash
npm run compile
```

### 开发模式

```bash
npm run watch
```

### 前端开发

```bash
npm run dev:frontend
```

## 项目结构

```
src/
├── extension.ts          # 扩展入口
├── ui/                   # UI 布局组件
│   ├── ActivityBarViewProvider.ts
│   ├── CommandManager.ts
│   ├── StatusBarManager.ts
│   └── WelcomeProvider.ts
├── webview/              # Webview 前端
│   ├── TiecodeWebviewProvider.ts
│   └── frontend/         # React 前端应用
└── types/                # 类型定义
```
