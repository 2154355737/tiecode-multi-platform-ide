# Frontend 开发环境

## 在线调试

你可以在 `frontend` 目录运行 `npm run dev` 来启动开发服务器，进行在线调试。

### 使用方法

**方式一：从根目录运行**
```bash
# 在项目根目录
npm run dev
# 或
npm run dev:frontend
```

**方式二：从 frontend 目录运行**
```bash
# 进入 frontend 目录
cd src/webview/frontend

# 运行开发服务器（需要先安装依赖）
npm run dev
```

### 注意事项

1. **首次使用**：需要先在项目根目录安装依赖：
   ```bash
   npm install
   ```

2. **开发服务器**：启动后会自动打开浏览器，访问 `http://localhost:3000`

3. **VSCode API 模拟**：开发环境中会自动模拟 VSCode API，所有消息会在浏览器控制台输出

4. **热更新**：修改代码后会自动刷新页面

5. **依赖管理**：所有依赖都在项目根目录的 `node_modules` 中，frontend 目录的 `package.json` 仅用于脚本管理

### 开发环境特性

- ✅ 热模块替换 (HMR)
- ✅ 源码映射 (Source Maps)
- ✅ VSCode API 模拟
- ✅ 自动打开浏览器
- ✅ 实时编译



