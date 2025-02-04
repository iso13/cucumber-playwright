import inquirer from 'inquirer';
import path from 'path';
import { writeFile, ensureDir } from 'fs-extra';
import { generateGherkinPrompt } from '../support/ai/aiHelper';

/**
 * Converts a string to lower camel case.
 */
function toLowerCamelCase(input: string): string {
    const pascalCase = input
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
        .replace(/\s+/g, '');
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
}

/**
 * Formats the Gherkin content with proper indentation.
 */
function formatGherkinContent(content: string): string {
    let formattedLines: string[] = [];
    let isScenarioBlock = false;

    content.split('\n').forEach((line) => {
        line = line.trim();

        if (line.startsWith('Scenario:')) {
            formattedLines.push(`  ${line}`);
            isScenarioBlock = true;
        } else if (isScenarioBlock && (line.startsWith('Given') || line.startsWith('When') || line.startsWith('Then') || line.startsWith('And'))) {
            formattedLines.push(`    ${line}`);
        } else if (line === '') {
            formattedLines.push('');
        }
    });

    return formattedLines.join('\n');
}

/**
 * Prompts the user for feature details and generates a Gherkin feature file dynamically.
 */
async function promptForFeatureAndGenerate() {
    try {
        console.log('Prompting for feature details...');

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'featureTitle',
                message: 'Enter the feature title:',
            },
            {
                type: 'input',
                name: 'scenarioCount',
                message: 'Enter the number of scenarios (between 3 and 6):',
                validate: (input: string) => {
                    const value = parseInt(input, 10);
                    if (isNaN(value) || value < 3 || value > 6) {
                        return 'Please enter a valid number between 3 and 6.';
                    }
                    return true;
                },
                default: '3',
            },
        ]);

        const featureTitle: string = answers.featureTitle;
        const scenarioCount: number = parseInt(answers.scenarioCount, 10);

        const lowerCamelCaseTag = toLowerCamelCase(featureTitle);

        const aiPrompt = `
            Generate a Gherkin feature file for the feature titled "${featureTitle}".

            Guidelines:
            1. Add a tag at the top of the file in lower camel case, e.g., "@${lowerCamelCaseTag}".
            2. Include a "Feature:" line with the feature title.
            3. Add ${scenarioCount} scenarios:
               - The first scenario should be the happy path (successful case).
               - The remaining scenarios should include edge cases.

            Format example:
            @${lowerCamelCaseTag}
            Feature: ${featureTitle}

              Scenario: Example Scenario
                Given an example condition
                When an example action is taken
                Then an example result is expected
        `;

        console.log('Generating Gherkin feature content...');
        let gherkinContent = await generateGherkinPrompt(aiPrompt);

        gherkinContent = formatGherkinContent(gherkinContent);

        const featureHeader = `@${lowerCamelCaseTag}\nFeature: ${featureTitle}\n\n`;
        const fullFeatureContent = featureHeader + gherkinContent;

        // Define the correct feature path
        const featuresDir = path.resolve(__dirname, '../features');
        const featureFileName = `${featureTitle.replace(/\s+/g, '')}.feature`;
        const featureFilePath = path.join(featuresDir, featureFileName);

        // Ensure the `features` directory exists
        await ensureDir(featuresDir);

        // Write the file to the correct path
        await writeFile(featureFilePath, fullFeatureContent, 'utf8');

        console.log(`Feature file successfully generated at: ${featureFilePath}`);
    } catch (error) {
        console.error('Error generating the feature file:', error);
    }
}

promptForFeatureAndGenerate();