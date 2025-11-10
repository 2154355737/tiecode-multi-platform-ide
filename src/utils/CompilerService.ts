import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { CompileConfig } from '../types';
import { ProjectConfigManager } from './ProjectConfigManager';

/**
 * 编译结果
 */
export interface CompileResult {
	success: boolean;
	output?: string;
	error?: string;
	exitCode?: number;
}

/**
 * 编译器服务
 * 负责调用 tiecc.exe 进行编译
 */
export class CompilerService {
	private static readonly COMPILER_EXE = 'tiecc.exe';
	private static readonly COMPILER_PATH = path.join(
		__dirname,
		'..',
		'..',
		'doce',
		'windows编译器',
		'windows',
		CompilerService.COMPILER_EXE
	);

	/**
	 * 获取编译器路径
	 */
	private static getCompilerPath(): string {
		// 尝试使用扩展路径
		const extensionPath = vscode.extensions.getExtension('tiecode.tiecode-multi-platform-ide')?.extensionPath;
		if (extensionPath) {
			const compilerPath = path.join(
				extensionPath,
				'doce',
				'windows编译器',
				'windows',
				CompilerService.COMPILER_EXE
			);
			if (fs.existsSync(compilerPath)) {
				return compilerPath;
			}
		}

		// 尝试使用 __dirname 的相对路径（开发环境）
		const devPath = path.join(__dirname, '..', '..', 'doce', 'windows编译器', 'windows', CompilerService.COMPILER_EXE);
		if (fs.existsSync(devPath)) {
			return devPath;
		}

		// 回退到原始路径
		return CompilerService.COMPILER_PATH;
	}

	/**
	 * 将平台名称转换为编译器识别的格式
	 */
	private static mapPlatformToCompiler(platform: string): string {
		const platformMap: Record<string, string> = {
			'Android': 'android',
			'Windows': 'windows',
			'Linux': 'linux',
			'HarmonyOS': 'harmony',
			'iOS': 'ios',
			'Apple': 'apple',
			'HTML': 'html'
		};
		return platformMap[platform] || platform.toLowerCase();
	}

	/**
	 * 获取标准库路径
	 */
	private static getStdlibPath(): string {
		// 尝试使用扩展路径
		const extensionPath = vscode.extensions.getExtension('tiecode.tiecode-multi-platform-ide')?.extensionPath;
		if (extensionPath) {
			const stdlibPath = path.join(
				extensionPath,
				'doce',
				'windows编译器',
				'windows',
				'stdlib'
			);
			if (fs.existsSync(stdlibPath)) {
				return stdlibPath;
			}
		}

		// 尝试使用 __dirname 的相对路径（开发环境）
		const devPath = path.join(__dirname, '..', '..', 'doce', 'windows编译器', 'windows', 'stdlib');
		if (fs.existsSync(devPath)) {
			return devPath;
		}

		// 回退到原始路径
		return path.join(__dirname, '..', '..', 'doce', 'windows编译器', 'windows', 'stdlib');
	}

	/**
	 * 查找标准库中的 .t 源文件
	 */
	private static findStdlibFiles(): string[] {
		const stdlibFiles: string[] = [];
		const stdlibPath = CompilerService.getStdlibPath();

		if (!fs.existsSync(stdlibPath)) {
			console.warn(`标准库路径不存在: ${stdlibPath}`);
			return stdlibFiles;
		}

		try {
			const entries = fs.readdirSync(stdlibPath, { withFileTypes: true });
			for (const entry of entries) {
				if (entry.isFile() && entry.name.endsWith('.t')) {
					const fullPath = path.join(stdlibPath, entry.name);
					stdlibFiles.push(fullPath);
				}
			}
			// 按文件名排序，确保编译顺序一致
			stdlibFiles.sort();
		} catch (error) {
			console.error(`读取标准库目录失败: ${stdlibPath}`, error);
		}

		return stdlibFiles;
	}

	/**
	 * 查找项目中的 .t 源文件
	 * 注意：排除 stdlib 目录，因为标准库会从扩展目录中自动包含
	 */
	private static findSourceFiles(workspacePath: string): string[] {
		const sourceFiles: string[] = [];
		
		function walkDir(dir: string): void {
			try {
				const entries = fs.readdirSync(dir, { withFileTypes: true });
				for (const entry of entries) {
					const fullPath = path.join(dir, entry.name);
					
					// 跳过 node_modules、dist、.git、stdlib 等目录
					if (entry.isDirectory()) {
						const dirName = entry.name.toLowerCase();
						if (dirName === 'node_modules' || dirName === 'dist' || 
							dirName === '.git' || dirName === '.vscode' ||
							dirName === 'stdlib' || // 排除项目中的标准库目录
							dirName.startsWith('.')) {
							continue;
						}
						walkDir(fullPath);
					} else if (entry.isFile() && entry.name.endsWith('.t')) {
						sourceFiles.push(fullPath);
					}
				}
			} catch (error) {
				console.error(`读取目录失败: ${dir}`, error);
			}
		}

		walkDir(workspacePath);
		return sourceFiles;
	}

	/**
	 * 编译项目
	 */
	public static async compile(
		config: CompileConfig,
		progress?: vscode.Progress<{ message?: string; increment?: number }>
	): Promise<CompileResult> {
		return new Promise(async (resolve) => {
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders || workspaceFolders.length === 0) {
				resolve({
					success: false,
					error: '未找到工作区文件夹'
				});
				return;
			}

			const workspacePath = workspaceFolders[0].uri.fsPath;
			
			// 加载项目配置并合并到编译配置
			const projectConfig = await ProjectConfigManager.loadConfig(workspacePath);
			const mergedConfig = ProjectConfigManager.mergeConfig(projectConfig, config);
			
			const compilerPath = CompilerService.getCompilerPath();

			// 检查编译器是否存在
			if (!fs.existsSync(compilerPath)) {
				resolve({
					success: false,
					error: `编译器未找到: ${compilerPath}`
				});
				return;
			}

			// 查找标准库文件
			const stdlibFiles = CompilerService.findStdlibFiles();
			progress?.report({ increment: 5, message: `找到 ${stdlibFiles.length} 个标准库文件...` });

			// 查找项目源文件
			const sourceFiles = CompilerService.findSourceFiles(workspacePath);
			if (sourceFiles.length === 0) {
				resolve({
					success: false,
					error: '未找到 .t 源文件'
				});
				return;
			}

			progress?.report({ increment: 5, message: `找到 ${sourceFiles.length} 个项目源文件...` });

			// 如果加载了项目配置，显示提示
			if (projectConfig) {
				progress?.report({ increment: 2, message: '已加载项目配置...' });
			}

			// 构建编译命令参数（使用合并后的配置）
			const args: string[] = [];

			// 输出目录（使用合并后的配置）
			// 如果用户指定的是相对路径，保持相对路径；否则使用绝对路径
			if (mergedConfig.outputPath) {
				// 检查是否是相对路径
				if (!path.isAbsolute(mergedConfig.outputPath)) {
					args.push('-o', mergedConfig.outputPath);
				} else {
					// 绝对路径，如果包含空格则加引号
					args.push('-o', mergedConfig.outputPath.includes(' ') ? `"${mergedConfig.outputPath}"` : mergedConfig.outputPath);
				}
			} else {
				// 默认使用相对路径（相对于工作目录）
				const defaultOutput = path.join('dist', mergedConfig.platform.toLowerCase());
				args.push('-o', defaultOutput);
			}

			// 包名（使用合并后的配置）
			if (mergedConfig.package) {
				args.push('-p', mergedConfig.package);
			}

			// 调试/发布模式（使用合并后的配置）
			if (mergedConfig.release) {
				args.push('--release');
			} else {
				args.push('--debug');
			}

			// 硬输出模式（使用合并后的配置）
			if (mergedConfig.hardMode) {
				args.push('--hard-mode');
			}

			// 优化级别（使用合并后的配置）
			if (mergedConfig.optimize !== undefined) {
				args.push('--optimize', mergedConfig.optimize.toString());
			}

			// 禁用lint（使用合并后的配置）
			if (mergedConfig.disableLint && mergedConfig.disableLint.length > 0) {
				for (const lint of mergedConfig.disableLint) {
					args.push('--disable-lint', lint);
				}
			}

			// 日志级别（使用合并后的配置，默认使用 info）
			const logLevel = mergedConfig.logLevel || 'info';
			args.push('--log-level', logLevel);

			// 平台（使用合并后的配置）
			const platformArg = CompilerService.mapPlatformToCompiler(mergedConfig.platform);
			args.push('--platform', platformArg);

			// 行号表（使用合并后的配置）
			if (mergedConfig.lineMap) {
				args.push('--line-map', mergedConfig.lineMap);
			}

			// 添加源文件：先添加标准库文件，再添加项目源文件
			// 标准库应该先编译，因为项目代码可能依赖标准库
			if (stdlibFiles.length > 0) {
				// 标准库文件在扩展目录中，使用绝对路径
				// 如果路径包含空格，则使用引号包裹
				for (const file of stdlibFiles) {
					if (file.includes(' ')) {
						args.push(`"${file}"`);
					} else {
						args.push(file);
					}
				}
			}
			
			// 项目源文件使用相对路径（相对于工作目录）
			// 这样更符合编译器的使用习惯
			for (const file of sourceFiles) {
				const relativePath = path.relative(workspacePath, file);
				// 将反斜杠转换为正斜杠（Windows 上更兼容）
				const normalizedPath = relativePath.replace(/\\/g, '/');
				if (normalizedPath.includes(' ')) {
					args.push(`"${normalizedPath}"`);
				} else {
					args.push(normalizedPath);
				}
			}

			progress?.report({ increment: 20, message: '启动编译器...' });

			// 创建输出通道
			const outputChannel = vscode.window.createOutputChannel('Tiecode 编译器');
			outputChannel.clear();
			outputChannel.appendLine(`编译器路径: ${compilerPath}`);
			outputChannel.appendLine(`工作目录: ${workspacePath}`);
			
			// 显示项目配置信息
			if (projectConfig) {
				outputChannel.appendLine('项目配置: 已加载');
				if (projectConfig.defaultPlatform) {
					outputChannel.appendLine(`  默认平台: ${projectConfig.defaultPlatform}`);
				}
				if (projectConfig.defaultPackage) {
					outputChannel.appendLine(`  默认包名: ${projectConfig.defaultPackage}`);
				}
			} else {
				outputChannel.appendLine('项目配置: 未找到，使用默认配置');
			}
			outputChannel.appendLine('');
			
			// 显示文件信息
			if (stdlibFiles.length > 0) {
				outputChannel.appendLine(`标准库文件 (${stdlibFiles.length} 个，来自扩展目录，使用绝对路径):`);
				stdlibFiles.forEach(file => {
					outputChannel.appendLine(`  - ${file}`);
				});
			}
			
			outputChannel.appendLine(`项目源文件 (${sourceFiles.length} 个，已排除 stdlib 目录，使用相对路径):`);
			sourceFiles.forEach(file => {
				const relativePath = path.relative(workspacePath, file).replace(/\\/g, '/');
				outputChannel.appendLine(`  - ${relativePath} (${file})`);
			});
			
			if (stdlibFiles.length === 0) {
				outputChannel.appendLine('警告: 未找到标准库文件，编译可能会失败');
			}
			
			outputChannel.appendLine('---');
			outputChannel.appendLine('编译命令:');
			outputChannel.appendLine(`${compilerPath} ${args.join(' ')}`);
			outputChannel.appendLine('---');
			outputChannel.appendLine('开始编译...');
			outputChannel.appendLine('');
			outputChannel.show(true);

			// 执行编译
			// 注意：当使用 shell: true 时，第一个参数应该是命令本身
			// 路径中的引号会在 shell 中正确处理
			// 确保编译器能找到 DLL，将编译器目录添加到 PATH
			const compilerDir = path.dirname(compilerPath);
			const compileProcess = spawn(compilerPath, args, {
				cwd: workspacePath,
				shell: true,
				env: {
					...process.env,
					// 确保编译器能找到 DLL（libtiec.dll）
					PATH: compilerDir + path.delimiter + (process.env.PATH || '')
				}
			});

			let stdout = '';
			let stderr = '';

			compileProcess.stdout.on('data', (data) => {
				const text = data.toString();
				stdout += text;
				outputChannel.append(text);
				// 尝试从输出中提取进度信息
				if (text.includes('编译') || text.includes('Compiling')) {
					progress?.report({ message: '编译中...' });
				}
			});

			compileProcess.stderr.on('data', (data) => {
				const text = data.toString();
				stderr += text;
				// 错误信息用不同颜色显示
				outputChannel.append(text);
				progress?.report({ message: '编译中（有警告/错误）...' });
			});

			compileProcess.on('error', (error) => {
				const errorMsg = `编译过程出错: ${error.message}`;
				outputChannel.appendLine(`错误: ${errorMsg}`);
				resolve({
					success: false,
					error: errorMsg,
					output: stdout,
					exitCode: -1
				});
			});

			compileProcess.on('close', (code) => {
				progress?.report({ increment: 100, message: code === 0 ? '编译完成' : '编译失败' });
				
				const success = code === 0;
				const result: CompileResult = {
					success,
					output: stdout,
					error: stderr || (success ? undefined : `编译失败，退出码: ${code}`),
					exitCode: code || undefined
				};

				outputChannel.appendLine('');
				outputChannel.appendLine('---');
				if (success) {
					outputChannel.appendLine('✓ 编译成功！');
					if (mergedConfig.outputPath) {
						if (path.isAbsolute(mergedConfig.outputPath)) {
							outputChannel.appendLine(`输出目录: ${mergedConfig.outputPath}`);
						} else {
							const fullOutputPath = path.join(workspacePath, mergedConfig.outputPath);
							outputChannel.appendLine(`输出目录: ${mergedConfig.outputPath} (${fullOutputPath})`);
						}
					} else {
						const relativeOutput = path.join('dist', mergedConfig.platform.toLowerCase());
						const fullOutputPath = path.join(workspacePath, relativeOutput);
						outputChannel.appendLine(`输出目录: ${relativeOutput} (${fullOutputPath})`);
					}
				} else {
					outputChannel.appendLine(`✗ 编译失败，退出码: ${code}`);
					if (code === 3221225781 || code === -1073741571) {
						outputChannel.appendLine('提示: 这可能是访问冲突错误，请检查：');
						outputChannel.appendLine('  1. 编译器 DLL (libtiec.dll) 是否存在');
						outputChannel.appendLine('  2. 文件路径是否正确');
						outputChannel.appendLine('  3. 是否有足够的权限');
					}
					if (stderr) {
						outputChannel.appendLine('错误输出:');
						outputChannel.appendLine(stderr);
					}
				}
				outputChannel.appendLine('---');

				resolve(result);
			});
		});
	}
}

