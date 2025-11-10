import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	TextField,
	Button,
	Paper,
	Alert,
	CircularProgress,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Switch,
	FormControlLabel,
	Divider,
	Stack,
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import { MessageBus } from '../utils/messageBus';

/**
 * 项目基本信息
 */
interface ProjectBasicInfo {
	projectName?: string;
	version?: string;
	outputDir?: string;
	outputFile?: string;
}

/**
 * 编译器配置
 */
interface CompilerSettings {
	compiler?: string;
	optimizeLevel?: number;
	logLevel?: 'debug' | 'info' | 'warning' | 'error';
	releaseMode?: boolean;
	extraArgs?: string[];
	compilerPath?: string;
	tmakePath?: string;
}

/**
 * 链接器配置
 */
interface LinkerSettings {
	libraries?: string[];
	libraryPaths?: string[];
	linkerArgs?: string[];
	linkerPath?: string;
}

/**
 * 项目配置
 */
interface ProjectConfig {
	basicInfo: ProjectBasicInfo;
	compiler: CompilerSettings;
	linker: LinkerSettings;
}

const ProjectConfig: React.FC = (): React.ReactElement => {
	const [config, setConfig] = useState<ProjectConfig>({
		basicInfo: {},
		compiler: {},
		linker: {}
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasConfigFile, setHasConfigFile] = useState(false);

	// 加载配置
	useEffect(() => {
		loadConfig();
	}, []);

	// 监听来自后端的消息
	useEffect(() => {
		const handleMessage = (message: any) => {
			if (message.command === 'projectConfigLoaded') {
				if (message.payload) {
					setConfig(message.payload);
					setHasConfigFile(true);
				} else {
					// 没有配置文件，使用默认值
					setConfig({
						basicInfo: {
							projectName: '',
							version: '1.0.0',
							outputDir: './dist',
							outputFile: ''
						},
						compiler: {
							compiler: 'g++',
							optimizeLevel: 1,
							logLevel: 'info',
							releaseMode: false
						},
						linker: {
							libraries: [],
							libraryPaths: [],
							linkerArgs: []
						}
					});
					setHasConfigFile(false);
				}
				setLoading(false);
			} else if (message.command === 'projectConfigSaved') {
				setSaving(false);
				setSaveSuccess(true);
				setHasConfigFile(true);
				setTimeout(() => setSaveSuccess(false), 3000);
			} else if (message.command === 'projectConfigSaveError') {
				setSaving(false);
				setError(message.payload || '保存配置失败');
				setTimeout(() => setError(null), 5000);
			}
		};

		const cleanup = MessageBus.onMessage(handleMessage);
		return cleanup;
	}, []);

	const loadConfig = () => {
		setLoading(true);
		MessageBus.post({ command: 'loadProjectConfig' });
	};

	const handleSave = () => {
		setSaving(true);
		setError(null);
		MessageBus.post({
			command: 'saveProjectConfig',
			payload: config
		});
	};

	const updateBasicInfo = (field: keyof ProjectBasicInfo, value: string) => {
		setConfig(prev => ({
			...prev,
			basicInfo: {
				...prev.basicInfo,
				[field]: value
			}
		}));
	};

	const updateCompiler = (field: keyof CompilerSettings, value: any) => {
		setConfig(prev => ({
			...prev,
			compiler: {
				...prev.compiler,
				[field]: value
			}
		}));
	};

	const updateLinker = (field: keyof LinkerSettings, value: any) => {
		setConfig(prev => ({
			...prev,
			linker: {
				...prev.linker,
				[field]: value
			}
		}));
	};

	if (loading) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
					width: '100%',
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				height: '100vh',
				width: '100%',
				padding: 3,
				overflow: 'auto',
				backgroundColor: 'var(--vscode-editor-background)',
				fontFamily: 'var(--vscode-font-family)',
				fontSize: 'var(--vscode-font-size)',
			}}
		>
			{/* 标题栏 */}
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: 3,
				}}
			>
				<Typography 
					variant="h4" 
					component="h1" 
					sx={{ 
						color: 'var(--vscode-foreground)',
						fontFamily: 'var(--vscode-font-family)',
						fontSize: 'var(--vscode-font-size)',
						fontWeight: 600,
					}}
				>
					项目配置
				</Typography>
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Button
						variant="outlined"
						startIcon={<Refresh />}
						onClick={loadConfig}
						disabled={saving}
					>
						刷新
					</Button>
					<Button
						variant="contained"
						startIcon={<Save />}
						onClick={handleSave}
						disabled={saving}
					>
						{saving ? '保存中...' : '保存配置'}
					</Button>
				</Box>
			</Box>

			{/* 提示信息 */}
			{saveSuccess && (
				<Alert severity="success" sx={{ marginBottom: 2 }}>
					配置已保存成功！
				</Alert>
			)}
			{error && (
				<Alert severity="error" sx={{ marginBottom: 2 }}>
					{error}
				</Alert>
			)}
			{!hasConfigFile && (
				<Alert severity="info" sx={{ marginBottom: 2 }}>
					当前项目没有配置文件，将创建新的配置文件。
					<br />
					<small>注意：TMake 配置保存在"编译配置.tmake"，IDE 路径配置保存在".tiecode.json"</small>
				</Alert>
			)}

			{/* 配置表单 */}
			<Stack spacing={3}>
				{/* 项目基本信息 */}
				<Paper
					sx={{
						padding: 3,
						backgroundColor: 'var(--vscode-sideBar-background)',
					}}
				>
					<Typography 
						variant="h6" 
						sx={{ 
							marginBottom: 2, 
							color: 'var(--vscode-foreground)',
							fontFamily: 'var(--vscode-font-family)',
							fontSize: 'var(--vscode-font-size)',
							fontWeight: 600,
						}}
					>
						项目基本信息
					</Typography>
					<Divider sx={{ marginBottom: 2 }} />
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
							<TextField
								label="项目名称"
								value={config.basicInfo.projectName || ''}
								onChange={(e) => updateBasicInfo('projectName', e.target.value)}
								variant="outlined"
								sx={{
									flex: '1 1 300px',
									minWidth: '300px',
									'& .MuiOutlinedInput-root': {
										backgroundColor: 'var(--vscode-input-background)',
										color: 'var(--vscode-input-foreground)',
									},
									'& .MuiInputLabel-root': {
										color: 'var(--vscode-input-foreground)',
									},
								}}
							/>
							<TextField
								label="版本号"
								value={config.basicInfo.version || ''}
								onChange={(e) => updateBasicInfo('version', e.target.value)}
								variant="outlined"
								placeholder="1.0.0"
								sx={{
									flex: '1 1 300px',
									minWidth: '300px',
									'& .MuiOutlinedInput-root': {
										backgroundColor: 'var(--vscode-input-background)',
										color: 'var(--vscode-input-foreground)',
									},
									'& .MuiInputLabel-root': {
										color: 'var(--vscode-input-foreground)',
									},
								}}
							/>
						</Box>
						<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
							<TextField
								label="输出目录"
								value={config.basicInfo.outputDir || ''}
								onChange={(e) => updateBasicInfo('outputDir', e.target.value)}
								variant="outlined"
								placeholder="./dist"
								sx={{
									flex: '1 1 300px',
									minWidth: '300px',
									'& .MuiOutlinedInput-root': {
										backgroundColor: 'var(--vscode-input-background)',
										color: 'var(--vscode-input-foreground)',
									},
									'& .MuiInputLabel-root': {
										color: 'var(--vscode-input-foreground)',
									},
								}}
							/>
							<TextField
								label="输出文件"
								value={config.basicInfo.outputFile || ''}
								onChange={(e) => updateBasicInfo('outputFile', e.target.value)}
								variant="outlined"
								placeholder="程序.exe"
								sx={{
									flex: '1 1 300px',
									minWidth: '300px',
									'& .MuiOutlinedInput-root': {
										backgroundColor: 'var(--vscode-input-background)',
										color: 'var(--vscode-input-foreground)',
									},
									'& .MuiInputLabel-root': {
										color: 'var(--vscode-input-foreground)',
									},
								}}
							/>
						</Box>
					</Box>
				</Paper>

				{/* 编译器配置 */}
				<Paper
					sx={{
						padding: 3,
						backgroundColor: 'var(--vscode-sideBar-background)',
					}}
				>
					<Typography 
						variant="h6" 
						sx={{ 
							marginBottom: 2, 
							color: 'var(--vscode-foreground)',
							fontFamily: 'var(--vscode-font-family)',
							fontSize: 'var(--vscode-font-size)',
							fontWeight: 600,
						}}
					>
						编译器配置
					</Typography>
					<Divider sx={{ marginBottom: 2 }} />
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
							<FormControl sx={{ flex: '1 1 300px' }}>
								<InputLabel sx={{ color: 'var(--vscode-input-foreground)' }}>编译器</InputLabel>
								<Select
									value={config.compiler.compiler || 'g++'}
									onChange={(e) => updateCompiler('compiler', e.target.value)}
									label="编译器"
									sx={{
										backgroundColor: 'var(--vscode-input-background)',
										color: 'var(--vscode-input-foreground)',
										'& .MuiOutlinedInput-notchedOutline': {
											borderColor: 'var(--vscode-input-border)',
										},
									}}
								>
									<MenuItem value="g++">g++</MenuItem>
									<MenuItem value="clang++">clang++</MenuItem>
									<MenuItem value="msvc">MSVC</MenuItem>
								</Select>
							</FormControl>
							<FormControl sx={{ flex: '1 1 300px' }}>
								<InputLabel sx={{ color: 'var(--vscode-input-foreground)' }}>优化级别</InputLabel>
								<Select
									value={String(config.compiler.optimizeLevel ?? 1)}
									onChange={(e) => updateCompiler('optimizeLevel', parseInt(e.target.value, 10))}
									label="优化级别"
									sx={{
										backgroundColor: 'var(--vscode-input-background)',
										color: 'var(--vscode-input-foreground)',
										'& .MuiOutlinedInput-notchedOutline': {
											borderColor: 'var(--vscode-input-border)',
										},
									}}
								>
									<MenuItem value="0">0 - 无优化</MenuItem>
									<MenuItem value="1">1 - 基本优化</MenuItem>
									<MenuItem value="2">2 - 标准优化</MenuItem>
									<MenuItem value="3">3 - 最大优化</MenuItem>
								</Select>
							</FormControl>
						</Box>
						<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
							<FormControl sx={{ flex: '1 1 300px' }}>
								<InputLabel sx={{ color: 'var(--vscode-input-foreground)' }}>日志级别</InputLabel>
								<Select
									value={config.compiler.logLevel || 'info'}
									onChange={(e) => updateCompiler('logLevel', e.target.value)}
									label="日志级别"
									sx={{
										backgroundColor: 'var(--vscode-input-background)',
										color: 'var(--vscode-input-foreground)',
										'& .MuiOutlinedInput-notchedOutline': {
											borderColor: 'var(--vscode-input-border)',
										},
									}}
								>
									<MenuItem value="debug">Debug</MenuItem>
									<MenuItem value="info">Info</MenuItem>
									<MenuItem value="warning">Warning</MenuItem>
									<MenuItem value="error">Error</MenuItem>
								</Select>
							</FormControl>
							<Box sx={{ flex: '1 1 300px', display: 'flex', alignItems: 'center' }}>
								<FormControlLabel
									control={
										<Switch
											checked={config.compiler.releaseMode || false}
											onChange={(e) => updateCompiler('releaseMode', e.target.checked)}
											sx={{
												'& .MuiSwitch-switchBase.Mui-checked': {
													color: 'var(--vscode-button-background)',
												},
												'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
													backgroundColor: 'var(--vscode-button-background)',
												},
											}}
										/>
									}
									label="发布模式"
									sx={{ color: 'var(--vscode-foreground)' }}
								/>
							</Box>
						</Box>
						<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
							<TextField
								label="编译器路径（tiecc路径）"
								value={config.compiler.compilerPath || ''}
								onChange={(e) => updateCompiler('compilerPath', e.target.value)}
								variant="outlined"
								placeholder="例如: ./.Tiecode/tiecc 或绝对路径"
								sx={{
									flex: '1 1 300px',
									minWidth: '300px',
									'& .MuiOutlinedInput-root': {
										backgroundColor: 'var(--vscode-input-background)',
										color: 'var(--vscode-input-foreground)',
									},
									'& .MuiInputLabel-root': {
										color: 'var(--vscode-input-foreground)',
									},
								}}
							/>
							<TextField
								label="TMake工具路径"
								value={config.compiler.tmakePath || ''}
								onChange={(e) => updateCompiler('tmakePath', e.target.value)}
								variant="outlined"
								placeholder="例如: ./tmake.exe"
								sx={{
									flex: '1 1 300px',
									minWidth: '300px',
									'& .MuiOutlinedInput-root': {
										backgroundColor: 'var(--vscode-input-background)',
										color: 'var(--vscode-input-foreground)',
									},
									'& .MuiInputLabel-root': {
										color: 'var(--vscode-input-foreground)',
									},
								}}
							/>
						</Box>
					</Box>
				</Paper>

				{/* 链接器配置 */}
				<Paper
					sx={{
						padding: 3,
						backgroundColor: 'var(--vscode-sideBar-background)',
					}}
				>
					<Typography 
						variant="h6" 
						sx={{ 
							marginBottom: 2, 
							color: 'var(--vscode-foreground)',
							fontFamily: 'var(--vscode-font-family)',
							fontSize: 'var(--vscode-font-size)',
							fontWeight: 600,
						}}
					>
						链接器配置
					</Typography>
					<Divider sx={{ marginBottom: 2 }} />
					<Stack spacing={2}>
						<TextField
							fullWidth
							label="链接库（用逗号分隔）"
							value={(config.linker.libraries || []).join(', ')}
							onChange={(e) => {
								const libraries = e.target.value
									.split(',')
									.map(lib => lib.trim())
									.filter(lib => lib.length > 0);
								updateLinker('libraries', libraries);
							}}
							variant="outlined"
							placeholder="例如: pthread, m, dl"
							multiline
							rows={2}
							sx={{
								'& .MuiOutlinedInput-root': {
									backgroundColor: 'var(--vscode-input-background)',
									color: 'var(--vscode-input-foreground)',
								},
								'& .MuiInputLabel-root': {
									color: 'var(--vscode-input-foreground)',
								},
							}}
						/>
						<TextField
							fullWidth
							label="库搜索路径（用逗号分隔）"
							value={(config.linker.libraryPaths || []).join(', ')}
							onChange={(e) => {
								const paths = e.target.value
									.split(',')
									.map(path => path.trim())
									.filter(path => path.length > 0);
								updateLinker('libraryPaths', paths);
							}}
							variant="outlined"
							placeholder="例如: /usr/lib, ./lib"
							multiline
							rows={2}
							sx={{
								'& .MuiOutlinedInput-root': {
									backgroundColor: 'var(--vscode-input-background)',
									color: 'var(--vscode-input-foreground)',
								},
								'& .MuiInputLabel-root': {
									color: 'var(--vscode-input-foreground)',
								},
							}}
						/>
						<TextField
							fullWidth
							label="链接器参数（用空格分隔）"
							value={(config.linker.linkerArgs || []).join(' ')}
							onChange={(e) => {
								const args = e.target.value
									.split(' ')
									.map(arg => arg.trim())
									.filter(arg => arg.length > 0);
								updateLinker('linkerArgs', args);
							}}
							variant="outlined"
							placeholder="例如: -static -Wl,--as-needed"
							multiline
							rows={2}
							sx={{
								'& .MuiOutlinedInput-root': {
									backgroundColor: 'var(--vscode-input-background)',
									color: 'var(--vscode-input-foreground)',
								},
								'& .MuiInputLabel-root': {
									color: 'var(--vscode-input-foreground)',
								},
							}}
						/>
						<TextField
							fullWidth
							label="链接器路径"
							value={config.linker.linkerPath || ''}
							onChange={(e) => updateLinker('linkerPath', e.target.value)}
							variant="outlined"
							placeholder="例如: ./linker.exe 或绝对路径"
							sx={{
								'& .MuiOutlinedInput-root': {
									backgroundColor: 'var(--vscode-input-background)',
									color: 'var(--vscode-input-foreground)',
								},
								'& .MuiInputLabel-root': {
									color: 'var(--vscode-input-foreground)',
								},
							}}
						/>
					</Stack>
				</Paper>
			</Stack>
		</Box>
	);
};

export default ProjectConfig;

