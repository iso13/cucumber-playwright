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
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
        });
        return response.choices[0]?.message?.content || '';
    } catch (error) {
        console.error('Error generating Gherkin content:', error);
        throw new Error('Failed to generate content from OpenAI.');
    }
}