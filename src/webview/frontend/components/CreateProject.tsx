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
	InputAdornment,
} from '@mui/material';
import { FolderOpen, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { MessageBus } from '../utils/messageBus';

type ProjectPlatform = 'Windows' | 'Linux' | 'Android';

interface ProjectConfig {
	projectName: string;
	version: string;
	outputDir: string;
	outputFile: string;
	platform: ProjectPlatform;
	projectPath: string;
}

const CreateProject: React.FC = (): React.ReactElement => {
	const [config, setConfig] = useState<ProjectConfig>({
		projectName: '',
		version: '1.0.0',
		outputDir: './dist',
		outputFile: '',
		platform: 'Windows',
		projectPath: '',
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [creating, setCreating] = useState(false);
	const [createSuccess, setCreateSuccess] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	// 监听来自后端的消息
	useEffect(() => {
		const handleMessage = (message: any) => {
			if (message.command === 'directoryPicked' || message.command === 'filePicked') {
				const { purpose, path: selectedPath } = message.payload;
				if (purpose === 'projectPath' && selectedPath) {
					setConfig((prev) => ({
						...prev,
						projectPath: selectedPath,
					}));
					// 清除错误
					setErrors((prev) => {
						const newErrors = { ...prev };
						delete newErrors.projectPath;
						return newErrors;
					});
				}
			} else if (message.command === 'projectCreated') {
				setCreating(false);
				setCreateSuccess(true);
				setErrorMessage('');
			} else if (message.command === 'projectCreateError') {
				setCreating(false);
				setErrorMessage(message.payload || '创建项目失败');
			}
		};

		// 使用 MessageBus.onMessage 来监听消息，与 InitialConfig 保持一致
		MessageBus.onMessage(handleMessage);
	}, []);

	// 根据项目名称自动生成输出文件名
	useEffect(() => {
		if (config.projectName && !config.outputFile) {
			const defaultOutputFile =
				config.platform === 'Windows'
					? `${config.projectName}.exe`
					: config.projectName;
			setConfig((prev) => ({
				...prev,
				outputFile: defaultOutputFile,
			}));
		}
	}, [config.projectName, config.platform]);

	const handleInputChange = (field: keyof ProjectConfig, value: string) => {
		setConfig((prev) => ({
			...prev,
			[field]: value,
		}));
		// 清除该字段的错误
		setErrors((prev) => {
			const newErrors = { ...prev };
			delete newErrors[field];
			return newErrors;
		});
	};

	const handleBrowseProjectLocation = () => {
		MessageBus.post({
			command: 'pickDirectory',
			payload: { purpose: 'projectPath' },
		});
	};

	const validateConfig = (): boolean => {
		const newErrors: Record<string, string> = {};

		// 验证项目信息
		if (!config.projectName.trim()) {
			newErrors.projectName = '请输入项目名称';
		}
		if (!config.version.trim()) {
			newErrors.version = '请输入版本号';
		}
		if (!config.outputDir.trim()) {
			newErrors.outputDir = '请输入输出目录';
		}
		if (!config.outputFile.trim()) {
			newErrors.outputFile = '请输入输出文件名';
		}
		// 验证项目位置
		if (!config.projectPath.trim()) {
			newErrors.projectPath = '请选择项目保存位置';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleCreate = async () => {
		if (!validateConfig()) {
			return;
		}

		setCreating(true);
		setCreateSuccess(false);
		setErrorMessage('');

		MessageBus.post({
			command: 'createProject',
			payload: config,
		});
	};

	const handleClose = () => {
		MessageBus.post({
			command: 'closeCreateProject',
		});
	};

	const renderFormContent = () => {
		return (
			<Box sx={{ mt: 3 }}>
				<FormControl fullWidth sx={{ mb: 3 }}>
					<InputLabel>项目平台</InputLabel>
					<Select
						value={config.platform}
						label="项目平台"
						onChange={(e) =>
							handleInputChange('platform', e.target.value)
						}
						disabled={creating}
					>
						<MenuItem value="Windows">Windows</MenuItem>
						<MenuItem value="Linux">Linux (预留)</MenuItem>
						<MenuItem value="Android">Android (预留)</MenuItem>
					</Select>
				</FormControl>

				<TextField
					fullWidth
					label="项目名称"
					value={config.projectName}
					placeholder="输入项目名称"
					onChange={(e) => handleInputChange('projectName', e.target.value)}
					error={!!errors.projectName}
					helperText={errors.projectName || '输入项目名称'}
					disabled={creating}
					sx={{ mb: 3 }}
				/>

				<TextField
					fullWidth
					label="版本号"
					value={config.version}
					placeholder="输入项目版本号，例如：1.0.0"
					onChange={(e) => handleInputChange('version', e.target.value)}
					error={!!errors.version}
					helperText={errors.version || '输入项目版本号，例如：1.0.0'}
					disabled={creating}
					sx={{ mb: 3 }}
				/>

				<TextField
					fullWidth
					label="输出目录"
					value={config.outputDir}
					placeholder="编译输出目录，例如：./dist"
					onChange={(e) => handleInputChange('outputDir', e.target.value)}
					error={!!errors.outputDir}
					helperText={errors.outputDir || '编译输出目录，例如：./dist'}
					disabled={creating}
					sx={{ mb: 3 }}
				/>

				<TextField
					fullWidth
					label="输出文件名"
					value={config.outputFile}
					placeholder={`输出文件名${config.platform === 'Windows' ? '（例如：程序.exe）' : ''}`}
					onChange={(e) => handleInputChange('outputFile', e.target.value)}
					error={!!errors.outputFile}
					helperText={
						errors.outputFile ||
						`输出文件名${config.platform === 'Windows' ? '（例如：程序.exe）' : ''}`
					}
					disabled={creating}
					sx={{ mb: 3 }}
				/>

				<TextField
					fullWidth
					label="项目保存位置"
					value={config.projectPath || ''}
					placeholder="请选择项目保存位置"
					error={!!errors.projectPath}
					helperText={errors.projectPath || '选择项目保存的文件夹'}
					InputProps={{
						readOnly: true,
						endAdornment: (
							<InputAdornment position="end">
								<Button
									startIcon={<FolderOpen />}
									onClick={handleBrowseProjectLocation}
									disabled={creating}
									size="small"
								>
									浏览
								</Button>
							</InputAdornment>
						),
					}}
					sx={{ mb: 3 }}
				/>

				{config.projectPath && (
					<Alert severity="info" sx={{ mb: 2 }}>
						项目将创建在: {config.projectPath}
					</Alert>
				)}
			</Box>
		);
	};

	if (createSuccess) {
		return (
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					minHeight: '400px',
					p: 3,
				}}
			>
				<CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
				<Typography variant="h5" gutterBottom>
					项目创建成功！
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
					项目已成功创建在: {config.projectPath}
				</Typography>
				<Button variant="contained" onClick={handleClose}>
					关闭
				</Button>
			</Box>
		);
	}

	return (
		<Box sx={{ width: '100%', p: 3 }}>
			<Paper sx={{ p: 3 }}>
				<Typography variant="h5" gutterBottom>
					创建新项目
				</Typography>

				{errorMessage && (
					<Alert severity="error" sx={{ mt: 3, mb: 2 }}>
						{errorMessage}
					</Alert>
				)}

				{renderFormContent()}

				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
					<Button
						variant="contained"
						onClick={handleCreate}
						disabled={creating}
						startIcon={creating ? <CircularProgress size={16} /> : null}
					>
						{creating ? '创建中...' : '创建项目'}
					</Button>
				</Box>
			</Paper>
		</Box>
	);
};

export default CreateProject;

