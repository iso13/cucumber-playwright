import { Before, After, Status, ITestCaseHookParameter } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { CustomWorld } from './world';
import fs from 'fs-extra';

let browser: Browser | null = null;
let context: BrowserContext;
let page: Page;

// 🎬 Before Scenario: Launch Browser
Before(async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
    this.pickle = scenario.pickle;
    this.scenarioName = this.pickle?.name ?? 'Unknown Scenario';
    console.log(`🚀 Starting scenario: ${this.scenarioName}`);

    // Convert readonly PickleTag[] to a mutable array
    const tags = this.pickle.tags.map(tag => tag.name);
    const isHeadless = tags.includes('@no-browser');

    // Launch browser unless @no-browser is tagged
    browser = await chromium.launch({ headless: isHeadless });
    context = await browser.newContext();
    page = await context.newPage();
    this.page = page;
});

// 🧹 After Scenario: Clean Up
After(async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
    console.log(`📝 Finished scenario: ${this.scenarioName}`);

    if (scenario.result?.status === Status.FAILED && this.page) {
        const screenshotPath = `reports/screenshots/failed_${this.scenarioName.replace(/ /g, '_')}.png`;
        await this.page.screenshot({ path: screenshotPath });
        console.log(`📸 Screenshot saved at: ${screenshotPath}`);
    }

    // Close browser if it was launched
    if (browser) {
        await page?.close();
        await context?.close();
        await browser?.close();
        browser = null;
    }
});