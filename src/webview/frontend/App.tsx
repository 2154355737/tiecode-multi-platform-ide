import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import InitialConfig from './components/InitialConfig';
import CreateProject from './components/CreateProject';
import ProjectConfig from './components/ProjectConfig';
import { MessageBus } from './utils/messageBus';
import './styles/main.css';

const App: React.FC = (): React.ReactElement => {
	const [showConfig, setShowConfig] = useState<boolean>(false);
	const [showCreateProject, setShowCreateProject] = useState<boolean>(false);
	const [showProjectConfig, setShowProjectConfig] = useState<boolean>(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// 检查配置状态
		MessageBus.post({
			command: 'checkConfig',
		});

		// 监听来自后端的消息
		const handleMessage = (message: any) => {
			if (message.command === 'configStatus') {
				const { isConfigured } = message.payload;
				setShowConfig(!isConfigured);
				setLoading(false);
			} else if (message.command === 'configCompleted') {
				// 配置完成后，刷新页面或显示主界面
				setShowConfig(false);
			} else if (message.command === 'showCreateProject') {
				// 显示创建项目界面
				setShowCreateProject(true);
				setShowProjectConfig(false);
			} else if (message.command === 'createProjectClosed') {
				// 关闭创建项目界面
				setShowCreateProject(false);
			} else if (message.command === 'showProjectConfig') {
				// 显示项目配置界面
				setShowProjectConfig(true);
				setShowCreateProject(false);
			} else if (message.command === 'closeProjectConfig') {
				// 关闭项目配置界面
				setShowProjectConfig(false);
			}
		};

		MessageBus.onMessage(handleMessage);
	}, []);

	if (loading) {
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
	if (showConfig) {
		return <InitialConfig />;
	}

	// 如果显示创建项目界面
	if (showCreateProject) {
		return <CreateProject />;
	}

	// 如果显示项目配置界面
	if (showProjectConfig) {
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
