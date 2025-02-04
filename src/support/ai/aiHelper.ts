import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Fetch the API key from the environment variables
});

/**
 * Generates Gherkin content using OpenAI's API based on a given prompt.
 * @param {string} prompt - The input prompt to send to OpenAI for Gherkin generation.
 * @returns {Promise<string>} - The generated Gherkin content.
 */
export async function generateGherkinPrompt(prompt: string): Promise<string> {
    try {
        console.log('Prompt sent to OpenAI:', prompt);  // Log the prompt being sent

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1500,
        });

        console.log('OpenAI response received:', JSON.stringify(response, null, 2));  // Log the response object

        // Check if the response contains choices
        if (!response.choices || response.choices.length === 0) {
            throw new Error('OpenAI returned an empty response.');
        }

        const generatedContent = response.choices[0]?.message?.content || '';
        console.log('Generated Gherkin content:', generatedContent);  // Log the generated content

        return generatedContent;
    } catch (error) {
        console.error('Error generating Gherkin content:', error);

        // Throw a more detailed error message
        throw new Error(`Failed to generate content from OpenAI: ${(error as any).message}`);
    }
}