# 编译指南

本文档说明如何编译和打包 Tiecode IDE 扩展插件。

## 前置要求

- Node.js (推荐 18.x 或更高版本)
- npm 或 yarn
- VS Code (用于测试扩展)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 编译扩展

```bash
# 开发编译
npm run compile

# 或使用监听模式（开发时推荐）
npm run watch
```

编译后的文件会输出到 `dist` 目录：
- `dist/extension.js` - 扩展主文件
- `dist/webview/main.js` - Webview 前端文件

## 编译模式

### 开发模式

```bash
npm run compile
```

- 生成源码映射（source maps）便于调试
- 代码未压缩，便于阅读
- 适合开发和调试

### 生产模式

```bash
npm run package
```

- 代码压缩优化
- 隐藏源码映射（hidden-source-map）
- 适合发布

## 打包 VSIX 插件

### 安装打包工具

```bash
npm install -g @vscode/vsce
```

### 生成 VSIX 文件

```bash
vsce package
```

这会在项目根目录生成 `tiecode-multi-platform-ide-0.0.1.vsix` 文件。

### 打包选项

```bash
# 生成 VSIX 文件（不包含测试文件）
vsce package

# 生成 VSIX 文件并显示详细信息
vsce package --verbose

# 生成 VSIX 文件并指定输出路径
vsce package -o ./release/tiecode-ide.vsix
```

## 安装和测试

### 方式一：开发模式运行

1. 在 VS Code 中打开项目
2. 按 `F5` 或点击"运行和调试"
3. 选择"扩展开发主机"
4. 会打开新的 VS Code 窗口，加载扩展的开发版本

### 方式二：安装 VSIX 文件

1. 在 VS Code 中按 `Ctrl+Shift+P`（Windows/Linux）或 `Cmd+Shift+P`（Mac）
2. 输入 `Extensions: Install from VSIX...`
3. 选择生成的 `.vsix` 文件
4. 重启 VS Code

### 方式三：本地安装

```bash
code --install-extension tiecode-multi-platform-ide-0.0.1.vsix
```

## 项目结构

编译后的目录结构：

```
dist/
├── extension.js          # 扩展主文件
├── extension.js.map      # 源码映射
└── webview/
    ├── main.js          # Webview 前端
    └── main.js.map      # 源码映射
```

## 常见问题

### 编译错误

如果遇到编译错误，请检查：

1. **依赖是否完整安装**
   ```bash
   npm install
   ```

2. **TypeScript 版本是否兼容**
   ```bash
   npm list typescript
   ```

3. **Node.js 版本是否满足要求**
   ```bash
   node --version
   ```

### 前端编译问题

如果前端编译失败：

1. 检查 React 依赖
   ```bash
   npm list react react-dom
   ```

2. 清理缓存重新编译
   ```bash
   rm -rf node_modules dist
   npm install
   npm run compile
   ```

### VSIX 打包失败

如果 `vsce package` 失败：

1. 检查 `package.json` 中的必填字段：
   - `name`
   - `version`
   - `publisher`
   - `displayName`
   - `description`

2. 检查 `.vscodeignore` 文件，确保排除了不需要的文件

3. 确保已编译代码（`dist` 目录存在）

## 发布流程

1. **更新版本号**
   ```bash
   # 在 package.json 中更新 version 字段
   ```

2. **编译生产版本**
   ```bash
   npm run package
   ```

3. **生成 VSIX**
   ```bash
   vsce package
   ```

4. **测试 VSIX**
   - 在干净的 VS Code 环境中安装并测试

5. **发布到市场**（可选）
   ```bash
   vsce publish
   ```

## 开发建议

- 使用 `npm run watch` 进行开发，自动重新编译
- 使用 `F5` 启动扩展开发主机进行测试
- 定期运行 `npm run lint` 检查代码质量
- 提交前确保 `npm run compile` 无错误


