import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CompileConfig, CompilePlatform, LogLevel } from '../types';

/**
 * 项目配置接口
 */
export interface ProjectConfig {
	name?: string;
	version?: string;
	description?: string;
	main?: string;
	author?: string;
	license?: string;
	/** 默认编译平台 */
	defaultPlatform?: CompilePlatform;
	/** 默认输出目录 */
	defaultOutputPath?: string;
	/** 默认包名 */
	defaultPackage?: string;
	/** 默认是否为发布模式 */
	defaultRelease?: boolean;
	/** 默认硬输出模式 */
	defaultHardMode?: boolean;
	/** 默认优化级别 */
	defaultOptimize?: number;
	/** 默认日志级别 */
	defaultLogLevel?: LogLevel;
	/** 默认禁用的lint检查 */
	defaultDisableLint?: string[];
	/** 默认行号表路径 */
	defaultLineMap?: string;
}

/**
 * 项目配置管理器
 * 负责读取和保存项目配置
 */
export class ProjectConfigManager {
	private static readonly CONFIG_FILE = '.tiecode/project.json';

	/**
	 * 获取项目配置文件路径
	 */
	private static getConfigPath(workspacePath: string): string {
		return path.join(workspacePath, ProjectConfigManager.CONFIG_FILE);
	}

	/**
	 * 读取项目配置
	 */
	public static async loadConfig(workspacePath: string): Promise<ProjectConfig | null> {
		const configPath = ProjectConfigManager.getConfigPath(workspacePath);

		if (!fs.existsSync(configPath)) {
			return null;
		}

		try {
			const configContent = fs.readFileSync(configPath, 'utf-8');
			const config = JSON.parse(configContent) as ProjectConfig;
			return config;
		} catch (error) {
			console.error('读取项目配置失败:', error);
			vscode.window.showWarningMessage('读取项目配置失败，将使用默认配置');
			return null;
		}
	}

	/**
	 * 保存项目配置
	 */
	public static async saveConfig(
		workspacePath: string,
		config: ProjectConfig
	): Promise<boolean> {
		const configPath = ProjectConfigManager.getConfigPath(workspacePath);
		const configDir = path.dirname(configPath);

		try {
			// 确保配置目录存在
			if (!fs.existsSync(configDir)) {
				fs.mkdirSync(configDir, { recursive: true });
			}

			// 保存配置
			const configContent = JSON.stringify(config, null, 4);
			fs.writeFileSync(configPath, configContent, 'utf-8');
			return true;
		} catch (error) {
			console.error('保存项目配置失败:', error);
			vscode.window.showErrorMessage(`保存项目配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
			return false;
		}
	}

	/**
	 * 合并项目配置到编译配置
	 * 项目配置作为默认值，用户配置会覆盖项目配置
	 */
	public static mergeConfig(
		projectConfig: ProjectConfig | null,
		userConfig: CompileConfig
	): CompileConfig {
		if (!projectConfig) {
			return userConfig;
		}

		return {
			platform: userConfig.platform || projectConfig.defaultPlatform || 'Windows',
			outputPath: userConfig.outputPath || projectConfig.defaultOutputPath,
			package: userConfig.package || projectConfig.defaultPackage,
			release: userConfig.release !== undefined ? userConfig.release : projectConfig.defaultRelease,
			hardMode: userConfig.hardMode !== undefined ? userConfig.hardMode : projectConfig.defaultHardMode,
			optimize: userConfig.optimize !== undefined ? userConfig.optimize : projectConfig.defaultOptimize,
			logLevel: userConfig.logLevel || projectConfig.defaultLogLevel || 'info',
			disableLint: userConfig.disableLint || projectConfig.defaultDisableLint,
			lineMap: userConfig.lineMap || projectConfig.defaultLineMap
		};
	}

	/**
	 * 获取当前工作区的配置
	 */
	public static async getCurrentConfig(): Promise<ProjectConfig | null> {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			return null;
		}

		const workspacePath = workspaceFolders[0].uri.fsPath;
		return await ProjectConfigManager.loadConfig(workspacePath);
	}

	/**
	 * 保存当前工作区的配置
	 */
	public static async saveCurrentConfig(config: ProjectConfig): Promise<boolean> {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('未找到工作区文件夹');
			return false;
		}

		const workspacePath = workspaceFolders[0].uri.fsPath;
		return await ProjectConfigManager.saveConfig(workspacePath, config);
	}
}



















