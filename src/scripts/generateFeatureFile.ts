import inquirer from 'inquirer';
import { mkdirp, writeFile } from 'fs-extra';
import path from 'path';
import { generateGherkinPrompt } from '../support/ai/aiHelper';

/**
 * Prompts the user to provide the feature title.
 */
async function promptForFeatureTitle() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'featureTitle',
            message: 'Enter the feature title:',
        },
    ]);

    return answers.featureTitle.trim();
}

/**
 * Converts a string to PascalCase.
 */
function toPascalCase(title: string): string {
    return title
        .trim()
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

/**
 * Converts a string to lowerCamelCase.
 */
function toLowerCamelCase(title: string): string {
    const pascalCase = toPascalCase(title);
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
}

/**
 * Removes numbering from scenario titles.
 */
function cleanScenarioTitles(content: string): string {
    return content.replace(/Scenario \d+: /g, 'Scenario: ');
}

/**
 * Adds a lowerCamelCase feature tag to the content.
 */
function addFeatureTag(content: string, featureTitle: string): string {
    const featureTag = `@${toLowerCamelCase(featureTitle)}`;
    return `${featureTag}\n${content}`;
}

/**
 * Extracts and limits the number of scenarios in the content.
 */
function limitScenarios(content: string, scenarioCount: number): string {
    const scenarioRegex = /Scenario:/g;
    let match;
    let startIndices: number[] = [];

    // Find all occurrences of "Scenario:"
    while ((match = scenarioRegex.exec(content)) !== null) {
        startIndices.push(match.index);
    }

    // If there are more scenarios than requested, truncate the content
    if (startIndices.length > scenarioCount) {
        const lastValidIndex = startIndices[scenarioCount];
        return content.substring(0, lastValidIndex).trim();
    }

    return content;
}

/**
 * Prompts the user for the desired number of scenarios (range: 3 to 5).
 */
async function promptForScenarioRange(): Promise<number> {
    const answer = await inquirer.prompt([
        {
            type: 'number',
            name: 'scenarioCount',
            message: 'Enter the number of scenarios to generate (between 3 and 5):',
            default: 3,
            validate: (value) => {
                if (typeof value === 'number' && value >= 3 && value <= 5) return true;
                return 'Please enter a number between 3 and 5.';
            },
        },
    ]);
    return answer.scenarioCount;
}

/**
 * Creates a Gherkin feature file based on the feature title and scenario count.
 */
async function createFeatureFile() {
    try {
        const featureTitle = await promptForFeatureTitle();
        const scenarioCount = await promptForScenarioRange();

        const featureFileName = toPascalCase(featureTitle) + '.feature';
        const featureFilePath = path.resolve(__dirname, '../../src/features', featureFileName);

        await mkdirp(path.dirname(featureFilePath));

        // Construct the prompt for OpenAI with dynamic scenario count and priority instructions
        const prompt = `
Generate a Gherkin feature file with scenarios for the following feature title: "${featureTitle}".
Include a brief description and exactly ${scenarioCount} scenarios.
- The first scenario should describe the main 'happy path' (successful operation) for the feature.
- Subsequent scenarios should cover negative paths (e.g., invalid input, authorization failure).
- The last scenario should describe an edge case.
Each scenario should have Given, When, and Then steps. Do not number the scenarios.
`;

        console.log('Sending the prompt to OpenAI...');
        let content = await generateGherkinPrompt(prompt);

        // Clean up scenario titles
        content = cleanScenarioTitles(content);

        // Add the feature tag at the top
        content = addFeatureTag(content, featureTitle);

        // Limit the number of scenarios to the user-specified count
        content = limitScenarios(content, scenarioCount);

        console.log('OpenAI response received. Writing feature file...');

        // Write the generated content to the file
        await writeFile(featureFilePath, content, 'utf8');

        console.log(`Feature file successfully generated at: ${featureFilePath}`);
    } catch (error) {
        console.error('Error creating feature file:', error);
    }
}

// Execute the script
createFeatureFile();