// ============================================================
// LixeirAI - Rotas de Usuários
// ============================================================

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../conexao_banco");

const JWT_SECRET = process.env.JWT_SECRET || "lixeirai_segredo_2026";

// ============================================================
// POST /api/usuarios/cadastro
// ============================================================
router.post("/cadastro", async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        // Validações
        if (!nome || !email || !senha) {
            return res.status(400).json({
                mensagem: "Preencha todos os campos."
            });
        }

        if (nome.trim().length < 2) {
            return res.status(400).json({
                mensagem: "O nome deve ter pelo menos 2 caracteres."
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                mensagem: "Email inválido."
            });
        }

        if (senha.length < 6) {
            return res.status(400).json({
                mensagem: "A senha deve ter pelo menos 6 caracteres."
            });
        }

        // Verificar email duplicado
        const [existente] = await pool.execute(
            "SELECT id FROM usuarios WHERE email = ?",
            [email.trim().toLowerCase()]
        );

        if (existente.length > 0) {
            return res.status(400).json({
                mensagem: "Este email já está cadastrado."
            });
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 12);

        // Inserir usuário
        const [resultado] = await pool.execute(
            "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
            [nome.trim(), email.trim().toLowerCase(), senhaHash]
        );

        const token = jwt.sign(
            { id: resultado.insertId, email: email.trim().toLowerCase() },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            mensagem: "Cadastro realizado com sucesso!",
            token,
            usuario: {
                id: resultado.insertId,
                nome: nome.trim(),
                email: email.trim().toLowerCase()
            }
        });
    } catch (erro) {
        console.error("Erro no cadastro:", erro);
        res.status(500).json({
            mensagem: "Erro interno do servidor. Tente novamente."
        });
    }
});

// ============================================================
// POST /api/usuarios/login
// ============================================================
router.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                mensagem: "Digite o email e a senha."
            });
        }

        const [usuarios] = await pool.execute(
            "SELECT id, nome, email, senha, pontos, total_reciclagens FROM usuarios WHERE email = ?",
            [email.trim().toLowerCase()]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                mensagem: "Email ou senha incorretos."
            });
        }

        const usuario = usuarios[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).json({
                mensagem: "Email ou senha incorretos."
            });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            mensagem: "Login realizado com sucesso!",
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                pontos: usuario.pontos,
                total_reciclagens: usuario.total_reciclagens
            }
        });
    } catch (erro) {
        console.error("Erro no login:", erro);
        res.status(500).json({
            mensagem: "Erro interno do servidor. Tente novamente."
        });
    }
});

// ============================================================
// GET /api/usuarios/:id
// ============================================================
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const idNum = Number(id);
        if (!Number.isInteger(idNum) || idNum <= 0) {
            return res.status(400).json({
                mensagem: "ID do usuário inválido."
            });
        }

        const [usuarios] = await pool.execute(
            "SELECT id, nome, email, pontos, total_reciclagens, data_cadastro FROM usuarios WHERE id = ?",
            [idNum]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        res.json(usuarios[0]);
    } catch (erro) {
        console.error("Erro ao buscar usuário:", erro);
        res.status(500).json({
            mensagem: "Erro interno do servidor."
        });
    }
});

module.exports = router;
