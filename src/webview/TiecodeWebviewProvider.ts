import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CompilePlatform } from '../types';

/**
 * Webview消息类型定义
 */
export interface WebviewMessage {
	command: string;
	payload?: any;
}

/**
 * Tiecode Webview提供者类
 * 负责创建和管理Webview面板，处理与前端通信
 */
export class TiecodeWebviewProvider {
	private static currentPanel: vscode.WebviewPanel | undefined = undefined;
	private static readonly viewType = 'tiecodeVisualEditor';

	/**
	 * 创建或显示Webview面板
	 */
	public static createOrShow(context: vscode.ExtensionContext): void {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// 如果面板已存在，直接显示
		if (TiecodeWebviewProvider.currentPanel) {
			TiecodeWebviewProvider.currentPanel.reveal(column);
			return;
		}

		// 创建新的Webview面板
		const panel = vscode.window.createWebviewPanel(
			TiecodeWebviewProvider.viewType,
			'Tiecode 可视化编辑器',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [
					vscode.Uri.joinPath(context.extensionUri, 'media'),
					vscode.Uri.joinPath(context.extensionUri, 'dist')
				],
				retainContextWhenHidden: true
			}
		);

		// 设置Webview内容
		panel.webview.html = TiecodeWebviewProvider.getWebviewContent(
			context,
			panel.webview
		);

		// 处理来自Webview的消息
		panel.webview.onDidReceiveMessage(
			(message: WebviewMessage) => {
				TiecodeWebviewProvider.handleMessage(message, panel);
			},
			undefined,
			context.subscriptions
		);

		// 面板关闭时清理
		panel.onDidDispose(
			() => {
				TiecodeWebviewProvider.currentPanel = undefined;
			},
			null,
			context.subscriptions
		);

		TiecodeWebviewProvider.currentPanel = panel;
	}

	/**
	 * 获取Webview HTML内容
	 */
	private static getWebviewContent(
		context: vscode.ExtensionContext,
		webview: vscode.Webview
	): string {
		// 获取前端资源路径
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'main.js')
		);

		// 使用nonce确保安全性
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="zh-CN">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Tiecode 可视化编辑器</title>
			</head>
			<body>
				<div id="root"></div>
				<script nonce="${nonce}">
					const vscode = acquireVsCodeApi();
					window.vscode = vscode;
				</script>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	/**
	 * 处理来自Webview的消息
	 */
	private static handleMessage(
		message: WebviewMessage,
		panel: vscode.WebviewPanel
	): void {
		switch (message.command) {
			case 'compile':
				// 处理编译请求，通过命令触发编译
				vscode.commands.executeCommand('tiecode.compile', message.payload);
				break;

			case 'selectPlatform':
				// 处理平台选择请求，通过命令触发平台选择
				vscode.commands.executeCommand<CompilePlatform>('tiecode.selectPlatform').then((selectedPlatform) => {
					// 平台选择完成后，通知Webview更新
					if (selectedPlatform) {
						panel.webview.postMessage({
							command: 'platformChanged',
							payload: selectedPlatform
						});
					}
				});
				break;

			case 'getWorkspaceFiles':
				// 返回工作区文件列表
				const files = TiecodeWebviewProvider.getWorkspaceFiles();
				panel.webview.postMessage({
					command: 'workspaceFiles',
					payload: files
				});
				break;

			case 'alert':
				// 显示警告信息
				vscode.window.showWarningMessage(message.payload || '');
				break;

			case 'error':
				// 显示错误信息
				vscode.window.showErrorMessage(message.payload || '');
				break;

			default:
				vscode.window.showWarningMessage(`未知命令: ${message.command}`);
		}
	}

	/**
	 * 获取工作区文件列表
	 */
	private static getWorkspaceFiles(): string[] {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			return [];
		}

		const files: string[] = [];
		const rootPath = workspaceFolders[0].uri.fsPath;

		try {
			const entries = fs.readdirSync(rootPath, { withFileTypes: true });
			for (const entry of entries) {
				if (entry.isFile()) {
					files.push(entry.name);
				}
			}
		} catch (error) {
			console.error('读取工作区文件失败:', error);
		}

		return files;
	}

	/**
	 * 向Webview发送消息
	 */
	public static postMessage(message: WebviewMessage): void {
		if (TiecodeWebviewProvider.currentPanel) {
			TiecodeWebviewProvider.currentPanel.webview.postMessage(message);
		}
	}

	/**
	 * 更新Webview内容
	 */
	public static updateContent(context: vscode.ExtensionContext): void {
		if (TiecodeWebviewProvider.currentPanel) {
			TiecodeWebviewProvider.currentPanel.webview.html =
				TiecodeWebviewProvider.getWebviewContent(
					context,
					TiecodeWebviewProvider.currentPanel.webview
				);
		}
	}
}

/**
 * 生成随机nonce用于CSP
 */
function getNonce(): string {
	let text = '';
	const possible =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

