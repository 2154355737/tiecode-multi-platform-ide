import * as vscode from 'vscode';
import * as fs from 'fs';
import { TiecodeWebviewProvider } from '../webview/TiecodeWebviewProvider';
import { StatusBarManager } from './StatusBarManager';
import { CompilePlatform, CompileConfig, LogLevel } from '../types';
import { ProjectGenerator } from '../utils/ProjectGenerator';
import { CompilerService } from '../utils/CompilerService';
import { ProjectConfigManager, ProjectConfig } from '../utils/ProjectConfigManager';

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
		// 打开 Tiecode IDE
		const openEditorCommand = vscode.commands.registerCommand(
			'tiecode.openVisualEditor',
			() => {
				try {
					console.log('命令 tiecode.openVisualEditor 被调用');
					TiecodeWebviewProvider.createOrShow(context);
				} catch (error) {
					console.error('执行命令 tiecode.openVisualEditor 时发生错误:', error);
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

		// 编译项目
		const compileCommand = vscode.commands.registerCommand(
			'tiecode.compile',
			async (config?: CompileConfig) => {
				await this.handleCompile(config);
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

		// 编辑项目配置
		const editConfigCommand = vscode.commands.registerCommand(
			'tiecode.editProjectConfig',
			async () => {
				await this.handleEditProjectConfig();
			}
		);

		// 注册到订阅中
		context.subscriptions.push(
			openEditorCommand,
			selectPlatformCommand,
			compileCommand,
			previewCommand,
			createProjectCommand,
			editConfigCommand
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
			},
			{
				label: 'iOS',
				description: '编译为iOS应用',
				value: 'iOS'
			},
			{
				label: 'Apple',
				description: '编译为Apple应用',
				value: 'Apple'
			},
			{
				label: 'HTML',
				description: '编译为HTML应用',
				value: 'HTML'
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
	private async handleCompile(config?: CompileConfig): Promise<void> {
		// 如果没有提供配置，使用当前选择的平台
		const compileConfig: CompileConfig = config || {
			platform: this.statusBarManager.getCurrentPlatform() || 'Windows'
		};

		// 更新状态为编译中
		this.statusBarManager.updateStatus('compiling');

		// 显示进度通知
		await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: `编译项目 (${compileConfig.platform})`,
				cancellable: false
			},
			async (progress) => {
				try {
					// 调用实际的编译服务
					const result = await CompilerService.compile(compileConfig, progress);

					if (result.success) {
						// 更新状态为成功
						this.statusBarManager.updateStatus('success');
						vscode.window.showInformationMessage(
							`编译成功！平台: ${compileConfig.platform}`,
							'查看输出'
						).then((selection) => {
							if (selection === '查看输出') {
								// 输出通道会自动显示
							}
						});

						// 3秒后恢复为就绪状态
						setTimeout(() => {
							this.statusBarManager.updateStatus('idle');
						}, 3000);
					} else {
						// 更新状态为失败
						this.statusBarManager.updateStatus('error');
						const errorMsg = result.error || '编译失败';
						vscode.window.showErrorMessage(
							`编译失败: ${errorMsg}`,
							'查看详情'
						).then((selection) => {
							if (selection === '查看详情') {
								// 输出通道会自动显示错误信息
							}
						});

						// 3秒后恢复为就绪状态
						setTimeout(() => {
							this.statusBarManager.updateStatus('idle');
						}, 3000);
					}
				} catch (error) {
					// 更新状态为失败
					this.statusBarManager.updateStatus('error');
					const errorMsg = error instanceof Error ? error.message : '未知错误';
					vscode.window.showErrorMessage(`编译失败: ${errorMsg}`);

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

	/**
	 * 处理编辑项目配置命令
	 */
	private async handleEditProjectConfig(): Promise<void> {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('未找到工作区文件夹');
			return;
		}

		// 加载当前配置
		const currentConfig = await ProjectConfigManager.getCurrentConfig();

		// 创建配置编辑界面
		const config: ProjectConfig = currentConfig || {};

		// 编辑默认平台
		const platformOptions: { label: string; value: CompilePlatform }[] = [
			{ label: 'Windows', value: 'Windows' },
			{ label: 'Android', value: 'Android' },
			{ label: 'Linux', value: 'Linux' },
			{ label: 'HarmonyOS', value: 'HarmonyOS' },
			{ label: 'iOS', value: 'iOS' },
			{ label: 'Apple', value: 'Apple' },
			{ label: 'HTML', value: 'HTML' }
		];

		const selectedPlatform = await vscode.window.showQuickPick(platformOptions, {
			placeHolder: '选择默认编译平台'
		});

		if (selectedPlatform) {
			config.defaultPlatform = selectedPlatform.value;
		}

		// 编辑默认包名
		const packageName = await vscode.window.showInputBox({
			prompt: '输入默认包名（可选）',
			placeHolder: '例如: 结绳.中文',
			value: config.defaultPackage || ''
		});

		if (packageName !== undefined) {
			config.defaultPackage = packageName || undefined;
		}

		// 编辑默认输出路径
		const outputPath = await vscode.window.showInputBox({
			prompt: '输入默认输出路径（可选，相对路径）',
			placeHolder: '例如: dist/windows',
			value: config.defaultOutputPath || ''
		});

		if (outputPath !== undefined) {
			config.defaultOutputPath = outputPath || undefined;
		}

		// 编辑默认日志级别
		const logLevelOptions: { label: string; value: LogLevel }[] = [
			{ label: 'Debug', value: 'debug' },
			{ label: 'Info', value: 'info' },
			{ label: 'Warning', value: 'warning' },
			{ label: 'Error', value: 'error' }
		];

		const selectedLogLevel = await vscode.window.showQuickPick(logLevelOptions, {
			placeHolder: '选择默认日志级别'
		});

		if (selectedLogLevel) {
			config.defaultLogLevel = selectedLogLevel.value;
		}

		// 询问是否设置其他高级选项
		const setAdvancedOptions = [
			{ label: '是', value: true },
			{ label: '否', value: false }
		];
		const setAdvanced = await vscode.window.showQuickPick(setAdvancedOptions, {
			placeHolder: '是否设置高级选项（优化级别、硬输出模式等）？'
		});

		if (setAdvanced?.value) {
			// 编辑默认优化级别
			const optimizeInput = await vscode.window.showInputBox({
				prompt: '输入默认优化级别 (0-3，留空使用默认值1)',
				placeHolder: '1',
				value: config.defaultOptimize?.toString() || '1',
				validateInput: (value) => {
					if (value && (isNaN(parseInt(value)) || parseInt(value) < 0 || parseInt(value) > 3)) {
						return '优化级别必须是 0-3 之间的数字';
					}
					return null;
				}
			});

			if (optimizeInput !== undefined) {
				config.defaultOptimize = optimizeInput ? parseInt(optimizeInput) : undefined;
			}

			// 编辑默认硬输出模式
			const hardModeOptions = [
				{ label: '是', value: true },
				{ label: '否', value: false }
			];
			const hardMode = await vscode.window.showQuickPick(hardModeOptions, {
				placeHolder: '默认启用硬输出模式？'
			});

			if (hardMode) {
				config.defaultHardMode = hardMode.value;
			}

			// 编辑默认发布模式
			const releaseModeOptions = [
				{ label: '是（发布模式）', value: true },
				{ label: '否（调试模式）', value: false }
			];
			const releaseMode = await vscode.window.showQuickPick(releaseModeOptions, {
				placeHolder: '默认使用发布模式？'
			});

			if (releaseMode) {
				config.defaultRelease = releaseMode.value;
			}
		}

		// 保存配置
		const saved = await ProjectConfigManager.saveCurrentConfig(config);
		if (saved) {
			vscode.window.showInformationMessage('项目配置已保存！配置将在下次编译时生效。');
		}
	}
}

