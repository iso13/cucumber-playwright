import { IWorldOptions, World, ITestCaseHookParameter } from '@cucumber/cucumber';
import { BrowserContext, Page } from '@playwright/test';

// Extend IWorldOptions to include 'pickle'
interface CustomWorldOptions extends IWorldOptions {
    pickle: ITestCaseHookParameter['pickle'];
}

export class CustomWorld extends World {
    page!: Page;
    context!: BrowserContext;
    scenarioName!: string;
    pickle!: ITestCaseHookParameter['pickle'];

    constructor(options: CustomWorldOptions) {
        super(options);
        this.pickle = options.pickle;
        this.scenarioName = this.pickle?.name ?? 'Unknown Scenario';
    }

    // Log current scenario
    logScenario(): void {
        console.log(`🎬 Running scenario: ${this.scenarioName}`);
    }
}