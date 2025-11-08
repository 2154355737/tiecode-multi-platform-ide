import React, { useState } from 'react';
import { CompilePlatform, CompileStatus } from '../types';
import './CompilePanel.css';

interface CompilePanelProps {
	platform: CompilePlatform;
	status: CompileStatus;
	onCompile: (config: any) => void;
}

const CompilePanel: React.FC<CompilePanelProps> = ({
	platform,
	status,
	onCompile
}) => {
	const [outputPath, setOutputPath] = useState<string>('');

	const handleCompile = () => {
		onCompile({
			outputPath: outputPath || undefined
		});
	};

	const getStatusText = () => {
		switch (status) {
			case 'idle':
				return '就绪';
			case 'compiling':
				return '编译中...';
			case 'success':
				return '编译成功';
			case 'error':
				return '编译失败';
			default:
				return '未知状态';
		}
	};

	const getStatusClass = () => {
		return `compile-status compile-status-${status}`;
	};

	return (
		<div className="compile-panel">
			<div className="panel-header">
				<h2>编译配置</h2>
			</div>
			<div className="panel-content">
				<div className="compile-info">
					<div className="info-item">
						<label>目标平台:</label>
						<span className="platform-badge">{platform}</span>
					</div>
					<div className="info-item">
						<label>编译状态:</label>
						<span className={getStatusClass()}>{getStatusText()}</span>
					</div>
				</div>

				<div className="compile-config">
					<div className="config-item">
						<label htmlFor="outputPath">输出路径 (可选):</label>
						<input
							id="outputPath"
							type="text"
							value={outputPath}
							onChange={(e) => setOutputPath(e.target.value)}
							placeholder="留空使用默认路径"
							disabled={status === 'compiling'}
						/>
					</div>
				</div>

				<div className="compile-actions">
					<button
						className="compile-button"
						onClick={handleCompile}
						disabled={status === 'compiling'}
					>
						{status === 'compiling' ? '编译中...' : '开始编译'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default CompilePanel;

