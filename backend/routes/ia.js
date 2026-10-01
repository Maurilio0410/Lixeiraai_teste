// ============================================================
// LixeirAI - Rotas de Inteligência Artificial
// ============================================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const pool = require("../conexao_banco");

// ============================================================
// CONFIGURAÇÃO DO MULTER (UPLOAD DE IMAGENS)
// ============================================================

const diretorioUploads = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(diretorioUploads)) {
    fs.mkdirSync(diretorioUploads, { recursive: true });
}

const armazenamento = multer.diskStorage({
    destination: (req, file, cb) => cb(null, diretorioUploads),
    filename: (req, file, cb) => {
        const unico = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unico + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: armazenamento,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB máximo
    },
    fileFilter: (req, file, cb) => {
        const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Tipo de arquivo não permitido. Use JPEG, PNG ou WebP."), false);
        }
    }
});

// ============================================================
// MAPEAMENTO DE MATERIAIS PARA LIXEIRAS E PONTOS
// ============================================================

const MAPA_LIXEIRAS = {
    "Plástico": { lixeira: "Vermelha", emoji: "🔴", pontos: 10 },
    "Papel": { lixeira: "Azul", emoji: "🔵", pontos: 10 },
    "Papelão": { lixeira: "Azul", emoji: "🔵", pontos: 10 },
    "Vidro": { lixeira: "Verde", emoji: "🟢", pontos: 10 },
    "Metal": { lixeira: "Amarela", emoji: "🟡", pontos: 10 },
    "Madeira": { lixeira: "Preta", emoji: "⚫", pontos: 5 },
    "Orgânico": { lixeira: "Marrom", emoji: "🟤", pontos: 5 },
    "Não reciclável": { lixeira: "Preta", emoji: "⚫", pontos: 0 },
    "Indeterminado": { lixeira: "Preta", emoji: "⚫", pontos: 0 }
};

const MATERIAIS_VALIDOS = new Set(Object.keys(MAPA_LIXEIRAS));
const CONFIANCA_MINIMA = 70;

function validarResultadoIA(resultado) {
    if (!resultado || typeof resultado !== "object") {
        throw new Error("A IA retornou um resultado vazio.");
    }

    const material = typeof resultado.material === "string"
        ? resultado.material.trim()
        : "";
    const confianca = Number(resultado.confianca);
    const mapa = MAPA_LIXEIRAS[material];

    if (!MATERIAIS_VALIDOS.has(material) || material === "Indeterminado") {
        throw new Error("A IA não identificou um material permitido.");
    }

    if (!Number.isFinite(confianca) || confianca < CONFIANCA_MINIMA || confianca > 100) {
        throw new Error(`A confiança da IA deve ser de pelo menos ${CONFIANCA_MINIMA}%.`);
    }

    return {
        ...resultado,
        aceito: true,
        material,
        tipo: typeof resultado.tipo === "string" && resultado.tipo.trim()
            ? resultado.tipo.trim()
            : "Objeto não especificado",
        categoria_lixeira: mapa.lixeira,
        lixeira: mapa.lixeira,
        confianca: Math.round(confianca),
        pontos: mapa.pontos,
        classificavel: true
    };
}

// ============================================================
// FUNÇÃO PARA CHAMAR A API DO GEMINI
// ============================================================

async function analisarComGemini(caminhoImagem) {
    const { GoogleGenerativeAI } = require("@google/generative-ai");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "sua_chave_aqui") {
        console.warn("GEMINI_API_KEY não configurada. Usando modo simulado.");
        return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelo = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const dadosImagem = fs.readFileSync(caminhoImagem);
    const base64Imagem = dadosImagem.toString("base64");

    const extensao = path.extname(caminhoImagem).toLowerCase();
    const mimeType = extensao === ".png" ? "image/png" : "image/jpeg";

    const prompt = `Analise cuidadosamente a imagem enviada e use somente o que estiver visível nela.

Identifique o principal material reciclável presente na imagem.

Classifique o objeto em UMA das seguintes categorias:
- Plástico
- Papel
- Papelão
- Vidro
- Metal
- Madeira
- Orgânico
- Não reciclável
- Indeterminado

Determine também a categoria de descarte correspondente segundo as lixeiras de reciclagem brasileiras.

Informe o objeto principal, o material visível, os indícios usados na identificação e qualquer limitação
(por exemplo: imagem borrada, objeto parcialmente visível ou material não distinguível). Não confunda o
objeto com o fundo da imagem. Use confiança de 70% ou mais somente quando houver evidência visual suficiente.

Retorne SOMENTE um JSON válido, sem nenhum texto antes ou depois, contendo:
{
    "aceito": true ou false,
    "material": "nome do material",
    "tipo": "descrição do objeto identificado",
    "categoria_lixeira": "cor da lixeira",
    "confianca": número de 0 a 100,
    "pontos": 10 ou 5 ou 0,
    "justificativa": "breve explicação baseada na imagem",
    "limitacoes": "limitações observadas ou vazio"
}

Se não houver segurança suficiente para identificar o material (confiança abaixo de 40%), retorne:
{
    "aceito": false,
    "material": "Indeterminado",
    "tipo": "Não identificado",
    "categoria_lixeira": "Preta",
    "confianca": 0,
    "pontos": 0,
    "justificativa": "Não foi possível identificar o material com segurança."
}

Não invente informações quando a imagem não permitir uma identificação confiável.`;

    try {
        const resultado = await modelo.generateContent([
            {
                inlineData: {
                    data: base64Imagem,
                    mimeType: mimeType
                }
            },
            prompt
        ]);

        const texto = resultado.response.text();
        console.log("Resposta recebida do Gemini.");

        // Extrair JSON da resposta (pode estar envolto em ```json ... ```)
        const match = texto.match(/\{[\s\S]*\}/);
        if (!match) {
            throw new Error("Resposta da IA não contém JSON válido.");
        }

        return validarResultadoIA(JSON.parse(match[0]));
    } catch (erro) {
        console.error("Erro ao chamar Gemini:", erro.message);
        return null;
    }
}

// ============================================================
// MODO SIMULADO (quando não há API Key)
// ============================================================

function simulacaoIA(caminhoImagem) {
    const materiais = ["Plástico", "Papel", "Papelão", "Vidro", "Metal"];
    const tipos = [
        "Garrafa PET", "Folha de papel", "Caixa de papelão",
        "Garrafa de vidro", "Lata de alumínio"
    ];
    const imagem = fs.readFileSync(caminhoImagem);
    const hash = crypto.createHash("sha256").update(imagem).digest();
    const indice = hash[0] % materiais.length;
    const material = materiais[indice];
    const mapa = MAPA_LIXEIRAS[material];
    const confianca = 70 + (hash[1] % 11);

    return {
        aceito: true,
        material: material,
        tipo: tipos[indice],
        categoria_lixeira: mapa.lixeira,
        confianca: confianca,
        pontos: mapa.pontos,
        justificativa: `Simulação de demonstração: referência visual não confirmada. ` +
            `O material sugerido é ${material} com confiança simulada de ${confianca}%.`,
        limitacoes: "A simulação não possui um modelo de visão e não confirma o conteúdo da foto."
    };
}

// ============================================================
// POST /api/ia/analisar-imagem
// ============================================================

router.post("/analisar-imagem", upload.single("imagem"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                mensagem: "Nenhuma imagem foi enviada."
            });
        }

        const usuarioId = req.body.usuarioId;
        if (!usuarioId || !Number.isInteger(Number(usuarioId)) || Number(usuarioId) <= 0) {
            return res.status(400).json({
                mensagem: "ID do usuário inválido."
            });
        }

        // Verificar se o usuário existe
        const [usuarioExiste] = await pool.execute(
            "SELECT id FROM usuarios WHERE id = ?",
            [Number(usuarioId)]
        );

        if (usuarioExiste.length === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        const caminhoImagem = req.file.path;
        console.log(`📸 Imagem recebida: ${req.file.filename} (${(req.file.size / 1024).toFixed(1)} KB)`);

        // Tentar chamar a API do Gemini; a simulação permanece disponível para demonstração.
        let resultadoIA = await analisarComGemini(caminhoImagem);

        // Se não conseguiu, usar simulação
        if (!resultadoIA) {
            resultadoIA = simulacaoIA(caminhoImagem);
            resultadoIA.modo = "simulado";
            resultadoIA.motivoSimulacao = "A análise real do Gemini falhou; consulte o log do servidor para o motivo.";
        } else {
            resultadoIA.modo = "real";
        }

        // Complementar com dados do mapa de lixeiras
        const mapa = MAPA_LIXEIRAS[resultadoIA.material] || MAPA_LIXEIRAS["Indeterminado"];
        resultadoIA.categoria_lixeira = resultadoIA.categoria_lixeira || mapa.lixeira;
        resultadoIA.pontos = resultadoIA.pontos ?? mapa.pontos;
        resultadoIA.lixeira = resultadoIA.categoria_lixeira;
        resultadoIA.classificavel = resultadoIA.modo === "real" &&
            resultadoIA.aceito === true &&
            Number(resultadoIA.confianca) >= CONFIANCA_MINIMA;
        resultadoIA.imagemPath = req.file.filename;
        resultadoIA.mensagem = resultadoIA.modo === "simulado"
            ? "Modo simulado: a foto não foi confirmada por uma IA visual."
            : (resultadoIA.justificativa || "Material analisado com sucesso.");

        res.json(resultadoIA);

    } catch (erro) {
        console.error("Erro na análise de imagem:", erro);

        if (erro.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                mensagem: "Imagem muito grande. O limite é 10 MB."
            });
        }

        if (erro.message && erro.message.includes("Tipo de arquivo")) {
            return res.status(400).json({
                mensagem: erro.message
            });
        }

        res.status(500).json({
            mensagem: "Não foi possível analisar a imagem. Tente novamente."
        });
    }
});

module.exports = router;
