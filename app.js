const express = require('express');
const axios = require('axios'); 

const ACCESS_TOKEN = process.env.ACCESS_TOKEN; 
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; 
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; 

const app = express();
app.use(express.json());
const port = process.env.PORT || 10000;

async function sendTemplateReply(recipientId) {
    try {
        await axios({
            method: "POST",
            url: `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ACCESS_TOKEN}`
            },
            data: {
                messaging_product: "whatsapp",
                to: recipientId,
                type: "template",
                template: {
                    name: "service_update_test",
                    language: { code: "en_GB" },
                    components: [{
                        type: "body",
                        parameters: [
                            { type: "text", text: "John Doe" },
                            { type: "text", text: "Account Activation" },
                            { type: "text", text: "Completed" }
                        ]
                    }]
                }
            }
        });
        console.log("✅ Message sent successfully!");
    } catch (error) {
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
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const message = changes?.value?.messages?.[0];
        if (message) {
            sendTemplateReply(message.from);
        }
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
