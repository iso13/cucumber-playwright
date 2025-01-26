import inquirer from 'inquirer';
import { writeFile } from 'fs-extra';
import path from 'path';
import { generateGherkinPrompt } from '../ai/aiHelper';

/**
 * Prompts the user for the feature title and generates a Gherkin feature file dynamically.
 */
async function promptForFeatureAndGenerate() {
    try {
        console.log('Prompting for feature details...');
        // Prompt the user for the feature title
        const { featureTitle } = await inquirer.prompt([
            {
                type: 'input',
                name: 'featureTitle',
                message: 'Enter the feature title:',
            },
        ]);

        // Construct the prompt for OpenAI
        const openAIPrompt = `Generate a Gherkin feature file with scenarios for the following feature title: "${featureTitle}". Include at least three scenarios, each with Given, When, and Then steps.`;

        console.log('Constructing the prompt for OpenAI...');
        console.log('Sending the prompt to OpenAI...');
        // Generate the Gherkin content using OpenAI
        const gherkinContent = await generateGherkinPrompt(openAIPrompt);

        console.log('OpenAI response received. Generating file...');
        // Create the file name and path
        const featureFileName = featureTitle.replace(/\s+/g, '_').toLowerCase() + '.feature';
        const featureFilePath = path.resolve(__dirname, '../../features', featureFileName);

        // Write the Gherkin content to the file
        await writeFile(featureFilePath, gherkinContent, 'utf8');

        console.log(`Feature file successfully generated at: ${featureFilePath}`);
    } catch (error) {
        console.error('Error generating the feature file:', error);
    }
}

promptForFeatureAndGenerate();