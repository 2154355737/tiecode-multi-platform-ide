import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import { createVSCodeTheme } from './theme/vscodeTheme';
import './styles/main.css';

function AppWithTheme(): React.ReactElement {
	const [theme, setTheme] = useState(() => createVSCodeTheme());

	useEffect(() => {
		// 监听主题变化（VS Code 会在主题改变时重新注入 CSS 变量）
		const updateTheme = () => {
			setTheme(createVSCodeTheme());
		};

		// 使用 MutationObserver 监听 CSS 变量变化
		const observer = new MutationObserver(() => {
			updateTheme();
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['style', 'class'],
		});

		// 定期检查主题变化（作为备用方案）
		const interval = setInterval(updateTheme, 1000);

		return () => {
			observer.disconnect();
			clearInterval(interval);
		};
	}, []);

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<App />
		</ThemeProvider>
	);
}

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
				<AppWithTheme />
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
