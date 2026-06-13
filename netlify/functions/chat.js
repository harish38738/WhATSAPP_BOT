const https = require('https');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { system, messages } = JSON.parse(event.body);

    const geminiMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const postData = JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: geminiMessages
    });

    const reply = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: /v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY},
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || No reply: ${data};
            resolve(text);
          } catch(e) {
            resolve(Parse error: ${data});
          }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: Error: ${err.message} })
    };
  }
};
