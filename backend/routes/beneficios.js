// ============================================================
// LixeirAI - Rotas de Benefícios
// ============================================================

const express = require("express");
const router = express.Router();
const pool = require("../conexao_banco");

// ============================================================
// GET /api/beneficios - Listar benefícios
// ============================================================

router.get("/", async (req, res) => {
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
        res.status(500).json({
            mensagem: "Erro ao carregar benefícios."
        });
    }
});

// ============================================================
// POST /api/beneficios/resgatar
// ============================================================

router.post("/resgatar", async (req, res) => {
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

        // 1. Verificar usuário e saldo (com lock)
        const [usuarios] = await conexao.execute(
            "SELECT id, pontos FROM usuarios WHERE id = ? FOR UPDATE",
            [Number(usuarioId)]
        );

        if (usuarios.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ mensagem: "Usuário não encontrado." });
        }

        const usuario = usuarios[0];

        // 2. Verificar benefício e disponibilidade (com lock)
        const [beneficios] = await conexao.execute(
            "SELECT id, nome, pontos_necessarios, quantidade_disponivel FROM beneficios WHERE id = ? AND ativo = 1 FOR UPDATE",
            [Number(beneficioId)]
        );

        if (beneficios.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ mensagem: "Benefício não encontrado ou indisponível." });
        }

        const beneficio = beneficios[0];

        // 3. Verificar saldo de pontos
        if (usuario.pontos < beneficio.pontos_necessarios) {
            await conexao.rollback();
            return res.status(400).json({
                mensagem: "Você não possui pontos suficientes para este benefício.",
                pontosAtuais: usuario.pontos,
                pontosNecessarios: beneficio.pontos_necessarios
            });
        }

        // 4. Verificar quantidade disponível
        if (beneficio.quantidade_disponivel <= 0) {
            await conexao.rollback();
            return res.status(400).json({
                mensagem: "Este benefício não está mais disponível."
            });
        }

        // 5. Gerar código único de resgate
        const codigo = "LXAI-" + Date.now().toString(36).toUpperCase() +
            Math.random().toString(36).substring(2, 6).toUpperCase();

        // 6. Descontar pontos do usuário
        const pontosRestantes = usuario.pontos - beneficio.pontos_necessarios;

        await conexao.execute(
            "UPDATE usuarios SET pontos = ? WHERE id = ?",
            [pontosRestantes, Number(usuarioId)]
        );

        // 7. Diminuir quantidade disponível
        await conexao.execute(
            "UPDATE beneficios SET quantidade_disponivel = quantidade_disponivel - 1 WHERE id = ?",
            [Number(beneficioId)]
        );

        // 8. Registrar resgate
        await conexao.execute(
            `INSERT INTO resgates (usuario_id, beneficio_id, pontos_gastos, codigo_resgate)
             VALUES (?, ?, ?, ?)`,
            [Number(usuarioId), Number(beneficioId), beneficio.pontos_necessarios, codigo]
        );

        await conexao.commit();

        console.log(`🎉 Benefício resgatado: usuário ${usuarioId}, benefício ${beneficio.nome}, código ${codigo}`);

        res.json({
            mensagem: "Benefício resgatado com sucesso!",
            codigo,
            nome: beneficio.nome,
            pontosGastos: beneficio.pontos_necessarios,
            pontosRestantes
        });

    } catch (erro) {
        await conexao.rollback();
        console.error("Erro ao resgatar benefício:", erro);
        res.status(500).json({
            mensagem: "Erro ao realizar resgate. Tente novamente."
        });
    } finally {
        conexao.release();
    }
});

// ============================================================
// GET /api/beneficios/resgates/:usuarioId
// ============================================================

router.get("/resgates/:usuarioId", async (req, res) => {
    try {
        const { usuarioId } = req.params;

        const idNum = Number(usuarioId);
        if (!Number.isInteger(idNum) || idNum <= 0) {
            return res.status(400).json({ mensagem: "ID do usuário inválido." });
        }

        const [resgates] = await pool.execute(
            `SELECT r.id, r.codigo_resgate, r.pontos_gastos, r.data_resgate,
                    b.nome AS beneficio_nome
             FROM resgates r
             JOIN beneficios b ON r.beneficio_id = b.id
             WHERE r.usuario_id = ?
             ORDER BY r.data_resgate DESC`,
            [idNum]
        );

        res.json(resgates);
    } catch (erro) {
        console.error("Erro ao buscar resgates:", erro);
        res.status(500).json({
            mensagem: "Erro ao carregar resgates."
        });
    }
});

module.exports = router;
