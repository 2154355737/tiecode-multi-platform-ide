/**
 * Webview消息类型定义
 */
export interface WebviewMessage {
	command: string;
	payload?: any;
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
