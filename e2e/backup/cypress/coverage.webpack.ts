import * as path from 'path';

export default {
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        loader: 'istanbul-instrumenter-loader',
        options: {
          esModules: true
        },
        enforce: 'post',
        include: path.join(__dirname, '..', 'src'),
        exclude: [
          /\.(e2e|spec)\.ts$/,
          /node_modules/,
          /(ngfactory|ngstyle)\.js/
        ]
      }
    ]
  }
};

// TODO this is an alternative approach without very old istanbul-instrumenter-loader
// from https://github.com/skylock/cypress-angular-coverage-example/issues/6
// module.exports = {
//   module: {
//     rules: [
//       {
//         test: /\.(js|ts)$/,
//         use: {
//           loader: 'babel-loader',
//           options: {
//             // presets: ['@babel/preset-env'],
//             plugins: ['babel-plugin-istanbul']
//           }
//         },
//         enforce: 'post',
//         include: [
//           require('path').join(__dirname, '..', "beheer", 'src', 'app'),
//         ],
//         exclude: [
//           /\.(e2e|spec)\.ts$/,
//           /node_modules/,
//           /(ngfactory|ngstyle)\.js/
//         ]
//       }
//     ]
//   }
// };