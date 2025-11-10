import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { CompilePlatform } from '../types';
import { PlatformIcon } from './Icons';

interface PlatformSelectorProps {
	selectedPlatform: CompilePlatform;
	onPlatformChange: (platform: CompilePlatform) => void;
}

const platforms: { value: CompilePlatform; label: string }[] = [
	{ value: 'Android', label: 'Android' },
	{ value: 'Windows', label: 'Windows' },
	{ value: 'Linux', label: 'Linux' },
	{ value: 'HarmonyOS', label: 'HarmonyOS' },
	{ value: 'iOS', label: 'iOS' },
	{ value: 'Apple', label: 'Apple' },
	{ value: 'HTML', label: 'HTML' }
];

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
	selectedPlatform,
	onPlatformChange
}) => {
	return (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
			<Typography 
				variant="body2" 
				sx={{ 
					fontSize: '13px',
					color: 'text.secondary',
					fontWeight: 500,
				}}
			>
				编译平台:
			</Typography>
			<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
				{platforms.map((platform) => {
					const isSelected = selectedPlatform === platform.value;
					return (
						<Button
							key={platform.value}
							onClick={() => onPlatformChange(platform.value)}
							variant={isSelected ? 'contained' : 'outlined'}
							size="small"
							title={platform.label}
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 0.75,
								textTransform: 'none',
								fontSize: '13px',
								padding: '4px 12px',
								minWidth: 'auto',
								borderColor: 'divider',
								...(isSelected && {
									backgroundColor: 'primary.main',
									color: 'primary.contrastText',
									borderColor: 'primary.main',
									'&:hover': {
										backgroundColor: 'primary.dark',
										borderColor: 'primary.dark',
									},
								}),
								...(!isSelected && {
									'&:hover': {
										borderColor: 'primary.main',
										backgroundColor: 'action.hover',
									},
								}),
							}}
						>
							<PlatformIcon platform={platform.value} size={16} />
							{platform.label}
						</Button>
					);
				})}
			</Box>
		</Box>
	);
};

export default PlatformSelector;
