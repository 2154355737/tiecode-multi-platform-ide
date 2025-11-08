import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/main.css';

// 初始化React应用
const container = document.getElementById('root');
if (container) {
	const root = createRoot(container);
	root.render(
		<React.StrictMode>
			<App />
		</React.StrictMode>
	);
}

