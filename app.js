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
                    language: { code: "en_US" }, // ✅ CORRETO
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
        console.error(
            "❌ API ERROR:",
            error.response ? JSON.stringify(error.response.data) : error.message
        );
    }
}
