/*
 * @Author: hy
 * @Date: 2019-03-13 13:45:07
 * @Last Modified by: hy
 * @Last Modified time: 2019-03-13 15:23:29
 */


// webpack 打包配置

const path = require('path')
const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')

function resolve(p) {
  return path.join(__dirname, p)
}


const config = (env) => {

  return {
    mode: 'production',
    // mode: 'development',
    entry: {
      //活动占比图
      charts: './src/index.js'
    },
    output: {
      path: resolve('./build'),
      filename: '[name].js',
      libraryTarget: 'umd',
      library: 'MyCharts'   //导出变量名
    },
    optimization: {
      splitChunks: { chunks: 'all' },
    },
    resolve: {
      extensions: ['*', '.js'],
      alias: {
        lib: resolve('./src/lib')
      },
    },
    module: {
      rules: [
        {
          exclude: /node_modules/,
          test: /\.js$/,
          use: ['babel-loader'],
        }
      ],
    },
    plugins: [
      new CleanWebpackPlugin(['build*'], {
        root: resolve('./'),
        verbose: false,
      })
    ],
  }
}


module.exports = config