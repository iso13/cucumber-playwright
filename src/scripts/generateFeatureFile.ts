import fs from "fs";
import path from "path";
import { generateFeature } from "../support/api/apiHelper";

async function createFeatureFile(prompt: string, fileName: string) {
  try {
    const featureContent = await generateFeature(prompt);

    const outputPath = path.resolve(__dirname, "../features", `${fileName}.feature`);
    fs.writeFileSync(outputPath, featureContent);

    console.log(`Feature file created successfully at: ${outputPath}`);
  } catch (error) {
    console.error("Failed to generate feature file:", error);
  }
}

// Example usage
const prompt = `
Create a Cucumber feature for an e-commerce application with scenarios:
1. Adding an item to the cart.
2. Completing a successful checkout.
3. Failing checkout due to payment issues.
`;

const fileName = "banking_deposit";
createFeatureFile(prompt, fileName);