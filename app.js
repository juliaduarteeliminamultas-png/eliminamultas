const express = require('express');
const axios = require('axios'); 

const ACCESS_TOKEN = process.env.ACCESS_TOKEN; 
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; 
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; 

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

async function sendTemplateReply(recipientId, incomingText) {
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
        console.error("ERROR: Credentials missing in Render Environment Variables.");
        return;
    }
    
    try {
        const response = await axios({
            method: "POST",
            url: `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ACCESS_TOKEN}`
            },
            data: {
                messaging_product: "whatsapp",
                to: recipientId,
                type: "template",
                template: {
                    name: "official_welcome_message",
                    language: {
                        code: "en" // Alterado de en_US para en para evitar erro 132001
                    },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: incomingText },
                                { type: "text", text: "ID-" + Math.floor(Math.random() * 100000) }
                            ]
                        }
                    ]
                }
            }
        });
        console.log(`✅ Success! Message ID: ${response.data.messages[0].id}`);
    } catch (error) {
        // Log detalhado para o vídeo de aprovação
        console.error("❌ API ERROR:", error.response ? JSON.stringify(error.response.data) : error.message);
    }
}

app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

app.post('/', (req, res) => {
  res.status(200).end();
  const body = req.body;
  if (body.object === 'whatsapp_business_account') {
    body.entry.forEach(entry => {
        entry.changes.forEach(change => {
            if (change.field === 'messages' && change.value.messages) {
                const message = change.value.messages[0];
                sendTemplateReply(message.from, message.text ? message.text.body : 'Support');
            }
        });
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
