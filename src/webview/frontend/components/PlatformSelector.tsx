import React from 'react';
import { CompilePlatform } from '../types';
import './PlatformSelector.css';

interface PlatformSelectorProps {
	selectedPlatform: CompilePlatform;
	onPlatformChange: (platform: CompilePlatform) => void;
}

const platforms: { value: CompilePlatform; label: string; icon: string }[] = [
	{ value: 'Android', label: 'Android', icon: '📱' },
	{ value: 'Windows', label: 'Windows', icon: '🪟' },
	{ value: 'Linux', label: 'Linux', icon: '🐧' },
	{ value: 'HarmonyOS', label: 'HarmonyOS', icon: '🌸' }
];

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
	selectedPlatform,
	onPlatformChange
}) => {
	return (
		<div className="platform-selector">
			<label className="selector-label">编译平台:</label>
			<div className="platform-options">
				{platforms.map((platform) => (
					<button
						key={platform.value}
						className={`platform-option ${
							selectedPlatform === platform.value ? 'active' : ''
						}`}
						onClick={() => onPlatformChange(platform.value)}
						title={platform.label}
					>
						<span className="platform-icon">{platform.icon}</span>
						<span className="platform-label">{platform.label}</span>
					</button>
				))}
			</div>
		</div>
	);
};

export default PlatformSelector;

