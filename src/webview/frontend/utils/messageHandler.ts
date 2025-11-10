import { WebviewMessage } from '../types';

/**
 * 消息处理器工具类
 * 用于与VSCode扩展主进程通信
 */
export class MessageHandler {
	private static vscode: ReturnType<typeof acquireVsCodeApi> | null = null;

	/**
	 * 获取VSCode API实例（延迟初始化）
	 */
	private static getVscode() {
		if (!this.vscode) {
			this.vscode = acquireVsCodeApi();
			console.log('MessageHandler: VSCode API已初始化', this.vscode);
		}
		return this.vscode;
	}

	/**
	 * 发送消息到扩展主进程
	 */
	public static postMessage(message: WebviewMessage): void {
		try {
			const vscode = this.getVscode();
			console.log('MessageHandler: 发送消息', message);
			vscode.postMessage(message);
		} catch (error) {
			console.error('MessageHandler: 发送消息失败', error);
		}
	}

	/**
	 * 监听来自扩展主进程的消息
	 */
	public static onMessage(callback: (message: WebviewMessage) => void): void {
		window.addEventListener('message', (event) => {
			callback(event.data as WebviewMessage);
		});
	}

	/**
	 * 获取扩展状态
	 */
	public static getState(): any {
		return this.getVscode().getState();
	}

	/**
	 * 设置扩展状态
	 */
	public static setState(state: any): void {
		this.getVscode().setState(state);
	}

	/**
	 * 请求编译
	 */
	public static requestCompile(config: any): void {
		this.postMessage({
			command: 'compile',
			payload: config
		});
	}

	/**
	 * 选择平台
	 */
	public static selectPlatform(platform: string): void {
		this.postMessage({
			command: 'selectPlatform',
			payload: platform
		});
	}

	/**
	 * 获取工作区文件
	 */
	public static getWorkspaceFiles(): void {
		this.postMessage({
			command: 'getWorkspaceFiles'
		});
	}

	/**
	 * 显示警告
	 */
	public static showAlert(message: string): void {
		this.postMessage({
			command: 'alert',
			payload: message
		});
	}

	/**
	 * 显示错误
	 */
	public static showError(message: string): void {
		this.postMessage({
			command: 'error',
			payload: message
		});
	}

	/**
	 * 获取项目配置
	 */
	public static getProjectConfig(): void {
		this.postMessage({
			command: 'getProjectConfig'
		});
	}
}

/**
 * 获取VSCode API（类型安全的包装）
 */
function acquireVsCodeApi(): {
	postMessage(message: WebviewMessage): void;
	getState(): any;
	setState(state: any): void;
} {
	// @ts-ignore - VSCode API在运行时注入
	return window.vscode || {
		postMessage: () => {},
		getState: () => null,
		setState: () => {}
	};
}

