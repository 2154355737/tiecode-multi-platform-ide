/**
 * Webview消息类型定义
 */
export interface WebviewMessage {
	command: string;
	payload?: any;
}

/**
 * 编译平台类型
 */
export type CompilePlatform = 'Android' | 'Windows' | 'Linux' | 'HarmonyOS';

/**
 * 编译状态
 */
export type CompileStatus = 'idle' | 'compiling' | 'success' | 'error';

/**
 * 编译配置
 */
export interface CompileConfig {
	platform: CompilePlatform;
	outputPath?: string;
	options?: Record<string, any>;
}

/**
 * VSCode API类型（前端使用）
 */
export interface VSCodeAPI {
	postMessage(message: WebviewMessage): void;
	getState(): any;
	setState(state: any): void;
}

declare global {
	interface Window {
		vscode: VSCodeAPI;
	}
}

