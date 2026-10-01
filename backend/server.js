// ============================================================
// LixeirAI - Servidor Backend
// ============================================================

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARES
// ============================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Servir arquivos de upload
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================================================
// ROTAS DA API
// ============================================================

const usuariosRoutes = require("./routes/usuarios");
const reciclagensRoutes = require("./routes/reciclagens");
const beneficiosRoutes = require("./routes/beneficios");
const iaRoutes = require("./routes/ia");

app.use("/api/usuarios", usuariosRoutes);
app.use("/api/reciclagens", reciclagensRoutes);
app.use("/api/beneficios", beneficiosRoutes);
app.use("/api/ia", iaRoutes);

// ============================================================
// ROTAS DE COMPATIBILIDADE (seu frontend já chama /cadastrar, /login etc)
// ============================================================

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("./conexao_banco");

const JWT_SECRET = process.env.JWT_SECRET || "lixeirai_segredo_2026";

// POST /cadastrar
app.post("/cadastrar", async (req, res) => {
    try {
        const { usuario, email, senha } = req.body;

        if (!usuario || !email || !senha) {
            return res.status(400).json({ mensagem: "Preencha todos os campos." });
        }

        if (senha.length < 6) {
            return res.status(400).json({ mensagem: "A senha deve ter pelo menos 6 caracteres." });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ mensagem: "Email inválido." });
        }

        const [existente] = await pool.execute(
            "SELECT id FROM usuarios WHERE email = ?",
            [email]
        );

        if (existente.length > 0) {
            return res.status(400).json({ mensagem: "Este email já está cadastrado." });
        }

        const senhaHash = await bcrypt.hash(senha, 12);

        const [resultado] = await pool.execute(
            "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
            [usuario, email, senhaHash]
        );

        res.status(201).json({
            mensagem: "Cadastro realizado com sucesso!",
            usuario: { id: resultado.insertId, nome: usuario, email }
        });
    } catch (erro) {
        console.error("Erro no cadastro:", erro);
        res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
});

// POST /login
app.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ mensagem: "Digite o email e a senha." });
        }

        const [usuarios] = await pool.execute(
            "SELECT id, nome, email, senha FROM usuarios WHERE email = ?",
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({ mensagem: "Email ou senha incorretos." });
        }

        const usuario = usuarios[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).json({ mensagem: "Email ou senha incorretos." });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            mensagem: "Login realizado com sucesso!",
            token,
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
        });
    } catch (erro) {
        console.error("Erro no login:", erro);
        res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
});

// GET /usuario/:id
app.get("/usuario/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [usuarios] = await pool.execute(
            "SELECT id, nome, email, pontos, total_reciclagens, data_cadastro FROM usuarios WHERE id = ?",
            [id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ mensagem: "Usuário não encontrado." });
        }

        res.json(usuarios[0]);
    } catch (erro) {
        console.error("Erro ao buscar usuário:", erro);
        res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
});

// ============================================================
// ROTAS DE COMPATIBILIDADE - Histórico e Estatísticas
// ============================================================

// GET /historico/:usuarioId
app.get("/historico/:usuarioId", async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const idNum = Number(usuarioId);
        if (!Number.isInteger(idNum) || idNum <= 0) {
            return res.status(400).json({ mensagem: "ID do usuário inválido." });
        }

        const [reciclagens] = await pool.execute(
            `SELECT id, material, tipo_residuo, categoria_lixeira AS lixeira, confianca,
                    pontos AS pontos_ganhos, justificativa, data_reciclagem
             FROM reciclagens
             WHERE usuario_id = ?
             ORDER BY data_reciclagem DESC`,
            [idNum]
        );

        res.json(reciclagens);
    } catch (erro) {
        console.error("Erro ao buscar histórico:", erro);
        res.status(500).json({ mensagem: "Erro ao carregar histórico." });
    }
});

// GET /estatisticas/:usuarioId
app.get("/estatisticas/:usuarioId", async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const idNum = Number(usuarioId);
        if (!Number.isInteger(idNum) || idNum <= 0) {
            return res.status(400).json({ mensagem: "ID do usuário inválido." });
        }

        const [estatisticas] = await pool.execute(
            `SELECT material, COUNT(*) AS total
             FROM reciclagens
             WHERE usuario_id = ?
             GROUP BY material
             ORDER BY total DESC`,
            [idNum]
        );

        const resultado = {};
        estatisticas.forEach(item => {
            resultado[item.material] = item.total;
        });

        res.json(resultado);
    } catch (erro) {
        console.error("Erro ao buscar estatísticas:", erro);
        res.status(500).json({ mensagem: "Erro ao carregar estatísticas." });
    }
});

// GET /beneficios
app.get("/beneficios", async (req, res) => {
    try {
        const [beneficios] = await pool.execute(
            `SELECT id, nome, descricao, pontos_necessarios, quantidade_disponivel, ativo
             FROM beneficios
             WHERE ativo = 1
             ORDER BY pontos_necessarios ASC`
        );
        res.json(beneficios);
    } catch (erro) {
        console.error("Erro ao buscar benefícios:", erro);
        res.status(500).json({ mensagem: "Erro ao carregar benefícios." });
    }
});

// POST /resgatar-beneficio
app.post("/resgatar-beneficio", async (req, res) => {
    const conexao = await pool.getConnection();
    try {
        const { usuarioId, beneficioId } = req.body;

        if (!usuarioId || !Number.isInteger(Number(usuarioId)) || Number(usuarioId) <= 0) {
            return res.status(400).json({ mensagem: "ID do usuário inválido." });
        }
        if (!beneficioId || !Number.isInteger(Number(beneficioId)) || Number(beneficioId) <= 0) {
            return res.status(400).json({ mensagem: "ID do benefício inválido." });
        }

        await conexao.beginTransaction();

        const [usuarios] = await conexao.execute(
            "SELECT id, pontos FROM usuarios WHERE id = ? FOR UPDATE",
            [Number(usuarioId)]
        );

        if (usuarios.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ mensagem: "Usuário não encontrado." });
        }

        const usuario = usuarios[0];

        const [beneficios] = await conexao.execute(
            "SELECT id, nome, pontos_necessarios, quantidade_disponivel FROM beneficios WHERE id = ? AND ativo = 1 FOR UPDATE",
            [Number(beneficioId)]
        );

        if (beneficios.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ mensagem: "Benefício não encontrado ou indisponível." });
        }

        const beneficio = beneficios[0];

        if (usuario.pontos < beneficio.pontos_necessarios) {
            await conexao.rollback();
            return res.status(400).json({
                mensagem: "Você não possui pontos suficientes para este benefício.",
                pontosAtuais: usuario.pontos,
                pontosNecessarios: beneficio.pontos_necessarios
            });
        }

        if (beneficio.quantidade_disponivel <= 0) {
            await conexao.rollback();
            return res.status(400).json({ mensagem: "Este benefício não está mais disponível." });
        }

        const codigo = "LXAI-" + Date.now().toString(36).toUpperCase() +
            Math.random().toString(36).substring(2, 6).toUpperCase();

        const pontosRestantes = usuario.pontos - beneficio.pontos_necessarios;

        await conexao.execute(
            "UPDATE usuarios SET pontos = ? WHERE id = ?",
            [pontosRestantes, Number(usuarioId)]
        );

        await conexao.execute(
            "UPDATE beneficios SET quantidade_disponivel = quantidade_disponivel - 1 WHERE id = ?",
            [Number(beneficioId)]
        );

        await conexao.execute(
            "INSERT INTO resgates (usuario_id, beneficio_id, pontos_gastos, codigo_resgate) VALUES (?, ?, ?, ?)",
            [Number(usuarioId), Number(beneficioId), beneficio.pontos_necessarios, codigo]
        );

        await conexao.commit();

        res.json({
            mensagem: "Benefício resgatado com sucesso!",
            codigo,
            pontosRestantes
        });
    } catch (erro) {
        await conexao.rollback();
        console.error("Erro ao resgatar benefício:", erro);
        res.status(500).json({ mensagem: "Erro ao realizar resgate. Tente novamente." });
    } finally {
        conexao.release();
    }
});

// ============================================================
// ROTAS DE COMPATIBILIDADE - Análise de Imagem e Confirmar Reciclagem
// ============================================================

// Montar rotas nos caminhos de compatibilidade do frontend
app.use("/", iaRoutes);              // /analisar-imagem
app.use("/", reciclagensRoutes);      // /confirmar, /:usuarioId

// POST /confirmar-reciclagem (frontend chama este caminho) → redireciona para /confirmar
app.post("/confirmar-reciclagem", async (req, res, next) => {
    // Simplesmente repassa o body para a lógica de confirmar
    try {
        const {
            usuarioId, material, tipo, lixeira,
            confianca, pontos, justificativa, imagemPath, codigoConfirmacao, modo
        } = req.body;

        const conexao = await pool.getConnection();
        try {
            if (!usuarioId || !Number.isInteger(Number(usuarioId)) || Number(usuarioId) <= 0) {
                return res.status(400).json({ mensagem: "ID do usuário inválido." });
            }
            if (!material || typeof material !== "string" || material.trim().length === 0) {
                return res.status(400).json({ mensagem: "Material inválido." });
            }
            if (!lixeira || typeof lixeira !== "string" || lixeira.trim().length === 0) {
                return res.status(400).json({ mensagem: "Categoria de lixeira inválida." });
            }

            if (modo !== "real") {
                return res.status(422).json({
                    mensagem: "A simulação é apenas demonstrativa e não pode gerar pontos."
                });
            }

            const confiancaNum = Number(confianca);
            if (!Number.isFinite(confiancaNum) || confiancaNum < 70 || confiancaNum > 100) {
                return res.status(422).json({ mensagem: "A confiança mínima para confirmar é 70%." });
            }

            const PONTOS_RECICLAGEM = 10;
            const pontosGanhos = PONTOS_RECICLAGEM;

            await conexao.beginTransaction();

            const [usuarios] = await conexao.execute(
                "SELECT id, pontos, total_reciclagens FROM usuarios WHERE id = ? FOR UPDATE",
                [Number(usuarioId)]
            );

            if (usuarios.length === 0) {
                await conexao.rollback();
                return res.status(404).json({ mensagem: "Usuário não encontrado." });
            }

            const usuarioAtual = usuarios[0];

            await conexao.execute(
                `INSERT INTO reciclagens
                    (usuario_id, material, tipo_residuo, categoria_lixeira, confianca, pontos, justificativa, imagem_path, codigo_confirmacao)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    Number(usuarioId),
                    material.trim(),
                    tipo ? tipo.trim() : null,
                    lixeira.trim(),
                    Math.round(Number(confianca) || 0),
                    pontosGanhos,
                    justificativa ? justificativa.trim() : null,
                    imagemPath || null,
                    codigoConfirmacao || null
                ]
            );

            const novosPontos = usuarioAtual.pontos + pontosGanhos;
            const novoTotal = usuarioAtual.total_reciclagens + 1;

            await conexao.execute(
                "UPDATE usuarios SET pontos = ?, total_reciclagens = ? WHERE id = ?",
                [novosPontos, novoTotal, Number(usuarioId)]
            );

            await conexao.commit();

            console.log(`✅ Reciclagem registrada: usuário ${usuarioId}, material ${material}, +${pontosGanhos} pontos`);

            res.json({
                mensagem: "Reciclagem confirmada com sucesso!",
                pontosGanhos: pontosGanhos,
                pontos: novosPontos,
                pontos_adicionados: pontosGanhos,
                pontos_totais: novosPontos,
                totalReciclagens: novoTotal
            });
        } catch (erro) {
            await conexao.rollback();
            throw erro;
        } finally {
            conexao.release();
        }
    } catch (erro) {
        console.error("Erro ao confirmar reciclagem:", erro);
        res.status(500).json({ mensagem: "Erro ao confirmar reciclagem. Tente novamente." });
    }
});

// ============================================================
// FALLBACK - Servir index.html para rotas não encontradas
// ============================================================
app.get("*", (req, res) => {
    const arquivo = path.join(__dirname, "../frontend", req.path);
    if (fs.existsSync(arquivo)) {
        return res.sendFile(arquivo);
    }
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
app.listen(PORT, "0.0.0.0", () => {
    console.log("\n🗑️  LixeirAI - Plataforma Inteligente de Reciclagem");
    console.log("=".repeat(48));
    console.log(`🌐 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📱 Acesso pelo celular: http://192.168.100.65:${PORT}`);
    console.log("=".repeat(48));
});
