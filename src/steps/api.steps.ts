import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { sendApiRequest } from '../support/api/aiAPIHelper';

// JSON response placeholder
let jsonResponse: Record<string, any>;

Given('I send a request to the AI inference API', async function () {
    // Make a GET request to the AI inference API endpoint
    jsonResponse = await sendApiRequest('/ai-inference', 'GET');
    expect(jsonResponse).toBeDefined();
    expect(typeof jsonResponse).toBe('object');
});

When('I receive a JSON response', function () {
    // Ensure the JSON response is present and valid
    expect(jsonResponse).toBeDefined();
    expect(typeof jsonResponse).toBe('object');
});

Then('the response should match the expected structure:', function (dataTable) {
    // Convert the data table to an array of objects
    const expectedStructure = dataTable.raw();

    // Iterate over each row to validate the structure
    for (const [key, expectedType] of expectedStructure.slice(1)) {  // Skip the header row
        expect(jsonResponse).toHaveProperty(key);

        // Validate the type of the property
        const value = jsonResponse[key];
        switch (expectedType.toLowerCase()) {
            case 'string':
                expect(typeof value).toBe('string');
                break;
            case 'number':
                expect(typeof value).toBe('number');
                break;
            case 'object':
                expect(typeof value).toBe('object');
                break;
            case 'array':
                expect(Array.isArray(value)).toBe(true);
                break;
            default:
                throw new Error(`Unsupported data type: ${expectedType}`);
        }
    }
});

Given('a valid JSON response is received from the AI inference API', function () {
    // Ensure the response is valid and has required fields
    expect(jsonResponse).toBeDefined();
    expect(typeof jsonResponse).toBe('object');

    // Check for core keys
    const requiredKeys = ['prediction', 'confidence', 'metadata'];
    for (const key of requiredKeys) {
        expect(jsonResponse).toHaveProperty(key, expect.anything());
    }

    // Log the received response for debugging purposes
    console.log('Valid JSON response received:', JSON.stringify(jsonResponse, null, 2));
});

When('I analyze the data in the response', function () {
    console.log('Analyzing response data:', jsonResponse);  // Debug log
    if (!jsonResponse) {
        throw new Error('No response received from API');
    }
    console.log('Prediction:', jsonResponse.prediction);
});

Then('the confidence value should be greater than {float}', function (minConfidence) {
    console.log('Confidence received:', jsonResponse.confidence);
    console.log('Input value:', jsonResponse.input_value || 'N/A');

    const confidenceValue = parseFloat(jsonResponse.confidence);
    expect(confidenceValue).toBeGreaterThanOrEqual(minConfidence);
});

Then('the prediction value should not be empty', function () {
    // Validate the prediction field is a non-empty string
    expect(typeof jsonResponse.prediction).toBe('string');
    expect(jsonResponse.prediction.trim()).not.toBe('');

    console.log(`Prediction value is valid: "${jsonResponse.prediction}"`);
});

Then('the metadata field should include the key {string}', function (key) {
    // Ensure the metadata field exists and includes the required key
    expect(jsonResponse).toHaveProperty('metadata');
    expect(jsonResponse.metadata).toHaveProperty(key);

    console.log(`Metadata contains the key: "${key}"`);
});

Given('I send a request to the AI inference API with input data:', async function (dataTable) {
    const inputData = dataTable.rowsHash();

    // Log the payload to ensure it's correct
    console.log('Payload being sent:', inputData);

    // Send the request
    jsonResponse = await sendApiRequest('/ai-inference', 'POST', {
        input_type: inputData.input_type,
        input_value: inputData.input_value  // Ensure input_value matches what Mockoon expects
    });
});

Then('the confidence value should be {float}', function (minConfidence) {
    expect(jsonResponse.confidence).toBeGreaterThanOrEqual(minConfidence);
});

Then('the prediction value should be {string}', function (expectedPrediction) {
    expect(jsonResponse.prediction).toBe(expectedPrediction);
});