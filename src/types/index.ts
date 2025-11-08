/**
 * 编译平台类型
 */
export type CompilePlatform = 'Android' | 'Windows' | 'Linux' | 'HarmonyOS';

/**
 * 编译状态
 */
export type CompileStatus = 'idle' | 'compiling' | 'success' | 'error';

/**
 * 编译配置
 */
export interface CompileConfig {
	platform: CompilePlatform;
	outputPath?: string;
	options?: Record<string, any>;
}

