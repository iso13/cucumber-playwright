import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

// Initialize OpenAI client with the API key from environment variables
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure this key is set in your .env file
});

/**
 * Generates Gherkin content using OpenAI's API based on a given prompt.
 * @param {string} prompt - The input prompt to send to OpenAI for Gherkin generation.
 * @returns {Promise<string>} - The generated Gherkin content.
 */
export async function generateGherkinPrompt(prompt: string): Promise<string> {
    try {
        console.log('Sending request to OpenAI...');
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,  // Lower value keeps output more deterministic
            max_tokens: 1500,  // Adjust based on expected response length
        });

        const content = response.choices[0]?.message?.content || '';
        console.log('Gherkin content successfully generated.');

        return content.trim();  // Trim to remove extra whitespace
    } catch (error) {
        console.error('Error generating Gherkin content:', error);
        throw new Error('Failed to generate content from OpenAI.');
    }
}