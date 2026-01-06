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

// --- Function to Send Template Message (Required for Meta Approval) ---
async function sendTemplateReply(recipientId, incomingText) {
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
        console.error("ERROR: Credentials not configured in Render.");
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
                type: "template",
                template: {
                    name: "official_welcome_message",
                    language: {
                        code: "en_US" 
                    },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                {
                                    type: "text",
                                    text: incomingText // Fills placeholder {{1}}
                                },
                                {
                                    type: "text",
                                    text: "ID-" + Math.floor(Math.random() * 100000) // Fills placeholder {{2}}
                                }
                            ]
                        }
                    ]
                }
            }
        });
        console.log(`✅ Template sent successfully to: ${recipientId}`);
    } catch (error) {
        console.error("❌ ERROR SENDING TEMPLATE:", error.response ? error.response.data : error.message);
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

// --- POST Route (Receiving and Replying with Template) ---
app.post('/', (req, res) => {
  res.status(200).end();
  const body = req.body;
  
  if (body.object === 'whatsapp_business_account') {
    body.entry.forEach(entry => {
        entry.changes.forEach(change => {
            if (change.field === 'messages' && change.value.messages) {
                const message = change.value.messages[0];
                const senderId = message.from;
                const incomingText = message.text ? message.text.body : 'Support Inquiry';
                
                console.log(`Incoming message from ${senderId}: "${incomingText}"`);

                // Send the official template instead of plain text
                sendTemplateReply(senderId, incomingText);
            }
        });
    });
  }
});

app.listen(port, () => {
  console.log(`\nServer active on port ${port}\n`);
});
