// apiHelper.ts
import axios from 'axios';
import { OPENAI_API_KEY } from "../apiKey/apiKey";

const BASE_URL = 'https://reqres.in';

export async function sendPostRequest(
  endpoint: string,
  data: Record<string, unknown>
) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await axios.post(url, data);
  return response.data;
}

export async function sendGetRequest(endpoint: string) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await axios.get(url);
  return response.data;
}

export async function generateFeature(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("API key is missing. Please set it in the apiKey.ts file.");
  }

  const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

  try {
    const response = await axios.post(
      OPENAI_URL,
      {
        model: "gpt-3.5-turbo", // Use the model available to your account
        messages: [
          { role: "system", content: "You are an expert in BDD and Gherkin syntax." },
          { role: "user", content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.7, // Controls creativity; adjust as needed
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content.trim();
    } else {
      throw new Error("Invalid response structure from OpenAI API.");
    }
  } catch (error: any) {
    console.error("Error generating feature with OpenAI:", error.response?.data || error.message);
    throw error;
  }
}