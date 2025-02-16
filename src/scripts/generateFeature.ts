import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { writeFile, ensureDir } from 'fs-extra';
import inquirer from 'inquirer';

// Load environment variables from the .env file
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure API key is set
});

// Corrected Directories for Feature Files and Step Definitions
const FEATURES_DIR = path.resolve(__dirname, '../../src/features');
const STEPS_DIR = path.resolve(__dirname, '../../src/steps');

console.log('🚀 Starting Feature & Step Definition Generation...');

async function promptForFeatureAndGenerate() {
    console.log('✅ Script started...');

    try {
        console.log('🔍 Prompting for feature details...');
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'featureTitle',
                message: 'Enter the feature title:',
                validate: (input: string) => input.trim() ? true : 'Feature title cannot be empty.',
            },
            {
                type: 'input',
                name: 'scenarioCount',
                message: 'Enter the number of scenarios (default 2, max 6):',
                default: '2',
                validate: (input: string) => {
                    const num = parseInt(input, 10);
                    return (num >= 2 && num <= 6) ? true : 'Please enter a number between 2 and 6.';
                }
            }
        ]);

        console.log('✅ User input:', answers.featureTitle, 'Scenarios:', answers.scenarioCount);
        
        const featureTitle: string = answers.featureTitle.trim();
        const scenarioCount: number = parseInt(answers.scenarioCount, 10);
        const lowerCamelCaseTag = featureTitle.replace(/\s+(.)/g, (_, char) => char.toUpperCase()).replace(/^./, str => str.toLowerCase());
        
        console.log('🔄 Sending request to OpenAI for feature generation...');
        let gherkinContent: string = await generateGherkinPrompt(`Generate a Cucumber BDD feature file titled "${featureTitle}" with ${scenarioCount} scenarios.`);

        console.log('✅ OpenAI Response:', gherkinContent);

        // Ensure unique Feature title and remove duplicate Feature: title if generated
        gherkinContent = gherkinContent.replace(/^Feature: .+\n/i, '').trim();
        gherkinContent = `@${lowerCamelCaseTag}\nFeature: ${featureTitle}\n\n${gherkinContent}`;

        console.log('📁 Saving feature file...');
        const featureFilePath = path.join(FEATURES_DIR, `${featureTitle.replace(/\s+/g, '')}.feature`);

        await ensureDir(FEATURES_DIR);
        await writeFile(featureFilePath, gherkinContent, 'utf8');
        console.log(`✅ Feature file saved: ${featureFilePath}`);
        
        // Generate step definitions
        console.log('🔄 Generating step definitions...');
        let stepDefinitions: string = await generateStepDefinitions(gherkinContent);

        // Ensure 'this.page' is used instead of importing Playwright's page
        stepDefinitions = stepDefinitions.replace(/import \{ page \} from 'playwright';\n?/g, '');
        stepDefinitions = stepDefinitions.replace(/await page\./g, 'await this.page?.');

        // Ensure 'And' steps inherit the correct keyword for compatibility
        stepDefinitions = stepDefinitions.replace(/^(And)\(/gm, (match, p1, offset, string) => {
            const previousKeywordMatch = string.substring(0, offset).match(/(Given|When|Then)\(/g);
            return previousKeywordMatch ? previousKeywordMatch[previousKeywordMatch.length - 1] : 'When';
        });

        const stepFilePath = path.join(STEPS_DIR, `${lowerCamelCaseTag}.steps.ts`);

        await ensureDir(STEPS_DIR);
        await writeFile(stepFilePath, stepDefinitions, 'utf8');
        console.log(`✅ Step definitions saved: ${stepFilePath}`);
    } catch (error) {
        console.error('❌ Error in script:', error);
    }
}

async function generateGherkinPrompt(prompt: string): Promise<string> {
    try {
        console.log('🔄 Sending request to OpenAI for Gherkin feature file generation...');
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1500
        });

        let content = response.choices[0]?.message?.content || '';
        content = content.replace(/```gherkin|```/g, '').trim();

        console.log('✅ Gherkin content successfully generated.');
        return content;
    } catch (error) {
        console.error('❌ Error generating Gherkin content:', error);
        throw new Error('Failed to generate content from OpenAI.');
    }
}

async function generateStepDefinitions(gherkinContent: string): Promise<string> {
    try {
        console.log('🔄 Generating step definitions from AI...');
        
        const aiPrompt = `Convert the following **Gherkin scenarios** into **TypeScript Cucumber step definitions** using Playwright:

        ${gherkinContent}

        **Rules for Step Definitions:**
        1. **Use Playwright's Built-in Locators:**
           - Use **locator()** instead of $eval.
           - Example: \`await this.page.locator('#errorMessage').textContent();\`

        2. **Ensure Implicit Waits:**
           - Use **waitFor({ state: 'visible' })** before interacting with elements.
           - Example: \`await inputField.waitFor({ state: 'visible' });\`

        3. **Use Dynamic Selectors for Flexibility:**
           - **Inputs:** \`input[name="{fieldName}"], input[placeholder="{fieldName}"], input:has-text("{fieldName}")\`
           - **Buttons:** \`button:has-text("{buttonName}"), [aria-label="{buttonName}"]\`
           - **Links:** \`a:has-text("{linkText}")\`

        4. **Use Playwright for UI interactions where applicable.**

        5. **Ensure Step Definitions are in Declarative Style**
           - Focus on **what the step does, not how it works internally.**
           - Keep logic **modular and reusable**.

        6. **Ensure the generated step definitions use 'this.page' instead of importing 'page' from Playwright.**
           - Replace **'await page.'** with **'await this.page.'** for Cucumber compatibility.

        7. **Ensure that every 'Then' step in the feature file has a corresponding step definition.**
           - No missing test coverage.

        8. **Ensure that a step that has an 'And' in the step will take the previous step keyword ('Given', 'When', or 'Then') and replace 'And' with the correct keyword in step definitions for compatibility with Cucumber TypeScript.**

        **Output Format Example:**
        \`\`\`typescript
        Then('I should see an error message {string}', async function (message: string) {
            const errorMessage = this.page.locator('#errorMessage');
            await expect(errorMessage).toHaveText(message);
        });

        When('I click the {string} button', async function (buttonName: string) {
            const button = this.page.getByRole('button', { name: buttonName });
            await button.click();
        });

        Given('I fill in {string} with {string}', async function (fieldName: string, value: string) {
            const input = this.page.getByPlaceholder(fieldName);
            await input.fill(value);
        });
        \`\`\`

        Generate TypeScript step definitions following these Playwright best practices.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: aiPrompt }],
            temperature: 0.2,
            max_tokens: 2000
        });

        let stepDefinitions = response.choices[0]?.message?.content || '';
        stepDefinitions = stepDefinitions.replace(/```typescript|```/g, '').trim();

        console.log('✅ Step definitions successfully generated.');
        return stepDefinitions;
    } catch (error) {
        console.error('❌ Error generating step definitions:', error);
        throw new Error('Failed to generate step definitions from OpenAI.');
    }
}

// Run the script
promptForFeatureAndGenerate();