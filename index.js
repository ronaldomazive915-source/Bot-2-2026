const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

async function conectarWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_rony');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        generateHighQualityLinkPreview: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('❌ Conexão RONY SKIES fechada. Reconectando:', shouldReconnect);
            if (shouldReconnect) conectarWhatsApp();
        } else if (connection === 'open') {
            console.log('🚀 *RONY SKIES* conectado com sucesso! ✨');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const texto = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || '';

        console.log(`📨 [RONY SKIES] ${from}: ${texto}`);

        await sock.sendReadReceipt(from, msg.key.participant, [msg.key.id]);

        // Comando inicial
        if (texto.toLowerCase() === 'oi' || texto.toLowerCase() === 'menu' || texto.toLowerCase() === '*') {
            await enviarMenuPrincipal(sock, from);
            return;
        }

        await processarComando(sock, from, texto);
    });
}

async function enviarMenuPrincipal(sock, to) {
    const menu = `✨ *RONY SKIES BOT* ✨

┌─── *🚀 MENU PRINCIPAL*
│
├─ *1️⃣  INFO* - Sobre o RONY SKIES
├─ *2️⃣  JOGOS* - Mini jogos divertidos
├─ *3️⃣  TOOLS* - Ferramentas úteis
├─ *4️⃣  DOWNLOAD* - Downloads rápidos
├─ *5️⃣  SUPORTE* - Contato RONY SKIES
│
└─── *Digite o número ou "menu"* 👇

*Powered by RONY SKIES* 🔥`;

    await sock.sendMessage(to, { text: menu });
}

async function processarComando(sock, from, texto) {
    const cmd = texto.toLowerCase().trim();

    switch (cmd) {
        case '1':
        case 'info':
            await infoBot(sock, from);
            break;
        case '2':
        case 'jogos':
            await menuJogos(sock, from);
            break;
        case '3':
        case 'tools':
            await menuTools(sock, from);
            break;
        case '4':
        case 'download':
            await menuDownloads(sock, from);
            break;
        case '5':
        case 'suporte':
            await suporte(sock, from);
            break;
        case 'pedra':
        case 'papel':
        case 'tesoura':
            await jogarJokenpo(sock, from, texto);
            break;
        default:
            await sock.sendMessage(from, { 
                text: `❌ Comando não encontrado no *RONY SKIES*!\n\n✨ Digite *menu* ou *oi* ✨` 
            });
    }
}

async function infoBot(sock, to) {
    const info = `🌟 *RONY SKIES - INFORMAÇÕES*

🤖 *Nome:* RONY SKIES BOT
✨ *Criador:* RONY SKIES
⚡ *Status:* 🟢 100% Online
📅 *Uptime:* ${Math.floor(process.uptime() / 60)} min
💾 *Versão:* 2.0 SKIES
🔥 *Servidor:* 24/7 Non-Stop

*Digite "menu" para voltar* 🚀`;
    
    await sock.sendMessage(to, { text: info });
}

async function menuJogos(sock, to) {
    const jogos = `🎮 *RONY SKIES - JOGOS*

1️⃣ *PEDRA* - Pedra Papel Tesoura
2️⃣ *NUMERO* - Adivinhe o número  
3️⃣ *ADIVINHA* - Adivinha quem!

*Jogue agora ou digite "menu"* ✨`;
    
    await sock.sendMessage(to, { text: jogos });
}

async function menuTools(sock, to) {
    const tools = `🔧 *RONY SKIES - TOOLS*

1️⃣ *CALC 10+2* - Calculadora
2️⃣ *DATA* - Data/hora atual
3️⃣ *CLIMA sp* - Previsão tempo
4️⃣ *COTA usd* - Dólar real-time

*Ex: "calc 15*3" ou "menu"* ⚡`;
    
    await sock.sendMessage(to, { text: tools });
}

async function menuDownloads(sock, to) {
    const dl = `📥 *RONY SKIES - DOWNLOADS*

1️⃣ *YTMP3 link* - YouTube → MP3
2️⃣ *YTMP4 link* - YouTube → MP4
3️⃣ *FBM link* - Facebook vídeo

*Cole o link ou "menu"* 🚀`;
    
    await sock.sendMessage(to, { text: dl });
}

async function suporte(sock, to) {
    const suporte = `📞 *RONY SKIES SUPORTE*

👨‍💻 *Dono:* RONY SKIES
📱 *WhatsApp:* wa.me/SEU_NUMERO
💰 *Pix:* seu.pix@ronyskies.com
✨ *Instagram:* @rony.skies

*Digite "menu" para voltar* 🔥`;
    
    await sock.sendMessage(to, { text: suporte });
}

async function jogarJokenpo(sock, from, jogada) {
    const opcoes = ['pedra', 'papel', 'tesoura'];
    const botJogada = opcoes[Math.floor(Math.random() * 3)];
    
    let resultado;
    if (jogada.toLowerCase() === botJogada) {
        resultado = '🤝 *EMPATE no RONY SKIES!*';
    } else if (
        (jogada.toLowerCase() === 'pedra' && botJogada === 'tesoura') ||
        (jogada.toLowerCase() === 'papel' && botJogada === 'pedra') ||
        (jogada.toLowerCase() === 'tesoura' && botJogada === 'papel')
    ) {
        resultado = '🎉 *VOCÊ VENCEU o RONY SKIES!*';
    } else {
        resultado = '😈 *RONY SKIES VENCEU!*';
    }

    const resposta = `${resultado}

👤 *Você:* ${jogada.toUpperCase()}
🤖 *RONY SKIES:* ${botJogada.toUpperCase()}

*Jogue novamente! ✨`;

    await sock.sendMessage(from, { text: resposta });
}

console.log('🚀 Iniciando RONY SKIES BOT...');
conectarWhatsApp().catch(console.error);
