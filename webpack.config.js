const path = require('path');

module.exports = {
  mode: 'production',
  entry: '/src/web/browser.ts',  // TypeScriptファイルをエントリーポイントに指定
  output: {
    path: path.resolve(__dirname, 'dist'),  // 出力先ディレクトリ
    filename: 'browser.js'                 // 出力ファイル名
  },
  resolve: {
    extensions: ['.ts', '.js']  // TypeScriptファイルとJavaScriptファイルの両方を解決
  },
  module: {
    rules: [
      {
        test: /\.ts$/,  // 拡張子`.ts`をトランスパイル
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
};
