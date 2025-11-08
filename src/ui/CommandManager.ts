import * as vscode from 'vscode';
import * as fs from 'fs';
import { TiecodeWebviewProvider } from '../webview/TiecodeWebviewProvider';
import { StatusBarManager } from './StatusBarManager';
import { CompilePlatform } from '../types';
import { ProjectGenerator } from '../utils/ProjectGenerator';

/**
 * 命令管理器
 * 负责注册和处理所有扩展命令
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
		// 打开可视化编辑器
		const openEditorCommand = vscode.commands.registerCommand(
			'tiecode.openVisualEditor',
			() => {
				TiecodeWebviewProvider.createOrShow(context);
			}
		);

		// 选择编译平台
		const selectPlatformCommand = vscode.commands.registerCommand(
			'tiecode.selectPlatform',
			async () => {
				await this.handleSelectPlatform();
			}
		);

		// 编译项目
		const compileCommand = vscode.commands.registerCommand(
			'tiecode.compile',
			async () => {
				await this.handleCompile();
			}
		);

		// 实时预览
		const previewCommand = vscode.commands.registerCommand(
			'tiecode.preview',
			() => {
				vscode.window.showInformationMessage('预览功能开发中...');
			}
		);

		// 创建结绳项目
		const createProjectCommand = vscode.commands.registerCommand(
			'tiecode.createProject',
			async (uri?: vscode.Uri) => {
				await this.handleCreateProject(uri);
			}
		);

		// 注册到订阅中
		context.subscriptions.push(
			openEditorCommand,
			selectPlatformCommand,
			compileCommand,
			previewCommand,
			createProjectCommand
		);
	}

	/**
	 * 处理平台选择
	 */
	private async handleSelectPlatform(): Promise<CompilePlatform | undefined> {
		const platforms: { label: string; description: string; value: CompilePlatform }[] = [
			{
				label: 'Android',
				description: '编译为Android应用',
				value: 'Android'
			},
			{
				label: 'Windows',
				description: '编译为Windows应用',
				value: 'Windows'
			},
			{
				label: 'Linux',
				description: '编译为Linux应用',
				value: 'Linux'
			},
			{
				label: 'HarmonyOS',
				description: '编译为HarmonyOS应用',
				value: 'HarmonyOS'
			}
		];

		const selected = await vscode.window.showQuickPick(platforms, {
			placeHolder: '选择编译目标平台',
			matchOnDescription: true
		});

		if (selected) {
			this.statusBarManager.updatePlatform(selected.value);
			vscode.window.showInformationMessage(
				`已选择编译平台: ${selected.label}`
			);
			return selected.value;
		}

		return undefined;
	}

	/**
	 * 处理编译命令
	 */
	private async handleCompile(): Promise<void> {
		// 更新状态为编译中
		this.statusBarManager.updateStatus('compiling');

		// 显示进度通知
		await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: '编译项目',
				cancellable: false
			},
			async (progress) => {
				progress.report({ increment: 0, message: '准备编译...' });

				try {
					// TODO: 实现实际的编译逻辑
					// 这里模拟编译过程
					await new Promise((resolve) => setTimeout(resolve, 1000));
					progress.report({ increment: 50, message: '编译中...' });

					await new Promise((resolve) => setTimeout(resolve, 1000));
					progress.report({ increment: 100, message: '编译完成' });

					// 更新状态为成功
					this.statusBarManager.updateStatus('success');
					vscode.window.showInformationMessage('编译成功！');

					// 3秒后恢复为就绪状态
					setTimeout(() => {
						this.statusBarManager.updateStatus('idle');
					}, 3000);
				} catch (error) {
					// 更新状态为失败
					this.statusBarManager.updateStatus('error');
					vscode.window.showErrorMessage(
						`编译失败: ${error instanceof Error ? error.message : '未知错误'}`
					);

					// 3秒后恢复为就绪状态
					setTimeout(() => {
						this.statusBarManager.updateStatus('idle');
					}, 3000);
				}
			}
		);
	}

	/**
	 * 处理创建项目命令
	 */
	private async handleCreateProject(uri?: vscode.Uri): Promise<void> {
		// 获取目标路径
		let targetPath: string | undefined;

		if (uri && uri.fsPath) {
			// 如果从右键菜单调用，使用选中的文件夹路径
			targetPath = uri.fsPath;
		} else {
			// 否则让用户选择文件夹
			const selectedFolders = await vscode.window.showOpenDialog({
				canSelectFiles: false,
				canSelectFolders: true,
				canSelectMany: false,
				openLabel: '选择项目位置'
			});

			if (!selectedFolders || selectedFolders.length === 0) {
				return;
			}

			targetPath = selectedFolders[0].fsPath;
		}

		if (!targetPath) {
			return;
		}

		// 输入项目名称
		const projectName = await vscode.window.showInputBox({
			prompt: '请输入项目名称',
			placeHolder: 'my-tiecode-project',
			validateInput: (value) => {
				if (!value || value.trim().length === 0) {
					return '项目名称不能为空';
				}
				// 检查项目名称是否合法（不能包含特殊字符）
				if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
					return '项目名称只能包含字母、数字、下划线和连字符';
				}
				return null;
			}
		});

		if (!projectName) {
			return;
		}

		// 创建项目路径
		const projectPath = vscode.Uri.joinPath(
			uri || vscode.Uri.file(targetPath),
			projectName
		).fsPath;

		// 检查目录是否已存在
		if (fs.existsSync(projectPath)) {
			const overwrite = await vscode.window.showWarningMessage(
				`目录 "${projectName}" 已存在，是否覆盖？`,
				'覆盖',
				'取消'
			);

			if (overwrite !== '覆盖') {
				return;
			}

			// 删除现有目录
			fs.rmSync(projectPath, { recursive: true, force: true });
		}

		try {
			// 创建项目
			await ProjectGenerator.createProject(projectPath);

			// 询问是否打开项目
			const openProject = await vscode.window.showInformationMessage(
				`项目 "${projectName}" 创建成功！`,
				'打开项目',
				'在资源管理器中显示'
			);

			if (openProject === '打开项目') {
				// 打开项目文件夹
				await vscode.commands.executeCommand(
					'vscode.openFolder',
					vscode.Uri.file(projectPath)
				);
			} else if (openProject === '在资源管理器中显示') {
				// 在资源管理器中显示
				await vscode.commands.executeCommand(
					'revealFileInOS',
					vscode.Uri.file(projectPath)
				);
			}
		} catch (error) {
			vscode.window.showErrorMessage(
				`创建项目失败: ${error instanceof Error ? error.message : '未知错误'}`
			);
		}
	}
}

