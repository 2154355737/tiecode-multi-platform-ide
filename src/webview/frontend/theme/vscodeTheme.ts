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
	// 获取VSCode颜色变量
	const foreground = getVSCodeVar('--vscode-foreground', '#cccccc');
	const background = getVSCodeVar('--vscode-editor-background', '#1e1e1e');
	const sideBarBackground = getVSCodeVar('--vscode-sideBar-background', '#252526');
	const panelBorder = getVSCodeVar('--vscode-panel-border', '#3e3e42');
	const inputBackground = getVSCodeVar('--vscode-input-background', '#3c3c3c');
	const inputForeground = getVSCodeVar('--vscode-input-foreground', '#cccccc');
	const inputBorder = getVSCodeVar('--vscode-input-border', '#3e3e42');
	const buttonBackground = getVSCodeVar('--vscode-button-background', '#0e639c');
	const buttonForeground = getVSCodeVar('--vscode-button-foreground', '#ffffff');
	const buttonHoverBackground = getVSCodeVar('--vscode-button-hoverBackground', '#1177bb');
	const buttonSecondaryBackground = getVSCodeVar('--vscode-button-secondaryBackground', '#3e3e42');
	const buttonSecondaryForeground = getVSCodeVar('--vscode-button-secondaryForeground', '#cccccc');
	const buttonSecondaryHoverBackground = getVSCodeVar('--vscode-button-secondaryHoverBackground', '#454545');
	const focusBorder = getVSCodeVar('--vscode-focusBorder', '#007acc');
	const textLinkForeground = getVSCodeVar('--vscode-textLink-foreground', '#3794ff');
	const descriptionForeground = getVSCodeVar('--vscode-descriptionForeground', '#989898');
	const errorForeground = getVSCodeVar('--vscode-errorForeground', '#f48771');
	const badgeBackground = getVSCodeVar('--vscode-badge-background', '#4d4d4d');
	const badgeForeground = getVSCodeVar('--vscode-badge-foreground', '#ffffff');
	const listHoverBackground = getVSCodeVar('--vscode-list-hoverBackground', '#2a2d2e');
	const testingIconPassed = getVSCodeVar('--vscode-testing-iconPassed', '#89d185');
	const titleBarActiveBackground = getVSCodeVar('--vscode-titleBar-activeBackground', '#3c3c3c');
	const titleBarActiveForeground = getVSCodeVar('--vscode-titleBar-activeForeground', '#cccccc');
	const scrollbarSliderBackground = getVSCodeVar('--vscode-scrollbarSlider-background', '#79797966');
	const scrollbarSliderHoverBackground = getVSCodeVar('--vscode-scrollbarSlider-hoverBackground', '#646464b3');
	const scrollbarSliderActiveBackground = getVSCodeVar('--vscode-scrollbarSlider-activeBackground', '#bfbfbf66');

	// 获取字体
	const fontFamily = getVSCodeVar('--vscode-font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');
	const fontSize = getVSCodeVar('--vscode-font-size', '13px');

	return createTheme({
		palette: {
			mode: 'dark',
			primary: {
				main: buttonBackground,
				light: buttonHoverBackground,
				dark: buttonBackground,
				contrastText: buttonForeground,
			},
			secondary: {
				main: buttonSecondaryBackground,
				light: buttonSecondaryHoverBackground,
				dark: buttonSecondaryBackground,
				contrastText: buttonSecondaryForeground,
			},
			error: {
				main: errorForeground,
			},
			success: {
				main: testingIconPassed,
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
		},
		typography: {
			fontFamily: fontFamily,
			fontSize: parseInt(fontSize) || 13,
			h1: {
				fontSize: '20px',
				fontWeight: 700,
				color: titleBarActiveForeground,
			},
			h2: {
				fontSize: '15px',
				fontWeight: 700,
				color: foreground,
			},
			body1: {
				fontSize: fontSize,
				color: foreground,
			},
			body2: {
				fontSize: '13px',
				color: descriptionForeground,
			},
			button: {
				fontSize: fontSize,
				fontWeight: 500,
				textTransform: 'none',
			},
		},
		shape: {
			borderRadius: 4, // VSCode标准圆角
		},
		spacing: 4, // 基础间距单位4px
		components: {
			MuiButton: {
				styleOverrides: {
					root: {
						borderRadius: 4,
						padding: '8px 16px',
						fontSize: fontSize,
						fontWeight: 500,
						boxShadow: 'none',
						'&:hover': {
							boxShadow: 'none',
						},
						'&.MuiButton-contained': {
							backgroundColor: buttonBackground,
							color: buttonForeground,
							'&:hover': {
								backgroundColor: buttonHoverBackground,
							},
						},
						'&.MuiButton-outlined': {
							borderColor: inputBorder,
							color: foreground,
							'&:hover': {
								borderColor: focusBorder,
								backgroundColor: buttonSecondaryHoverBackground,
							},
						},
						'&.MuiButton-text': {
							color: textLinkForeground,
							'&:hover': {
								backgroundColor: listHoverBackground,
							},
						},
					},
				},
			},
			MuiTextField: {
				styleOverrides: {
					root: {
						'& .MuiOutlinedInput-root': {
							backgroundColor: inputBackground,
							color: inputForeground,
							fontSize: fontSize,
							'& fieldset': {
								borderColor: inputBorder,
							},
							'&:hover fieldset': {
								borderColor: focusBorder,
							},
							'&.Mui-focused fieldset': {
								borderColor: focusBorder,
							},
						},
						'& .MuiInputLabel-root': {
							color: descriptionForeground,
							fontSize: fontSize,
							'&.Mui-focused': {
								color: focusBorder,
							},
						},
					},
				},
			},
			MuiCheckbox: {
				styleOverrides: {
					root: {
						color: inputBorder,
						'&.Mui-checked': {
							color: buttonBackground,
						},
					},
				},
			},
			MuiSelect: {
				styleOverrides: {
					root: {
						backgroundColor: inputBackground,
						color: inputForeground,
						fontSize: fontSize,
						'& .MuiOutlinedInput-notchedOutline': {
							borderColor: inputBorder,
						},
						'&:hover .MuiOutlinedInput-notchedOutline': {
							borderColor: focusBorder,
						},
						'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
							borderColor: focusBorder,
						},
					},
				},
			},
			MuiCard: {
				styleOverrides: {
					root: {
						backgroundColor: background,
						border: `1px solid ${panelBorder}`,
						borderRadius: 8,
						boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
					},
				},
			},
			MuiPaper: {
				styleOverrides: {
					root: {
						backgroundColor: background,
						border: `1px solid ${panelBorder}`,
						borderRadius: 8,
						boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
					},
				},
			},
			MuiAppBar: {
				styleOverrides: {
					root: {
						backgroundColor: titleBarActiveBackground,
						color: titleBarActiveForeground,
						borderBottom: `2px solid ${panelBorder}`,
						boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
					},
				},
			},
			MuiListItem: {
				styleOverrides: {
					root: {
						borderRadius: 4,
						'&:hover': {
							backgroundColor: listHoverBackground,
						},
					},
				},
			},
			MuiToggleButton: {
				styleOverrides: {
					root: {
						borderColor: inputBorder,
						color: foreground,
						backgroundColor: buttonSecondaryBackground,
						'&:hover': {
							backgroundColor: buttonSecondaryHoverBackground,
							borderColor: focusBorder,
						},
						'&.Mui-selected': {
							backgroundColor: buttonBackground,
							color: buttonForeground,
							'&:hover': {
								backgroundColor: buttonHoverBackground,
							},
						},
					},
				},
			},
			MuiChip: {
				styleOverrides: {
					root: {
						backgroundColor: badgeBackground,
						color: badgeForeground,
						fontSize: '12px',
						height: '24px',
					},
				},
			},
		},
	});
};

