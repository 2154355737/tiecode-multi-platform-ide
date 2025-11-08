import * as vscode from 'vscode';

/**
 * 活动栏视图项的数据结构
 */
export interface ActivityBarItem {
	id: string;
	label: string;
	description?: string;
	icon?: string;
	command?: string;
	contextValue?: string;
	children?: ActivityBarItem[];
}

/**
 * 活动栏视图提供者
 * 在 VS Code 活动栏中显示 Tiecode IDE 的功能视图
 */
export class ActivityBarViewProvider implements vscode.TreeDataProvider<ActivityBarItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<ActivityBarItem | undefined | null | void> = new vscode.EventEmitter<ActivityBarItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<ActivityBarItem | undefined | null | void> = this._onDidChangeTreeData.event;

	private context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	/**
	 * 刷新视图
	 */
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	/**
	 * 获取树项
	 */
	getTreeItem(element: ActivityBarItem): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(
			element.label,
			element.children ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
		);

		// 设置图标
		if (element.icon) {
			treeItem.iconPath = new vscode.ThemeIcon(element.icon);
		}

		// 设置描述
		if (element.description) {
			treeItem.tooltip = element.description;
			treeItem.description = element.description;
		}

		// 设置命令
		if (element.command) {
			treeItem.command = {
				command: element.command,
				title: element.label
			};
		}

		// 设置上下文值（用于菜单项的条件显示）
		if (element.contextValue) {
			treeItem.contextValue = element.contextValue;
		}

		return treeItem;
	}

	/**
	 * 获取子项
	 */
	getChildren(element?: ActivityBarItem): Thenable<ActivityBarItem[]> {
		if (!element) {
			// 返回根节点
			return Promise.resolve(this.getRootItems());
		}
		// 返回子节点
		return Promise.resolve(element.children || []);
	}

	/**
	 * 获取根节点项
	 */
	private getRootItems(): ActivityBarItem[] {
		return [
			{
				id: 'openEditor',
				label: '可视化编辑器',
				description: '打开 Tiecode 可视化编辑器',
				icon: 'code',
				command: 'tiecode.openVisualEditor'
			},
			{
				id: 'platforms',
				label: '编译平台',
				description: '管理编译目标平台',
				icon: 'device-desktop',
				children: [
					{
						id: 'platform-android',
						label: 'Android',
						description: '编译为 Android 应用',
						icon: 'device-mobile',
						command: 'tiecode.selectPlatform',
						contextValue: 'platform'
					},
					{
						id: 'platform-windows',
						label: 'Windows',
						description: '编译为 Windows 应用',
						icon: 'window',
						command: 'tiecode.selectPlatform',
						contextValue: 'platform'
					},
					{
						id: 'platform-linux',
						label: 'Linux',
						description: '编译为 Linux 应用',
						icon: 'terminal',
						command: 'tiecode.selectPlatform',
						contextValue: 'platform'
					},
					{
						id: 'platform-harmonyos',
						label: 'HarmonyOS',
						description: '编译为 HarmonyOS 应用',
						icon: 'device-desktop',
						command: 'tiecode.selectPlatform',
						contextValue: 'platform'
					}
				]
			},
			{
				id: 'compile',
				label: '编译项目',
				description: '编译当前项目',
				icon: 'play',
				command: 'tiecode.compile'
			},
			{
				id: 'preview',
				label: '实时预览',
				description: '预览项目效果',
				icon: 'eye',
				command: 'tiecode.preview'
			},
			{
				id: 'createProject',
				label: '新建项目',
				description: '创建新的 Tiecode 项目',
				icon: 'new-folder',
				command: 'tiecode.createProject'
			},
			{
				id: 'welcome',
				label: '欢迎页面',
				description: '显示欢迎和帮助信息',
				icon: 'home',
				command: 'tiecode.showWelcome'
			}
		];
	}
}

