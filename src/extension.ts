import * as vscode from 'vscode';
import { StatusBarManager } from './ui/StatusBarManager';
import { CommandManager } from './ui/CommandManager';
import { WelcomeProvider } from './ui/WelcomeProvider';
import { ActivityBarViewProvider } from './ui/ActivityBarViewProvider';

/**
 * 扩展激活函数
 * 初始化UI布局组件
 */
export function activate(context: vscode.ExtensionContext) {
	try {
		// 延迟初始化UI组件
		setTimeout(() => {
			try {
				// 创建状态栏管理器
				const statusBarManager = new StatusBarManager(context);
				
				// 创建命令管理器
				const commandManager = new CommandManager(context, statusBarManager);
				
				// 显示状态栏
				statusBarManager.show();
			} catch (error) {
				console.error('初始化UI组件失败:', error);
				vscode.window.showErrorMessage(`初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
			}
		}, 500);

		// 检查是否显示欢迎页面
		if (WelcomeProvider.shouldShowWelcome(context)) {
			setTimeout(() => {
				try {
					WelcomeProvider.createOrShow(context);
				} catch (error) {
					console.error('显示欢迎页面失败:', error);
				}
			}, 1000);
		}

		// 注册欢迎页面相关命令
		const showWelcomeCommand = vscode.commands.registerCommand(
			'tiecode.showWelcome',
			() => {
				WelcomeProvider.createOrShow(context);
			}
		);
		context.subscriptions.push(showWelcomeCommand);

		const resetWelcomeCommand = vscode.commands.registerCommand(
			'tiecode.resetWelcome',
			() => {
				WelcomeProvider.resetWelcomeState(context);
				vscode.window.showInformationMessage('欢迎页面状态已重置，重新加载窗口后将会显示欢迎页面');
			}
		);
		context.subscriptions.push(resetWelcomeCommand);

		// 注册活动栏视图
		const activityBarViewProvider = new ActivityBarViewProvider(context);
		const treeView = vscode.window.createTreeView('tiecodeExplorer', {
			treeDataProvider: activityBarViewProvider,
			showCollapseAll: true
		});
		context.subscriptions.push(treeView);

		// 注册刷新视图的命令
		const refreshExplorerCommand = vscode.commands.registerCommand(
			'tiecode.refreshExplorer',
			() => {
				activityBarViewProvider.refresh();
			}
		);
		context.subscriptions.push(refreshExplorerCommand);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : '未知错误';
		console.error('扩展激活失败:', errorMessage);
		vscode.window.showErrorMessage(`Tiecode Multi-Platform IDE 扩展激活失败: ${errorMessage}`);
	}
}

/**
 * 扩展停用函数
 */
export function deactivate() {
	console.log('Tiecode Multi-Platform IDE 扩展已停用');
}
