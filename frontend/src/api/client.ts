import axios from 'axios';

const client = axios.create({
    baseURL: 'http://localhost:8001/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor
client.interceptors.request.use((config) => {
    config.params = config.params || {};
    config.params['tenant_id'] = 'default';
    return config;
});

export default client;
