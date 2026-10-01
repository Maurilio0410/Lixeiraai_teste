-- ============================================================
-- LIXEIRAI - Banco de Dados MySQL
-- Execute este arquivo no MySQL Workbench para criar
-- toda a estrutura do banco.
-- ============================================================

CREATE DATABASE IF NOT EXISTS banco_lixeirai
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE banco_lixeirai;

-- ============================================================
-- TABELA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    pontos INT NOT NULL DEFAULT 0,
    total_reciclagens INT NOT NULL DEFAULT 0,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: reciclagens
-- ============================================================
CREATE TABLE IF NOT EXISTS reciclagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    material VARCHAR(80) NOT NULL,
    tipo_residuo VARCHAR(120) DEFAULT NULL,
    categoria_lixeira VARCHAR(60) NOT NULL,
    confianca INT NOT NULL DEFAULT 0,
    pontos INT NOT NULL DEFAULT 0,
    justificativa TEXT DEFAULT NULL,
    imagem_path VARCHAR(500) DEFAULT NULL,
    codigo_confirmacao VARCHAR(100) DEFAULT NULL,
    data_reciclagem DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: beneficios
-- ============================================================
CREATE TABLE IF NOT EXISTS beneficios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT DEFAULT NULL,
    pontos_necessarios INT NOT NULL DEFAULT 0,
    quantidade_disponivel INT NOT NULL DEFAULT 0,
    ativo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: resgates
-- ============================================================
CREATE TABLE IF NOT EXISTS resgates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    beneficio_id INT NOT NULL,
    pontos_gastos INT NOT NULL DEFAULT 0,
    codigo_resgate VARCHAR(30) NOT NULL UNIQUE,
    data_resgate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (beneficio_id) REFERENCES beneficios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- DADOS INICIAIS: benefícios
-- ============================================================
INSERT INTO beneficios (nome, descricao, pontos_necessarios, quantidade_disponivel, ativo) VALUES
('Desconto no Mercado', '10% de desconto em produtos sustentáveis no mercado parceiro EcoShop.', 50, 100, 1),
('Ingresso Cinema', 'Um ingresso para qualquer sessão no CineGreen - cinema que usa energia solar.', 100, 50, 1),
('Muda de Planta', 'Receba uma muda de planta nativa para cultivar em casa.', 75, 200, 1),
('Vale Transporte', 'Crédito de R$ 5,00 para uso em transporte público.', 150, 80, 1),
('Curso de Sustentabilidade', 'Acesso gratuito ao curso online "Vida Sustentável na Prática".', 200, 30, 1),
('Kit Reciclagem', 'Kit com sacolas ecológicas, separador de lixo e adesivo LixeirAI.', 300, 20, 1),
('Árvore Plantada', 'Uma árvore será plantada em seu nome em área de reflorestamento.', 500, 10, 1);
