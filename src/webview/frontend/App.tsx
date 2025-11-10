import React from 'react';
import { Box, Typography } from '@mui/material';
import './styles/main.css';

const App: React.FC = () => {
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				height: '100vh',
				width: '100%',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 2,
			}}
		>
			<Typography variant="h4" component="h1" gutterBottom>
				欢迎使用
			</Typography>
			<Typography variant="body1" color="text.secondary">
				开始你的开发之旅
			</Typography>
		</Box>
	);
};

export default App;
