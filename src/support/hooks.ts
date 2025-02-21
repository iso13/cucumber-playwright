import { Before, After, Status } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { CustomWorld } from './world';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

// Global browser instances
let browser: Browser;
let context: BrowserContext;
let page: Page;

// 🎬 Before Scenario: Launch Browser and Ensure Scenario Name is Available
Before(async function (this: CustomWorld) {
    const scenarioName = this.pickle?.name ?? 'Unknown Scenario';
    console.log(`🚀 Starting scenario: ${scenarioName}`);

    // Launch Playwright browser
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();
    this.page = page;
});

// 🚀 Before @performance: Run K6 Load Test Automatically
Before({ tags: '@performance' }, function () {
    const reportDir = 'reports/performance';
    fs.ensureDirSync(reportDir);  // Ensure report directory exists

    console.log('⚙️ Running K6 load test...');
    try {
        execSync(`k6 run --env REPORT_PATH=${reportDir}/ src/support/performance/loadTest.js`, { stdio: 'inherit' });
        console.log(`✅ K6 load test completed. Reports are saved in ${reportDir}`);
    } catch (error) {
        console.error('❌ Load test failed:', error);
        throw new Error('K6 load test failed');
    }
});

// 📸 After Scenario: Capture Screenshot if Failed
After(async function (this: CustomWorld, scenario) {
    const scenarioName = this.pickle?.name ?? 'Unknown Scenario';
    console.log(`📝 Finished scenario: ${scenarioName}`);

    if (scenario.result?.status === Status.FAILED && this.page) {
        const screenshotPath = `reports/screenshots/failed_${scenarioName.replace(/ /g, '_')}.png`;
        await this.page.screenshot({ path: screenshotPath });
        this.attach(fs.readFileSync(screenshotPath), 'image/png');
        console.log(`📸 Screenshot saved for failed scenario: ${screenshotPath}`);
    }

    // Cleanup
    if (this.page) {
        await this.page.close();
        await context.close();
        await browser.close();
    }
});

// 🧹 After All: Ensure Clean Reports Directory
After(async function () {
    const reportsDir = 'reports/';
    fs.ensureDirSync(reportsDir);

    // Move Playwright screenshots (if any) to the reports directory
    const testResultsDir = '.playwright/test-results';
    if (fs.existsSync(testResultsDir)) {
        const screenshotFiles = fs.readdirSync(testResultsDir).filter(file => file.endsWith('.png'));

        for (const file of screenshotFiles) {
            const sourcePath = path.join(testResultsDir, file);
            const targetPath = path.join(reportsDir, 'screenshots', file);
            fs.moveSync(sourcePath, targetPath, { overwrite: true });
            console.log(`📁 Moved screenshot to: ${targetPath}`);
        }
    }
});