import inquirer from 'inquirer';
import path from 'path';
import { writeFile, ensureDir } from 'fs-extra';
import { generateGherkinPrompt } from '../support/ai/aiHelper';

const CONFIG = {
    FEATURE_EXT: '.feature',
    FEATURES_DIR: '../features'
} as const;

/**
 * Converts a string to lower camel case.
 */
function toLowerCamelCase(input: string): string {
    return input.replace(/\s+(.)/g, (_, char) => char.toUpperCase()).replace(/^\w/, (c) => c.toLowerCase());
}

/**
 * Sanitizes a string for use as a file name.
 */
function sanitizeFileName(input: string): string {
    return input.replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '');
}

/**
 * Generates a structured prompt for OpenAI to create a Scalability & Latency feature.
 */
function generateAIPrompt(featureTitle: string): string {
    const lowerCamelCaseTag = toLowerCamelCase(featureTitle);
    return `
        Generate a Cucumber BDD feature file for **${featureTitle}**.

        **Guidelines:**
        - Use the format **"As a [role], I want to [goal], So that I can [benefit]."**
        - Include 3 **realistic test scenarios** that measure:
          1. **Model inference speed under normal load (e.g., 100 requests/sec)**
          2. **Performance degradation under high load (e.g., 10,000 concurrent users)**
          3. **Auto-scaling effectiveness (e.g., doubling the request volume)**
        - Ensure quantifiable conditions (e.g., expected latency in milliseconds).
        - The output should be **formatted correctly for Cucumber BDD**.
    `;
}

/**
 * Generates a feature file with AI-generated Gherkin content.
 */
async function promptForFeatureAndGenerate() {
    try {
        const { featureTitle } = await inquirer.prompt([
            {
                type: 'input',
                name: 'featureTitle',
                message: 'Enter the feature title:',
                default: 'Scalability & Latency Testing for AI Model'
            }
        ]);

        console.log('Generating AI-driven Gherkin content...');
        const aiPrompt = generateAIPrompt(featureTitle);
        let gherkinContent = await generateGherkinPrompt(aiPrompt);

        // Ensure clean formatting
        gherkinContent = gherkinContent.replace(/```gherkin|```/g, '').trim();

        // Ensure only one "Feature:" title remains
        gherkinContent = gherkinContent.replace(/Feature: .+\n/g, '').trim();
        gherkinContent = `@${toLowerCamelCase(featureTitle)}\nFeature: ${featureTitle}\n\n${gherkinContent}`;

        const featuresDir = path.resolve(__dirname, CONFIG.FEATURES_DIR);
        const featureFileName = `${sanitizeFileName(featureTitle)}${CONFIG.FEATURE_EXT}`;
        const featureFilePath = path.join(featuresDir, featureFileName);

        await ensureDir(featuresDir);
        await writeFile(featureFilePath, gherkinContent, 'utf8');

        console.log(`✅ Feature file generated: ${featureFilePath}`);
    } catch (error) {
        console.error('❌ Error generating the feature file:', error);
    }
}

// Execute feature generation
promptForFeatureAndGenerate();