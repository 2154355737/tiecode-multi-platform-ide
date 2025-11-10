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
export type CompilePlatform = 'Android' | 'Windows' | 'Linux' | 'HarmonyOS' | 'iOS' | 'Apple' | 'HTML';

/**
 * 编译状态
 */
export type CompileStatus = 'idle' | 'compiling' | 'success' | 'error';

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warning' | 'error';

/**
 * 编译配置
 */
export interface CompileConfig {
	/** 目标平台 */
	platform: CompilePlatform;
	/** 输出目录 */
	outputPath?: string;
	/** 默认包名 */
	package?: string;
	/** 是否为发布模式（默认false，即调试模式） */
	release?: boolean;
	/** 硬输出模式 */
	hardMode?: boolean;
	/** 优化级别 (0-3，默认1) */
	optimize?: number;
	/** 禁用的lint检查列表 */
	disableLint?: string[];
	/** 日志级别 */
	logLevel?: LogLevel;
	/** 行号表输出路径 */
	lineMap?: string;
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

