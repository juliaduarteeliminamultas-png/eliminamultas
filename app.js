// Importar Express (para o servidor) e Axios (para fazer requisições HTTP)
const express = require('express');
const axios = require('axios'); 

// --- Credenciais de Ambiente (Lidas do Render) ---
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; 
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; 
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // Usamos UPPERCASE para clareza

// Configurações básicas do servidor
const app = express(); // ⬅️ Apenas uma vez!
app.use(express.json());
const port = process.env.PORT || 3000;


// --- Função para Enviar a Resposta via Cloud API ---
async function sendReply(recipientId, textMessage) {
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
        console.error("ERRO: ACCESS_TOKEN ou PHONE_NUMBER_ID não configurados no Render.");
        return;
    }
    
    try {
        await axios({
            method: "POST", // A API de envio SEMPRE usa POST
            url: `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ACCESS_TOKEN}` // O token para autenticação
            },
            data: {
                messaging_product: "whatsapp",
                to: recipientId, // O número de quem enviou
                type: "text",
                text: {
                    body: textMessage // A mensagem de resposta
                }
            }
        });
        console.log(`✅ Mensagem enviada com sucesso para: ${recipientId}`);
    } catch (error) {
        // Se houver erro, loga a resposta do Meta para ajudar na depuração
        console.error("❌ ERRO AO ENVIAR MENSAGEM:", error.response ? error.response.data : error.message);
    }
}


// --- Rota GET (Verificação do Webhook) ---
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});


// --- Rota POST (Recebimento de Mensagens e Resposta) ---
app.post('/', (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n\nWebhook received ${timestamp}\n`);
  
  // Responda ao Meta imediatamente com 200 OK para evitar timeouts
  res.status(200).end();

  // --- LÓGICA DE PROCESSAMENTO E RESPOSTA ---
  const body = req.body;
  
  if (body.object === 'whatsapp_business_account') {
    body.entry.forEach(entry => {
        entry.changes.forEach(change => {
            if (change.field === 'messages') {
                const messageData = change.value;
                
                // Verifica se é uma mensagem de texto recebida
                if (messageData.messages && messageData.messages.length > 0) {
                    const message = messageData.messages[0];
                    const senderId = message.from; // Número do remetente
                    const incomingText = message.text ? message.text.body : 'Mensagem de outro tipo';
                    
                    console.log(`Mensagem recebida de ${senderId}: "${incomingText}"`);

                    // Chama a função para enviar uma resposta automática
                    const responseText = `Recebi sua mensagem: "${incomingText}". Meu chatbot está funcionando perfeitamente!`;
                    sendReply(senderId, responseText);
                }
            }
        });
    });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
