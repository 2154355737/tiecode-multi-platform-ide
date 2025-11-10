import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/main.css';

// 添加初始化日志
console.log('前端入口文件已加载');
console.log('window.vscode:', (window as any).vscode);
console.log('document.readyState:', document.readyState);

// 等待DOM完全加载
function initApp() {
	const container = document.getElementById('root');
	if (!container) {
		console.error('未找到root容器元素');
		document.body.innerHTML = `
			<div style="padding: 20px; font-family: sans-serif; color: red;">
				<h1>初始化失败</h1>
				<p>未找到root容器元素</p>
			</div>
		`;
		return;
	}

	console.log('找到root容器，正在初始化React应用...');
	console.log('容器内容:', container.innerHTML.substring(0, 100));
	
	try {
		// 清空容器中的加载消息
		container.innerHTML = '';
		
		const root = createRoot(container);
		root.render(
			<React.StrictMode>
				<App />
			</React.StrictMode>
		);
		console.log('React应用初始化成功');
	} catch (error) {
		console.error('React应用初始化失败:', error);
		const errorMsg = error instanceof Error ? error.message : '未知错误';
		const errorStack = error instanceof Error ? error.stack : String(error);
		container.innerHTML = `
			<div style="padding: 20px; font-family: sans-serif; color: red;">
				<h1>初始化失败</h1>
				<p>错误信息: ${errorMsg}</p>
				<pre style="background: #f0f0f0; padding: 10px; overflow: auto;">${errorStack}</pre>
			</div>
		`;
	}
}

// 如果DOM已经加载完成，立即初始化；否则等待DOMContentLoaded事件
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initApp);
} else {
	// DOM已经加载完成，立即初始化
	initApp();
}


















