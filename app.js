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
                    name: "service_update_test", // Nome do novo modelo
                    language: {
                        code: "en_US" 
                    },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: "John Doe" },           // Variável {{1}}
                                { type: "text", text: "Account Activation" }, // Variável {{2}}
                                { type: "text", text: "Completed" }          // Variável {{3}}
                            ]
                        }
                    ]
                }
            }
        });
        console.log(`✅ Message sent successfully to: ${recipientId}`);
    } catch (error) {
        console.error("❌ ERROR:", error.response ? JSON.stringify(error.response.data) : error.message);
    }
}
