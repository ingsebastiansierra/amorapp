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
                    root: ['./src'],
                    alias: {
                        '@': './src',
                        '@core': './src/core',
                        '@features': './src/features',
                        '@shared': './src/shared',
                    },
                },
            ],
        ],
    };
};
