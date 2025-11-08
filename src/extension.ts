// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { StatusBarManager } from './ui/StatusBarManager';
import { CommandManager } from './ui/CommandManager';
import { WelcomeProvider } from './ui/WelcomeProvider';
import { ActivityBarViewProvider } from './ui/ActivityBarViewProvider';

/**
 * 扩展激活函数
 * 当扩展被激活时调用，初始化所有UI组件
 */
export function activate(context: vscode.ExtensionContext) {
	// 立即输出到多个地方，确保能看到
	// 注意：这些输出可能在扩展加载时就能看到
	console.log('ACTIVATE CALLED');
	console.error('ACTIVATE CALLED (error stream)'); // 错误流通常更可靠
	
	// 使用输出通道 - 这会自动显示输出面板
	const outputChannel = vscode.window.createOutputChannel('Tiecode IDE');
	outputChannel.appendLine('========================================');
	outputChannel.appendLine('Tiecode Multi-Platform IDE 扩展开始激活...');
	outputChannel.appendLine('时间: ' + new Date().toISOString());
	outputChannel.show(true); // 显示输出通道
	
	try {
		// 输出激活信息到调试控制台
		console.log('========================================');
		console.log('Tiecode Multi-Platform IDE 扩展开始激活...');
		console.log('========================================');

		// 先测试基本功能，确保扩展能加载
		vscode.window.showInformationMessage('Tiecode Multi-Platform IDE 正在初始化...');

		// 延迟初始化，避免在激活时立即创建所有组件
		setTimeout(() => {
			try {
				console.log('开始初始化UI组件...');
				
				// 创建状态栏管理器（状态栏会显示在右下角）
				console.log('正在创建状态栏管理器...');
				const statusBarManager = new StatusBarManager(context);
				console.log('状态栏管理器创建成功');

				// 创建命令管理器（会自动注册所有命令）
				console.log('正在创建命令管理器...');
				const commandManager = new CommandManager(context, statusBarManager);
				console.log('命令管理器创建成功');

				// 显示状态栏（确保可见）
				statusBarManager.show();
				
				console.log('UI组件初始化完成');
			} catch (error) {
				console.error('初始化UI组件失败:', error);
				const errorMsg = error instanceof Error ? error.message : String(error);
				const errorStack = error instanceof Error ? error.stack : '';
				console.error('错误堆栈:', errorStack);
				vscode.window.showErrorMessage(`初始化失败: ${errorMsg}`);
			}
		}, 500);

		// 检查是否是首次启动，如果是则显示欢迎页面
		console.log('检查是否应该显示欢迎页面...');
		const shouldShow = WelcomeProvider.shouldShowWelcome(context);
		console.log('是否应该显示欢迎页面:', shouldShow);
		
		if (shouldShow) {
			// 延迟一下显示欢迎页面，确保VSCode界面已完全加载
			setTimeout(() => {
				console.log('正在显示欢迎页面...');
				try {
					WelcomeProvider.createOrShow(context);
				} catch (error) {
					console.error('显示欢迎页面失败:', error);
					vscode.window.showErrorMessage(`显示欢迎页面失败: ${error instanceof Error ? error.message : '未知错误'}`);
				}
			}, 1000);
		} else {
			// 非首次启动，显示简单的激活提示
			vscode.window.showInformationMessage(
				'✅ Tiecode Multi-Platform IDE 已就绪！',
				'打开可视化编辑器',
				'显示欢迎页面'
			).then((selection) => {
				if (selection === '打开可视化编辑器') {
					vscode.commands.executeCommand('tiecode.openVisualEditor');
				} else if (selection === '显示欢迎页面') {
					vscode.commands.executeCommand('tiecode.showWelcome');
				}
			});
		}

		// 输出可用命令到控制台
		console.log('可用命令:');
		console.log('  - tiecode.openVisualEditor: 打开可视化编辑器');
		console.log('  - tiecode.selectPlatform: 选择编译平台');
		console.log('  - tiecode.compile: 编译项目');
		console.log('  - tiecode.preview: 实时预览');
		console.log('  - tiecode.showWelcome: 显示欢迎页面');
		console.log('  - tiecode.createProject: 新建结绳项目');
		console.log('========================================');
		console.log('Tiecode Multi-Platform IDE 扩展激活成功！');
		console.log('========================================');

		// 注册重新显示欢迎页面的命令
		const showWelcomeCommand = vscode.commands.registerCommand(
			'tiecode.showWelcome',
			() => {
				WelcomeProvider.createOrShow(context);
			}
		);
		context.subscriptions.push(showWelcomeCommand);

		// 注册重置欢迎页面状态的命令（用于测试）
		const resetWelcomeCommand = vscode.commands.registerCommand(
			'tiecode.resetWelcome',
			() => {
				WelcomeProvider.resetWelcomeState(context);
				vscode.window.showInformationMessage('欢迎页面状态已重置，重新加载窗口后将会显示欢迎页面');
			}
		);
		context.subscriptions.push(resetWelcomeCommand);

		// 注册活动栏视图
		console.log('正在注册活动栏视图...');
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
		console.log('活动栏视图注册成功');

		// 将所有订阅添加到context中，确保扩展停用时正确清理
		// StatusBarManager 和 CommandManager 已经将它们的订阅添加到context中
		// statusBarManager 在 setTimeout 中创建，不需要在这里调用 show()
		
		// 保存输出通道到context
		context.subscriptions.push(outputChannel);
		
		outputChannel.appendLine('扩展激活流程完成');
	} catch (error) {
		// 捕获并显示激活错误
		const errorMessage = error instanceof Error ? error.message : '未知错误';
		const errorStack = error instanceof Error ? error.stack : String(error);
		
		console.error('========================================');
		console.error('扩展激活失败！');
		console.error('错误信息:', errorMessage);
		console.error('错误堆栈:', errorStack);
		console.error('========================================');
		
		vscode.window.showErrorMessage(
			`Tiecode Multi-Platform IDE 扩展激活失败: ${errorMessage}`
		);
	}
}

/**
 * 扩展停用函数
 * 当扩展被停用时调用，清理资源
 */
export function deactivate() {
	// 清理工作（如果需要）
	console.log('Tiecode Multi-Platform IDE 扩展已停用');
}
