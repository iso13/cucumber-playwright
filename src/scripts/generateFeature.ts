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

const FEATURES_DIR = path.resolve(__dirname, '../../src/features');
const STEPS_DIR = path.resolve(__dirname, '../../src/steps');

console.log('🚀 Starting Feature Generation...');

async function promptForFeatureAndGenerate() {
    console.log('✅ Script started...');

    try {
        console.log('🔍 Checking if inquirer prompt runs...');
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

        console.log('✅ User entered:', answers.featureTitle, 'Scenarios:', answers.scenarioCount);
        
        const featureTitle: string = answers.featureTitle;
        const scenarioCount: number = parseInt(answers.scenarioCount, 10);
        const lowerCamelCaseTag = featureTitle.replace(/\s+(.)/g, (_, char) => char.toUpperCase()).replace(/^./, str => str.toLowerCase());
        
        console.log('🔄 Sending request to OpenAI...');
        let gherkinContent: string = await generateGherkinPrompt(`Generate a Cucumber BDD feature file titled "${featureTitle}" with ${scenarioCount} scenarios.`);

        console.log('✅ OpenAI Response:', gherkinContent);

        // Remove duplicate Feature title if present
        gherkinContent = gherkinContent.replace(/^Feature: .+\n/i, '').trim();

        // Ensure feature title and tag are included only once
        gherkinContent = `@${lowerCamelCaseTag}\nFeature: ${featureTitle}\n\n${gherkinContent}`;

        console.log('📁 Saving feature file...');
        const featureFilePath = path.join(FEATURES_DIR, `${featureTitle.replace(/\s+/g, '')}.feature`);

        await ensureDir(FEATURES_DIR);
        await writeFile(featureFilePath, gherkinContent, 'utf8');

        console.log(`✅ Feature file saved: ${featureFilePath}`);
        
        // Generate step definitions
        console.log('🔄 Generating step definitions...');
        let stepDefinitions: string = await generateStepDefinitions(gherkinContent);
        
        // Ensure generated step definitions use this.page instead of importing page from Playwright
        stepDefinitions = stepDefinitions.replace(/import \{ page \} from 'playwright';\n?/g, '');
        stepDefinitions = stepDefinitions.replace(/await page\./g, 'await this.page?.');
        
        // Ensure 'And' is replaced with the previous step's keyword for Cucumber TypeScript compatibility
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
        console.log('🔄 Sending request to OpenAI...');
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
        
        const aiPrompt = `Convert the following Gherkin scenarios into TypeScript Cucumber step definitions:

        ${gherkinContent}

        Use Playwright for UI interactions where applicable.
        Ensure that the generated step definitions use 'this.page' instead of importing 'page' from Playwright.
        Format the output correctly, and do not include any additional comments, explanations, or instructions.
        Ensure that every 'Then' step in the feature file has a corresponding step definition.
        Ensure that a step that has an 'And' in the step will take the previous step keyword ('Given', 'When', or 'Then') and replace 'And' with the correct keyword in step definitions for compatibility with Cucumber TypeScript.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: aiPrompt }],
            temperature: 0.2,
            max_tokens: 2000
        });

        let stepDefinitions = response.choices[0]?.message?.content || '';
        
        // Cleanup formatting issues
        stepDefinitions = stepDefinitions.replace(/```typescript|```/g, '').trim();
        
        console.log('✅ Step definitions successfully generated.');
        return stepDefinitions;
    } catch (error) {
        console.error('❌ Error generating step definitions:', error);
        throw new Error('Failed to generate step definitions from OpenAI.');
    }
}

promptForFeatureAndGenerate();
