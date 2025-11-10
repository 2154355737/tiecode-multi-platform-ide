import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 项目生成器
 * 用于创建新的结绳项目
 */
export class ProjectGenerator {
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

		return '';
	}

	/**
	 * 复制目录及其内容
	 */
	private static async copyDirectory(src: string, dest: string): Promise<void> {
		if (!fs.existsSync(src)) {
			return;
		}

		// 创建目标目录
		if (!fs.existsSync(dest)) {
			fs.mkdirSync(dest, { recursive: true });
		}

		// 读取源目录内容
		const entries = fs.readdirSync(src, { withFileTypes: true });

		for (const entry of entries) {
			const srcPath = path.join(src, entry.name);
			const destPath = path.join(dest, entry.name);

			if (entry.isDirectory()) {
				// 递归复制子目录
				await this.copyDirectory(srcPath, destPath);
			} else {
				// 复制文件
				fs.copyFileSync(srcPath, destPath);
			}
		}
	}

	/**
	 * 创建新的结绳项目
	 */
	public static async createProject(targetPath: string): Promise<void> {
		const projectName = path.basename(targetPath);
		
		// 创建项目目录结构
		const projectStructure = {
			'src': {
				'main.t': this.getMainTieTemplate(projectName)
			},
			'config': {
				'platform.json': this.getPlatformConfigTemplate()
			},
			'README.md': this.getReadmeTemplate(projectName),
			'.tiecode': {
				'project.json': this.getProjectConfigTemplate(projectName)
			}
		};

		// 递归创建目录和文件
		await this.createProjectStructure(targetPath, projectStructure);

		// 复制标准库到项目中（可选，用于参考）
		const stdlibPath = this.getStdlibPath();
		if (stdlibPath && fs.existsSync(stdlibPath)) {
			const projectStdlibPath = path.join(targetPath, 'stdlib');
			try {
				await this.copyDirectory(stdlibPath, projectStdlibPath);
				vscode.window.showInformationMessage(
					`结绳项目 "${projectName}" 创建成功！标准库已复制到项目中。`
				);
			} catch (error) {
				console.warn('复制标准库失败:', error);
				vscode.window.showInformationMessage(
					`结绳项目 "${projectName}" 创建成功！标准库复制失败，但编译时会自动包含标准库。`
				);
			}
		} else {
			vscode.window.showInformationMessage(
				`结绳项目 "${projectName}" 创建成功！`
			);
		}
	}

	/**
	 * 递归创建项目结构
	 */
	private static async createProjectStructure(
		basePath: string,
		structure: any
	): Promise<void> {
		for (const [name, content] of Object.entries(structure)) {
			const itemPath = path.join(basePath, name);

			if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
				// 创建目录
				if (!fs.existsSync(itemPath)) {
					fs.mkdirSync(itemPath, { recursive: true });
				}
				// 递归创建子结构
				await this.createProjectStructure(itemPath, content);
			} else {
				// 创建文件
				if (!fs.existsSync(itemPath)) {
					fs.writeFileSync(itemPath, content as string, 'utf-8');
				}
			}
		}
	}

	/**
	 * 获取主程序模板
	 * Windows 平台目前只能写控制台程序
	 */
	private static getMainTieTemplate(projectName: string): string {
		return `// ${projectName} - 主程序文件
// 这是您的结绳项目入口文件
// Windows 平台目前只能写控制台程序

// 启动类是结绳windows工程的入口类
类 启动类

	// 程序将从本方法开始执行
	方法 启动方法()
		// 在控制台输出文本
		控制台.输出("欢迎使用结绳编程语言！")
		控制台.输出("项目名称: ${projectName}")
	结束 方法

结束 类
`;
	}

	/**
	 * 获取平台配置模板
	 */
	private static getPlatformConfigTemplate(): string {
		return `{
    "platforms": [
        {
            "name": "Windows",
            "enabled": true,
            "output": "dist/windows"
        },
        {
            "name": "Android",
            "enabled": false,
            "output": "dist/android"
        },
        {
            "name": "Linux",
            "enabled": false,
            "output": "dist/linux"
        },
        {
            "name": "HarmonyOS",
            "enabled": false,
            "output": "dist/harmonyos"
        }
    ]
}
`;
	}

	/**
	 * 获取项目配置模板
	 */
	private static getProjectConfigTemplate(projectName: string): string {
		return `{
    "name": "${projectName}",
    "version": "1.0.0",
    "description": "结绳项目",
    "main": "src/main.t",
    "author": "",
    "license": "MIT",
    "defaultPlatform": "Windows",
    "defaultOutputPath": "dist/windows",
    "defaultLogLevel": "info"
}
`;
	}

	/**
	 * 获取README模板
	 */
	private static getReadmeTemplate(projectName: string): string {
		return `# ${projectName}

这是一个结绳编程语言项目。

## 项目结构

\`\`\`
${projectName}/
├── src/              # 源代码目录
│   └── main.t        # 主程序文件（结绳语言源文件）
├── stdlib/           # 标准库目录（参考用）
│   ├── CXX_基本类型.t
│   ├── CXX_数据结构.t
│   └── ...           # 其他标准库文件
├── config/           # 配置文件目录
│   └── platform.json # 平台配置
├── .tiecode/         # 项目配置目录
│   └── project.json  # 项目配置文件
└── README.md         # 项目说明文件
\`\`\`

## 快速开始

1. 打开项目文件夹
2. 编辑 \`src/main.t\` 文件
3. 使用 Tiecode 扩展编译和运行项目

## Windows 平台说明

Windows 平台目前只能写控制台程序。程序入口必须是一个名为"启动类"的类，其中包含一个"启动方法"方法。

示例代码：
\`\`\`
类 启动类
	方法 启动方法()
		控制台.输出("你好，结绳！")
	结束 方法
结束 类
\`\`\`

## 编译器和标准库

### 编译器
编译器（tiecc.exe）位于 Tiecode IDE 扩展的安装目录中，编译时会自动调用，无需手动配置。

### 标准库
标准库文件已复制到项目的 \`stdlib/\` 目录中，供参考使用。编译时，扩展会自动包含标准库文件，无需手动指定。

标准库包含：
- \`CXX_基本类型.t\` - C++ 基本类型定义
- \`CXX_数据结构.t\` - C++ 数据结构定义
- 其他标准库文件

> **注意**：如果修改了项目中的标准库文件，这些修改不会影响编译，因为编译时使用的是扩展目录中的标准库。如需使用自定义标准库，请修改扩展目录中的标准库文件。

## 编译

使用 Tiecode Multi-Platform IDE 扩展：
- 选择编译平台
- 点击编译按钮
- 查看输出结果

编译时会自动：
1. 包含标准库文件（从扩展目录）
2. 编译项目源文件（\`src/\` 目录下的 .t 文件）
3. 输出到 \`dist/\` 目录

## 许可证

MIT License
`;
	}
}

