const http = require('http');

const data = JSON.stringify({
  email: 'admin@workforcepro.com',
  password: 'Admin@12345'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('CORS Headers:');
    console.log('  Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
    console.log('  Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
    console.log('  Access-Control-Allow-Headers:', res.headers['access-control-allow-headers']);
    console.log('  Access-Credentials:', res.headers['access-control-allow-credentials']);
    console.log('Response:', responseData);
  });
});

req.on('error', (e) => {
  console.log('Error:', e.message);
});

req.write(data);
req.end();