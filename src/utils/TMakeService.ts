import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import * as iconv from 'iconv-lite';
import { ProjectConfigManager } from './ProjectConfigManager';
import { CompileConfig } from '../types';
import { StatusBarManager } from '../ui/StatusBarManager';

/**
 * TMake 命令类型
 */
export type TMakeCommand = 
	| 'create'
	| 'plugin'
	| 'precompile'
	| 'compile'
	| 'build'
	| 'clean'
	| 'version'
	| 'help';

/**
 * TMake 服务
 * 负责执行 TMake 命令
 */
export class TMakeService {
	private static outputChannel: vscode.OutputChannel | null = null;
	private static currentProcess: ChildProcess | null = null;

	/**
	 * 获取输出通道
	 */
	private static getOutputChannel(): vscode.OutputChannel {
		if (!this.outputChannel) {
			this.outputChannel = vscode.window.createOutputChannel('TMake');
		}
		return this.outputChannel;
	}

	/**
	 * 获取 TMake 可执行文件路径
	 * 从项目配置中读取
	 */
	private static async getTmakePath(projectDir?: string): Promise<string | null> {
		const resolvedProjectDir = projectDir ?? this.getProjectDir();
		if (!resolvedProjectDir) {
			return null;
		}

		// 从项目配置读取
		const projectConfig = await ProjectConfigManager.readConfig(resolvedProjectDir);
		if (projectConfig && projectConfig.compiler.tmakePath) {
			let tmakePath = projectConfig.compiler.tmakePath;
			// 如果是相对路径，转换为绝对路径
			if (!path.isAbsolute(tmakePath)) {
				tmakePath = path.resolve(resolvedProjectDir, tmakePath);
			}
			if (fs.existsSync(tmakePath)) {
				return tmakePath;
			}
		}

		// 如果项目配置中没有，尝试在项目根目录查找 tmake.exe
		const defaultTmakePath = path.join(resolvedProjectDir, 'tmake.exe');
		if (fs.existsSync(defaultTmakePath)) {
			return defaultTmakePath;
		}

		return null;
	}

	/**
	 * 获取 tiecc 目录路径
	 * 优先级：项目内的 .Tiecode 文件夹 > 项目配置中的路径 > 环境变量
	 * 注意：返回路径（项目内的返回相对路径，其他的返回绝对路径）
	 */
	private static async getTieccDir(projectDir?: string): Promise<string | null> {
		const resolvedProjectDir = projectDir ?? this.getProjectDir();
		if (!resolvedProjectDir) {
			return null;
		}

		// 1. 优先检查项目内的 .Tiecode 文件夹（最优先，因为这是项目特定的）
		const tiecodeDir = path.join(resolvedProjectDir, '.Tiecode');
		if (fs.existsSync(tiecodeDir)) {
			// 返回相对路径，TMake 会在项目目录下查找
			return '.Tiecode';
		}

		// 2. 从项目配置读取
		const projectConfig = await ProjectConfigManager.readConfig(resolvedProjectDir);
		if (projectConfig && projectConfig.compiler.compilerPath) {
			let compilerPath = projectConfig.compiler.compilerPath;
			// 如果是相对路径，转换为绝对路径
			if (!path.isAbsolute(compilerPath)) {
				compilerPath = path.resolve(resolvedProjectDir, compilerPath);
			}
			if (fs.existsSync(compilerPath)) {
				// 检查是否是项目内的路径
				const relativePath = path.relative(resolvedProjectDir, compilerPath);
				if (!relativePath.startsWith('..')) {
					// 项目内的路径，返回相对路径
					return relativePath.replace(/\\/g, '/');
				}
				// 项目外的路径，返回绝对路径
				return compilerPath;
			}
		}

		// 3. 检查环境变量或默认路径
		const envTiecc = process.env.TIECC_DIR;
		if (envTiecc && fs.existsSync(envTiecc)) {
			// 确保返回绝对路径
			if (path.isAbsolute(envTiecc)) {
				return envTiecc;
			} else {
				// 如果是相对路径，转换为绝对路径
				return path.resolve(envTiecc);
			}
		}

		return null;
	}

	/**
	 * 获取项目目录（当前工作区或指定目录）
	 */
	private static getProjectDir(): string | null {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders && workspaceFolders.length > 0) {
			return workspaceFolders[0].uri.fsPath;
		}
		return null;
	}

	/**
	 * 解析并格式化输出行
	 */
	private static formatOutputLine(line: string, source: 'tiecc' | 'g++' | 'tmake'): string {
		// 检测警告
		const isWarning = /\[WARNING\]|warning:/i.test(line) || /警告/i.test(line);
		// 检测错误
		const isError = /\[ERROR\]|error:/i.test(line) || /错误|失败|失败！/i.test(line);
		// 检测成功信息
		const isSuccess = /成功|完成|Success/i.test(line) && !isError;

		let prefix = '';
		switch (source) {
			case 'tiecc':
				prefix = '[Tiecc] ';
				break;
			case 'g++':
				prefix = '[G++] ';
				break;
			case 'tmake':
				prefix = '[TMake] ';
				break;
		}

		if (isError) {
			return `❌ ${prefix}${line}`;
		} else if (isWarning) {
			return `⚠️  ${prefix}${line}`;
		} else if (isSuccess) {
			return `✅ ${prefix}${line}`;
		} else {
			return `${prefix}${line}`;
		}
	}

	/**
	 * 检测输出来源（tiecc、g++ 或 tmake）
	 */
	private static detectOutputSource(line: string): 'tiecc' | 'g++' | 'tmake' {
		// 检测 tiecc 输出
		if (/\.Tiecode[\\\/]tiecc\.exe|执行结绳编译命令|结绳编译|添加源文件|开始编译|目标平台|输出目录/i.test(line)) {
			return 'tiecc';
		}
		// 检测 g++ 输出
		if (/g\+\+|使用编译器|编译参数|\.cpp:|In function|note:|warning:|error:/i.test(line)) {
			return 'g++';
		}
		// 默认是 tmake
		return 'tmake';
	}

	/**
	 * 执行 TMake 命令
	 */
	private static async executeCommand(
		_context: vscode.ExtensionContext,
		command: TMakeCommand,
		args: string[] = [],
		options: {
			cwd?: string;
			onStdout?: (data: string) => void;
			onStderr?: (data: string) => void;
		} = {}
	): Promise<{ success: boolean; output: string; error?: string }> {
		const projectDir = options.cwd || this.getProjectDir();
		if (!projectDir) {
			throw new Error('未找到项目目录，请先打开工作区');
		}

		const tmakePath = await this.getTmakePath(projectDir);
		if (!tmakePath) {
			throw new Error('未找到 TMake 可执行文件，请在项目配置中设置 tmakePath');
		}

		const outputChannel = this.getOutputChannel();
		outputChannel.clear();
		outputChannel.show(true);
		outputChannel.appendLine(`═══════════════════════════════════════════════════════════`);
		outputChannel.appendLine(`执行命令: ${command} ${args.join(' ')}`);
		outputChannel.appendLine(`工作目录: ${projectDir}`);
		outputChannel.appendLine(`═══════════════════════════════════════════════════════════`);
		outputChannel.appendLine('');

		return new Promise((resolve, reject) => {
			const fullArgs = [command, ...args];
			// 设置环境变量以支持 UTF-8 编码
			const env: Record<string, string> = {
				...process.env as Record<string, string>,
			};
			// Windows 上设置代码页为 UTF-8
			if (process.platform === 'win32') {
				env['CHCP'] = '65001'; // UTF-8 代码页
				env['PYTHONIOENCODING'] = 'utf-8';
			}
			
			const childProcess = spawn(tmakePath, fullArgs, {
				cwd: projectDir,
				shell: true,
				env: env
			});

			this.currentProcess = childProcess;
			let stdout = '';
			let stderr = '';
			let lastSource: 'tiecc' | 'g++' | 'tmake' = 'tmake';
			let buffer = ''; // 用于缓存不完整的行

			const processOutput = (text: string, isStderr: boolean) => {
				// 将新数据添加到缓冲区
				buffer += text;
				
				// 按行处理输出
				const lines = buffer.split(/\r?\n/);
				// 保留最后一行（可能不完整）在缓冲区
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (!line.trim()) {
						// 空行也输出
						outputChannel.appendLine('');
						continue;
					}

					// 检测输出来源
					const source = this.detectOutputSource(line);
					if (source !== 'tmake') {
						lastSource = source;
					}

					// 格式化输出
					const formattedLine = this.formatOutputLine(line, lastSource);
					outputChannel.appendLine(formattedLine);
				}

				// 如果有缓冲区内容且包含完整信息，也输出（用于实时显示）
				if (buffer.trim()) {
					const source = this.detectOutputSource(buffer);
					if (source !== 'tmake') {
						lastSource = source;
					}
					// 不输出不完整的行，等待更多数据
				}
			};

			// 处理缓冲区中剩余的内容
			const flushBuffer = () => {
				if (buffer.trim()) {
					const source = this.detectOutputSource(buffer);
					const formattedLine = this.formatOutputLine(buffer, source);
					outputChannel.appendLine(formattedLine);
					buffer = '';
				}
			};

			// 解码函数：尝试多种编码
			const decodeBuffer = (buffer: Buffer): string => {
				// 首先尝试 UTF-8
				try {
					const utf8Text = buffer.toString('utf-8');
					// 检查是否包含无效字符（乱码替换字符）
					if (!/[\uFFFD]/.test(utf8Text)) {
						return utf8Text;
					}
				} catch {
					// UTF-8 解码失败
				}

				// 在 Windows 上，输出可能是 GBK/GB2312 编码
				if (process.platform === 'win32') {
					try {
						// 使用 iconv-lite 尝试 GBK 解码
						const gbkText = iconv.decode(buffer, 'gbk');
						// 检查解码后的文本是否包含中文字符（简单验证）
						if (/[\u4e00-\u9fa5]/.test(gbkText)) {
							return gbkText;
						}
						// 如果没有中文字符，可能不是 GBK，回退到 UTF-8
					} catch {
						// GBK 解码失败
					}
				}

				// 最后回退到 UTF-8（即使可能乱码）
				return buffer.toString('utf-8');
			};

			childProcess.stdout?.on('data', (data: Buffer) => {
				const text = decodeBuffer(data);
				stdout += text;
				processOutput(text, false);
				if (options.onStdout) {
					options.onStdout(text);
				}
			});

			childProcess.stderr?.on('data', (data: Buffer) => {
				const text = decodeBuffer(data);
				stderr += text;
				processOutput(text, true);
				if (options.onStderr) {
					options.onStderr(text);
				}
			});

			childProcess.on('close', (code: number | null) => {
				this.currentProcess = null;
				// 处理缓冲区中剩余的内容
				flushBuffer();
				outputChannel.appendLine('');
				outputChannel.appendLine(`═══════════════════════════════════════════════════════════`);
				if (code === 0) {
					outputChannel.appendLine('✅ 编译完成');
					resolve({ success: true, output: stdout });
				} else {
					outputChannel.appendLine('❌ 编译失败');
					resolve({ success: false, output: stdout, error: stderr });
				}
				outputChannel.appendLine(`═══════════════════════════════════════════════════════════`);
			});

			childProcess.on('error', (error: Error) => {
				this.currentProcess = null;
				outputChannel.appendLine('');
				outputChannel.appendLine(`═══════════════════════════════════════════════════════════`);
				outputChannel.appendLine(`❌ [错误] ${error.message}`);
				outputChannel.appendLine(`═══════════════════════════════════════════════════════════`);
				reject(error);
			});
		});
	}

	/**
	 * 构建编译参数
	 * 注意：TMake 只支持部分命令行参数，大部分选项应从配置文件读取
	 */
	private static buildCompileArgs(config: CompileConfig, projectDir: string): string[] {
		const args: string[] = [];

		// TMake 支持的基本参数
		if (config.outputPath) {
			args.push('--output', config.outputPath);
		}

		if (config.package) {
			args.push('--package', config.package);
		}

		// tiecc-dir 参数：优先使用相对路径（如果项目内有 .Tiecode 文件夹）
		if (config.tieccDir) {
			let tieccDirPath = config.tieccDir;
			
			// 如果项目目录存在，检查是否是项目内的 .Tiecode 文件夹
			if (projectDir && path.isAbsolute(tieccDirPath)) {
				const projectTiecodeDir = path.join(projectDir, '.Tiecode');
				// 如果是项目内的 .Tiecode 文件夹，使用相对路径
				if (path.resolve(tieccDirPath) === path.resolve(projectTiecodeDir)) {
					tieccDirPath = '.Tiecode';
				} else {
					// 其他绝对路径，检查是否可以转换为相对路径
					try {
						const relativePath = path.relative(projectDir, tieccDirPath);
						const parentLevels = relativePath.split(path.sep).filter(p => p === '..').length;
						// 如果相对路径合理（不超过3级父目录），使用相对路径
						if (parentLevels <= 3 && !relativePath.startsWith('..')) {
							// 规范化路径分隔符（使用正斜杠，跨平台兼容）
							tieccDirPath = relativePath.replace(/\\/g, '/');
						}
					} catch {
						// 转换失败，使用绝对路径
						tieccDirPath = path.normalize(tieccDirPath);
					}
				}
			} else if (!path.isAbsolute(tieccDirPath)) {
				// 已经是相对路径，直接使用（规范化路径分隔符）
				tieccDirPath = tieccDirPath.replace(/\\/g, '/');
			} else {
				// 绝对路径，规范化
				tieccDirPath = path.normalize(tieccDirPath);
			}
			
			args.push('--tiecc-dir', tieccDirPath);
		}

		if (config.configPath) {
			args.push('--config', config.configPath);
		}

		if (config.watch) {
			args.push('--watch');
		}

		// 注意：以下参数 TMake 不支持通过命令行传递，应从配置文件读取
		// --debug, --release, --optimize, --log-level, --platform, --hard-mode
		// 这些选项应该在项目的 编译配置.tmake 文件中设置

		if (config.extraArgs) {
			args.push(...config.extraArgs);
		}

		return args;
	}

	/**
	 * 编译项目
	 */
	public static async compile(
		context: vscode.ExtensionContext,
		config: CompileConfig,
		statusBarManager?: StatusBarManager
	): Promise<boolean> {
		try {
			if (statusBarManager) {
				statusBarManager.updateStatus('compiling');
			}

			const projectDir = config.tmakeProjectDir || this.getProjectDir();
			if (!projectDir) {
				throw new Error('未找到项目目录');
			}

			// 获取 tiecc 目录
			const tieccDir = config.tieccDir || await this.getTieccDir(projectDir);
			if (tieccDir) {
				config.tieccDir = tieccDir;
			}

			const args = this.buildCompileArgs(config, projectDir);
			const result = await this.executeCommand(context, 'compile', args, {
				cwd: projectDir
			});

			if (statusBarManager) {
				if (result.success) {
					statusBarManager.updateStatus('success');
					vscode.window.showInformationMessage('编译成功！');
				} else {
					statusBarManager.updateStatus('error');
					vscode.window.showErrorMessage('编译失败，请查看输出面板');
				}
			}

			return result.success;
		} catch (error) {
			if (statusBarManager) {
				statusBarManager.updateStatus('error');
			}
			const errorMsg = error instanceof Error ? error.message : '编译失败';
			vscode.window.showErrorMessage(`编译错误: ${errorMsg}`);
			return false;
		}
	}

	/**
	 * 构建项目（清理并编译）
	 */
	public static async build(
		context: vscode.ExtensionContext,
		config: CompileConfig,
		statusBarManager?: StatusBarManager
	): Promise<boolean> {
		try {
			if (statusBarManager) {
				statusBarManager.updateStatus('compiling');
			}

			const projectDir = config.tmakeProjectDir || this.getProjectDir();
			if (!projectDir) {
				throw new Error('未找到项目目录');
			}

			// 获取 tiecc 目录
			const tieccDir = config.tieccDir || await this.getTieccDir(projectDir);
			if (tieccDir) {
				config.tieccDir = tieccDir;
			}

			const args = this.buildCompileArgs(config, projectDir);
			const result = await this.executeCommand(context, 'build', args, {
				cwd: projectDir
			});

			if (statusBarManager) {
				if (result.success) {
					statusBarManager.updateStatus('success');
					vscode.window.showInformationMessage('构建成功！');
				} else {
					statusBarManager.updateStatus('error');
					vscode.window.showErrorMessage('构建失败，请查看输出面板');
				}
			}

			return result.success;
		} catch (error) {
			if (statusBarManager) {
				statusBarManager.updateStatus('error');
			}
			const errorMsg = error instanceof Error ? error.message : '构建失败';
			vscode.window.showErrorMessage(`构建错误: ${errorMsg}`);
			return false;
		}
	}

	/**
	 * 预编译
	 */
	public static async precompile(
		context: vscode.ExtensionContext
	): Promise<boolean> {
		try {
			const result = await this.executeCommand(context, 'precompile');
			if (result.success) {
				vscode.window.showInformationMessage('预编译完成');
			} else {
				vscode.window.showErrorMessage('预编译失败，请查看输出面板');
			}
			return result.success;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : '预编译失败';
			vscode.window.showErrorMessage(`预编译错误: ${errorMsg}`);
			return false;
		}
	}

	/**
	 * 清理构建产物
	 */
	public static async clean(
		context: vscode.ExtensionContext
	): Promise<boolean> {
		try {
			const result = await this.executeCommand(context, 'clean');
			if (result.success) {
				vscode.window.showInformationMessage('清理完成');
			} else {
				vscode.window.showErrorMessage('清理失败，请查看输出面板');
			}
			return result.success;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : '清理失败';
			vscode.window.showErrorMessage(`清理错误: ${errorMsg}`);
			return false;
		}
	}

	/**
	 * 显示版本信息
	 */
	public static async version(
		context: vscode.ExtensionContext
	): Promise<void> {
		try {
			const result = await this.executeCommand(context, 'version');
			if (result.success) {
				// 版本信息已在输出面板显示
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : '获取版本失败';
			vscode.window.showErrorMessage(`版本错误: ${errorMsg}`);
		}
	}

	/**
	 * 显示帮助信息
	 */
	public static async help(
		context: vscode.ExtensionContext
	): Promise<void> {
		try {
			const result = await this.executeCommand(context, 'help');
			if (result.success) {
				// 帮助信息已在输出面板显示
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : '获取帮助失败';
			vscode.window.showErrorMessage(`帮助错误: ${errorMsg}`);
		}
	}

	/**
	 * 创建项目
	 */
	public static async createProject(
		context: vscode.ExtensionContext,
		projectName: string
	): Promise<boolean> {
		try {
			const result = await this.executeCommand(context, 'create', [projectName]);
			if (result.success) {
				vscode.window.showInformationMessage(`项目 "${projectName}" 创建成功`);
			} else {
				vscode.window.showErrorMessage('创建项目失败，请查看输出面板');
			}
			return result.success;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : '创建项目失败';
			vscode.window.showErrorMessage(`创建项目错误: ${errorMsg}`);
			return false;
		}
	}

	/**
	 * 创建插件
	 */
	public static async createPlugin(
		context: vscode.ExtensionContext,
		pluginName: string
	): Promise<boolean> {
		try {
			const result = await this.executeCommand(context, 'plugin', [pluginName]);
			if (result.success) {
				vscode.window.showInformationMessage(`插件 "${pluginName}" 创建成功`);
			} else {
				vscode.window.showErrorMessage('创建插件失败，请查看输出面板');
			}
			return result.success;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : '创建插件失败';
			vscode.window.showErrorMessage(`创建插件错误: ${errorMsg}`);
			return false;
		}
	}

	/**
	 * 停止当前进程
	 */
	public static stop(): void {
		if (this.currentProcess) {
			this.currentProcess.kill();
			this.currentProcess = null;
		}
	}
}
