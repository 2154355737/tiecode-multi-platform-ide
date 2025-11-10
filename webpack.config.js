//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'node', // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

  entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    // Node.js内置模块应该保持为external
    'fs': 'commonjs fs',
    'path': 'commonjs path'
    // modules added here also need to be added in the .vscodeignore file
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
};

// Webview前端配置
const webviewConfig = {
	target: 'web',
	mode: 'none',
	entry: './src/webview/frontend/index.tsx',
	output: {
		path: path.resolve(__dirname, 'dist/webview'),
		filename: 'main.js',
		libraryTarget: 'umd'
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
		fallback: {
			"process": false
		}
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
	plugins: [
		// 定义 process.env 以避免 "process is not defined" 错误
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('production'),
			'process.env': JSON.stringify({})
		}),
		// 提供 process 的全局变量
		new webpack.ProvidePlugin({
			process: 'process/browser'
		})
	],
	// React不设为external，直接打包进bundle
	devtool: 'nosources-source-map',
	infrastructureLogging: {
		level: "log",
	},
};

module.exports = [ extensionConfig, webviewConfig ];