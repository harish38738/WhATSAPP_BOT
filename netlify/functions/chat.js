const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const messages = body.messages;
    const system = body.system;

    const geminiMessages = messages.map(function(m) {
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      };
    });

    const postData = JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: geminiMessages
    });

    const apiKey = process.env.GEMINI_API_KEY;
    const path = '/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;

    const reply = await new Promise(function(resolve, reject) {
      const req = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, function(res) {
        let data = '';
        res.on('data', function(chunk) { data += chunk; });
        res.on('end', function() {
          try {
            const parsed = JSON.parse(data);
            const text = parsed.candidates[0].content.parts[0].text;
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
