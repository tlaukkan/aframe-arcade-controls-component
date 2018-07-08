module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'browserify'],
        files: [
            'src/**/*.js',
            'test/common/**/*.js',
            'test/browser/**/*.js'
        ],
        exclude: [
            'src/app.js',
            'src/index.js'
        ],
        preprocessors: {
            './src/**/*.js': ['browserify'],
            './test/**/*.js': ['browserify']
        },
        browserify: {
            debug: true,
            paths: ['src', 'test'],
            "transform": [
                [
                    "babelify",
                    {
                        presets: ["es2015"]
                    }
                ]
            ]
        },
        reporters: ['progress'],
        port: 9876,  // karma web server port
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ['FirefoxHeadless', 'ChromeHeadless'],
        autoWatch: false,
        singleRun: true,
        concurrency: Infinity,
        customLaunchers: {
            FirefoxHeadless: {
                base: 'Firefox',
                flags: ['-headless'],
            },
        },
    })
}