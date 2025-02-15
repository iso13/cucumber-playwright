import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure API key is set
});

/**
 * Generates Gherkin content using OpenAI's API based on a given prompt.
 */
export async function generateGherkinPrompt(prompt: string): Promise<string> {
    try {
        console.log('🔄 Sending request to OpenAI...');
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1500
        });

        let content = response.choices[0]?.message?.content || '';

        // Cleanup formatting issues
        content = content.replace(/```gherkin|```/g, '').trim();
        content = content.replace(/Feature: .+\n/g, '').trim();

        console.log('✅ Gherkin content successfully generated.');
        return content;
    } catch (error) {
        console.error('❌ Error generating Gherkin content:', error);
        throw new Error('Failed to generate content from OpenAI.');
    }
}