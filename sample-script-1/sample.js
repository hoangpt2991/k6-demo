import { sleep, check } from 'k6';
import http from 'k6/http';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export const k6Options = {
    vus: 10,
    duration: '120s',
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
