import * as vscode from 'vscode';
import { TiecodeWebviewProvider } from '../webview/TiecodeWebviewProvider';
import { StatusBarManager } from './StatusBarManager';
import { CompilePlatform, CompileConfig } from '../types';
import { ProjectConfigManager } from '../utils/ProjectConfigManager';
import { TMakeService } from '../utils/TMakeService';

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
	 * 检查项目是否已配置
	 */
	private async checkProjectConfig(): Promise<boolean> {
		const projectDir = ProjectConfigManager.getProjectDir();
		if (!projectDir) {
			return false;
		}
		const config = await ProjectConfigManager.readConfig(projectDir);
		return config !== null && !!(config.compiler.compilerPath || config.compiler.tmakePath);
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

		// 编译命令
		const compileCommand = vscode.commands.registerCommand(
			'tiecode.compile',
			async () => {
				try {
					// 检查项目是否已配置
					const isConfigured = await this.checkProjectConfig();
					if (!isConfigured) {
						vscode.window.showWarningMessage('请先在项目配置中设置编译器和 TMake 路径');
						TiecodeWebviewProvider.createOrShow(context);
						return;
					}

					// 获取当前平台
					const platform = this.statusBarManager.getCurrentPlatform();
					
					// 构建编译配置
					const config: CompileConfig = {
						platform: platform,
						release: false, // 默认调试模式
						optimize: 1
					};

					// 执行编译
					await TMakeService.compile(context, config, this.statusBarManager);
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : '编译失败';
					vscode.window.showErrorMessage(`编译错误: ${errorMsg}`);
				}
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
			async () => {
				try {
					// 打开 Webview 并显示创建项目界面
					TiecodeWebviewProvider.createOrShow(context);
					// 发送消息显示创建项目界面
					setTimeout(() => {
						TiecodeWebviewProvider.postMessage({
							command: 'showCreateProject'
						});
					}, 500);
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : '未知错误';
					vscode.window.showErrorMessage(`打开创建项目界面失败: ${errorMsg}`);
				}
			}
		);

		// TMake 构建命令
		const tmakeBuild = vscode.commands.registerCommand(
			'tiecode.tmakeBuild',
			async () => {
				try {
					// 检查项目是否已配置
					const isConfigured = await this.checkProjectConfig();
					if (!isConfigured) {
						vscode.window.showWarningMessage('请先在项目配置中设置编译器和 TMake 路径');
						TiecodeWebviewProvider.createOrShow(context);
						return;
					}

					// 获取当前平台
					const platform = this.statusBarManager.getCurrentPlatform();
					
					// 构建编译配置
					const config: CompileConfig = {
						platform: platform,
						release: false,
						optimize: 1
					};

					// 执行构建
					await TMakeService.build(context, config, this.statusBarManager);
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : '构建失败';
					vscode.window.showErrorMessage(`构建错误: ${errorMsg}`);
				}
			}
		);

		// TMake 清理命令
		const tmakeClean = vscode.commands.registerCommand(
			'tiecode.tmakeClean',
			async () => {
				try {
					// 检查项目是否已配置
					const isConfigured = await this.checkProjectConfig();
					if (!isConfigured) {
						vscode.window.showWarningMessage('请先在项目配置中设置编译器和 TMake 路径');
						return;
					}
					await TMakeService.clean(context);
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : '清理失败';
					vscode.window.showErrorMessage(`清理错误: ${errorMsg}`);
				}
			}
		);

		// TMake 预编译命令
		const tmakePrecompile = vscode.commands.registerCommand(
			'tiecode.tmakePrecompile',
			async () => {
				try {
					// 检查项目是否已配置
					const isConfigured = await this.checkProjectConfig();
					if (!isConfigured) {
						vscode.window.showWarningMessage('请先在项目配置中设置编译器和 TMake 路径');
						return;
					}
					await TMakeService.precompile(context);
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : '预编译失败';
					vscode.window.showErrorMessage(`预编译错误: ${errorMsg}`);
				}
			}
		);

		// TMake 创建项目命令
		const tmakeCreateProject = vscode.commands.registerCommand(
			'tiecode.tmakeCreateProject',
			async () => {
				try {
					const projectName = await vscode.window.showInputBox({
						prompt: '请输入项目名称',
						placeHolder: '例如: MyProject',
						validateInput: (value) => {
							if (!value || value.trim().length === 0) {
								return '项目名称不能为空';
							}
							return null;
						}
					});

					if (projectName) {
						await TMakeService.createProject(context, projectName);
					}
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : '创建项目失败';
					vscode.window.showErrorMessage(`创建项目错误: ${errorMsg}`);
				}
			}
		);

		// TMake 创建插件命令
		const tmakeCreatePlugin = vscode.commands.registerCommand(
			'tiecode.tmakeCreatePlugin',
			async () => {
				try {
					// 检查项目是否已配置
					const isConfigured = await this.checkProjectConfig();
					if (!isConfigured) {
						vscode.window.showWarningMessage('请先在项目配置中设置编译器和 TMake 路径');
						return;
					}

					const pluginName = await vscode.window.showInputBox({
						prompt: '请输入插件名称',
						placeHolder: '例如: MyPlugin',
						validateInput: (value) => {
							if (!value || value.trim().length === 0) {
								return '插件名称不能为空';
							}
							return null;
						}
					});

					if (pluginName) {
						await TMakeService.createPlugin(context, pluginName);
					}
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : '创建插件失败';
					vscode.window.showErrorMessage(`创建插件错误: ${errorMsg}`);
				}
			}
		);

		// TMake 版本命令
		const tmakeVersion = vscode.commands.registerCommand(
			'tiecode.tmakeVersion',
			async () => {
				try {
					// 检查项目是否已配置
					const isConfigured = await this.checkProjectConfig();
					if (!isConfigured) {
						vscode.window.showWarningMessage('请先在项目配置中设置编译器和 TMake 路径');
						return;
					}
					await TMakeService.version(context);
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : '获取版本失败';
					vscode.window.showErrorMessage(`版本错误: ${errorMsg}`);
				}
			}
		);

		// TMake 帮助命令
		const tmakeHelp = vscode.commands.registerCommand(
			'tiecode.tmakeHelp',
			async () => {
				try {
					// 检查项目是否已配置
					const isConfigured = await this.checkProjectConfig();
					if (!isConfigured) {
						vscode.window.showWarningMessage('请先在项目配置中设置编译器和 TMake 路径');
						return;
					}
					await TMakeService.help(context);
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : '获取帮助失败';
					vscode.window.showErrorMessage(`帮助错误: ${errorMsg}`);
				}
			}
		);

		const editConfigCommand = vscode.commands.registerCommand(
			'tiecode.editProjectConfig',
			async () => {
				try {
					// 打开 Webview 并显示项目配置界面
					TiecodeWebviewProvider.createOrShow(context);
					// 发送消息显示项目配置界面
					setTimeout(() => {
						TiecodeWebviewProvider.postMessage({
							command: 'showProjectConfig'
						});
					}, 500);
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : '未知错误';
					vscode.window.showErrorMessage(`打开项目配置界面失败: ${errorMsg}`);
				}
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
			tmakeVersion,
			tmakeHelp,
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

