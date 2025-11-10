const path = require('path');

/** @type {import('webpack').Configuration} */
const webviewConfig = {
	target: 'web',
	mode: 'none',
	entry: './src/webview/frontend/index.tsx',
	output: {
		path: path.resolve(__dirname, '../../../dist/webview'),
		filename: 'main.js',
		libraryTarget: 'umd'
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx']
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							compilerOptions: {
								jsx: 'react'
							}
						}
					}
				]
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			}
		]
	},
	externals: {
		react: 'React',
		'react-dom': 'ReactDOM'
	},
	devtool: 'nosources-source-map',
	infrastructureLogging: {
		level: 'log'
	}
};

module.exports = webviewConfig;




















