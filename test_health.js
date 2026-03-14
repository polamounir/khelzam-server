import http from 'http';

const testUrl = 'http://localhost:5000/';

http.get(testUrl, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200 && data.includes('API is running')) {
      console.log('✅ Server is UP and healthy!');
    } else {
      console.log(`❌ Server check failed. Status: ${res.statusCode}, Data: ${data}`);
    }
  });
}).on('error', (err) => {
  console.log('❌ Server is DOWN or unreachable:', err.message);
});
