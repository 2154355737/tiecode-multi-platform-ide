import React, { useState, useMemo, useEffect } from 'react';
import { Paper, Typography, Box, List, ListItem, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import { Icons } from './Icons';

interface EditorPanelProps {
	files: string[];
}

interface FileNode {
	name: string;
	path: string;
	isFolder: boolean;
	children: Map<string, FileNode>;
	level: number;
	parent?: FileNode;
	isLast?: boolean; // 是否是父节点的最后一个子节点
	parentLines?: boolean[]; // 用于渲染树状连接线
}

const EditorPanel: React.FC<EditorPanelProps> = ({ files }) => {
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

	// 构建文件树结构
	const fileTree = useMemo(() => {
		const root: FileNode = {
			name: '',
			path: '',
			isFolder: true,
			children: new Map(),
			level: 0,
		};

		files.forEach((filePath) => {
			const parts = filePath.split(/[/\\]/).filter(Boolean);
			let current = root;

			parts.forEach((part, index) => {
				const isLast = index === parts.length - 1;
				const path = parts.slice(0, index + 1).join('/');

				if (!current.children.has(part)) {
					current.children.set(part, {
						name: part,
						path: path,
						isFolder: !isLast,
						children: new Map(),
						level: index + 1,
						parent: current,
					});
				}

				current = current.children.get(part)!;
			});
		});

		// 标记每个节点是否是最后一个子节点
		const markLastNodes = (node: FileNode) => {
			const childrenArray = Array.from(node.children.values());
			childrenArray.forEach((child, index) => {
				child.isLast = index === childrenArray.length - 1;
				markLastNodes(child);
			});
		};
		markLastNodes(root);

		return root;
	}, [files]);

	// 展平树结构为列表（用于渲染）
	const flattenTree = (node: FileNode, result: FileNode[] = [], parentLines: boolean[] = []): FileNode[] => {
		if (node.level > 0) {
			const nodeWithLines: FileNode = { ...node, parentLines: [...parentLines] };
			result.push(nodeWithLines);
		}

		// 按文件夹优先，然后按名称排序
		const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
			if (a.isFolder !== b.isFolder) {
				return a.isFolder ? -1 : 1;
			}
			return a.name.localeCompare(b.name);
		});

		sortedChildren.forEach((child, index) => {
			const isLast = index === sortedChildren.length - 1;
			const newParentLines = [...parentLines];
			
			if (node.level > 0) {
				// 如果父节点不是最后一个，需要显示连接线
				newParentLines.push(!node.isLast);
			}

			if (child.isFolder) {
				// 如果是文件夹且已展开，递归处理子节点
				if (expandedFolders.has(child.path)) {
					flattenTree(child, result, newParentLines);
				}
			} else {
				// 文件直接添加
				const fileWithLines: FileNode = { ...child, parentLines: newParentLines };
				result.push(fileWithLines);
			}
		});

		return result;
	};

	const toggleFolder = (path: string) => {
		setExpandedFolders((prev) => {
			const next = new Set(prev);
			if (next.has(path)) {
				next.delete(path);
			} else {
				next.add(path);
			}
			return next;
		});
	};

	const flatList = flattenTree(fileTree);

	// 默认展开根目录下的第一层文件夹
	useEffect(() => {
		if (expandedFolders.size === 0 && fileTree.children.size > 0) {
			const firstLevelFolders = Array.from(fileTree.children.values())
				.filter((node) => node.isFolder)
				.map((node) => node.path);
			if (firstLevelFolders.length > 0) {
				setExpandedFolders(new Set(firstLevelFolders));
			}
		}
	}, [fileTree, expandedFolders.size]);

	// 渲染树状连接线
	const renderTreeLines = (parentLines: boolean[] = [], isLast: boolean = false) => {
		return (
			<Box sx={{ display: 'flex', position: 'absolute', left: 0, top: 0, bottom: 0 }}>
				{parentLines.map((showLine, index) => (
					<Box
						key={index}
						sx={{
							width: '16px',
							position: 'relative',
							'&::after': showLine
								? {
										content: '""',
										position: 'absolute',
										left: '50%',
										top: 0,
										bottom: 0,
										width: '1px',
										backgroundColor: 'divider',
										opacity: 0.3,
									}
								: {},
						}}
					/>
				))}
				{parentLines.length > 0 && (
					<Box
						sx={{
							width: '16px',
							position: 'relative',
							'&::before': {
								content: '""',
								position: 'absolute',
								left: '50%',
								top: 0,
								width: '1px',
								height: '50%',
								backgroundColor: 'divider',
								opacity: 0.3,
							},
							'&::after': !isLast
								? {
										content: '""',
										position: 'absolute',
										left: '50%',
										top: '50%',
										bottom: 0,
										width: '1px',
										backgroundColor: 'divider',
										opacity: 0.3,
									}
								: {},
						}}
					/>
				)}
			</Box>
		);
	};

	return (
		<Paper 
			sx={{ 
				height: '100%', 
				width: '100%',
				display: 'flex', 
				flexDirection: 'column',
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: 1,
				overflow: 'hidden',
			}}
		>
			{/* 标题栏 */}
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 1,
					padding: '10px 12px',
					borderBottom: '1px solid',
					borderColor: 'divider',
					minHeight: '40px',
				}}
			>
				<Icons.Folder size={16} />
				<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px' }}>
					文件列表
				</Typography>
			</Box>

			{/* 内容区 */}
			<Box sx={{ flex: 1, overflow: 'auto', padding: '8px', position: 'relative' }}>
				{files.length === 0 ? (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							height: '100%',
							gap: 1.5,
							color: 'text.secondary',
						}}
					>
						<Icons.Folder size={40} style={{ opacity: 0.4 }} />
						<Typography variant="body2" sx={{ fontSize: '12px' }}>
							工作区中没有文件
						</Typography>
					</Box>
				) : (
					<List sx={{ padding: 0 }}>
						{flatList.map((node, index) => {
							const isExpanded = expandedFolders.has(node.path);
							const indent = node.level * 16; // 每级缩进16px
							const isLast = node.isLast ?? false;
							const parentLines = node.parentLines || [];

							return (
								<ListItem
									key={`${node.path}-${index}`}
									title={node.path || node.name}
									sx={{
										padding: '4px 8px',
										paddingLeft: `${8 + indent}px`,
										borderRadius: 1,
										mb: 0.25,
										minHeight: '28px',
										position: 'relative',
										'&:hover': {
											backgroundColor: 'action.hover',
										},
									}}
								>
									{/* 树状连接线 */}
									{renderTreeLines(parentLines, isLast)}

									{node.isFolder ? (
										<>
											<ListItemIcon sx={{ minWidth: 20, marginRight: 0.5, position: 'relative', zIndex: 1 }}>
												<IconButton
													size="small"
													onClick={(e) => {
														e.stopPropagation();
														toggleFolder(node.path);
													}}
													sx={{
														padding: '2px',
														width: '16px',
														height: '16px',
														'&:hover': {
															backgroundColor: 'action.hover',
														},
													}}
												>
													{isExpanded ? (
														<Icons.ChevronDown size={14} />
													) : (
														<Icons.ChevronRight size={14} />
													)}
												</IconButton>
											</ListItemIcon>
											<ListItemIcon sx={{ minWidth: 20, marginRight: 0.5, position: 'relative', zIndex: 1 }}>
												{isExpanded ? (
													<Icons.FolderOpen size={16} style={{ color: 'var(--vscode-textLink-foreground)' }} />
												) : (
													<Icons.Folder size={16} />
												)}
											</ListItemIcon>
											<ListItemText
												primary={
													<Typography 
														variant="body2" 
														component="span" 
														sx={{ 
															fontSize: '13px',
															fontWeight: 500,
															cursor: 'pointer',
															color: 'text.primary',
														}}
														onClick={() => toggleFolder(node.path)}
													>
														{node.name}
													</Typography>
												}
											/>
										</>
									) : (
										<>
											<ListItemIcon sx={{ minWidth: 20, marginRight: 0.5, position: 'relative', zIndex: 1 }}>
												<Box sx={{ width: 16 }} /> {/* 占位符，保持对齐 */}
											</ListItemIcon>
											<ListItemIcon sx={{ minWidth: 20, marginRight: 0.5, position: 'relative', zIndex: 1 }}>
												<Icons.File size={16} />
											</ListItemIcon>
											<ListItemText
												primary={
													<Typography variant="body2" component="span" sx={{ fontSize: '13px' }}>
														{node.name}
													</Typography>
												}
											/>
										</>
									)}
								</ListItem>
							);
						})}
					</List>
				)}
			</Box>
		</Paper>
	);
};

export default EditorPanel;
