var path = require('path');

module.exports = {
  entry: "./example/app.js",
  output: {
    path: path.resolve(__dirname, '..', './example'),
    filename: "bundle.js"
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: "babel",
        query: {
          presets: ["es2015", "stage-0", "react"]
        }
      }
    ]
  }
};