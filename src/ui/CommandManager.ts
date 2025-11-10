import * as vscode from 'vscode';
import { TiecodeWebviewProvider } from '../webview/TiecodeWebviewProvider';
import { StatusBarManager } from './StatusBarManager';
import { CompilePlatform } from '../types';

/**
 * 命令管理器
 * 负责注册基本的UI命令
 */
export class CommandManager {
	private statusBarManager: StatusBarManager;

	constructor(
		context: vscode.ExtensionContext,
		statusBarManager: StatusBarManager
	) {
		this.statusBarManager = statusBarManager;
		this.registerCommands(context);
	}

	/**
	 * 注册所有命令
	 */
	private registerCommands(context: vscode.ExtensionContext): void {
		// 打开 Tiecode IDE
		const openEditorCommand = vscode.commands.registerCommand(
			'tiecode.openVisualEditor',
			() => {
				try {
					TiecodeWebviewProvider.createOrShow(context);
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : '未知错误';
					vscode.window.showErrorMessage(`打开 Tiecode IDE 失败: ${errorMsg}`);
				}
			}
		);

		// 选择编译平台
		const selectPlatformCommand = vscode.commands.registerCommand(
			'tiecode.selectPlatform',
			async () => {
				await this.handleSelectPlatform();
			}
		);

		// 占位命令（保持命令注册，但功能简化）
		const compileCommand = vscode.commands.registerCommand(
			'tiecode.compile',
			() => {
				vscode.window.showInformationMessage('编译功能已移除');
			}
		);

		const previewCommand = vscode.commands.registerCommand(
			'tiecode.preview',
			() => {
				vscode.window.showInformationMessage('预览功能已移除');
			}
		);

		const createProjectCommand = vscode.commands.registerCommand(
			'tiecode.createProject',
			() => {
				vscode.window.showInformationMessage('创建项目功能已移除');
			}
		);

		const tmakeBuild = vscode.commands.registerCommand(
			'tiecode.tmakeBuild',
			() => {
				vscode.window.showInformationMessage('TMake 构建功能已移除');
			}
		);

		const tmakeClean = vscode.commands.registerCommand(
			'tiecode.tmakeClean',
			() => {
				vscode.window.showInformationMessage('TMake 清理功能已移除');
			}
		);

		const tmakePrecompile = vscode.commands.registerCommand(
			'tiecode.tmakePrecompile',
			() => {
				vscode.window.showInformationMessage('TMake 预编译功能已移除');
			}
		);

		const tmakeCreateProject = vscode.commands.registerCommand(
			'tiecode.tmakeCreateProject',
			() => {
				vscode.window.showInformationMessage('创建 TMake 项目功能已移除');
			}
		);

		const tmakeCreatePlugin = vscode.commands.registerCommand(
			'tiecode.tmakeCreatePlugin',
			() => {
				vscode.window.showInformationMessage('创建 TMake 插件功能已移除');
			}
		);

		const editConfigCommand = vscode.commands.registerCommand(
			'tiecode.editProjectConfig',
			() => {
				vscode.window.showInformationMessage('编辑项目配置功能已移除');
			}
		);

		// 注册到订阅中
		context.subscriptions.push(
			openEditorCommand,
			selectPlatformCommand,
			compileCommand,
			previewCommand,
			createProjectCommand,
			tmakeBuild,
			tmakeClean,
			tmakePrecompile,
			tmakeCreateProject,
			tmakeCreatePlugin,
			editConfigCommand
		);
	}

	/**
	 * 处理平台选择
	 */
	private async handleSelectPlatform(): Promise<CompilePlatform | undefined> {
		const platforms: { label: string; description: string; value: CompilePlatform }[] = [
			{ label: 'Android', description: '编译为Android应用', value: 'Android' },
			{ label: 'Windows', description: '编译为Windows应用', value: 'Windows' },
			{ label: 'Linux', description: '编译为Linux应用', value: 'Linux' },
			{ label: 'HarmonyOS', description: '编译为HarmonyOS应用', value: 'HarmonyOS' },
			{ label: 'iOS', description: '编译为iOS应用', value: 'iOS' },
			{ label: 'Apple', description: '编译为Apple应用', value: 'Apple' },
			{ label: 'HTML', description: '编译为HTML应用', value: 'HTML' }
		];

		const selected = await vscode.window.showQuickPick(platforms, {
			placeHolder: '选择编译目标平台',
			matchOnDescription: true
		});

		if (selected) {
			this.statusBarManager.updatePlatform(selected.value);
			vscode.window.showInformationMessage(`已选择编译平台: ${selected.label}`);
			return selected.value;
		}

		return undefined;
	}
}

