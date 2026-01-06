// --- Função Ajustada para Enviar Modelo (Template) ---
async function sendReply(recipientId) {
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
        console.error("ERROR: Credentials not configured.");
        return;
    }
    
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
                    name: "service_update_test", // O nome que deve estar no Painel da Meta
                    language: { 
                        code: "en_GB" // Tente en_GB se en_US falhar
                    },
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
        console.log(`✅ Template sent successfully!`);
    } catch (error) {
        console.error("❌ ERROR SENDING TEMPLATE:", error.response ? JSON.stringify(error.response.data) : error.message);
    }
}

// --- POST Route Ajustado ---
app.post('/', (req, res) => {
    res.status(200).end();
    const body = req.body;
    
    if (body.object === 'whatsapp_business_account') {
        body.entry.forEach(entry => {
            entry.changes.forEach(change => {
                if (change.field === 'messages' && change.value.messages) {
                    const senderId = change.value.messages[0].from;
                    // Chama a função de modelo em vez de texto simples
                    sendReply(senderId);
                }
            });
        });
    }
});
