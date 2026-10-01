// ============================================================
// LixeirAI - Rotas de Reciclagens
// ============================================================

const express = require("express");
const router = express.Router();
const pool = require("../conexao_banco");

const LIXEIRA_POR_MATERIAL = {
    "Plástico": "Vermelha",
    "Papel": "Azul",
    "Papelão": "Azul",
    "Vidro": "Verde",
    "Metal": "Amarela",
    "Madeira": "Preta",
    "Orgânico": "Marrom",
    "Não reciclável": "Preta"
};
const CONFIANCA_MINIMA = 70;

// ============================================================
// POST /api/reciclagens/confirmar
// ============================================================

router.post("/confirmar", async (req, res) => {
    const conexao = await pool.getConnection();

    try {
        const {
            usuarioId,
            material,
            tipo,
            lixeira,
            confianca,
            pontos,
            justificativa,
            imagemPath,
            codigoConfirmacao,
            modo
        } = req.body;

        // Validações no backend
        if (!usuarioId || !Number.isInteger(Number(usuarioId)) || Number(usuarioId) <= 0) {
            return res.status(400).json({ mensagem: "ID do usuário inválido." });
        }

        if (!material || typeof material !== "string" || material.trim().length === 0) {
            return res.status(400).json({ mensagem: "Material inválido." });
        }

        const materialNormalizado = material.trim();
        if (!Object.prototype.hasOwnProperty.call(LIXEIRA_POR_MATERIAL, materialNormalizado)) {
            return res.status(400).json({ mensagem: "Material não permitido para reciclagem." });
        }

        if (modo !== "real") {
            return res.status(422).json({
                mensagem: "A simulação é apenas demonstrativa e não pode gerar pontos."
            });
        }

        if (!lixeira || typeof lixeira !== "string" || lixeira.trim().length === 0) {
            return res.status(400).json({ mensagem: "Categoria de lixeira inválida." });
        }

        const confiancaNum = Number(confianca);
        if (!Number.isFinite(confiancaNum) || confiancaNum < 0 || confiancaNum > 100) {
            return res.status(400).json({ mensagem: "Confiança inválida." });
        }

        if (confiancaNum < CONFIANCA_MINIMA) {
            return res.status(422).json({
                mensagem: `A confiança mínima para confirmar é ${CONFIANCA_MINIMA}%.`
            });
        }

        if (lixeira.trim() !== LIXEIRA_POR_MATERIAL[materialNormalizado]) {
            return res.status(400).json({ mensagem: "A lixeira não corresponde ao material informado." });
        }

        // O BACKEND determina os pontos - NUNCA confiar no frontend
        const PONTOS_RECICLAGEM = 10;
        const pontosGanhos = PONTOS_RECICLAGEM;

        // Iniciar transação
        await conexao.beginTransaction();

        // 1. Verificar se o usuário existe e obter dados atuais (com lock)
        const [usuarios] = await conexao.execute(
            "SELECT id, pontos, total_reciclagens FROM usuarios WHERE id = ? FOR UPDATE",
            [Number(usuarioId)]
        );

        if (usuarios.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ mensagem: "Usuário não encontrado." });
        }

        const usuarioAtual = usuarios[0];

        // 2. Registrar a reciclagem
        await conexao.execute(
            `INSERT INTO reciclagens
                (usuario_id, material, tipo_residuo, categoria_lixeira, confianca, pontos, justificativa, imagem_path, codigo_confirmacao)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                Number(usuarioId),
                materialNormalizado,
                tipo ? tipo.trim() : null,
                lixeira.trim(),
                Math.round(confiancaNum),
                pontosGanhos,
                justificativa ? justificativa.trim() : null,
                imagemPath || null,
                codigoConfirmacao || null
            ]
        );

        // 3. Atualizar pontos e total do usuário
        const novosPontos = usuarioAtual.pontos + pontosGanhos;
        const novoTotal = usuarioAtual.total_reciclagens + 1;

        await conexao.execute(
            "UPDATE usuarios SET pontos = ?, total_reciclagens = ? WHERE id = ?",
            [novosPontos, novoTotal, Number(usuarioId)]
        );

        // Commit da transação
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
        console.error("Erro ao confirmar reciclagem:", erro);
        res.status(500).json({
            mensagem: "Erro ao confirmar reciclagem. Tente novamente."
        });
    } finally {
        conexao.release();
    }
});

// ============================================================
// GET /api/reciclagens/:usuarioId - Histórico
// ============================================================

router.get("/:usuarioId", async (req, res) => {
    try {
        const { usuarioId } = req.params;

        const idNum = Number(usuarioId);
        if (!Number.isInteger(idNum) || idNum <= 0) {
            return res.status(400).json({ mensagem: "ID do usuário inválido." });
        }

        const [reciclagens] = await pool.execute(
            `SELECT id, material, tipo_residuo, categoria_lixeira AS lixeira, confianca, pontos AS pontos_ganhos,
                    justificativa, data_reciclagem
             FROM reciclagens
             WHERE usuario_id = ?
             ORDER BY data_reciclagem DESC`,
            [idNum]
        );

        res.json(reciclagens);
    } catch (erro) {
        console.error("Erro ao buscar histórico:", erro);
        res.status(500).json({
            mensagem: "Erro ao carregar histórico."
        });
    }
});

module.exports = router;
