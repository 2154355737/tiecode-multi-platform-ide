import React from 'react';
import './EditorPanel.css';

interface EditorPanelProps {
	files: string[];
}

const EditorPanel: React.FC<EditorPanelProps> = ({ files }) => {
	return (
		<div className="editor-panel">
			<div className="panel-header">
				<h2>文件列表</h2>
			</div>
			<div className="panel-content">
				{files.length === 0 ? (
					<div className="empty-state">
						<p>工作区中没有文件</p>
					</div>
				) : (
					<ul className="file-list">
						{files.map((file, index) => (
							<li key={index} className="file-item">
								<span className="file-icon">📄</span>
								<span className="file-name">{file}</span>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};

export default EditorPanel;

