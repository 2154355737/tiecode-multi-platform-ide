import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 编译器配置接口
 */
export interface CompilerConfig {
	/** Windows tiecc核心编译器路径 */
	windowsTieccPath?: string;
	/** Windows tmake编译工具链路径 */
	windowsTmakePath?: string;
	/** Android核心编译器路径（预留） */
	androidTieccPath?: string;
	/** Linux核心编译器路径（预留） */
	linuxTieccPath?: string;
}

/**
 * 配置管理器
 * 负责管理编译器的路径配置
 */
export class ConfigManager {
	private static readonly CONFIG_KEY = 'tiecode.compilerConfig';
	private static readonly CONFIGURED_KEY = 'tiecode.configured';

	/**
	 * 获取配置
	 */
	public static getConfig(context: vscode.ExtensionContext): CompilerConfig {
		const config = context.globalState.get<CompilerConfig>(this.CONFIG_KEY);
		return config || {};
	}

	/**
	 * 保存配置
	 */
	public static async saveConfig(
		context: vscode.ExtensionContext,
		config: CompilerConfig
	): Promise<void> {
		await context.globalState.update(this.CONFIG_KEY, config);
		await context.globalState.update(this.CONFIGURED_KEY, true);
	}

	/**
	 * 检查是否已配置
	 */
	public static isConfigured(context: vscode.ExtensionContext): boolean {
		return context.globalState.get<boolean>(this.CONFIGURED_KEY) || false;
	}

	/**
	 * 验证Windows配置是否完整
	 */
	public static isWindowsConfigValid(config: CompilerConfig): boolean {
		return !!(config.windowsTieccPath && config.windowsTmakePath);
	}

	/**
	 * 验证路径是否存在
	 */
	public static async validatePath(filePath: string): Promise<boolean> {
		if (!filePath) {
			return false;
		}
		try {
			const stats = await fs.promises.stat(filePath);
			return stats.isFile() || stats.isDirectory();
		} catch {
			return false;
		}
	}

	/**
	 * 验证tiecc路径（应该是文件）
	 */
	public static async validateTieccPath(filePath: string): Promise<boolean> {
		if (!filePath) {
			return false;
		}
		try {
			const stats = await fs.promises.stat(filePath);
			return stats.isFile();
		} catch {
			return false;
		}
	}

	/**
	 * 验证tmake路径（应该是文件）
	 */
	public static async validateTmakePath(filePath: string): Promise<boolean> {
		if (!filePath) {
			return false;
		}
		try {
			const stats = await fs.promises.stat(filePath);
			return stats.isFile();
		} catch {
			return false;
		}
	}
}

