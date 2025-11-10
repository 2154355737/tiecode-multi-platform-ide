import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, Container, Button, Typography, Chip } from '@mui/material';
import { MessageBus } from './utils/messageBus';
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
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [pendingTieccDir, setPendingTieccDir] = useState<string | undefined>(undefined);
	const [pendingProjectDir, setPendingProjectDir] = useState<string | undefined>(undefined);

	useEffect(() => {
		MessageBus.onMessage((message) => {
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
				case 'directoryPicked':
					if (message.payload?.purpose === 'tieccDir') {
						const picked = message.payload.path || undefined;
						setPendingTieccDir(picked);
						if (picked) {
							// 若用户选择的是 TMake 根目录而非 tiecc 目录，尝试附加 /tiecc
							const normalized = picked.endsWith('tiecc') ? picked : `${picked}\\tiecc`;
							const next = {
								...(projectConfig || {}),
								defaultTieccDir: normalized,
							};
							MessageBus.post({ command: 'saveProjectConfig', payload: next });
						}
					}
					if (message.payload?.purpose === 'tmakeProjectDir') {
						setPendingProjectDir(message.payload.path || undefined);
					}
					break;
			}
		});

		MessageBus.getWorkspaceFiles();
		MessageBus.getProjectConfig();
	}, []);

	const handlePlatformChange = (platform: CompilePlatform) => {
		setSelectedPlatform(platform);
		MessageBus.selectPlatform(platform);
	};

	const handleCompile = (config: CompileConfig) => {
		setCompileStatus('compiling');
		MessageBus.requestCompile({
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
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						{!projectConfig?.defaultTieccDir && (
							<Button
								variant="contained"
								size="small"
								onClick={() => MessageBus.post({ command: 'pickDirectory', payload: { purpose: 'tieccDir' } })}
								sx={{ textTransform: 'none' }}
							>
								设置编译器目录
							</Button>
						)}
						{projectConfig?.defaultTieccDir && (
							<Chip size="small" label="已配置编译器目录" sx={{ height: 22 }} />
						)}
						{projectConfig?.defaultTMakeProjectDir && (
							<Chip size="small" label="已配置TMake目录" sx={{ height: 22 }} />
						)}
						<Button
							variant="outlined"
							size="small"
							onClick={() => {
								setPendingTieccDir(projectConfig?.defaultTieccDir);
								setPendingProjectDir(projectConfig?.defaultTMakeProjectDir);
								setSettingsOpen((v) => !v);
							}}
							sx={{ textTransform: 'none' }}
						>
							设置
						</Button>
					</Box>
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
						<Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
							{settingsOpen && (
								<Box
									sx={{
										border: '1px solid',
										borderColor: 'divider',
										borderRadius: 1,
										padding: 2,
										display: 'flex',
										flexDirection: 'column',
										gap: 1.5,
										backgroundColor: 'background.paper',
									}}
								>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>
										项目设置
									</Typography>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<Typography variant="body2" sx={{ width: 160 }}>TMake 项目目录</Typography>
										<Typography variant="body2" sx={{ flex: 1, color: 'text.secondary' }}>
											{pendingProjectDir || projectConfig?.defaultTMakeProjectDir || '未设置'}
										</Typography>
										<Button
											variant="outlined"
											size="small"
											onClick={() => MessageBus.post({ command: 'pickDirectory', payload: { purpose: 'tmakeProjectDir' } })}
											sx={{ textTransform: 'none' }}
										>
											选择文件夹
										</Button>
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<Typography variant="body2" sx={{ width: 160 }}>编译器目录 (tieccDir)</Typography>
										<Typography variant="body2" sx={{ flex: 1, color: 'text.secondary' }}>
											{pendingTieccDir || projectConfig?.defaultTieccDir || '未设置'}
										</Typography>
										<Button
											variant="outlined"
											size="small"
											onClick={() => MessageBus.post({ command: 'pickDirectory', payload: { purpose: 'tieccDir' } })}
											sx={{ textTransform: 'none' }}
										>
											选择文件夹
										</Button>
									</Box>
									<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
										<Button
											variant="text"
											size="small"
											onClick={() => setSettingsOpen(false)}
											sx={{ textTransform: 'none' }}
										>
											取消
										</Button>
										<Button
											variant="contained"
											size="small"
											onClick={() => {
												const next = {
													...(projectConfig || {}),
													defaultTMakeProjectDir: pendingProjectDir || projectConfig?.defaultTMakeProjectDir,
													defaultTieccDir: pendingTieccDir || projectConfig?.defaultTieccDir,
												};
												MessageBus.post({ command: 'saveProjectConfig', payload: next });
												setSettingsOpen(false);
											}}
											sx={{ textTransform: 'none' }}
										>
											保存
										</Button>
									</Box>
								</Box>
							)}
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
