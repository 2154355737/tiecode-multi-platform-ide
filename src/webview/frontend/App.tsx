import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, Container } from '@mui/material';
import { MessageHandler } from './utils/messageHandler';
import { CompilePlatform, CompileStatus, CompileConfig } from './types';
import EditorPanel from './components/EditorPanel';
import CompilePanel from './components/CompilePanel';
import PlatformSelector from './components/PlatformSelector';
import { createVSCodeTheme } from './theme/vscodeTheme';
import './styles/main.css';

const App: React.FC = () => {
	const [selectedPlatform, setSelectedPlatform] = useState<CompilePlatform>('Windows');
	const [compileStatus, setCompileStatus] = useState<CompileStatus>('idle');
	const [workspaceFiles, setWorkspaceFiles] = useState<string[]>([]);
	const [projectConfig, setProjectConfig] = useState<any>(null);
	const [theme] = useState(() => createVSCodeTheme());

	useEffect(() => {
		MessageHandler.onMessage((message) => {
			switch (message.command) {
				case 'workspaceFiles':
					setWorkspaceFiles(message.payload || []);
					break;
				case 'compileStatus':
					setCompileStatus(message.payload || 'idle');
					break;
				case 'platformChanged':
					setSelectedPlatform(message.payload);
					break;
				case 'projectConfig':
					setProjectConfig(message.payload);
					if (message.payload?.defaultPlatform) {
						setSelectedPlatform(message.payload.defaultPlatform);
					}
					break;
			}
		});

		MessageHandler.getWorkspaceFiles();
		MessageHandler.getProjectConfig();
	}, []);

	const handlePlatformChange = (platform: CompilePlatform) => {
		setSelectedPlatform(platform);
		MessageHandler.selectPlatform(platform);
	};

	const handleCompile = (config: CompileConfig) => {
		setCompileStatus('compiling');
		MessageHandler.requestCompile({
			...config,
			platform: config.platform || selectedPlatform
		});
	};

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					height: '100vh',
					width: '100%',
					backgroundColor: 'background.default',
				}}
			>
				{/* 顶部工具栏 */}
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '12px 16px',
						borderBottom: '1px solid',
						borderColor: 'divider',
						backgroundColor: 'background.paper',
					}}
				>
					<PlatformSelector
						selectedPlatform={selectedPlatform}
						onPlatformChange={handlePlatformChange}
					/>
				</Box>

				{/* 主内容区 */}
				<Box
					component="main"
					sx={{
						flex: 1,
						overflow: 'hidden',
						display: 'flex',
						gap: 2,
						padding: 2,
					}}
				>
					<Container maxWidth={false} sx={{ height: '100%', padding: 0, display: 'flex', gap: 2 }}>
						<Box sx={{ flex: '0 0 300px', height: '100%', display: 'flex' }}>
							<EditorPanel files={workspaceFiles} />
						</Box>
						<Box sx={{ flex: 1, height: '100%', display: 'flex' }}>
							<CompilePanel
								platform={selectedPlatform}
								status={compileStatus}
								onCompile={handleCompile}
								projectConfig={projectConfig}
							/>
						</Box>
					</Container>
				</Box>
			</Box>
		</ThemeProvider>
	);
};

export default App;
