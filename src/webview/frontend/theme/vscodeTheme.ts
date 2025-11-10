import { createTheme, Theme } from '@mui/material/styles';

/**
 * 获取VSCode CSS变量的辅助函数
 */
const getVSCodeVar = (varName: string, fallback: string = '#000000'): string => {
	if (typeof window !== 'undefined' && typeof document !== 'undefined') {
		try {
			const root = document.documentElement;
			const value = getComputedStyle(root).getPropertyValue(varName).trim();
			return value || fallback;
		} catch {
			return fallback;
		}
	}
	return fallback;
};

/**
 * 创建基于VSCode CSS变量的Material-UI主题
 */
export const createVSCodeTheme = (): Theme => {
	const foreground = getVSCodeVar('--vscode-foreground', '#cccccc');
	const background = getVSCodeVar('--vscode-editor-background', '#1e1e1e');
	const sideBarBackground = getVSCodeVar('--vscode-sideBar-background', '#252526');
	const panelBorder = getVSCodeVar('--vscode-panel-border', '#3e3e42');
	const buttonBackground = getVSCodeVar('--vscode-button-background', '#0e639c');
	const buttonForeground = getVSCodeVar('--vscode-button-foreground', '#ffffff');
	const buttonHoverBackground = getVSCodeVar('--vscode-button-hoverBackground', '#1177bb');
	const focusBorder = getVSCodeVar('--vscode-focusBorder', '#007acc');
	const descriptionForeground = getVSCodeVar('--vscode-descriptionForeground', '#989898');
	const errorForeground = getVSCodeVar('--vscode-errorForeground', '#f48771');

	const fontFamily = getVSCodeVar('--vscode-font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
	const fontSize = getVSCodeVar('--vscode-font-size', '13px');
	const fontWeight = getVSCodeVar('--vscode-font-weight', 'normal');
	const inputBackground = getVSCodeVar('--vscode-input-background', '#3c3c3c');
	const inputForeground = getVSCodeVar('--vscode-input-foreground', '#cccccc');
	const inputBorder = getVSCodeVar('--vscode-input-border', '#3e3e42');
	const widgetShadow = getVSCodeVar('--vscode-widget-shadow', '#000000');
	const textLinkForeground = getVSCodeVar('--vscode-textLink-foreground', '#3794ff');
	const successForeground = getVSCodeVar('--vscode-testing-iconPassed', '#89d185');
	const warningForeground = getVSCodeVar('--vscode-testing-iconQueued', '#cca700');
	
	// VS Code 标准间距和尺寸
	const fontSizeNum = parseInt(fontSize) || 13;
	const baseSpacing = 4; // VS Code 使用 4px 作为基础间距单位
	const buttonHeight = 22; // VS Code 按钮标准高度
	const inputHeight = 26; // VS Code 输入框标准高度
	const iconSize = 16; // VS Code 图标标准大小

	return createTheme({
		palette: {
			mode: 'dark',
			primary: {
				main: buttonBackground,
				light: buttonHoverBackground,
				contrastText: buttonForeground,
			},
			error: {
				main: errorForeground,
			},
			success: {
				main: successForeground || '#89d185',
			},
			warning: {
				main: warningForeground || '#cca700',
			},
			background: {
				default: background,
				paper: sideBarBackground,
			},
			text: {
				primary: foreground,
				secondary: descriptionForeground,
			},
			divider: panelBorder,
			action: {
				active: focusBorder,
				hover: buttonHoverBackground,
			},
		},
		typography: {
			fontFamily: fontFamily,
			fontSize: fontSizeNum,
			h1: {
				fontSize: `${fontSizeNum * 1.5}px`,
				fontWeight: 600,
				lineHeight: 1.2,
			},
			h2: {
				fontSize: `${fontSizeNum * 1.3}px`,
				fontWeight: 600,
				lineHeight: 1.3,
			},
			h3: {
				fontSize: `${fontSizeNum * 1.15}px`,
				fontWeight: 600,
				lineHeight: 1.4,
			},
			h4: {
				fontSize: `${fontSizeNum * 1.1}px`,
				fontWeight: 600,
				lineHeight: 1.4,
			},
			h5: {
				fontSize: `${fontSizeNum}px`,
				fontWeight: 600,
				lineHeight: 1.5,
			},
			h6: {
				fontSize: `${fontSizeNum}px`,
				fontWeight: 600,
				lineHeight: 1.5,
			},
			body1: {
				fontSize: `${fontSizeNum}px`,
				fontWeight: fontWeight === 'bold' ? 700 : 400,
				lineHeight: 1.5,
			},
			body2: {
				fontSize: `${fontSizeNum * 0.92}px`,
				fontWeight: fontWeight === 'bold' ? 700 : 400,
				lineHeight: 1.5,
			},
			button: {
				fontSize: `${fontSizeNum}px`,
				fontWeight: 400,
				textTransform: 'none',
			},
		},
		shape: {
			borderRadius: 2, // VS Code 使用较小的圆角
		},
		spacing: baseSpacing, // 使用 4px 作为基础间距单位
		components: {
			MuiTextField: {
				styleOverrides: {
					root: {
						marginBottom: baseSpacing * 2, // 16px 间距
					'& .MuiOutlinedInput-root': {
						backgroundColor: inputBackground,
						color: inputForeground,
						fontSize: `${fontSizeNum + 1}px`, // 增大字体到 14px
						minHeight: `${inputHeight}px`,
						padding: `${baseSpacing * 1.5}px ${baseSpacing * 1.5}px`, // 6px 上下左右
						display: 'flex',
						alignItems: 'center',
							'& fieldset': {
								borderColor: inputBorder,
								borderWidth: '1px',
							},
							'&:hover fieldset': {
								borderColor: focusBorder,
							},
							'&.Mui-focused fieldset': {
								borderColor: focusBorder,
								borderWidth: '1px',
							},
						'& .MuiInputAdornment-root': {
							marginLeft: 0,
							marginRight: baseSpacing * 1, // 4px
						},
							'& .MuiInputBase-input': {
								flex: 1,
								display: 'flex',
								alignItems: 'center',
								minHeight: 'auto',
							},
						},
						'& .MuiInputLabel-root': {
							color: descriptionForeground,
							fontSize: `${fontSizeNum}px`,
							'&.Mui-focused': {
								color: focusBorder,
							},
							'&.MuiInputLabel-shrink': {
								fontSize: `${fontSizeNum * 0.85}px`,
							},
						},
					'& .MuiInputBase-input': {
						padding: `${baseSpacing * 1.5}px ${baseSpacing * 2.5}px`, // 6px 上下, 10px 左右
						fontSize: `${fontSizeNum + 1}px`, // 增大字体到 14px
						textAlign: 'left', // 文本左对齐
						display: 'flex',
						alignItems: 'center',
						minHeight: 'auto',
						lineHeight: 1.5,
						'&::placeholder': {
							textAlign: 'left', // placeholder 左对齐
							opacity: 0.6, // placeholder 透明度
							display: 'flex',
							alignItems: 'center',
						},
						'&.MuiInputBase-inputAdornedEnd': {
							paddingRight: baseSpacing * 1.5, // 6px，因为按钮在 endAdornment 中
						},
					},
						'& .MuiFormHelperText-root': {
							marginTop: baseSpacing * 1.5, // 6px
							marginLeft: 0,
							marginRight: 0,
							fontSize: `${fontSizeNum * 0.85}px`,
							color: descriptionForeground,
							'&.Mui-error': {
								color: errorForeground,
							},
						},
					},
				},
			},
			MuiButton: {
				styleOverrides: {
					root: {
						textTransform: 'none',
						fontSize: `${fontSizeNum}px`,
						fontWeight: 400,
						minHeight: `${buttonHeight}px`,
						height: `${buttonHeight}px`,
						padding: `${baseSpacing * 0.5}px ${baseSpacing * 2}px`, // 2px 8px
						lineHeight: 1.4,
						'&:hover': {
							backgroundColor: buttonHoverBackground,
						},
						'& .MuiButton-startIcon': {
							marginRight: baseSpacing * 0.5, // 2px
							marginLeft: 0,
							'& > *:nth-of-type(1)': {
								fontSize: `${iconSize}px`,
							},
						},
						'& .MuiButton-endIcon': {
							marginLeft: baseSpacing * 0.5, // 2px
							marginRight: 0,
							'& > *:nth-of-type(1)': {
								fontSize: `${iconSize}px`,
							},
						},
						'&.MuiButton-sizeSmall': {
							minHeight: `${buttonHeight - 2}px`,
							height: `${buttonHeight - 2}px`,
							padding: `${baseSpacing * 0.25}px ${baseSpacing * 1.5}px`, // 1px 6px
							fontSize: `${fontSizeNum * 0.92}px`,
							'& .MuiButton-startIcon': {
								marginRight: baseSpacing * 0.25, // 1px
								'& > *:nth-of-type(1)': {
									fontSize: `${iconSize - 2}px`,
								},
							},
							'& .MuiButton-endIcon': {
								marginLeft: baseSpacing * 0.25, // 1px
								'& > *:nth-of-type(1)': {
									fontSize: `${iconSize - 2}px`,
								},
							},
						},
					},
					contained: {
						backgroundColor: buttonBackground,
						color: buttonForeground,
						padding: `${baseSpacing * 0.5}px ${baseSpacing * 2}px`, // 2px 8px
						'&:hover': {
							backgroundColor: buttonHoverBackground,
						},
						'&.MuiButton-sizeSmall': {
							padding: `${baseSpacing * 0.25}px ${baseSpacing * 1.5}px`, // 1px 6px
						},
					},
					outlined: {
						borderColor: inputBorder,
						borderWidth: '1px',
						padding: `${baseSpacing * 0.5 - 1}px ${baseSpacing * 2 - 1}px`, // 考虑边框
						'&.MuiButton-sizeSmall': {
							padding: `${baseSpacing * 0.25 - 1}px ${baseSpacing * 1.5 - 1}px`,
						},
					},
					text: {
						padding: `${baseSpacing * 0.5}px ${baseSpacing * 1.5}px`, // 2px 6px
						backgroundColor: 'transparent',
						'&:hover': {
							backgroundColor: buttonHoverBackground,
						},
						'&:active': {
							backgroundColor: buttonBackground,
						},
						'&:focus': {
							backgroundColor: buttonHoverBackground,
							outline: `1px solid ${focusBorder}`,
							outlineOffset: '1px',
						},
						'&.MuiButton-sizeSmall': {
							padding: `${baseSpacing * 0.25}px ${baseSpacing * 1}px`, // 1px 4px
						},
					},
				},
			},
			MuiPaper: {
				styleOverrides: {
					root: {
						backgroundColor: sideBarBackground,
						boxShadow: `0 2px 8px ${widgetShadow}`,
						padding: `${baseSpacing * 3}px`, // 12px 内边距
					},
				},
			},
			MuiStepper: {
				styleOverrides: {
					root: {
						padding: `${baseSpacing * 2}px 0`, // 8px 上下
						'& .MuiStepLabel-root .MuiStepLabel-label': {
							color: foreground,
							fontSize: `${fontSizeNum}px`,
						},
						'& .MuiStepLabel-root .MuiStepLabel-label.Mui-active': {
							color: focusBorder,
						},
						'& .MuiStepLabel-root .MuiStepLabel-label.Mui-completed': {
							color: foreground,
						},
						'& .MuiStepIcon-root': {
							fontSize: `${iconSize + 4}px`, // 20px
						},
					},
				},
			},
			MuiAlert: {
				styleOverrides: {
					root: {
						backgroundColor: inputBackground,
						padding: `${baseSpacing * 1.5}px ${baseSpacing * 2}px`, // 6px 8px
						fontSize: `${fontSizeNum}px`,
						borderRadius: '2px',
					},
					icon: {
						fontSize: `${iconSize}px`,
					},
					standardError: {
						backgroundColor: inputBackground,
						color: errorForeground,
					},
					standardSuccess: {
						backgroundColor: inputBackground,
						color: successForeground || '#89d185',
					},
				},
			},
			MuiTypography: {
				styleOverrides: {
					root: {
						'&.MuiTypography-h4': {
							marginBottom: baseSpacing * 1.5, // 6px
						},
						'&.MuiTypography-body1': {
							marginBottom: baseSpacing * 2, // 8px
						},
					},
				},
			},
			MuiCircularProgress: {
				styleOverrides: {
					root: {
						width: `${iconSize}px !important`,
						height: `${iconSize}px !important`,
					},
				},
			},
		},
	});
};
