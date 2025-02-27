import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { writeFile, ensureDir } from 'fs-extra';
import inquirer from 'inquirer';

// Load environment variables from the .env file
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const FEATURES_DIR = path.resolve(__dirname, '../../src/features');
const STEPS_DIR = path.resolve(__dirname, '../../src/steps');

console.log('🚀 Starting Feature & Step Definition Generation...');

async function promptForFeatureAndGenerate() {
    try {
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

        const featureTitle = answers.featureTitle.trim();
        const scenarioCount = parseInt(answers.scenarioCount, 10);
        const lowerCamelCaseTag = featureTitle
            .replace(/\s+(.)/g, (_: string, char: string) => char.toUpperCase())
            .replace(/^./, (str: string) => str.toLowerCase());
        console.log('🔄 Requesting OpenAI for feature generation...');
        let gherkinContent = await generateGherkinPrompt(featureTitle, scenarioCount);

        // Ensure declarative steps
        gherkinContent = enforceDeclarativeSteps(gherkinContent);

        const featureFilePath = path.join(FEATURES_DIR, `${featureTitle.replace(/\s+/g, '')}.feature`);
        await ensureDir(FEATURES_DIR);
        await writeFile(featureFilePath, gherkinContent, 'utf8');
        console.log(`✅ Feature file saved: ${featureFilePath}`);

        console.log('🔄 Generating TypeScript step definitions...');
        let stepDefinitions = await generateStepDefinitions(gherkinContent);
        stepDefinitions = cleanStepDefinitions(stepDefinitions);

        const stepFilePath = path.join(STEPS_DIR, `${lowerCamelCaseTag}.steps.ts`);
        await ensureDir(STEPS_DIR);
        await writeFile(stepFilePath, stepDefinitions, 'utf8');
        console.log(`✅ Step definitions saved: ${stepFilePath}`);
    } catch (error) {
        console.error('❌ Error in script:', error);
    }
}

function enforceDeclarativeSteps(content: string): string {
    return content
        .replace(/When I go to the "(.*?)" page/gi, 'Given the "$1" page is displayed')
        .replace(/And I fill in the "(.*?)" with "(.*?)"/gi, 'When the user provides "$2" for "$1"')
        .replace(/And I click on the "(.*?)" button/gi, 'When the user submits the form')
        .replace(/Then I should see a confirmation message "(.*?)"/gi, 'Then a confirmation message "$1" should be displayed')
        .replace(/Then I should see an error message "(.*?)"/gi, 'Then an error message "$1" should be displayed')
        .replace(/And "(.*?)" should be listed in the system users/gi, 'Then the system should list "$1" as a user')
        .replace(/And "(.*?)" should still be listed only once in the system users/gi, 'Then the system should maintain "$1" as a unique user');
}

async function generateGherkinPrompt(featureTitle: string, scenarioCount: number): Promise<string> {
    const prompt = `Generate a Cucumber BDD feature titled "${featureTitle}" with ${scenarioCount} unique scenarios.
Ensure:
1. A single user story under the Feature title.
2. Clear, valid Gherkin scenarios using declarative steps.
3. No duplicate "As an admin" or extra Feature titles.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1500
        });

        let content = response.choices[0]?.message?.content || '';
        return enforceDeclarativeSteps(content.replace(/```gherkin|```/g, '').trim());
    } catch (error) {
        console.error('❌ Error generating Gherkin content:', error);
        throw new Error('Failed to generate Gherkin content.');
    }
}

async function generateStepDefinitions(gherkinContent: string): Promise<string> {
    const prompt = `Convert the following Gherkin scenarios into TypeScript Cucumber step definitions using Playwright.
Ensure:
1. Only valid TypeScript code.
2. No explanations, comments, or extra text.
3. Use 'this.page' for Playwright interactions.
4. Maintain declarative step structure.

Gherkin Scenarios:
${gherkinContent}

Output TypeScript code only.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_tokens: 2000
        });

        let stepDefinitions = response.choices[0]?.message?.content || '';
        return cleanStepDefinitions(stepDefinitions);
    } catch (error) {
        console.error('❌ Error generating step definitions:', error);
        throw new Error('Failed to generate step definitions.');
    }
}

function cleanStepDefinitions(content: string): string {
    return content.replace(/.*Below are the TypeScript Cucumber step definitions.*|### Explanation:.*|### Notes:.*|```typescript|```/gs, '').trim();
}

promptForFeatureAndGenerate();
