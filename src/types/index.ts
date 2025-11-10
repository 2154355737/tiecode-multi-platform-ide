/**
 * 编译平台类型
 */
export type CompilePlatform = 'Android' | 'Windows' | 'Linux' | 'HarmonyOS' | 'iOS' | 'Apple' | 'HTML';

/**
 * 编译状态
 */
export type CompileStatus = 'idle' | 'compiling' | 'success' | 'error';

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warning' | 'error';

/**
 * 编译配置
 */
export interface CompileConfig {
	/** 目标平台 */
	platform: CompilePlatform;
	/** 输出目录 */
	outputPath?: string;
	/** 默认包名 */
	package?: string;
	/** 是否为发布模式（默认false，即调试模式） */
	release?: boolean;
	/** 硬输出模式 */
	hardMode?: boolean;
	/** 优化级别 (0-3，默认1) */
	optimize?: number;
	/** 禁用的lint检查列表 */
	disableLint?: string[];
	/** 日志级别 */
	logLevel?: LogLevel;
	/** 行号表输出路径 */
	lineMap?: string;
	/** 结绳编译器目录（传递给 tmake 的 --tiecc-dir） */
	tieccDir?: string;
	/** TMake 配置文件路径（--config） */
	configPath?: string;
	/** 监听模式（--watch） */
	watch?: boolean;
	/** 额外的 CLI 参数（直接透传到 tmake） */
	extraArgs?: string[];
	/** TMake 工作目录（运行 tmake 的 cwd） */
	tmakeProjectDir?: string;
}

