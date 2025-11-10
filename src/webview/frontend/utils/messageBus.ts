import { WebviewMessage } from '../types';

type VSCodeAPI = {
	postMessage(message: WebviewMessage): void;
	getState(): any;
	setState(state: any): void;
};

function acquireVsCodeApiSafe(): VSCodeAPI {
	// @ts-ignore VSCode 注入
	return (window as any).vscode || {
		postMessage: () => {},
		getState: () => null,
		setState: () => {},
	};
}

/**
 * 统一消息总线：封装与 VSCode 的通信
 */
export const MessageBus = {
	_vscode: null as VSCodeAPI | null,

	get vscode(): VSCodeAPI {
		if (!this._vscode) {
			this._vscode = acquireVsCodeApiSafe();
		}
		return this._vscode;
	},

	post(message: WebviewMessage) {
		try {
			this.vscode.postMessage(message);
		} catch {
			// 静默失败
		}
	},

	onMessage(handler: (message: WebviewMessage) => void) {
		window.addEventListener('message', (event) => {
			handler(event.data as WebviewMessage);
		});
	},

	getState<T = any>(): T {
		return this.vscode.getState();
	},

	setState(state: any) {
		this.vscode.setState(state);
	},
};
