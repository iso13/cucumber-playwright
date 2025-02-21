import isCI from "is-ci";

const config = {
    paths: [process.env.FEATURE_PATH || 'src/features/**/*.feature'],
    requireModule: ['ts-node/register'],
    require: [
        process.env.STEP_PATH || 'src/steps/**/*.steps.ts',
        'src/support/*.ts',
    ],
    strict: true,
    format: [
        'progress',
        'json:reports/cucumber/cucumber_report.json',
        'html:reports/cucumber/cucumber_report.html',
        'junit:reports/cucumber/cucumber_report.xml'
    ],
    formatOptions: { snippetInterface: 'async-await' },
    worldParameters: {},
    retry: process.env.RETRY || (isCI ? 1 : 0),
    parallel: process.env.PARALLEL || 1,
    tags: process.env.TAGS || '',
};

export default config;