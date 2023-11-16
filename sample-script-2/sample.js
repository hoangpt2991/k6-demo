import { sleep, check } from 'k6';
import http from 'k6/http';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { Rate } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export let errorRate = new Rate('errors');
 
 export const options = {
    stages: [
        { target: 50, duration: '1m' },
        { target: 50, duration: '2m' },
        { target: 10, duration: '1m' },
    ],
    thresholds: {
		"http_req_failed": ['rate<0.01'], // http errors should be less than 1%
        "http_req_duration": ["p(95)<1000"] , // 95 percent of response times must be below 1000ms
    },
};

const input_data = papaparse.parse(open('./id.csv'), { header: true }).data;

export default function () {

    let randomUser = input_data[Math.floor(Math.random() * input_data.length)];
    console.log('Random user: ', JSON.stringify(randomUser));

    let requests = {
        'public/crocodiles': {
            method: 'GET',
            url: 'https://test-api.k6.io/public/crocodiles/'
        },
        'public/crocodiles/${Id}': {
            method: 'GET',
            url: 'https://test-api.k6.io/public/crocodiles/' + randomUser.Id,
            params: {
                headers: {
                    Authorization: randomUser.sessionId,
                    'x-profile-id': randomUser.profileId,
                    'Content-Type': 'application/json',
                }
            },
        }
    };
    let responses = http.batch(requests);

    check(responses['public/crocodiles'], {
        'public/crocodiles status was 200': (res) => res.status === 200,
    })|| errorRate.add(1);

    check(responses['public/crocodiles/${Id}'], {
        'public/crocodiles/${Id} status was 200': (res) => res.status === 200,
    })|| errorRate.add(1);
  
} 

// function export
export function handleSummary(data) {
    // Generate the HTML report and store it in 'result.html'.
    const htmlReportData = htmlReport(data);
   
    // Generate the text summary with colors and indentation.
    const textSummaryData = textSummary(data, { indent: " ", enableColors: true });
   
    // Create a combined object that includes both HTML and JSON data.
    const combinedSummary = {
      "result-2.html": htmlReportData,
      stdout: textSummaryData,
      'summary-2.json': JSON.stringify(data),
    };
   
    return combinedSummary;
  }