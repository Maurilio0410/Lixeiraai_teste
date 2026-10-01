// ============================================================
// LixeirAI - Conexão com Banco de Dados MySQL
// ============================================================

const mysql = require("mysql2/promise");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "2016Fjmm!",
    database: process.env.DB_NAME || "banco_lixeirai",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testarConexao() {
    try {
        const conexao = await pool.getConnection();
        console.log("✅ MySQL conectado com sucesso.");
        conexao.release();
    } catch (erro) {
        console.error("❌ Erro ao conectar no MySQL:", erro.message);
    }
}

testarConexao();

module.exports = pool;
    