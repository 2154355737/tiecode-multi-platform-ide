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
		},
		shape: {
			borderRadius: 4,
		},
		spacing: 4,
	});
};
