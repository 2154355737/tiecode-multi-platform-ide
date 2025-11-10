import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/main.css';

function initApp() {
	const container = document.getElementById('root');
	if (!container) {
		console.error('未找到root容器元素');
		return;
	}

	try {
		const root = createRoot(container);
		root.render(
			<React.StrictMode>
				<App />
			</React.StrictMode>
		);
		console.log('React应用初始化成功');
	} catch (error) {
		console.error('React应用初始化失败:', error);
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initApp);
} else {
	initApp();
}
