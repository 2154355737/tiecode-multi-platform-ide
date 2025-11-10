import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	TextField,
	Button,
	Paper,
	Stepper,
	Step,
	StepLabel,
	Alert,
	CircularProgress,
	InputAdornment,
	Tooltip,
} from '@mui/material';
import { FolderOpen, CheckCircle, Error as ErrorIcon, Warning, Info } from '@mui/icons-material';
import { MessageBus } from '../utils/messageBus';

interface CompilerConfig {
	windowsTieccPath?: string;
	windowsTmakePath?: string;
	androidTieccPath?: string;
	linuxTieccPath?: string;
}

interface PathValidation {
	valid: boolean;
	error?: string;
	validating?: boolean;
}

const InitialConfig: React.FC = (): React.ReactElement => {
	const [config, setConfig] = useState<CompilerConfig>({});
	const [activeStep, setActiveStep] = useState(0);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [saving, setSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [validations, setValidations] = useState<Record<string, PathValidation>>({});
	const [loading, setLoading] = useState(true);

	const steps = ['Windows 配置', '预留配置'];

	// 加载已有配置
	useEffect(() => {
		MessageBus.post({ command: 'checkConfig' });
	}, []);

	// 验证路径
	const validatePath = (purpose: string, pathToValidate: string) => {
		if (!pathToValidate) {
			setValidations((prev) => ({
				...prev,
				[purpose]: { valid: false, error: undefined, validating: false }
			}));
			return;
		}

		setValidations((prev) => ({
			...prev,
			[purpose]: { valid: false, error: undefined, validating: true }
		}));

		MessageBus.post({
			command: 'validatePath',
			payload: { purpose, path: pathToValidate }
		});
	};

	// 监听来自后端的消息
	useEffect(() => {
		const handleMessage = (message: any) => {
			if (message.command === 'configStatus') {
				const { isConfigured, config: existingConfig } = message.payload;
				if (existingConfig && !isConfigured) {
					// 如果已有配置但标记为未配置，可能是编辑模式
					setConfig(existingConfig);
					// 验证已有路径
					if (existingConfig.windowsTieccPath) {
						validatePath('windowsTieccPath', existingConfig.windowsTieccPath);
					}
					if (existingConfig.windowsTmakePath) {
						validatePath('windowsTmakePath', existingConfig.windowsTmakePath);
					}
				}
				setLoading(false);
			} else if (message.command === 'directoryPicked' || message.command === 'filePicked') {
				const { purpose, path: selectedPath } = message.payload;
				if (selectedPath) {
					setConfig((prev) => ({
						...prev,
						[purpose]: selectedPath,
					}));
					// 清除该字段的错误
					setErrors((prev) => {
						const newErrors = { ...prev };
						delete newErrors[purpose];
						return newErrors;
					});
					// 验证新选择的路径
					validatePath(purpose, selectedPath);
				}
			} else if (message.command === 'pathValidated') {
				const { purpose, valid, error } = message.payload;
				setValidations((prev) => ({
					...prev,
					[purpose]: { valid, error, validating: false }
				}));
				if (!valid && error) {
					setErrors((prev) => ({
						...prev,
						[purpose]: error
					}));
				} else {
					setErrors((prev) => {
						const newErrors = { ...prev };
						delete newErrors[purpose];
						return newErrors;
					});
				}
			} else if (message.command === 'configSaved') {
				setSaving(false);
				setSaveSuccess(true);
				setTimeout(() => {
					// 通知后端配置完成，可以关闭或刷新界面
					MessageBus.post({
						command: 'configCompleted',
					});
				}, 1500);
			} else if (message.command === 'configSaveError') {
				setSaving(false);
				setErrors((prev) => ({
					...prev,
					_save: message.payload || '保存配置失败',
				}));
			}
		};

		MessageBus.onMessage(handleMessage);
	}, []);

	const handleBrowse = (purpose: string) => {
		// 根据purpose决定是选择文件还是目录
		if (purpose === 'windowsTmakePath') {
			// tmake 选择文件
			MessageBus.post({
				command: 'pickFile',
				payload: { 
					purpose,
					filters: { '可执行文件': ['exe'], '所有文件': ['*'] }
				},
			});
		} else if (purpose === 'windowsTieccPath') {
			// tiecc 选择目录
			MessageBus.post({
				command: 'pickDirectory',
				payload: { purpose },
			});
		} else {
			// 其他情况选择目录
			MessageBus.post({
				command: 'pickDirectory',
				payload: { purpose },
			});
		}
	};

	const validateWindowsConfig = (): boolean => {
		const newErrors: Record<string, string> = {};
		
		if (!config.windowsTieccPath) {
			newErrors.windowsTieccPath = '请选择 tiecc 编译器目录';
		} else {
			const validation = validations.windowsTieccPath;
			if (validation && !validation.valid) {
				newErrors.windowsTieccPath = validation.error || 'tiecc 路径无效';
			}
		}
		
		if (!config.windowsTmakePath) {
			newErrors.windowsTmakePath = '请选择 tmake.exe 文件';
		} else {
			const validation = validations.windowsTmakePath;
			if (validation && !validation.valid) {
				newErrors.windowsTmakePath = validation.error || 'tmake 路径无效';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleNext = () => {
		if (activeStep === 0) {
			if (validateWindowsConfig()) {
				setActiveStep(1);
			}
		}
	};

	const handleBack = () => {
		setActiveStep(activeStep - 1);
	};

	const handleSave = () => {
		if (validateWindowsConfig()) {
			setSaving(true);
			setSaveSuccess(false);
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors._save;
				return newErrors;
			});

			MessageBus.post({
				command: 'saveConfig',
				payload: config,
			});
		}
	};

	const getValidationIcon = (purpose: string) => {
		const validation = validations[purpose];
		if (!validation || validation.validating) {
			return null;
		}
		if (validation.valid) {
			return <CheckCircle color="success" sx={{ fontSize: 20, ml: 1 }} />;
		}
		if (validation.error) {
			return (
				<Tooltip title={validation.error}>
					<ErrorIcon color="error" sx={{ fontSize: 20, ml: 1 }} />
				</Tooltip>
			);
		}
		return null;
	};

	const renderWindowsConfig = () => (
		<Box sx={{ mt: 2 }}>
			<Typography variant="h6" gutterBottom>
				Windows 编译器配置
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
				请配置 Windows 平台的 tiecc 核心编译器和 tmake 编译工具链位置
			</Typography>

			<Alert severity="info" icon={<Info />} sx={{ mb: 2 }}>
				<Box>
					<Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
						配置说明：
					</Typography>
					<Typography variant="body2" component="div">
						• <strong>tiecc 核心编译器</strong>：选择包含 tiecc 编译器的目录（通常是包含 tiecc.exe 的文件夹）
					</Typography>
					<Typography variant="body2" component="div">
						• <strong>tmake 编译工具链</strong>：选择 tmake.exe 可执行文件
					</Typography>
				</Box>
			</Alert>

			<Box sx={{ mb: 2 }}>
				<TextField
					fullWidth
					label="tiecc 核心编译器位置"
					value={config.windowsTieccPath || ''}
					placeholder="请选择 tiecc 编译器目录"
					error={!!errors.windowsTieccPath}
					helperText={
						errors.windowsTieccPath || 
						(validations.windowsTieccPath?.validating ? '正在验证路径...' : 
						validations.windowsTieccPath?.valid ? '路径有效' : 
						'选择 tiecc 编译器所在目录（必须是一个文件夹）')
					}
					InputProps={{
						readOnly: true,
						sx: {
							fontSize: '14px',
						},
						endAdornment: (
							<InputAdornment position="end">
								<Box sx={{ display: 'flex', alignItems: 'center' }}>
									{getValidationIcon('windowsTieccPath')}
									{validations.windowsTieccPath?.validating && (
										<CircularProgress size={16} sx={{ ml: 1 }} />
									)}
									<Button
										startIcon={<FolderOpen />}
										onClick={() => handleBrowse('windowsTieccPath')}
										size="small"
									>
										浏览
									</Button>
								</Box>
							</InputAdornment>
						),
					}}
					inputProps={{
						style: {
							fontSize: '14px',
							textAlign: 'left',
						},
					}}
				/>
			</Box>

			<Box sx={{ mb: 2 }}>
				<TextField
					fullWidth
					label="tmake 编译工具链位置"
					value={config.windowsTmakePath || ''}
					placeholder="请选择 tmake.exe 文件"
					error={!!errors.windowsTmakePath}
					helperText={
						errors.windowsTmakePath || 
						(validations.windowsTmakePath?.validating ? '正在验证路径...' : 
						validations.windowsTmakePath?.valid ? '路径有效' : 
						'选择 tmake.exe 可执行文件（必须是 .exe 文件）')
					}
					InputProps={{
						readOnly: true,
						sx: {
							fontSize: '14px',
						},
						endAdornment: (
							<InputAdornment position="end">
								<Box sx={{ display: 'flex', alignItems: 'center' }}>
									{getValidationIcon('windowsTmakePath')}
									{validations.windowsTmakePath?.validating && (
										<CircularProgress size={16} sx={{ ml: 1 }} />
									)}
									<Button
										startIcon={<FolderOpen />}
										onClick={() => handleBrowse('windowsTmakePath')}
										size="small"
									>
										浏览
									</Button>
								</Box>
							</InputAdornment>
						),
					}}
					inputProps={{
						style: {
							fontSize: '14px',
							textAlign: 'left',
						},
					}}
				/>
			</Box>
		</Box>
	);

	const renderReservedConfig = () => (
		<Box sx={{ mt: 2 }}>
			<Typography variant="h6" gutterBottom>
				预留配置
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
				以下配置为预留项，可在后续版本中使用
			</Typography>

			<Box>
				<TextField
					fullWidth
					label="Android 核心编译器位置（预留）"
					value={config.androidTieccPath || ''}
					placeholder="Android 编译器路径（可选）"
					InputProps={{
						readOnly: true,
						endAdornment: (
							<InputAdornment position="end">
								<Button
									startIcon={<FolderOpen />}
									onClick={() => handleBrowse('androidTieccPath')}
									size="small"
									disabled
								>
									浏览
								</Button>
							</InputAdornment>
						),
					}}
					disabled
				/>
			</Box>

			<Box>
				<TextField
					fullWidth
					label="Linux 核心编译器位置（预留）"
					value={config.linuxTieccPath || ''}
					placeholder="Linux 编译器路径（可选）"
					InputProps={{
						readOnly: true,
						endAdornment: (
							<InputAdornment position="end">
								<Button
									startIcon={<FolderOpen />}
									onClick={() => handleBrowse('linuxTieccPath')}
									size="small"
									disabled
								>
									浏览
								</Button>
							</InputAdornment>
						),
					}}
					disabled
				/>
			</Box>
		</Box>
	);

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
					backgroundColor: 'background.default',
				}}
			>
				<CircularProgress />
				<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
					正在加载配置...
				</Typography>
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
				alignItems: 'center',
				justifyContent: 'center',
				padding: 2, // 8px
				backgroundColor: 'background.default',
			}}
		>
			<Paper
				elevation={3}
				sx={{
					width: '100%',
					maxWidth: 800,
					// padding 已在主题中设置
				}}
			>
				<Typography variant="h4" component="h1" gutterBottom align="center">
					欢迎使用 Tiecode IDE
				</Typography>
				<Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
					首次使用需要配置编译器路径
				</Typography>

				<Stepper activeStep={activeStep} sx={{ mb: 3 }}>
					{steps.map((label) => (
						<Step key={label}>
							<StepLabel>{label}</StepLabel>
						</Step>
					))}
				</Stepper>

				{errors._save && (
					<Alert severity="error" sx={{ mb: 2 }} icon={<ErrorIcon />}>
						{errors._save}
					</Alert>
				)}

				{saveSuccess && (
					<Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
						配置保存成功！
					</Alert>
				)}

				{activeStep === 0 && renderWindowsConfig()}
				{activeStep === 1 && renderReservedConfig()}

				<Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
					<Button
						disabled={activeStep === 0}
						onClick={handleBack}
					>
						上一步
					</Button>
					<Box>
						{activeStep === steps.length - 1 ? (
							<Button
								variant="contained"
								onClick={handleSave}
								disabled={saving || saveSuccess}
								startIcon={saving ? <CircularProgress size={16} /> : <CheckCircle />}
							>
								{saving ? '保存中...' : saveSuccess ? '已保存' : '完成配置'}
							</Button>
						) : (
							<Button variant="contained" onClick={handleNext}>
								下一步
							</Button>
						)}
					</Box>
				</Box>
			</Paper>
		</Box>
	);
};

export default InitialConfig;

