const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const messages = body.messages;
    const system = body.system;

    const postData = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'system', content: system }].concat(messages),
      max_tokens: 500
    });

    const apiKey = process.env.GROQ_API_KEY;

    const reply = await new Promise(function(resolve, reject) {
      const req = https.request({
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey,
          'Content-Length': Buffer.byteLength(postData)
        }
      }, function(res) {
        let data = '';
        res.on('data', function(chunk) { data += chunk; });
        res.on('end', function() {
          try {
            const parsed = JSON.parse(data);
            const text = parsed.choices[0].message.content;
            resolve(text);
          } catch(e) {
            resolve('API Error: ' + data);
          }
        });
      });
      req.on('error', function(e) { resolve('Request Error: ' + e.message); });
      req.write(postData);
      req.end();
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: reply })
    };
  } catch(err) {
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: 'Error: ' + err.message })
    };
  }
};
