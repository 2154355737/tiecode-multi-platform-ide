# Tiecode Multi-Platform IDE

Tiecode 编程语言的开发套件，提供可视化开发界面和布局支持。

## 功能特性

- **可视化编辑器**：提供基于 Webview 的可视化开发界面
- **活动栏视图**：在 VS Code 活动栏中显示 Tiecode IDE 功能视图
- **状态栏管理**：显示编译平台和状态信息
- **初始配置向导**：首次启动时自动显示配置界面，用于配置编译器路径
  - Windows tiecc 核心编译器位置
  - Windows tmake 编译工具链位置
  - 预留 Android 和 Linux 核心编译器位置
- **项目编译功能**：支持使用 TMake 工具链编译 Tiecode 项目
  - 在项目第一次编译构建时，需要用户配置编译器配置
  - 支持多种编译命令和参数选项

## 开发

### 安装依赖

首先需要安装项目依赖：

```bash
npm install
```

### 编译扩展

#### 1. 开发编译（带源码映射）

```bash
npm run compile
```

这会编译 TypeScript 代码和 React 前端代码到 `dist` 目录。

#### 2. 监听模式（开发时使用）

```bash
npm run watch
```

这会持续监听文件变化并自动重新编译。

#### 3. 生产打包

```bash
npm run package
```

这会以生产模式打包扩展，生成优化后的代码。

### 前端开发

如果需要单独开发前端界面：

```bash
npm run dev:frontend
```

这会启动开发服务器，在浏览器中打开 `http://localhost:3000` 进行调试。

### 打包 VSIX 插件

要生成可安装的 `.vsix` 插件文件，需要安装 `vsce` 工具：

```bash
npm install -g @vscode/vsce
```

然后运行：

```bash
vsce package
```

这会在项目根目录生成一个 `.vsix` 文件，可以直接在 VS Code 中安装。

### 安装插件

#### 方式一：从 VSIX 文件安装

1. 在 VS Code 中按 `Ctrl+Shift+P`（Windows/Linux）或 `Cmd+Shift+P`（Mac）
2. 输入 `Extensions: Install from VSIX...`
3. 选择生成的 `.vsix` 文件

#### 方式二：开发模式安装

1. 在 VS Code 中按 `F5` 或点击"运行和调试"
2. 这会打开一个新的 VS Code 窗口，其中加载了扩展的开发版本
3. 在新窗口中测试扩展功能

## 项目编译

### 编译器配置

在项目第一次编译构建时，需要用户配置编译器配置。配置包括：

- **tiecc 核心编译器位置**：指定结绳编译器目录
- **tmake 编译工具链位置**：指定 TMake 可执行文件路径

配置完成后，扩展会自动保存配置信息，后续编译将使用已配置的编译器路径。

### TMake 命令与参数

#### 支持的命令

| 命令 | 描述 |
|------|------|
| `create [项目名]` | 创建新的结绳项目 |
| `plugin [插件名]` | 创建新的 TMake 插件 |
| `precompile` | 预编译所有 .tmake 文件到 .cache 目录 |
| `compile` | 编译结绳项目（默认命令） |
| `build` | 清理并编译项目 |
| `clean` | 清理构建产物、缓存和临时文件 |
| `version` | 显示版本信息 |
| `help` | 显示帮助信息 |

#### 编译命令参数

在执行 `compile` 或 `build` 命令时，支持以下参数：

| 参数 | 描述 | 默认值 |
|------|------|--------|
| `--output` | 指定输出目录 | 根据配置文件决定 |
| `--package` | 指定包名 | main |
| `--debug` | 启用调试模式 | 根据配置文件决定 |
| `--release` | 启用发布模式 | 根据配置文件决定 |
| `--hard-mode` | 启用严格模式 | false |
| `--optimize` | 设置优化级别（0-3） | 根据配置文件决定 |
| `--log-level` | 设置日志级别 | 根据配置文件决定 |
| `--platform` | 指定目标平台 | 根据配置文件决定 |
| `--tiecc-dir` | 指定结绳编译器目录 | 环境变量或 ./tiecc |

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
├── utils/                # 工具类
│   ├── ConfigManager.ts  # 配置管理
│   └── ProjectCreator.ts # 项目创建
└── types/                # 类型定义
```
