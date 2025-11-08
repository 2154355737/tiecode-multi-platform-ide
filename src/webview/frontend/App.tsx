import React, { useState, useEffect } from 'react';
import { MessageHandler } from './utils/messageHandler';
import { CompilePlatform, CompileStatus } from './types';
import EditorPanel from './components/EditorPanel';
import CompilePanel from './components/CompilePanel';
import PlatformSelector from './components/PlatformSelector';
import './styles/main.css';

const App: React.FC = () => {
	const [selectedPlatform, setSelectedPlatform] = useState<CompilePlatform>('Windows');
	const [compileStatus, setCompileStatus] = useState<CompileStatus>('idle');
	const [workspaceFiles, setWorkspaceFiles] = useState<string[]>([]);

	useEffect(() => {
		// 监听来自扩展主进程的消息
		MessageHandler.onMessage((message) => {
			switch (message.command) {
				case 'workspaceFiles':
					setWorkspaceFiles(message.payload || []);
					break;
				case 'compileStatus':
					setCompileStatus(message.payload || 'idle');
					break;
				case 'platformChanged':
					// 平台已通过命令面板更改，更新UI
					setSelectedPlatform(message.payload);
					break;
				default:
					console.log('收到消息:', message);
			}
		});

		// 获取工作区文件列表
		MessageHandler.getWorkspaceFiles();
	}, []);

	const handlePlatformChange = (platform: CompilePlatform) => {
		setSelectedPlatform(platform);
		MessageHandler.selectPlatform(platform);
	};

	const handleCompile = (config: any) => {
		setCompileStatus('compiling');
		MessageHandler.requestCompile({
			...config,
			platform: selectedPlatform
		});
	};

	return (
		<div className="tiecode-app">
			<header className="app-header">
				<h1>Tiecode 可视化编辑器</h1>
				<PlatformSelector
					selectedPlatform={selectedPlatform}
					onPlatformChange={handlePlatformChange}
				/>
			</header>
			<main className="app-main">
				<div className="app-content">
					<EditorPanel files={workspaceFiles} />
					<CompilePanel
						platform={selectedPlatform}
						status={compileStatus}
						onCompile={handleCompile}
					/>
				</div>
			</main>
		</div>
	);
};

export default App;

