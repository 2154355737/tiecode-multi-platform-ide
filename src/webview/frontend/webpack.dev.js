const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/** @type {import('webpack').Configuration} */
const devConfig = {
	target: 'web',
	mode: 'development',
	entry: path.resolve(__dirname, 'index.tsx'),
	output: {
		path: path.resolve(__dirname, '../../../dist/webview-dev'),
		filename: 'main.js',
		publicPath: '/'
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
		modules: [
			path.resolve(__dirname, '.'), // 当前目录
			path.resolve(__dirname, '../../../node_modules'), // 根目录的 node_modules
			'node_modules'
		]
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
							},
							configFile: path.resolve(__dirname, '../../../tsconfig.json')
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
	// 开发环境：React 不设为 external，直接打包
	plugins: [
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, 'dev.html'),
			filename: 'index.html'
		})
	],
	devtool: 'eval-source-map',
	devServer: {
		static: {
			directory: path.resolve(__dirname, '../../../dist/webview-dev')
		},
		port: 3000,
		hot: true,
		open: true,
		historyApiFallback: true
	},
	infrastructureLogging: {
		level: 'log'
	}
};

module.exports = devConfig;

