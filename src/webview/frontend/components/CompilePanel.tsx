import React, { useState, useEffect } from 'react';
import {
	Paper,
	Typography,
	TextField,
	FormControlLabel,
	Checkbox,
	Button,
	Box,
	Chip,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Collapse,
	Divider,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { CompilePlatform, CompileStatus, CompileConfig, LogLevel } from '../types';
import { Icons } from './Icons';

interface CompilePanelProps {
	platform: CompilePlatform;
	status: CompileStatus;
	onCompile: (config: CompileConfig) => void;
	projectConfig?: any;
}

const CompilePanel: React.FC<CompilePanelProps> = ({
	platform,
	status,
	onCompile,
	projectConfig
}) => {
	const [outputPath, setOutputPath] = useState<string>(projectConfig?.defaultOutputPath || '');
	const [packageName, setPackageName] = useState<string>(projectConfig?.defaultPackage || '');
	const [releaseMode, setReleaseMode] = useState<boolean>(projectConfig?.defaultRelease || false);
	const [hardMode, setHardMode] = useState<boolean>(projectConfig?.defaultHardMode || false);
	const [optimize, setOptimize] = useState<number>(projectConfig?.defaultOptimize ?? 1);
	const [logLevel, setLogLevel] = useState<LogLevel>(projectConfig?.defaultLogLevel || 'info');
	const [lineMap, setLineMap] = useState<string>(projectConfig?.defaultLineMap || '');
	const [disableLint, setDisableLint] = useState<string>(projectConfig?.defaultDisableLint?.join(', ') || '');
	const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

	useEffect(() => {
		if (projectConfig) {
			if (projectConfig.defaultOutputPath) setOutputPath(projectConfig.defaultOutputPath);
			if (projectConfig.defaultPackage) setPackageName(projectConfig.defaultPackage);
			if (projectConfig.defaultRelease !== undefined) setReleaseMode(projectConfig.defaultRelease);
			if (projectConfig.defaultHardMode !== undefined) setHardMode(projectConfig.defaultHardMode);
			if (projectConfig.defaultOptimize !== undefined) setOptimize(projectConfig.defaultOptimize);
			if (projectConfig.defaultLogLevel) setLogLevel(projectConfig.defaultLogLevel);
			if (projectConfig.defaultLineMap) setLineMap(projectConfig.defaultLineMap);
			if (projectConfig.defaultDisableLint) setDisableLint(projectConfig.defaultDisableLint.join(', '));
		}
	}, [projectConfig]);

	const handleCompile = () => {
		const disableLintList = disableLint
			.split(',')
			.map(item => item.trim())
			.filter(item => item.length > 0);

		const config: CompileConfig = {
			platform,
			outputPath: outputPath || undefined,
			package: packageName || undefined,
			release: releaseMode,
			hardMode: hardMode || undefined,
			optimize: optimize !== 1 ? optimize : undefined,
			logLevel: logLevel,
			disableLint: disableLintList.length > 0 ? disableLintList : undefined,
			lineMap: lineMap || undefined
		};
		onCompile(config);
	};

	const getStatusText = () => {
		switch (status) {
			case 'idle': return '就绪';
			case 'compiling': return '编译中...';
			case 'success': return '编译成功';
			case 'error': return '编译失败';
			default: return '未知状态';
		}
	};

	const getStatusColor = (): 'default' | 'primary' | 'success' | 'error' => {
		switch (status) {
			case 'idle': return 'default';
			case 'compiling': return 'primary';
			case 'success': return 'success';
			case 'error': return 'error';
			default: return 'default';
		}
	};

	const isDisabled = status === 'compiling';

	return (
		<Paper 
			sx={{ 
				height: '100%', 
				width: '100%',
				display: 'flex', 
				flexDirection: 'column',
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: 1, // 4px - VSCode标准圆角
				overflow: 'hidden',
			}}
		>
			{/* 标题栏 */}
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '10px 12px', // 统一使用4px基础单位
					borderBottom: '1px solid',
					borderColor: 'divider',
					minHeight: '40px',
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
					<Icons.SettingsGear size={16} />
					<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px' }}>
						编译配置
					</Typography>
				</Box>
				{projectConfig && (
					<Chip 
						label="已加载配置" 
						size="small" 
						sx={{ 
							height: '20px', 
							fontSize: '11px',
							padding: '0 6px',
						}}
					/>
				)}
			</Box>

			{/* 内容区 */}
			<Box 
				sx={{ 
					flex: 1, 
					overflow: 'auto', 
					padding: '12px', // 统一12px内边距
					display: 'flex', 
					flexDirection: 'column', 
					gap: '12px', // 统一12px间距
				}}
			>
				{/* 状态信息 */}
				<Box 
					sx={{ 
						display: 'flex', 
						flexDirection: 'column', 
						gap: '8px', // 8px间距
						paddingBottom: '8px',
					}}
				>
					<Box 
						sx={{ 
							display: 'flex', 
							alignItems: 'center', 
							justifyContent: 'space-between',
							minHeight: '24px',
						}}
					>
						<Typography 
							variant="body2" 
							color="text.secondary" 
							sx={{ fontSize: '12px', lineHeight: '20px' }}
						>
							目标平台:
						</Typography>
						<Chip 
							label={platform} 
							size="small" 
							sx={{ 
								height: '20px', 
								fontSize: '12px',
								padding: '0 8px',
							}}
						/>
					</Box>
					<Box 
						sx={{ 
							display: 'flex', 
							alignItems: 'center', 
							justifyContent: 'space-between',
							minHeight: '24px',
						}}
					>
						<Typography 
							variant="body2" 
							color="text.secondary" 
							sx={{ fontSize: '12px', lineHeight: '20px' }}
						>
							编译状态:
						</Typography>
						<Chip
							label={getStatusText()}
							color={getStatusColor()}
							size="small"
							sx={{
								height: '20px',
								fontSize: '12px',
								padding: '0 8px',
								animation: status === 'compiling' ? 'pulse 1.5s ease-in-out infinite' : 'none',
								'@keyframes pulse': {
									'0%, 100%': { opacity: 1 },
									'50%': { opacity: 0.6 },
								},
							}}
						/>
					</Box>
				</Box>

				<Divider sx={{ my: 0 }} />

				{/* 配置表单 */}
				<Box 
					sx={{ 
						display: 'flex', 
						flexDirection: 'column', 
						gap: '12px', // 统一12px间距
					}}
				>
					<TextField
						label="输出路径 (可选)"
						value={outputPath}
						onChange={(e) => setOutputPath(e.target.value)}
						placeholder="留空使用默认路径"
						disabled={isDisabled}
						fullWidth
						size="small"
						sx={{ margin: 0 }}
					/>

					<TextField
						label="包名 (可选)"
						value={packageName}
						onChange={(e) => setPackageName(e.target.value)}
						placeholder="例如: 结绳.中文"
						disabled={isDisabled}
						fullWidth
						size="small"
						sx={{ margin: 0 }}
					/>

					<Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
						<FormControlLabel
							control={
								<Checkbox
									checked={releaseMode}
									onChange={(e) => setReleaseMode(e.target.checked)}
									disabled={isDisabled}
									size="small"
									sx={{ padding: '4px' }}
								/>
							}
							label={
								<Typography variant="body2" sx={{ fontSize: '13px', lineHeight: '20px' }}>
									发布模式 (默认: 调试模式)
								</Typography>
							}
							sx={{ margin: 0 }}
						/>

						<FormControlLabel
							control={
								<Checkbox
									checked={hardMode}
									onChange={(e) => setHardMode(e.target.checked)}
									disabled={isDisabled}
									size="small"
									sx={{ padding: '4px' }}
								/>
							}
							label={
								<Typography variant="body2" sx={{ fontSize: '13px', lineHeight: '20px' }}>
									硬输出模式
								</Typography>
							}
							sx={{ margin: 0 }}
						/>
					</Box>

					<Button
						variant="text"
						onClick={() => setShowAdvanced(!showAdvanced)}
						disabled={isDisabled}
						startIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
						size="small"
						sx={{ 
							alignSelf: 'flex-start',
							textTransform: 'none',
							fontSize: '12px',
							padding: '4px 8px',
							minWidth: 'auto',
							marginTop: '4px',
						}}
					>
						{showAdvanced ? '隐藏高级选项' : '显示高级选项'}
					</Button>

					<Collapse in={showAdvanced}>
						<Box 
							sx={{ 
								display: 'flex', 
								flexDirection: 'column', 
								gap: '12px', // 统一12px间距
								paddingTop: '8px',
								paddingLeft: '4px',
							}}
						>
							<TextField
								label="优化级别 (0-3)"
								type="number"
								inputProps={{ min: 0, max: 3 }}
								value={optimize}
								onChange={(e) => setOptimize(parseInt(e.target.value) || 1)}
								disabled={isDisabled}
								fullWidth
								size="small"
								sx={{ margin: 0 }}
							/>

							<FormControl fullWidth size="small" disabled={isDisabled} sx={{ margin: 0 }}>
								<InputLabel>日志级别</InputLabel>
								<Select
									value={logLevel}
									label="日志级别"
									onChange={(e) => setLogLevel(e.target.value as LogLevel)}
								>
									<MenuItem value="debug">Debug</MenuItem>
									<MenuItem value="info">Info</MenuItem>
									<MenuItem value="warning">Warning</MenuItem>
									<MenuItem value="error">Error</MenuItem>
								</Select>
							</FormControl>

							<TextField
								label="禁用lint检查 (可选，多个用逗号分隔)"
								value={disableLint}
								onChange={(e) => setDisableLint(e.target.value)}
								placeholder="例如: lint1, lint2"
								disabled={isDisabled}
								fullWidth
								size="small"
								sx={{ margin: 0 }}
							/>

							<TextField
								label="行号表路径 (可选)"
								value={lineMap}
								onChange={(e) => setLineMap(e.target.value)}
								placeholder="行号表输出路径"
								disabled={isDisabled}
								fullWidth
								size="small"
								sx={{ margin: 0 }}
							/>
						</Box>
					</Collapse>
				</Box>

				{/* 编译按钮 */}
				<Box 
					sx={{ 
						mt: 'auto', 
						paddingTop: '12px',
						borderTop: '1px solid',
						borderColor: 'divider',
					}}
				>
					<Button
						variant="contained"
						fullWidth
						onClick={handleCompile}
						disabled={isDisabled}
						size="medium"
						startIcon={status === 'compiling' ? <Icons.SyncSpin size={18} /> : <Icons.Rocket size={18} />}
						sx={{
							textTransform: 'none',
							fontSize: '13px',
							padding: '8px 16px',
							minHeight: '32px',
						}}
					>
						{status === 'compiling' ? '编译中...' : '开始编译'}
					</Button>
				</Box>
			</Box>
		</Paper>
	);
};

export default CompilePanel;
