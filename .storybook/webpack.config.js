// const path = require("path");
// const TSDocgenPlugin = require("react-docgen-typescript-webpack-plugin");

module.exports = (baseConfig, env, config) => {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    loader: require.resolve("ts-loader"),
  });

  config.module.rules.push({
    test: /\.scss$/,
    use: [
      {
        loader: require.resolve("style-loader"), // creates style nodes from JS strings
      },
      {
        loader: require.resolve("typings-for-css-modules-loader"),
        options: {
          modules: true,
          namedExport: true,
          camelCase: true,
        },
      },
      {
        loader: require.resolve("sass-loader"), // compiles Sass to CSS
      },
    ],
  });

  config.resolve.extensions.push(".ts", ".tsx");

  return config;
};
