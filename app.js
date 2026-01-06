require('dotenv').config();
const express = require('express');
const axios = require('axios');

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const app = express();
app.use(express.json());

const port = process.env.PORT || 10000;

/**
 * Envia template do WhatsApp
 */
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
                    language: { code: "en_US" },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: "John Doe" },
                                { type: "text", text: "Account Activation" },
                                { type: "text", text: "Completed" }
                            ]
                        }
                    ]
                }
            }
        });

        console.log("✅ Message sent successfully!");
    } catch (error) {
        console.error(
            "❌ API ERROR:",
            error.response ? JSON.stringify(error.response.data, null, 2) : error.message
        );
    }
}

/**
 * Verificação do Webhook
 */
app.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
});

/**
 * Recebe mensagens do WhatsApp
 */
app.post('/', async (req, res) => {
    res.sendStatus(200);

    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) return;

    console.log("📩 Mensagem recebida de:", message.from);

    await sendTemplateReply(message.from);
});

/**
 * Inicializa servidor
 */
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
