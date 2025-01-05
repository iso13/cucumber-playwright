import { Given, When, Then } from '@cucumber/cucumber';

Given('the application endpoint is {string}', async function (string) {
    // Write code here that turns the phrase above into concrete actions
  
});

Given('I have a payload with valid request data', async function () {
    // Write code here that turns the phrase above into concrete actions
    
});

When('I send {int},{int} concurrent requests to the endpoint', async function (int, int2) {
    // When('I send {int},{float} concurrent requests to the endpoint', async function (int, float) {
    // When('I send {float},{int} concurrent requests to the endpoint', async function (float, int) {
    // When('I send {float},{float} concurrent requests to the endpoint', async function (float, float2) {
    // Write code here that turns the phrase above into concrete actions
    
});


Then('the response time should not exceed {int} milliseconds', async function (int) {
    // Then('the response time should not exceed {float} milliseconds', async function (float) {
    // Write code here that turns the phrase above into concrete actions
   
});

Then('the server should not return more than {int}% of {int} error responses', async function (int, int2) {
    // Then('the server should not return more than {int}% of {float} error responses', async function (int, float) {
    // Then('the server should not return more than {float}% of {int} error responses', async function (float, int) {
    // Then('the server should not return more than {float}% of {float} error responses', async function (float, float2) {
    // Write code here that turns the phrase above into concrete actions
   
});

Then('the CPU usage should remain below {int}%', async function (int) {
    // Then('the CPU usage should remain below {float}%', async function (float) {
    // Write code here that turns the phrase above into concrete actions
   
});

Then('the memory usage should remain below {int}%', async function (int) {
    // Then('the memory usage should remain below {float}%', async function (float) {
    // Write code here that turns the phrase above into concrete actions

});