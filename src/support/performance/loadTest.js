import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Environment variables for flexible test parameters
const vus = __ENV.VUS ? parseInt(__ENV.VUS) : 1;
const duration = __ENV.DURATION ? __ENV.DURATION : "5s";
const endpoint = __ENV.ENDPOINT || "/posts";
const method = __ENV.METHOD || "GET";
const reportPath = __ENV.REPORT_PATH || "reports/performance/";

console.log(`🚀 Running K6 load test with ${vus} VUs for ${duration} on ${endpoint}`);

// K6 test options
export let options = {
  vus: vus,
  duration: duration,
  thresholds: {
    http_req_duration: ["avg<200", "p(95)<300"],
    checks: ["rate>0.99"],
  },
};

export default function () {
  let res;

  if (method.toUpperCase() === "GET") {
    res = http.get(`https://jsonplaceholder.typicode.com${endpoint}`);
  } else {
    console.error(`❌ Unsupported HTTP method: ${method}`);
    return;
  }

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 1000ms": (r) => r.timings.duration < 1000,
  });

  sleep(1);
}

// Generate reports automatically
export function handleSummary(data) {
  return {
    [`${reportPath}loadTest.json`]: JSON.stringify(data, null, 2),
    [`${reportPath}loadTest.html`]: htmlReport(data),
  };
}