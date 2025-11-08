import * as vscode from 'vscode';
import { CompilePlatform, CompileStatus } from '../types';

/**
 * 状态栏管理器
 * 负责创建和管理状态栏项，显示编译平台和状态
 */
export class StatusBarManager {
	private statusBarItem: vscode.StatusBarItem;
	private currentPlatform: CompilePlatform = 'Windows';
	private currentStatus: CompileStatus = 'idle';

	constructor(context: vscode.ExtensionContext) {
		// 创建状态栏项，优先级100，显示在右侧
		this.statusBarItem = vscode.window.createStatusBarItem(
			vscode.StatusBarAlignment.Right,
			100
		);

		// 设置点击命令
		this.statusBarItem.command = 'tiecode.selectPlatform';
		this.statusBarItem.tooltip = '点击选择编译平台';

		// 初始化状态栏
		this.updateStatusBar();

		// 注册到订阅中，确保扩展停用时清理
		context.subscriptions.push(this.statusBarItem);
	}

	/**
	 * 更新编译平台
	 */
	public updatePlatform(platform: CompilePlatform): void {
		this.currentPlatform = platform;
		this.updateStatusBar();
	}

	/**
	 * 更新编译状态
	 */
	public updateStatus(status: CompileStatus): void {
		this.currentStatus = status;
		this.updateStatusBar();
	}

	/**
	 * 更新状态栏显示
	 */
	private updateStatusBar(): void {
		const platformIcon = this.getPlatformIcon(this.currentPlatform);
		const statusIcon = this.getStatusIcon(this.currentStatus);
		const statusText = this.getStatusText(this.currentStatus);

		this.statusBarItem.text = `$(code) ${platformIcon} ${statusIcon} ${statusText}`;
		this.statusBarItem.show();
	}

	/**
	 * 获取平台图标
	 */
	private getPlatformIcon(platform: CompilePlatform): string {
		switch (platform) {
			case 'Android':
				return '📱';
			case 'Windows':
				return '🪟';
			case 'Linux':
				return '🐧';
			case 'HarmonyOS':
				return '🌸';
			default:
				return '⚙️';
		}
	}

	/**
	 * 获取状态图标
	 */
	private getStatusIcon(status: CompileStatus): string {
		switch (status) {
			case 'idle':
				return '$(circle-outline)';
			case 'compiling':
				return '$(sync~spin)';
			case 'success':
				return '$(check)';
			case 'error':
				return '$(error)';
			default:
				return '$(circle-outline)';
		}
	}

	/**
	 * 获取状态文本
	 */
	private getStatusText(status: CompileStatus): string {
		switch (status) {
			case 'idle':
				return '就绪';
			case 'compiling':
				return '编译中';
			case 'success':
				return '成功';
			case 'error':
				return '失败';
			default:
				return '未知';
		}
	}

	/**
	 * 显示状态栏
	 */
	public show(): void {
		this.statusBarItem.show();
	}

	/**
	 * 隐藏状态栏
	 */
	public hide(): void {
		this.statusBarItem.hide();
	}

	/**
	 * 销毁状态栏
	 */
	public dispose(): void {
		this.statusBarItem.dispose();
	}
}

