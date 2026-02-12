module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            [
                'babel-preset-expo',
                {
                    unstable_transformImportMeta: true,
                },
            ],
        ],
        plugins: [
            [
                'module-resolver',
                {
                    alias: {
                        '@': './src',
                        '@core': './src/core',
                        '@features': './src/features',
                        '@shared': './src/shared',
                    },
                },
            ],
            'react-native-worklets-core/plugin',
            'react-native-reanimated/plugin',
        ],
    };
};
