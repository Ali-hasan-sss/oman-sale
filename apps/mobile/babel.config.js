module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo']
    // reanimated/worklets plugin is added automatically by babel-preset-expo
  };
};
