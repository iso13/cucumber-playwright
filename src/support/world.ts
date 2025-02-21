import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Page } from 'playwright';

// Extend IWorldOptions to include pickle (without importing Pickle)
interface CustomWorldOptions extends IWorldOptions {
    pickle?: any;  // Use 'any' because 'Pickle' is not exported from Cucumber
}

export class CustomWorld extends World {
    page: Page | undefined;
    pickle: any; // Store scenario metadata safely

    constructor(options: CustomWorldOptions) {
        super(options);
        this.page = undefined;
        this.pickle = options.pickle;  // Assign pickle dynamically
    }
}

setWorldConstructor(CustomWorld);