const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [    {
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['es2015']
                }
            }
        }]
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: 'static' }
        ]),
        new webpack.IgnorePlugin(/wrtc/, /console-stamp/, /websocket/, /signaling-server/)
    ],
    devServer: {
        compress: true,
        port: 9000
    },
    mode: "production"
};