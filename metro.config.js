const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json', 'cjs', 'mjs'];

config.resolver.extraNodeModules = {
    stream: require.resolve('readable-stream'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Fix for @supabase/supabase-js resolution issues
    if (moduleName === '@supabase/supabase-js') {
        return {
            filePath: require.resolve('@supabase/supabase-js'),
            type: 'sourceFile',
        };
    }
    // Default resolver
    return context.resolveRequest(context, moduleName, platform);
};

config.transformer = {
    ...config.transformer,
    minifierPath: 'metro-minify-terser',
    minifierConfig: {
        ecma: 8,
        keep_classnames: true,
        keep_fnames: true,
        module: true,
        mangle: {
            module: true,
            keep_classnames: true,
            keep_fnames: true,
        },
    },
};

module.exports = config;
