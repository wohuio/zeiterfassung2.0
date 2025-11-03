const XANO_BASE_URL = 'https://xv05-su7k-rvc8.f2.xano.io';
const XANO_API_GROUP_AUTH = 'api:vUu_9Py3';
const XANO_API_GROUP_MAIN = 'api:v1';

const authBaseUrl = `${XANO_BASE_URL}/${XANO_API_GROUP_AUTH}`;
const mainBaseUrl = `${XANO_BASE_URL}/${XANO_API_GROUP_MAIN}`;

console.log('Auth Base URL:', authBaseUrl);
console.log('Main Base URL:', mainBaseUrl);
console.log('Signup URL:', `${authBaseUrl}/signup`);
console.log('Login URL:', `${authBaseUrl}/login`);
console.log('Time Entries URL:', `${mainBaseUrl}/time-entries`);
