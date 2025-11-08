import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 项目生成器
 * 用于创建新的结绳项目
 */
export class ProjectGenerator {
	/**
	 * 创建新的结绳项目
	 */
	public static async createProject(targetPath: string): Promise<void> {
		const projectName = path.basename(targetPath);
		
		// 创建项目目录结构
		const projectStructure = {
			'src': {
				'main.tie': this.getMainTieTemplate(projectName)
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

		vscode.window.showInformationMessage(
			`结绳项目 "${projectName}" 创建成功！`
		);
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
	 */
	private static getMainTieTemplate(projectName: string): string {
		return `// ${projectName} - 主程序文件
// 这是您的结绳项目入口文件

function main() {
    print("欢迎使用结绳编程语言！");
    print("项目名称: ${projectName}");
}

main();
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
    "main": "src/main.tie",
    "author": "",
    "license": "MIT"
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
│   └── main.tie      # 主程序文件
├── config/           # 配置文件目录
│   └── platform.json # 平台配置
├── .tiecode/         # 项目配置目录
│   └── project.json  # 项目配置文件
└── README.md         # 项目说明文件
\`\`\`

## 快速开始

1. 打开项目文件夹
2. 编辑 \`src/main.tie\` 文件
3. 使用 Tiecode 扩展编译和运行项目

## 编译

使用 Tiecode Multi-Platform IDE 扩展：
- 选择编译平台
- 点击编译按钮
- 查看输出结果

## 许可证

MIT License
`;
	}
}

