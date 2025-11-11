import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 项目基本信息
 */
export interface ProjectBasicInfo {
	/** 项目名称 */
	projectName?: string;
	/** 版本号 */
	version?: string;
	/** 输出目录 */
	outputDir?: string;
	/** 输出文件 */
	outputFile?: string;
}

/**
 * 编译器配置
 */
export interface CompilerSettings {
	/** 编译器类型 */
	compiler?: string;
	/** 优化级别 (0-3) */
	optimizeLevel?: number;
	/** 日志级别 */
	logLevel?: 'debug' | 'info' | 'warning' | 'error';
	/** 是否发布模式 */
	releaseMode?: boolean;
	/** 其他编译器参数 */
	extraArgs?: string[];
	/** 编译器路径（tiecc路径） */
	compilerPath?: string;
	/** TMake工具路径 */
	tmakePath?: string;
}

/**
 * 链接器配置
 */
export interface LinkerSettings {
	/** 链接库列表 */
	libraries?: string[];
	/** 库搜索路径 */
	libraryPaths?: string[];
	/** 链接器参数 */
	linkerArgs?: string[];
	/** 链接器路径 */
	linkerPath?: string;
}

/**
 * 项目配置（完整配置）
 */
export interface ProjectConfig {
	/** 基本信息 */
	basicInfo: ProjectBasicInfo;
	/** 编译器配置 */
	compiler: CompilerSettings;
	/** 链接器配置 */
	linker: LinkerSettings;
	/** 配置文件路径 */
	configPath?: string;
}

/**
 * Tiecode IDE 项目配置（独立于 TMake 配置）
 */
export interface TiecodeProjectConfig {
	/** 编译器路径（tiecc路径） */
	compilerPath?: string;
	/** TMake工具路径 */
	tmakePath?: string;
	/** 链接器路径 */
	linkerPath?: string;
	/** 其他 IDE 特定配置 */
	[key: string]: any;
}

/**
 * 项目配置管理器
 * 负责读取和保存项目的配置
 * - TMake 配置：编译配置.tmake（只包含 TMake 相关的配置）
 * - Tiecode IDE 配置：.tiecode.json（包含 IDE 管理的路径等配置）
 */
export class ProjectConfigManager {
	/**
	 * 获取 TMake 配置文件路径
	 */
	private static getTmakeConfigFilePath(projectDir?: string): string | null {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		const dir = projectDir || (workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : null);
		
		if (!dir) {
			return null;
		}

		const configPath = path.join(dir, '编译配置.tmake');
		return configPath;
	}

	/**
	 * 获取 Tiecode IDE 配置文件路径
	 */
	private static getTiecodeConfigFilePath(projectDir?: string): string | null {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		const dir = projectDir || (workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : null);
		
		if (!dir) {
			return null;
		}

		const configPath = path.join(dir, '.tiecode.json');
		return configPath;
	}

	/**
	 * 检查项目是否存在 TMake 配置文件
	 */
	public static hasTmakeConfigFile(projectDir?: string): boolean {
		const configPath = this.getTmakeConfigFilePath(projectDir);
		if (!configPath) {
			return false;
		}
		return fs.existsSync(configPath);
	}

	/**
	 * 检查项目是否存在 Tiecode IDE 配置文件
	 */
	public static hasTiecodeConfigFile(projectDir?: string): boolean {
		const configPath = this.getTiecodeConfigFilePath(projectDir);
		if (!configPath) {
			return false;
		}
		return fs.existsSync(configPath);
	}

	/**
	 * 检查项目是否存在配置文件（任一）
	 */
	public static hasConfigFile(projectDir?: string): boolean {
		return this.hasTmakeConfigFile(projectDir) || this.hasTiecodeConfigFile(projectDir);
	}

	/**
	 * 读取项目配置（合并 TMake 配置和 Tiecode IDE 配置）
	 */
	public static async readConfig(projectDir?: string): Promise<ProjectConfig | null> {
		const tmakeConfigPath = this.getTmakeConfigFilePath(projectDir);
		const tiecodeConfigPath = this.getTiecodeConfigFilePath(projectDir);

		// 如果两个配置文件都不存在，返回 null
		if ((!tmakeConfigPath || !fs.existsSync(tmakeConfigPath)) && 
			(!tiecodeConfigPath || !fs.existsSync(tiecodeConfigPath))) {
			return null;
		}

		const config: ProjectConfig = {
			basicInfo: {},
			compiler: {},
			linker: {}
		};

		// 读取 TMake 配置
		if (tmakeConfigPath && fs.existsSync(tmakeConfigPath)) {
			try {
				const content = await fs.promises.readFile(tmakeConfigPath, 'utf-8');
				const tmakeConfig = this.parseTmakeConfig(content);
				// 合并 TMake 配置
				Object.assign(config.basicInfo, tmakeConfig.basicInfo);
				Object.assign(config.compiler, tmakeConfig.compiler);
				Object.assign(config.linker, tmakeConfig.linker);
			} catch (error) {
				console.error('读取 TMake 配置文件失败:', error);
			}
		}

		// 读取 Tiecode IDE 配置
		if (tiecodeConfigPath && fs.existsSync(tiecodeConfigPath)) {
			try {
				const tiecodeConfig = await this.readTiecodeConfig(projectDir);
				if (tiecodeConfig) {
					// 合并 Tiecode IDE 配置（路径信息）
					if (tiecodeConfig.compilerPath) {
						config.compiler.compilerPath = tiecodeConfig.compilerPath;
					}
					if (tiecodeConfig.tmakePath) {
						config.compiler.tmakePath = tiecodeConfig.tmakePath;
					}
					if (tiecodeConfig.linkerPath) {
						config.linker.linkerPath = tiecodeConfig.linkerPath;
					}
				}
			} catch (error) {
				console.error('读取 Tiecode IDE 配置文件失败:', error);
			}
		}

		return config;
	}

	/**
	 * 读取 Tiecode IDE 配置文件
	 */
	public static async readTiecodeConfig(projectDir?: string): Promise<TiecodeProjectConfig | null> {
		const configPath = this.getTiecodeConfigFilePath(projectDir);
		if (!configPath || !fs.existsSync(configPath)) {
			return null;
		}

		try {
			const content = await fs.promises.readFile(configPath, 'utf-8');
			return JSON.parse(content) as TiecodeProjectConfig;
		} catch (error) {
			console.error('读取 Tiecode IDE 配置文件失败:', error);
			return null;
		}
	}

	/**
	 * 保存 Tiecode IDE 配置文件
	 */
	public static async saveTiecodeConfig(
		config: TiecodeProjectConfig,
		projectDir?: string
	): Promise<boolean> {
		const configPath = this.getTiecodeConfigFilePath(projectDir);
		if (!configPath) {
			throw new Error('无法确定项目目录');
		}

		try {
			const content = JSON.stringify(config, null, 2);
			await fs.promises.writeFile(configPath, content, 'utf-8');
			return true;
		} catch (error) {
			console.error('保存 Tiecode IDE 配置文件失败:', error);
			throw error;
		}
	}

	/**
	 * 解析 TMake 配置文件内容（不包含路径信息）
	 */
	private static parseTmakeConfig(content: string): ProjectConfig {
		const config: ProjectConfig = {
			basicInfo: {},
			compiler: {},
			linker: {}
		};

		const lines = content.split(/\r?\n/);
		
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
				continue;
			}

			// 解析设置变量
			const setVarMatch = trimmed.match(/设置变量\("([^"]+)",\s*"([^"]+)"\)/);
			if (setVarMatch) {
				const [, key, value] = setVarMatch;
				if (key === '项目名称') {
					config.basicInfo.projectName = value;
				} else if (key === '版本号') {
					config.basicInfo.version = value;
				} else if (key === '输出目录') {
					config.basicInfo.outputDir = value;
				}
				continue;
			}

			// 解析设置输出文件
			const setOutputMatch = trimmed.match(/设置输出文件\("([^"]+)"\)/);
			if (setOutputMatch) {
				config.basicInfo.outputFile = setOutputMatch[1];
				continue;
			}

			// 解析优化级别
			const optimizeMatch = trimmed.match(/设置优化级别\((\d+)\)/);
			if (optimizeMatch) {
				config.compiler.optimizeLevel = parseInt(optimizeMatch[1], 10);
				continue;
			}

			// 解析日志级别
			const logLevelMatch = trimmed.match(/设置日志级别\("([^"]+)"\)/);
			if (logLevelMatch) {
				const level = logLevelMatch[1].toLowerCase();
				if (['debug', 'info', 'warning', 'error'].includes(level)) {
					config.compiler.logLevel = level as 'debug' | 'info' | 'warning' | 'error';
				}
				continue;
			}

			// 解析编译器
			const compilerMatch = trimmed.match(/设置编译器\("([^"]+)"\)/);
			if (compilerMatch) {
				config.compiler.compiler = compilerMatch[1];
				continue;
			}

			// 注意：不再解析路径信息，这些信息存储在 .tiecode.json 中
			// 解析发布模式
			if (trimmed.includes('发布模式()')) {
				config.compiler.releaseMode = true;
				continue;
			}
		}

		return config;
	}

	/**
	 * 保存项目配置（分别保存 TMake 配置和 Tiecode IDE 配置）
	 */
	public static async saveConfig(config: ProjectConfig, projectDir?: string): Promise<boolean> {
		try {
			// 保存 TMake 配置（不包含路径信息）
			const tmakeConfigPath = this.getTmakeConfigFilePath(projectDir);
			if (tmakeConfigPath) {
				const tmakeContent = this.generateTmakeConfigContent(config);
				await fs.promises.writeFile(tmakeConfigPath, tmakeContent, 'utf-8');
			}

			// 保存 Tiecode IDE 配置（只包含路径信息）
			const tiecodeConfig: TiecodeProjectConfig = {};
			if (config.compiler.compilerPath) {
				tiecodeConfig.compilerPath = config.compiler.compilerPath;
			}
			if (config.compiler.tmakePath) {
				tiecodeConfig.tmakePath = config.compiler.tmakePath;
			}
			if (config.linker.linkerPath) {
				tiecodeConfig.linkerPath = config.linker.linkerPath;
			}
			await this.saveTiecodeConfig(tiecodeConfig, projectDir);

			return true;
		} catch (error) {
			console.error('保存配置文件失败:', error);
			throw error;
		}
	}

	/**
	 * 生成 TMake 配置文件内容（不包含路径信息）
	 */
	private static generateTmakeConfigContent(config: ProjectConfig): string {
		const lines: string[] = [];

		// TMake版本和结绳编译器版本（固定值，可以从现有文件读取或使用默认值）
		lines.push('TMake版本("1.0.0")');
		lines.push('结绳编译器版本("4.6")');
		lines.push('');

		// 基本信息
		if (config.basicInfo.projectName) {
			lines.push(`设置变量("项目名称", "${config.basicInfo.projectName}")`);
		}
		if (config.basicInfo.version) {
			lines.push(`设置变量("版本号", "${config.basicInfo.version}")`);
		}
		if (config.basicInfo.outputDir) {
			lines.push(`设置变量("输出目录", "${config.basicInfo.outputDir}")`);
		}
		if (config.basicInfo.outputFile) {
			lines.push(`设置输出文件("${config.basicInfo.outputFile}")`);
		}

		// 编译器配置
		if (config.compiler.optimizeLevel !== undefined) {
			lines.push(`设置优化级别(${config.compiler.optimizeLevel})`);
		}
		if (config.compiler.logLevel) {
			lines.push(`设置日志级别("${config.compiler.logLevel}")`);
		}
		if (config.compiler.compiler) {
			lines.push(`设置编译器("${config.compiler.compiler}")`);
		}
		// 注意：路径信息不写入 TMake 配置文件，而是存储在 .tiecode.json 中

		lines.push('');

		// 编译程序（固定格式）
		lines.push('编译程序(读取源文件列表("./"), 输出文件)');

		// 发布模式
		if (config.compiler.releaseMode) {
			lines.push('发布模式()');
		}

		return lines.join('\n');
	}

	/**
	 * 获取项目目录
	 */
	public static getProjectDir(): string | null {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders && workspaceFolders.length > 0) {
			return workspaceFolders[0].uri.fsPath;
		}
		return null;
	}

	/**
	 * 验证 tiecc 目录路径
	 */
	public static async validateCompilerPath(dirPath: string): Promise<{ valid: boolean; error?: string }> {
		if (!dirPath) {
			return { valid: false, error: '路径不能为空' };
		}
		try {
			const stats = await fs.promises.stat(dirPath);
			if (!stats.isDirectory()) {
				return { valid: false, error: '编译器路径必须是目录' };
			}
			return { valid: true };
		} catch {
			return { valid: false, error: '路径不存在或无法访问' };
		}
	}

	/**
	 * 验证 TMake 可执行文件路径
	 */
	public static async validateTmakePath(filePath: string): Promise<{ valid: boolean; error?: string }> {
		if (!filePath) {
			return { valid: false, error: '路径不能为空' };
		}
		try {
			const stats = await fs.promises.stat(filePath);
			if (!stats.isFile()) {
				return { valid: false, error: 'TMake 路径必须是文件' };
			}
			const ext = path.extname(filePath).toLowerCase();
			if (ext !== '.exe') {
				return { valid: false, error: 'TMake 必须是 .exe 文件' };
			}
			return { valid: true };
		} catch {
			return { valid: false, error: '文件不存在或无法访问' };
		}
	}

	/**
	 * 验证任意路径
	 */
	public static async validatePath(targetPath: string, isDirectory: boolean): Promise<{ valid: boolean; error?: string }> {
		if (!targetPath) {
			return { valid: false, error: '路径不能为空' };
		}
		try {
			const stats = await fs.promises.stat(targetPath);
			if (isDirectory && !stats.isDirectory()) {
				return { valid: false, error: '路径必须是目录' };
			}
			if (!isDirectory && !stats.isFile()) {
				return { valid: false, error: '路径必须是文件' };
			}
			return { valid: true };
		} catch {
			return { valid: false, error: '路径不存在或无法访问' };
		}
	}
}
