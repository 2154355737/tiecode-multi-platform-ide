import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigManager } from './ConfigManager';

/**
 * 项目平台类型
 */
export type ProjectPlatform = 'Windows' | 'Linux' | 'Android';

/**
 * 项目创建配置
 */
export interface ProjectCreateConfig {
	/** 项目名称 */
	projectName: string;
	/** 项目版本号 */
	version: string;
	/** 输出目录 */
	outputDir: string;
	/** 输出文件名 */
	outputFile: string;
	/** 项目平台 */
	platform: ProjectPlatform;
	/** 项目路径 */
	projectPath: string;
}

/**
 * 项目创建器
 * 负责创建新项目
 */
export class ProjectCreator {
	/**
	 * 创建项目
	 */
	public static async createProject(
		context: vscode.ExtensionContext,
		config: ProjectCreateConfig
	): Promise<void> {
		try {
			// 验证配置
			const compilerConfig = ConfigManager.getConfig(context);
			if (!this.validateConfig(config, compilerConfig)) {
				throw new Error('配置验证失败');
			}

			// 确保项目路径包含项目名称
			let finalProjectPath = config.projectPath;
			const projectDirName = path.basename(finalProjectPath);
			if (projectDirName !== config.projectName) {
				// 如果选择的路径不是项目名称，则在选择的路径下创建项目名称文件夹
				finalProjectPath = path.join(config.projectPath, config.projectName);
			}

			// 更新配置中的项目路径
			config.projectPath = finalProjectPath;

			// 创建项目目录
			await this.createProjectDirectory(finalProjectPath);

			// 创建 .Tiecode 文件夹
			const tiecodeDir = path.join(finalProjectPath, '.Tiecode');
			await this.createDirectory(tiecodeDir);

			// 复制 tiecc 核心编译器
			if (config.platform === 'Windows' && compilerConfig.windowsTieccPath) {
				await this.copyDirectory(
					compilerConfig.windowsTieccPath,
					tiecodeDir
				);
			}

			// 复制 tmake 工具链
			if (config.platform === 'Windows' && compilerConfig.windowsTmakePath) {
				const tmakeFileName = path.basename(compilerConfig.windowsTmakePath);
				const tmakeDestPath = path.join(finalProjectPath, tmakeFileName);
				await this.copyFile(compilerConfig.windowsTmakePath, tmakeDestPath);
			}

			// 复制模板文件
			await this.copyTemplateFiles(config, context);

			// 创建编译配置.tmake 文件
			await this.createTmakeConfig(config, context);

			// 创建 Tiecode IDE 配置文件
			await this.createTiecodeConfig(config, context);

			vscode.window.showInformationMessage(
				`项目 "${config.projectName}" 创建成功！`
			);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : '创建项目失败';
			vscode.window.showErrorMessage(`创建项目失败: ${errorMsg}`);
			throw error;
		}
	}

	/**
	 * 验证配置
	 */
	private static validateConfig(
		config: ProjectCreateConfig,
		compilerConfig: any
	): boolean {
		if (!config.projectName || !config.projectPath) {
			return false;
		}

		if (config.platform === 'Windows') {
			if (!compilerConfig.windowsTieccPath || !compilerConfig.windowsTmakePath) {
				return false;
			}
		}

		return true;
	}

	/**
	 * 创建项目目录
	 */
	private static async createProjectDirectory(projectPath: string): Promise<void> {
		if (!fs.existsSync(projectPath)) {
			await fs.promises.mkdir(projectPath, { recursive: true });
		} else {
			const files = await fs.promises.readdir(projectPath);
			if (files.length > 0) {
				throw new Error('项目目录不为空');
			}
		}
	}

	/**
	 * 创建目录
	 */
	private static async createDirectory(dirPath: string): Promise<void> {
		if (!fs.existsSync(dirPath)) {
			await fs.promises.mkdir(dirPath, { recursive: true });
		}
	}

	/**
	 * 复制目录
	 */
	private static async copyDirectory(
		sourceDir: string,
		destDir: string
	): Promise<void> {
		if (!fs.existsSync(sourceDir)) {
			throw new Error(`源目录不存在: ${sourceDir}`);
		}

		// 获取源目录名称
		const sourceDirName = path.basename(sourceDir);
		const finalDestDir = path.join(destDir, sourceDirName);

		// 创建目标目录
		await this.createDirectory(finalDestDir);

		// 递归复制文件
		await this.copyDirectoryRecursive(sourceDir, finalDestDir);
	}

	/**
	 * 递归复制目录
	 */
	private static async copyDirectoryRecursive(
		source: string,
		dest: string
	): Promise<void> {
		const entries = await fs.promises.readdir(source, { withFileTypes: true });

		for (const entry of entries) {
			const sourcePath = path.join(source, entry.name);
			const destPath = path.join(dest, entry.name);

			if (entry.isDirectory()) {
				await this.createDirectory(destPath);
				await this.copyDirectoryRecursive(sourcePath, destPath);
			} else {
				await this.copyFile(sourcePath, destPath);
			}
		}
	}

	/**
	 * 复制文件
	 */
	private static async copyFile(sourcePath: string, destPath: string): Promise<void> {
		// 确保目标文件的父目录存在
		const destDir = path.dirname(destPath);
		await this.createDirectory(destDir);
		await fs.promises.copyFile(sourcePath, destPath);
	}

	/**
	 * 复制模板文件
	 */
	private static async copyTemplateFiles(
		config: ProjectCreateConfig,
		context: vscode.ExtensionContext
	): Promise<void> {
		// 使用 context.extensionPath 获取扩展路径
		const extensionPath = context.extensionPath;
		const templatePath = path.join(extensionPath, '项目模板');

		if (!fs.existsSync(templatePath)) {
			// 如果扩展路径中不存在，尝试使用工作区相对路径
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (workspaceFolders && workspaceFolders.length > 0) {
				const workspacePath = workspaceFolders[0].uri.fsPath;
				const altTemplatePath = path.join(workspacePath, '..', '项目模板');
				if (fs.existsSync(altTemplatePath)) {
					await this.copyPlatformTemplate(
						config.platform,
						altTemplatePath,
						config.projectPath
					);
					return;
				}
			}
			throw new Error(`模板目录不存在: ${templatePath}`);
		}

		await this.copyPlatformTemplate(
			config.platform,
			templatePath,
			config.projectPath
		);
	}

	/**
	 * 复制平台模板
	 */
	private static async copyPlatformTemplate(
		platform: ProjectPlatform,
		templateBasePath: string,
		projectPath: string
	): Promise<void> {
		let templatePath: string;

		switch (platform) {
			case 'Windows':
				templatePath = path.join(templateBasePath, 'Windosw');
				break;
			case 'Linux':
				// 预留
				templatePath = path.join(templateBasePath, 'Linux');
				break;
			case 'Android':
				// 预留
				templatePath = path.join(templateBasePath, 'Android');
				break;
			default:
				throw new Error(`不支持的平台: ${platform}`);
		}

		if (!fs.existsSync(templatePath)) {
			throw new Error(`模板目录不存在: ${templatePath}`);
		}

		// 复制模板目录内的所有内容到项目目录（不包括模板目录本身）
		const entries = await fs.promises.readdir(templatePath, { withFileTypes: true });

		for (const entry of entries) {
			const sourcePath = path.join(templatePath, entry.name);
			const destPath = path.join(projectPath, entry.name);

			if (entry.isDirectory()) {
				// 确保目标目录存在
				await this.createDirectory(destPath);
				await this.copyDirectoryRecursive(sourcePath, destPath);
			} else {
				// 对于文件，确保父目录存在
				const destDir = path.dirname(destPath);
				await this.createDirectory(destDir);
				await this.copyFile(sourcePath, destPath);
			}
		}
	}

	/**
	 * 创建编译配置.tmake 文件
	 */
	private static async createTmakeConfig(
		config: ProjectCreateConfig,
		context: vscode.ExtensionContext
	): Promise<void> {
		const configPath = path.join(config.projectPath, '编译配置.tmake');
		const configContent = this.generateTmakeConfig(config, context);
		await fs.promises.writeFile(configPath, configContent, 'utf-8');
	}

	/**
	 * 生成 tmake 配置内容
	 */
	private static generateTmakeConfig(
		config: ProjectCreateConfig,
		context: vscode.ExtensionContext
	): string {
		const compilerConfig = ConfigManager.getConfig(context);
		const lines = [
			'TMake版本("1.0.0")',
			'结绳编译器版本("4.6")',
			`设置变量("项目名称", "${config.projectName}")`,
			`设置变量("版本号", "${config.version}")`,
			`设置变量("输出目录", "${config.outputDir}")`,
			`设置输出文件("${config.outputFile}")`,
			'设置优化级别(2)',
			'设置日志级别("warning")',
			'设置编译器("g++")',
		];

		// 注意：路径信息不再写入 TMake 配置文件，而是存储在 .tiecode.json 中

		lines.push('');
		lines.push('编译程序(读取源文件列表("./"), 输出文件)');
		lines.push('发布模式()');

		return lines.join('\n');
	}

	/**
	 * 创建 Tiecode IDE 配置文件
	 */
	private static async createTiecodeConfig(
		config: ProjectCreateConfig,
		context: vscode.ExtensionContext
	): Promise<void> {
		const { ProjectConfigManager } = await import('./ProjectConfigManager');
		const compilerConfig = ConfigManager.getConfig(context);
		
		const tiecodeConfig: any = {};

		// 保存编译器路径和TMake路径
		if (config.platform === 'Windows') {
			if (compilerConfig.windowsTieccPath) {
				// 如果路径在项目内，使用相对路径；否则使用绝对路径
				const projectDir = config.projectPath;
				const tieccPath = compilerConfig.windowsTieccPath;
				const relativePath = path.relative(projectDir, tieccPath);
				const finalTieccPath = relativePath.startsWith('..') 
					? tieccPath 
					: relativePath.replace(/\\/g, '/');
				tiecodeConfig.compilerPath = finalTieccPath;
			}
			if (compilerConfig.windowsTmakePath) {
				// TMake通常复制到项目根目录，使用相对路径
				const tmakeFileName = path.basename(compilerConfig.windowsTmakePath);
				tiecodeConfig.tmakePath = `./${tmakeFileName}`;
			}
		}

		await ProjectConfigManager.saveTiecodeConfig(tiecodeConfig, config.projectPath);
	}

	/**
	 * 选择项目保存位置
	 */
	public static async selectProjectLocation(): Promise<string | undefined> {
		const options: vscode.OpenDialogOptions = {
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: '选择项目保存位置'
		};

		const result = await vscode.window.showOpenDialog(options);
		if (result && result.length > 0) {
			return result[0].fsPath;
		}

		return undefined;
	}
}

