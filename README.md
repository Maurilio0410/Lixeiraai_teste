# 🌿 LixeirAI — Plataforma Inteligente de Reciclagem

LixeirAI é uma plataforma web completa que utiliza inteligência artificial (Google Gemini) para identificar materiais recicláveis através da câmera, gerenciar pontos de reciclagem e oferecer benefícios aos usuários.

---

## 📁 Estrutura do Projeto

```
LixeirAI/
├── frontend/
│   ├── index.html          ← Página de Login/Cadastro
│   ├── aplicativo.html      ← Aplicativo principal (câmera, histórico)
│   ├── beneficius.html      ← Página de Benefícios/Resgates
│   ├── css/
│   │   ├── index.css        ← Estilos do Login/Cadastro
│   │   ├── aplicativo.css   ← Estilos do Aplicativo
│   │   └── beneficius.css   ← Estilos dos Benefícios
│   └── javascript/
│       ├── script_TelaLogin.js  ← Lógica de Login
│       ├── Cadastro.js          ← Lógica de Cadastro
│       ├── site.js              ← Lógica do Aplicativo
│       └── beneficius.js        ← Lógica dos Benefícios
├── backend/
│   ├── server.js           ← Servidor Express principal
│   ├── conexao_banco.js    ← Conexão MySQL (pool com promises)
│   ├── routes/
│   │   ├── usuarios.js     ← Rotas: cadastro, login, perfil
│   │   ├── reciclagens.js  ← Rotas: confirmar, histórico
│   │   ├── beneficios.js   ← Rotas: listar, resgatar
│   │   └── ia.js           ← Rota: análise de imagem (Gemini)
│   └── uploads/            ← Pasta de uploads de imagens
├── database/
│   └── banco.sql           ← Schema completo do MySQL
├── .env                    ← Variáveis de ambiente (NÃO versionar!)
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Instalação e Configuração

### 1. Pré-requisitos

- **Node.js** 18+ (necessário para a API do Gemini)
- **MySQL** 5.7+ ou 8.x
- **npm** 8+
- **Conta Google AI** com chave de API do Gemini (opcional — funciona em modo simulação sem ela)

### 2. Clonar / Copiar o projeto

```bash
cp -r LixeirAI/ ~/LixeirAI
cd ~/LixeirAI
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Configurar o banco de dados MySQL

```sql
-- Acesse o MySQL como root
mysql -u root -p

-- Execute o schema
source database/banco.sql;
```

Isso criará:
- Banco `banco_lixeirai`
- Tabela `usuarios` (id, nome, email, senha_hash, pontos, data_cadastro)
- Tabela `reciclagens` (id, usuario_id, material, pontos, imagem_url, data_reciclagem)
- Tabela `beneficios` (id, nome, descricao, pontos_necessarios, estoque, ativo)
- Tabela `resgates` (id, usuario_id, beneficio_id, codigo_resgate, data_resgate)
- **7 benefícios** pré-cadastrados (descontos em lojas sustentáveis)

### 5. Configurar variáveis de ambiente

Edite o arquivo `.env` com seus dados:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=banco_lixeirai
GEMINI_API_KEY=sua_chave_gemini_aqui
PORT=3000
```

> **Sem a GEMINI_API_KEY**, o sistema funciona em **modo simulação** — ele gera uma sugestão determinística apenas para demonstração. A simulação é identificada na tela, não confirma o conteúdo da foto e não gera pontos.

### 6. Iniciar o servidor

```bash
npm start
```

O servidor iniciará em **http://192.168.100.65:3000**

---

## 📱 Acessando pelo Celular (Mesma Rede Wi-Fi)

Para usar a câmera do celular, você precisa acessar via HTTPS ou localhost. Na mesma rede Wi-Fi:

### Opção A — Usar o IP local (HTTP, câmera pode não funcionar)

1. Descubra seu IP local:
   ```bash
   # Linux/Mac
   ip addr show | grep inet
   # ou
   ifconfig | grep inet
   ```

2. No celular, acesse: `http://SEU_IP:3000`

### Opção B — Usar ngrok (HTTPS, câmera funciona!)

```bash
# Instale o ngrok
npm install -g ngrok

# Em um terminal, rode o servidor
npm start

# Em outro terminal, crie o túnel HTTPS
ngrok http 3000
```
baixar o cloudflared para deixar o site seguro 

Use a URL HTTPS fornecida pelo ngrok para acessar no celular. **A câmera funciona apenas em HTTPS ou localhost.**


use esse comando para deixar o site seguro: & "C:\Users\Maurilio\Downloads\cloudflared-windows-amd64.exe" tunnel --url http://localhost:3000
---

## 🔧 Funcionalidades

### 🔐 Autenticação
- **Cadastro** com nome, email e senha (senha hasheada com bcrypt)
- **Login** com JWT (token armazenado no localStorage)
- Sessão persistente via localStorage

### 📸 Análise de Imagem com IA
- Tire foto ou envie imagem do material reciclável
- **Google Gemini** identifica o material e orienta como reciclar
- Modo simulação explícito quando a chave da API não está configurada; resultados simulados não podem ser registrados
- Confiança mínima de 70% e validação das categorias antes de confirmar uma reciclagem
- Cores das lixeiras: azul para papel, vermelho para plástico, verde para vidro e amarelo para metal
- Materiais reconhecidos: Plástico, Papel, Vidro, Metal, Orgânico, Eletrônico

### 🔄 Sistema de Pontos
- Cada reciclagem confirmada = **10 pontos** (definido pelo backend)
- Histórico completo de reciclagens
- Estatísticas por tipo de material

### 🎁 Benefícios
- 7 benefícios pré-cadastrados (descontos em lojas sustentáveis)
- Resgate com código único gerado automaticamente
- Validação de saldo de pontos e estoque
- Histórico de resgates

---

## 🔌 Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/cadastrar` | Cadastro de usuário |
| POST | `/login` | Login (retorna JWT) |
| GET | `/usuario/:id` | Dados do usuário + pontos |
| POST | `/analisar-imagem` | Análise IA de imagem (multipart) |
| POST | `/confirmar-reciclagem` | Confirma reciclagem (+10 pts) |
| GET | `/historico/:id` | Histórico de reciclagens |
| GET | `/estatisticas/:id` | Estatísticas por material |
| GET | `/beneficios` | Lista benefícios ativos |
| POST | `/resgatar-beneficio` | Resgata um benefício |
| GET | `/resgates/:usuarioId` | Histórico de resgates |

---

## 🛡️ Segurança

- Senhas hasheadas com **bcrypt** (12 rounds)
- **JWT** para autenticação
- Validação de entrada no backend (nunca confia no frontend)
- **Transações MySQL** para operações críticas (pontos, resgates)
- Validação de MIME type nos uploads
- Limite de 10MB por upload de imagem
- Variáveis sensíveis no `.env` (não versionado)

---

## 🎨 Design

- Tema **futurista escuro** com acentos verdes
- **Mobile-first** e responsivo
- Animações CSS suaves
- Interface em **Português Brasileiro**

---

## 📋 Checklist de Testes

### Funcionalidades Core
- [ ] Servidor inicia sem erros em `npm start`
- [ ] Banco de dados criado com `database/banco.sql`
- [ ] Conexão MySQL funcionando (verifique console do servidor)
- [ ] Página de login carrega em `/`
- [ ] Página do app carrega em `/aplicativo.html`
- [ ] Página de benefícios carrega em `/beneficius.html`

### Cadastro e Login
- [ ] Cadastro de novo usuário funciona (POST `/cadastrar`)
- [ ] Login retorna token JWT (POST `/login`)
- [ ] Login com senha errada retorna erro
- [ ] Cadastro com email duplicado retorna erro
- [ ] Usuário salvo no banco com senha hasheada

### Análise de Imagem (IA)
- [ ] Upload de imagem retorna identificação de material
- [ ] Sem API key, modo simulação funciona
- [ ] Imagem >10MB é rejeitada
- [ ] Arquivo não-imagem é rejeitado

### Reciclagem e Pontos
- [ ] Confirmar reciclagem adiciona 10 pontos ao usuário
- [ ] Reciclagem salva no histórico com material correto
- [ ] Histórico de reciclagens lista corretamente
- [ ] Estatísticas agrupam por tipo de material

### Benefícios
- [ ] Lista de benefícios retorna 7 itens
- [ ] Resgate com pontos suficientes funciona
- [ ] Resgate gera código único
- [ ] Resgate sem pontos suficientes retorna erro
- [ ] Resgate sem estoque retorna erro
- [ ] Pontos debitados após resgate
- [ ] Estoque decrementado após resgate

### Interface
- [ ] Design responsivo funciona no celular
- [ ] Câmera abre no celular (requer HTTPS)
- [ ] Navegação entre páginas funciona
- [ ] CSS carrega corretamente em todas as páginas
- [ ] JavaScript executa sem erros no console

---

## 🐛 Solução de Problemas

| Problema | Solução |
|----------|----------|
| `ECONNREFUSED` no banco | Verifique se o MySQL está rodando e as credenciais no `.env` |
| Câmera não abre | Acesse via HTTPS (ngrok) ou localhost |
| `MODULE_NOT_FOUND` | Rode `npm install` |
| Análise IA retorna erro | Verifique a `GEMINI_API_KEY` no `.env` — sem ela, usa modo simulação |
| `Access denied` no MySQL | Verifique DB_USER e DB_PASSWORD no `.env` |

---

## 📦 Dependências

| Pacote | Versão | Uso |
|--------|--------|-----|
| express | ^4.18 | Servidor web |
| mysql2 | ^3.6 | Driver MySQL (com promises) |
| cors | ^2.8 | Cross-Origin |
| dotenv | ^16.3 | Variáveis de ambiente |
| multer | ^1.4 | Upload de imagens |
| bcrypt | ^5.1 | Hash de senhas |
| jsonwebtoken | ^9.0 | Autenticação JWT |
| @google/generative-ai | ^0.24 | API Google Gemini |

---

**Desenvolvido com 💚 para um futuro mais sustentável**
