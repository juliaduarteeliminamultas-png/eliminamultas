// Import Express and Axios
const express = require('express');
const axios = require('axios'); 

// --- Environment Credentials (From Render) ---
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; 
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; 
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; 

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

// --- Function to Send Reply via Cloud API ---
async function sendReply(recipientId, textMessage) {
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
        console.error("ERROR: ACCESS_TOKEN or PHONE_NUMBER_ID not configured.");
        return;
    }
    
    try {
        await axios({
            method: "POST",
            url: `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ACCESS_TOKEN}`
            },
            data: {
                messaging_product: "whatsapp",
                to: recipientId,
                type: "text",
                text: {
                    body: textMessage
                }
            }
        });
        console.log(`✅ Message sent successfully to: ${recipientId}`);
    } catch (error) {
        console.error("❌ ERROR SENDING MESSAGE:", error.response ? error.response.data : error.message);
    }
}

// --- GET Route (Webhook Verification) ---
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// --- POST Route (Receiving and Replying) ---
app.post('/', (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\nWebhook received ${timestamp}\n`);
  
  res.status(200).end();

  const body = req.body;
  
  if (body.object === 'whatsapp_business_account') {
    body.entry.forEach(entry => {
        entry.changes.forEach(change => {
            if (change.field === 'messages') {
                const messageData = change.value;
                
                if (messageData.messages && messageData.messages.length > 0) {
                    const message = messageData.messages[0];
                    const senderId = message.from;
                    const incomingText = message.text ? message.text.body : 'Other message type';
                    
                    console.log(`Message from ${senderId}: "${incomingText}"`);

                    // --- ENGLISH RESPONSE FOR META APPROVAL ---
                    const responseText = `Hello! This is the automated assistant for [Sua Empresa]. 🚀\n\nI have received your message: "${incomingText}".\n\nA team member will assist you shortly. Please stay tuned!`;
                    
                    sendReply(senderId, responseText);
                }
            }
        });
    });
  }
});

app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
