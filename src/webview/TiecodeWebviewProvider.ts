import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CompilePlatform, CompileConfig } from '../types';
import { ProjectConfigManager } from '../utils/ProjectConfigManager';

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
		try {
			console.log('TiecodeWebviewProvider.createOrShow 被调用');
			
			const column = vscode.window.activeTextEditor
				? vscode.window.activeTextEditor.viewColumn
				: undefined;

			// 如果面板已存在，直接显示
			if (TiecodeWebviewProvider.currentPanel) {
				console.log('Webview面板已存在，直接显示');
				TiecodeWebviewProvider.currentPanel.reveal(column);
				return;
			}

			console.log('正在创建新的Webview面板...');
			
			// 创建新的Webview面板
			const panel = vscode.window.createWebviewPanel(
				TiecodeWebviewProvider.viewType,
				'Tiecode IDE',
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

			console.log('Webview面板创建成功，正在设置内容...');

			// 设置Webview内容
			try {
				const htmlContent = TiecodeWebviewProvider.getWebviewContent(
					context,
					panel.webview
				);
				panel.webview.html = htmlContent;
				console.log('Webview内容设置成功');
			} catch (htmlError) {
				console.error('设置Webview内容失败:', htmlError);
				vscode.window.showErrorMessage(
					`设置Webview内容失败: ${htmlError instanceof Error ? htmlError.message : '未知错误'}`
				);
				panel.dispose();
				return;
			}

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
					console.log('Webview面板已关闭');
					TiecodeWebviewProvider.currentPanel = undefined;
				},
				null,
				context.subscriptions
			);

			TiecodeWebviewProvider.currentPanel = panel;
			console.log('Webview面板创建和初始化完成');
		} catch (error) {
			console.error('创建Webview面板时发生错误:', error);
			const errorMsg = error instanceof Error ? error.message : '未知错误';
			vscode.window.showErrorMessage(`打开 Tiecode IDE 失败: ${errorMsg}`);
		}
	}

	/**
	 * 获取Webview HTML内容
	 */
	private static getWebviewContent(
		context: vscode.ExtensionContext,
		webview: vscode.Webview
	): string {
		try {
			// 获取前端资源路径
			const scriptUri = webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'main.js')
			);

			console.log('Script URI:', scriptUri.toString());

			// 使用nonce确保安全性
			const nonce = getNonce();

			// 修复CSP：允许从webview.cspSource加载脚本
			const html = `<!DOCTYPE html>
			<html lang="zh-CN">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource};">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Tiecode IDE</title>
			</head>
			<body>
				<div id="root">
					<div style="padding: 20px; font-family: sans-serif;">
						<h2>正在加载 Tiecode IDE...</h2>
						<p>如果此页面长时间显示，请检查控制台是否有错误信息。</p>
						<div id="error-message" style="display: none; color: red; margin-top: 20px;">
							<h3>加载错误</h3>
							<p id="error-text"></p>
						</div>
					</div>
				</div>
				<script nonce="${nonce}">
					console.log('开始初始化VSCode API...');
					try {
						const vscode = acquireVsCodeApi();
						window.vscode = vscode;
						console.log('VSCode API已初始化成功', vscode);
					} catch (error) {
						console.error('VSCode API初始化失败:', error);
						window.vscode = {
							postMessage: (msg) => console.log('postMessage (fallback):', msg),
							getState: () => null,
							setState: () => {}
						};
					}
					
					// 添加脚本加载错误处理
					window.addEventListener('error', function(e) {
						console.error('全局错误捕获:', e);
						const errorDiv = document.getElementById('error-message');
						const errorText = document.getElementById('error-text');
						if (errorDiv && errorText) {
							errorDiv.style.display = 'block';
							errorText.textContent = e.message + ' (文件: ' + (e.filename || '未知') + ', 行: ' + (e.lineno || '未知') + ')';
						}
					}, true);
					
					// 添加未处理的Promise拒绝处理
					window.addEventListener('unhandledrejection', function(e) {
						console.error('未处理的Promise拒绝:', e.reason);
						const errorDiv = document.getElementById('error-message');
						const errorText = document.getElementById('error-text');
						if (errorDiv && errorText) {
							errorDiv.style.display = 'block';
							errorText.textContent = '未处理的错误: ' + (e.reason?.message || String(e.reason));
						}
					});
					
					// 超时检测：如果10秒后还没有加载完成，显示错误
					setTimeout(function() {
						const root = document.getElementById('root');
						if (root && root.children.length === 1 && root.children[0].querySelector('#error-message')) {
							const errorDiv = document.getElementById('error-message');
							const errorText = document.getElementById('error-text');
							if (errorDiv && errorDiv.style.display === 'none') {
								errorDiv.style.display = 'block';
								if (errorText) {
									errorText.textContent = '前端应用加载超时。请检查：1) 脚本文件是否正确加载 2) 控制台是否有错误信息';
								}
							}
						}
					}, 10000);
				</script>
				<script nonce="${nonce}" src="${scriptUri}" onerror="
					console.error('脚本加载失败:', '${scriptUri}');
					const errorDiv = document.getElementById('error-message');
					const errorText = document.getElementById('error-text');
					if (errorDiv && errorText) {
						errorDiv.style.display = 'block';
						errorText.textContent = '无法加载前端脚本: ${scriptUri}。请检查文件是否存在。';
					}
				"></script>
			</body>
			</html>`;

			return html;
		} catch (error) {
			console.error('生成Webview HTML内容时发生错误:', error);
			// 返回一个简单的错误页面
			return `<!DOCTYPE html>
			<html lang="zh-CN">
			<head>
				<meta charset="UTF-8">
				<title>错误</title>
			</head>
			<body>
				<h1>加载失败</h1>
				<p>无法加载 Tiecode IDE。请检查控制台输出以获取更多信息。</p>
				<p>错误: ${error instanceof Error ? error.message : '未知错误'}</p>
			</body>
			</html>`;
		}
	}

	/**
	 * 处理来自Webview的消息
	 */
	private static async handleMessage(
		message: WebviewMessage,
		panel: vscode.WebviewPanel
	): Promise<void> {
		switch (message.command) {
			case 'compile':
				// 处理编译请求，通过命令触发编译
				const compileConfig = message.payload as CompileConfig;
				vscode.commands.executeCommand('tiecode.compile', compileConfig);
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

			case 'getProjectConfig':
				// 返回项目配置
				const workspaceFolders = vscode.workspace.workspaceFolders;
				if (workspaceFolders && workspaceFolders.length > 0) {
					const workspacePath = workspaceFolders[0].uri.fsPath;
					const projectConfig = await ProjectConfigManager.loadConfig(workspacePath);
					panel.webview.postMessage({
						command: 'projectConfig',
						payload: projectConfig
					});
				}
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
	 * 获取工作区文件列表（递归获取所有文件）
	 */
	private static getWorkspaceFiles(): string[] {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			return [];
		}

		const files: string[] = [];
		const rootPath = workspaceFolders[0].uri.fsPath;

		// 需要排除的目录
		const excludeDirs = new Set([
			'node_modules',
			'.git',
			'dist',
			'.vscode',
			'out',
			'build',
			'.next',
			'.nuxt',
			'.cache',
			'coverage',
			'.nyc_output',
			'.idea',
			'.vs',
			'temp',
			'tmp'
		]);

		/**
		 * 递归遍历目录
		 */
		function walkDir(dir: string, relativePath: string = ''): void {
			try {
				const entries = fs.readdirSync(dir, { withFileTypes: true });
				for (const entry of entries) {
					const entryName = entry.name;
					const fullPath = path.join(dir, entryName);
					const relativeFilePath = relativePath ? path.join(relativePath, entryName) : entryName;

					// 跳过隐藏文件（以 . 开头，但保留 .tiecode 等配置目录）
					if (entryName.startsWith('.') && !entryName.startsWith('.tiecode')) {
						// 检查是否在排除列表中
						if (!excludeDirs.has(entryName)) {
							// 如果是文件，添加到列表
							if (entry.isFile()) {
								files.push(relativeFilePath);
							} else if (entry.isDirectory()) {
								// 递归遍历
								walkDir(fullPath, relativeFilePath);
							}
						}
						continue;
					}

					// 跳过排除的目录
					if (entry.isDirectory() && excludeDirs.has(entryName.toLowerCase())) {
						continue;
					}

					if (entry.isFile()) {
						// 使用相对路径，便于显示
						files.push(relativeFilePath);
					} else if (entry.isDirectory()) {
						// 递归遍历子目录
						walkDir(fullPath, relativeFilePath);
					}
				}
			} catch (error) {
				console.error(`读取目录失败: ${dir}`, error);
			}
		}

		try {
			walkDir(rootPath);
			// 按路径排序，使文件列表更有序
			files.sort();
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

