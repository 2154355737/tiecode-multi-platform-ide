import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CompilePlatform } from '../types';
import { ProjectCreator } from '../utils/ProjectCreator';
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
	private static context: vscode.ExtensionContext | undefined = undefined;
	private static currentProjectDir: string | undefined = undefined;

	/**
	 * 创建或显示Webview面板
	 */
	public static createOrShow(context: vscode.ExtensionContext): void {
		try {
			console.log('TiecodeWebviewProvider.createOrShow 被调用');
			TiecodeWebviewProvider.context = context;
			
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
				<style>
					:root {
						/* VS Code 会自动注入这些变量，这里作为备用 */
						--vscode-foreground: var(--vscode-foreground, #cccccc);
						--vscode-editor-background: var(--vscode-editor-background, #1e1e1e);
						--vscode-sideBar-background: var(--vscode-sideBar-background, #252526);
						--vscode-panel-border: var(--vscode-panel-border, #3e3e42);
						--vscode-button-background: var(--vscode-button-background, #0e639c);
						--vscode-button-foreground: var(--vscode-button-foreground, #ffffff);
						--vscode-button-hoverBackground: var(--vscode-button-hoverBackground, #1177bb);
						--vscode-focusBorder: var(--vscode-focusBorder, #007acc);
						--vscode-descriptionForeground: var(--vscode-descriptionForeground, #989898);
						--vscode-errorForeground: var(--vscode-errorForeground, #f48771);
						--vscode-font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
						--vscode-font-size: var(--vscode-font-size, 13px);
						--vscode-input-background: var(--vscode-input-background, #3c3c3c);
						--vscode-input-foreground: var(--vscode-input-foreground, #cccccc);
						--vscode-input-border: var(--vscode-input-border, #3e3e42);
						--vscode-inputOption-activeBorder: var(--vscode-inputOption-activeBorder, #007acc);
						--vscode-textLink-foreground: var(--vscode-textLink-foreground, #3794ff);
						--vscode-textLink-activeForeground: var(--vscode-textLink-activeForeground, #3794ff);
						--vscode-widget-shadow: var(--vscode-widget-shadow, #000000);
					}
					body {
						font-family: var(--vscode-font-family);
						font-size: var(--vscode-font-size);
						color: var(--vscode-foreground);
						background-color: var(--vscode-editor-background);
						margin: 0;
						padding: 0;
					}
				</style>
			</head>
			<body>
				<div id="root">
					<div style="padding: 20px; font-family: var(--vscode-font-family); color: var(--vscode-foreground);">
						<h2 style="color: var(--vscode-foreground);">正在加载 Tiecode IDE...</h2>
						<p style="color: var(--vscode-descriptionForeground);">如果此页面长时间显示，请检查控制台是否有错误信息。</p>
						<div id="error-message" style="display: none; color: var(--vscode-errorForeground); margin-top: 20px;">
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
		const context = TiecodeWebviewProvider.context;
		if (!context) {
			vscode.window.showErrorMessage('扩展上下文未初始化');
			return;
		}
		switch (message.command) {
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
				// 返回空配置
				panel.webview.postMessage({
					command: 'projectConfig',
					payload: null
				});
				break;
			
			case 'pickDirectory':
				// 由前端请求目录选择器
				{
					const { purpose } = message.payload || {};
					const selected = await vscode.window.showOpenDialog({
						canSelectFiles: false,
						canSelectFolders: true,
						canSelectMany: false,
						openLabel: '选择文件夹'
					});
					panel.webview.postMessage({
						command: 'directoryPicked',
						payload: {
							purpose,
							path: selected && selected.length > 0 ? selected[0].fsPath : null
						}
					});
				}
				break;

			case 'pickFile':
				// 由前端请求文件选择器
				{
					const { purpose, filters } = message.payload || {};
					const selected = await vscode.window.showOpenDialog({
						canSelectFiles: true,
						canSelectFolders: false,
						canSelectMany: false,
						openLabel: '选择文件',
						filters: filters || { '可执行文件': ['exe'], '所有文件': ['*'] }
					});
					panel.webview.postMessage({
						command: 'filePicked',
						payload: {
							purpose,
							path: selected && selected.length > 0 ? selected[0].fsPath : null
						}
					});
				}
				break;

			case 'validatePath':
				// 验证路径（用于项目配置）
				{
					try {
						const { path: pathToValidate, purpose } = message.payload || {};
						if (!pathToValidate) {
							panel.webview.postMessage({
								command: 'pathValidated',
								payload: {
									purpose,
									valid: false,
									error: '路径不能为空'
								}
							});
							break;
						}

						let result;
						if (purpose === 'compilerPath' || purpose === 'windowsTieccPath') {
							result = await ProjectConfigManager.validateCompilerPath(pathToValidate);
						} else if (purpose === 'tmakePath' || purpose === 'windowsTmakePath') {
							result = await ProjectConfigManager.validateTmakePath(pathToValidate);
						} else {
							// 其他路径默认为目录
							result = await ProjectConfigManager.validatePath(pathToValidate, true);
						}

						panel.webview.postMessage({
							command: 'pathValidated',
							payload: {
								purpose,
								...result
							}
						});
					} catch (error) {
						const errorMsg = error instanceof Error ? error.message : '验证路径失败';
						panel.webview.postMessage({
							command: 'pathValidated',
							payload: {
								purpose: message.payload?.purpose,
								valid: false,
								error: errorMsg
							}
						});
					}
				}
				break;

			case 'saveConfig':
				// 兼容旧版本：全局编译器配置已废弃
				{
					panel.webview.postMessage({
						command: 'configSaveError',
						payload: '全局编译器配置已废弃，请在项目配置中设置编译器与 TMake 路径。'
					});
					vscode.window.showWarningMessage('全局编译器配置已废弃，请改用项目配置。');
				}
				break;

			case 'checkConfig':
				// 检查当前项目配置状态
				{
					try {
						const projectDir = ProjectConfigManager.getProjectDir();
						if (!projectDir) {
							panel.webview.postMessage({
								command: 'configStatus',
								payload: {
									isConfigured: false,
									config: null
								}
							});
							break;
						}

						const projectConfig = await ProjectConfigManager.readConfig(projectDir);
						const isConfigured =
							!!projectConfig &&
							!!(
								projectConfig.compiler?.compilerPath ||
								projectConfig.compiler?.tmakePath
							);

						panel.webview.postMessage({
							command: 'configStatus',
							payload: {
								isConfigured,
								config: projectConfig
							}
						});
					} catch (error) {
						const errorMsg = error instanceof Error ? error.message : '加载配置失败';
						panel.webview.postMessage({
							command: 'configStatus',
							payload: {
								isConfigured: false,
								config: null,
								error: errorMsg
							}
						});
					}
				}
				break;


			case 'createProject':
				// 创建项目
				{
					if (!context) {
						panel.webview.postMessage({
							command: 'projectCreateError',
							payload: '上下文未初始化'
						});
						break;
					}
					try {
						const projectConfig = message.payload;
						const createdProjectPath = await ProjectCreator.createProject(context, projectConfig);
						// 缓存刚创建的项目目录，用于后续配置写入正确位置
						TiecodeWebviewProvider.currentProjectDir = createdProjectPath;
						panel.webview.postMessage({
							command: 'projectCreated',
							payload: { ...projectConfig, projectPath: createdProjectPath }
						});
					} catch (error) {
						const errorMsg = error instanceof Error ? error.message : '创建项目失败';
						panel.webview.postMessage({
							command: 'projectCreateError',
							payload: errorMsg
						});
					}
				}
				break;

			case 'closeCreateProject':
				// 关闭创建项目界面
				{
					// 可以在这里处理关闭逻辑，比如刷新视图
					panel.webview.postMessage({
						command: 'createProjectClosed'
					});
				}
				break;
			
			case 'loadProjectConfig':
				// 加载项目配置
				{
					try {
						const config = await ProjectConfigManager.readConfig(TiecodeWebviewProvider.currentProjectDir || undefined);
						panel.webview.postMessage({
							command: 'projectConfigLoaded',
							payload: config
						});
					} catch (error) {
						const errorMsg = error instanceof Error ? error.message : '加载配置失败';
						panel.webview.postMessage({
							command: 'projectConfigLoaded',
							payload: null
						});
						console.error('加载项目配置失败:', error);
					}
				}
				break;

			case 'saveProjectConfig':
				// 保存项目配置
				{
					try {
						const config = message.payload;
						await ProjectConfigManager.saveConfig(config, TiecodeWebviewProvider.currentProjectDir || undefined);
						panel.webview.postMessage({
							command: 'projectConfigSaved',
							payload: config
						});
						vscode.window.showInformationMessage('项目配置已保存成功！');
					} catch (error) {
						const errorMsg = error instanceof Error ? error.message : '保存配置失败';
						panel.webview.postMessage({
							command: 'projectConfigSaveError',
							payload: errorMsg
						});
						vscode.window.showErrorMessage(`保存配置失败: ${errorMsg}`);
					}
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

