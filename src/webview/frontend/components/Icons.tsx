import React from 'react';
import {
	Code as CodeIcon,
	PhoneAndroid,
	Computer,
	Terminal,
	Language,
	InsertDriveFile,
	Folder,
	FolderOpen,
	ChevronRight,
	KeyboardArrowDown,
	Settings,
	Check,
	Error as ErrorIcon,
	Sync,
	RocketLaunch,
	AutoAwesome,
	Circle,
	PhoneIphone
} from '@mui/icons-material';
import { CompilePlatform } from '../types';

/**
 * 图标组件库
 * 统一管理所有使用的图标 - 使用Material-UI图标
 */

// 平台图标映射
export const PlatformIcon: React.FC<{ platform: CompilePlatform; size?: number; className?: string; style?: React.CSSProperties }> = ({
	platform,
	size = 18,
	className = '',
	style
}) => {
	const iconProps = { 
		fontSize: 'small' as const,
		className,
		style: { fontSize: size, ...style }
	};
	
	switch (platform) {
		case 'Android':
			return <PhoneAndroid {...iconProps} />;
		case 'Windows':
			return <Computer {...iconProps} />;
		case 'Linux':
			return <Terminal {...iconProps} />;
		case 'HarmonyOS':
			return <Computer {...iconProps} />;
		case 'iOS':
			return <PhoneIphone {...iconProps} />;
		case 'Apple':
			return <PhoneIphone {...iconProps} />;
		case 'HTML':
			return <Language {...iconProps} />;
		default:
			return <Settings {...iconProps} />;
	}
};

// 通用图标组件 - 包装为支持size属性的组件
const createIconComponent = (Icon: React.ElementType) => {
	return ({ size = 18, style, ...props }: { size?: number; style?: React.CSSProperties; [key: string]: any }) => (
		<Icon fontSize="small" style={{ fontSize: size, ...style }} {...props} />
	);
};

// 通用图标组件
export const Icons = {
	Code: createIconComponent(CodeIcon),
	DeviceMobile: createIconComponent(PhoneAndroid),
	DeviceDesktop: createIconComponent(Computer),
	TerminalLinux: createIconComponent(Terminal),
	Globe: createIconComponent(Language),
	File: createIconComponent(InsertDriveFile),
	Folder: createIconComponent(Folder),
	FolderOpen: createIconComponent(FolderOpen),
	ChevronRight: createIconComponent(ChevronRight),
	ChevronDown: createIconComponent(KeyboardArrowDown),
	SettingsGear: createIconComponent(Settings),
	Check: createIconComponent(Check),
	Error: createIconComponent(ErrorIcon),
	Sync: createIconComponent(Sync),
	SyncSpin: createIconComponent(Sync),
	Rocket: createIconComponent(RocketLaunch),
	Sparkle: createIconComponent(AutoAwesome),
	CircleOutline: createIconComponent(Circle)
};

