const webpack = require("webpack");
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');

const webpackConfig = {
    resolve: {
      alias: {
        // 'lodash-es': 'lodash'
      }
    },
    plugins: [
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
        // new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
        new LodashModuleReplacementPlugin()
      ]
}

module.exports = webpackConfig
