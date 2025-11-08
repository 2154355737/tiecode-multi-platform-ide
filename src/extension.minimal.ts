// 最小化测试版本 - 用于排查崩溃问题
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	// 使用多种方式输出，确保能看到
	console.log('=== MINIMAL TEST: ACTIVATE CALLED ===');
	console.error('=== MINIMAL TEST: ACTIVATE CALLED (error) ===');
	
	// 创建输出通道
	const outputChannel = vscode.window.createOutputChannel('Tiecode Test');
	outputChannel.appendLine('=== MINIMAL TEST: ACTIVATE CALLED ===');
	outputChannel.show(true);
	
	// 显示消息
	vscode.window.showInformationMessage('Tiecode 扩展已激活（测试版本）');
	
	// 注册一个简单命令
	const disposable = vscode.commands.registerCommand('tiecode.test', () => {
		vscode.window.showInformationMessage('测试命令执行成功！');
	});
	
	context.subscriptions.push(disposable);
	context.subscriptions.push(outputChannel);
	
	outputChannel.appendLine('扩展激活完成');
}

export function deactivate() {
	console.log('=== MINIMAL TEST: DEACTIVATE ===');
}

