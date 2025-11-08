import * as vscode from 'vscode';

/**
 * 欢迎页面提供者
 * 在用户首次启动扩展时显示欢迎界面
 */
export class WelcomeProvider {
	private static currentPanel: vscode.WebviewPanel | undefined = undefined;
	private static readonly viewType = 'tiecodeWelcome';

	/**
	 * 显示欢迎页面
	 */
	public static createOrShow(
		context: vscode.ExtensionContext
	): void {
		console.log('WelcomeProvider.createOrShow 被调用');
		
		// 如果面板已存在，直接显示
		if (WelcomeProvider.currentPanel) {
			console.log('欢迎面板已存在，直接显示');
			WelcomeProvider.currentPanel.reveal();
			return;
		}

		console.log('创建新的欢迎面板');
		// 创建新的Webview面板
		const panel = vscode.window.createWebviewPanel(
			WelcomeProvider.viewType,
			'欢迎使用 Tiecode Multi-Platform IDE',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: false
			}
		);

		// 设置Webview内容
		panel.webview.html = WelcomeProvider.getWebviewContent(context, panel.webview);

		// 处理来自Webview的消息
		panel.webview.onDidReceiveMessage(
			(message) => {
				switch (message.command) {
					case 'openVisualEditor':
						vscode.commands.executeCommand('tiecode.openVisualEditor');
						panel.dispose();
						break;
					case 'getStarted':
						// 标记已查看欢迎页面
						context.globalState.update('tiecode.hasSeenWelcome', true);
						panel.dispose();
						break;
				}
			},
			undefined,
			context.subscriptions
		);

		// 面板关闭时清理
		panel.onDidDispose(
			() => {
				WelcomeProvider.currentPanel = undefined;
			},
			null,
			context.subscriptions
		);

		WelcomeProvider.currentPanel = panel;
	}

	/**
	 * 获取Webview HTML内容
	 */
	private static getWebviewContent(
		context: vscode.ExtensionContext,
		webview: vscode.Webview
	): string {
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="zh-CN">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>欢迎使用 Tiecode Multi-Platform IDE</title>
				<style>
					body {
						font-family: var(--vscode-font-family);
						padding: 40px;
						color: var(--vscode-foreground);
						background-color: var(--vscode-editor-background);
						line-height: 1.6;
					}
					.container {
						max-width: 800px;
						margin: 0 auto;
					}
					.header {
						text-align: center;
						margin-bottom: 40px;
					}
					.header h1 {
						font-size: 32px;
						margin-bottom: 10px;
						color: var(--vscode-textLink-foreground);
					}
					.header p {
						font-size: 16px;
						color: var(--vscode-descriptionForeground);
					}
					.features {
						display: grid;
						grid-template-columns: repeat(2, 1fr);
						gap: 20px;
						margin: 40px 0;
					}
					.feature-card {
						padding: 20px;
						border: 1px solid var(--vscode-panel-border);
						border-radius: 8px;
						background-color: var(--vscode-sideBar-background);
					}
					.feature-card h3 {
						margin-top: 0;
						color: var(--vscode-textLink-foreground);
					}
					.feature-card p {
						margin: 10px 0 0 0;
						color: var(--vscode-descriptionForeground);
					}
					.actions {
						text-align: center;
						margin-top: 40px;
					}
					.button {
						display: inline-block;
						padding: 12px 24px;
						margin: 0 10px;
						background-color: var(--vscode-button-background);
						color: var(--vscode-button-foreground);
						border: none;
						border-radius: 4px;
						cursor: pointer;
						font-size: 14px;
						text-decoration: none;
						transition: background-color 0.2s;
					}
					.button:hover {
						background-color: var(--vscode-button-hoverBackground);
					}
					.button-secondary {
						background-color: var(--vscode-button-secondaryBackground);
						color: var(--vscode-button-secondaryForeground);
					}
					.button-secondary:hover {
						background-color: var(--vscode-button-secondaryHoverBackground);
					}
					.quick-start {
						background-color: var(--vscode-textBlockQuote-background);
						border-left: 4px solid var(--vscode-textLink-foreground);
						padding: 20px;
						margin: 30px 0;
						border-radius: 4px;
					}
					.quick-start h3 {
						margin-top: 0;
						color: var(--vscode-textLink-foreground);
					}
					.quick-start ol {
						margin: 10px 0 0 20px;
					}
					.quick-start li {
						margin: 8px 0;
					}
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>🎉 欢迎使用 Tiecode Multi-Platform IDE</h1>
						<p>Tiecode 编程语言的完整开发套件，提供可视化开发界面和多平台编译支持</p>
					</div>

					<div class="features">
						<div class="feature-card">
							<h3>📱 多平台支持</h3>
							<p>支持 Android、Windows、Linux 和 HarmonyOS 平台的一键编译</p>
						</div>
						<div class="feature-card">
							<h3>🎨 可视化编辑器</h3>
							<p>提供直观的可视化开发界面，简化开发流程</p>
						</div>
						<div class="feature-card">
							<h3>⚡ 实时预览</h3>
							<p>实时预览您的代码效果，提高开发效率</p>
						</div>
						<div class="feature-card">
							<h3>🔧 智能补全</h3>
							<p>语法高亮、代码补全等完整的IDE功能</p>
						</div>
					</div>

					<div class="quick-start">
						<h3>🚀 快速开始</h3>
						<ol>
							<li>点击下方按钮打开可视化编辑器</li>
							<li>选择您的目标编译平台（Android/Windows/Linux/HarmonyOS）</li>
							<li>开始编写您的 Tiecode 代码</li>
							<li>使用一键编译功能生成目标平台应用</li>
						</ol>
					</div>

					<div class="actions">
						<button class="button" onclick="openVisualEditor()">打开可视化编辑器</button>
						<button class="button button-secondary" onclick="getStarted()">开始使用</button>
					</div>
				</div>

				<script nonce="${nonce}">
					const vscode = acquireVsCodeApi();
					
					function openVisualEditor() {
						vscode.postMessage({ command: 'openVisualEditor' });
					}
					
					function getStarted() {
						vscode.postMessage({ command: 'getStarted' });
					}
				</script>
			</body>
			</html>`;
	}

	/**
	 * 检查是否应该显示欢迎页面
	 */
	public static shouldShowWelcome(
		context: vscode.ExtensionContext
	): boolean {
		const hasSeenWelcome = context.globalState.get<boolean>(
			'tiecode.hasSeenWelcome',
			false
		);
		console.log('hasSeenWelcome:', hasSeenWelcome);
		return !hasSeenWelcome;
	}

	/**
	 * 重置欢迎页面状态（用于测试或重新显示）
	 */
	public static resetWelcomeState(
		context: vscode.ExtensionContext
	): void {
		context.globalState.update('tiecode.hasSeenWelcome', false);
		console.log('欢迎页面状态已重置');
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

