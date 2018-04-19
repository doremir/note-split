var path = require('path');

console.log(__dirname);

module.exports = {
    entry: './note-split.js',
    mode: 'development',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        port: 3000
    },
    devtool: 'source-map',
};