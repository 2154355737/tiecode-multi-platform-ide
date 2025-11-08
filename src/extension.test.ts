// 最小化测试版本 - 用于排查崩溃问题
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('测试版本：扩展开始激活...');
	
	try {
		vscode.window.showInformationMessage('测试版本：扩展已激活！');
		console.log('测试版本：扩展激活成功');
	} catch (error) {
		console.error('测试版本：激活失败', error);
		vscode.window.showErrorMessage(`激活失败: ${error}`);
	}
}

export function deactivate() {
	console.log('测试版本：扩展已停用');
}

