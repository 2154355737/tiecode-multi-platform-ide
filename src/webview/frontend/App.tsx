import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import InitialConfig from './components/InitialConfig';
import CreateProject from './components/CreateProject';
import ProjectConfig from './components/ProjectConfig';
import { MessageBus } from './utils/messageBus';
import './styles/main.css';

type ViewState = 'loading' | 'initialConfig' | 'createProject' | 'projectConfig' | 'home';

const App: React.FC = (): React.ReactElement => {
	const [view, setView] = useState<ViewState>('loading');
	const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
	const intentRef = useRef<'none' | 'createProject' | 'projectConfig'>('none');

	useEffect(() => {
		// 检查配置状态
		MessageBus.post({
			command: 'checkConfig',
		});

		// 监听来自后端的消息
		const unsubscribe = MessageBus.onMessage((message: any) => {
			if (message.command === 'configStatus') {
				const { isConfigured: configured } = message.payload;
				setIsConfigured(configured);
				// 若已有明确意图，则保持该意图优先级最高
				if (intentRef.current === 'createProject') {
					setView('createProject');
				} else if (intentRef.current === 'projectConfig') {
					setView('projectConfig');
				} else {
					setView((current) => {
						if (current === 'createProject' || current === 'projectConfig') {
							return current;
						}
						return configured ? 'home' : 'initialConfig';
					});
				}
			} else if (message.command === 'configCompleted') {
				setIsConfigured(true);
				setView('home');
			} else if (message.command === 'showCreateProject') {
				intentRef.current = 'createProject';
				setView('createProject');
			} else if (message.command === 'createProjectClosed') {
				// 关闭创建页后返回首页，即使未配置也不强制进入首次配置
				intentRef.current = 'none';
				setView('home');
			} else if (message.command === 'showProjectConfig') {
				intentRef.current = 'projectConfig';
				setView('projectConfig');
			} else if (message.command === 'closeProjectConfig') {
				intentRef.current = 'none';
				setView(isConfigured ? 'home' : 'initialConfig');
			}
		});

		return unsubscribe;
	}, [isConfigured]);

	if (view === 'loading') {
		return (
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					height: '100vh',
					width: '100%',
					alignItems: 'center',
					justifyContent: 'center',
					padding: 2,
				}}
			>
				<Typography variant="body1" color="text.secondary">
					正在加载...
				</Typography>
			</Box>
		);
	}

	// 如果未配置，显示配置界面
	if (view === 'initialConfig') {
		return <InitialConfig />;
	}

	// 如果显示创建项目界面
	if (view === 'createProject') {
		return <CreateProject />;
	}

	// 如果显示项目配置界面
	if (view === 'projectConfig') {
		return <ProjectConfig />;
	}

	// 已配置，显示主界面
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				height: '100vh',
				width: '100%',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 2,
			}}
		>
			<Typography variant="h4" component="h1" gutterBottom>
				欢迎使用
			</Typography>
			<Typography variant="body1" color="text.secondary">
				开始你的开发之旅
			</Typography>
		</Box>
	);
};

export default App;
