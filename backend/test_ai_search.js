import { aiSearchHandler } from './api/aiSearch.js';

// Mock request and response
const mockReq = {
    body: {
        q: 'patience',
        filters: {
            book: 'Sahih Bukhari',
            grade: 'Sahih',
            narrator: 'Abu Hurairah'
        },
        skipSummary: true
    }
};

const mockRes = {
    status: (code) => {
        console.log('Status:', code);
        return mockRes;
    },
    json: (data) => {
        console.log('Response:', JSON.stringify(data, null, 2));
        return mockRes;
    }
};

console.log('--- Testing skipSummary: true ---');
aiSearchHandler(mockReq, mockRes).then(() => {
    console.log('--- Done ---');
});
