import inquirer from 'inquirer';
import { writeFile } from 'fs-extra';
import path from 'path';
import { generateGherkinPrompt } from '../support/ai/aiHelper'; // Adjust the path based on your project structure

/**
 * Prompts the user to provide feature details.
 * @returns {Promise<{featureTitle: string, description: string, scenarios: string[]}>} User-provided feature details.
 */
async function promptForFeatureDetails() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'featureTitle',
            message: 'Enter the feature title:',
        },
        {
            type: 'input',
            name: 'description',
            message: 'Enter a brief description of the feature:',
        },
        {
            type: 'input',
            name: 'scenarios',
            message: 'List the scenarios (comma-separated):',
        },
    ]);

    return {
        featureTitle: answers.featureTitle,
        description: answers.description,
        scenarios: answers.scenarios.split(',').map((s: string) => s.trim()),
    };
}

/**
 * Creates a Gherkin feature file based on user-provided details.
 */
async function createFeatureFile() {
    try {
        // Get feature details from the user
        const { featureTitle, description, scenarios } = await promptForFeatureDetails();

        // Construct the prompt for OpenAI
        let prompt = `Generate a Gherkin feature file:\nFeature: ${featureTitle}\nDescription: ${description}\nScenarios:\n`;
        scenarios.forEach((scenario: string, index: number) => {
            prompt += `  ${index + 1}. ${scenario}\n`;
        });

        console.log('Generating feature file with the following details:');
        console.log(prompt);

        // Generate the Gherkin content using OpenAI
        const content = await generateGherkinPrompt(prompt);

        // Define the path for the new feature file
        const featureFileName = featureTitle.replace(/\s+/g, '_').toLowerCase() + '.feature';
        const featureFilePath = path.resolve(__dirname, '../../features', featureFileName);

        // Write the generated content to the file
        await writeFile(featureFilePath, content, 'utf8');

        console.log(`Feature file successfully generated at: ${featureFilePath}`);
    } catch (error) {
        console.error('Error creating feature file:', error);
    }
}

createFeatureFile();