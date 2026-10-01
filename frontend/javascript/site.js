// =====================================================
// PEGAR ID DO USUÁRIO
// =====================================================

const usuarioId = localStorage.getItem("usuarioId");


// =====================================================
// VERIFICAR LOGIN
// =====================================================

if (!usuarioId) {
    alert("Você precisa fazer login.");
    window.location.href = "index.html";
}


// =====================================================
// ELEMENTOS DO USUÁRIO
// =====================================================

const nomeUsuario =
    document.getElementById("nomeUsuario");

const nomeTopo =
    document.getElementById("nomeTopo");

const pontosUsuario =
    document.getElementById("pontosUsuario");

const totalReciclagens =
    document.getElementById("totalReciclagens");

const proximoBeneficio =
    document.getElementById("proximoBeneficio");

const listaHistorico =
    document.getElementById("listaHistorico");

const estatisticasMateriais =
    document.getElementById("estatisticasMateriais");


// =====================================================
// CARREGAR USUÁRIO
// =====================================================

async function carregarUsuario() {

    try {

        const resposta = await fetch(
            `/usuario/${usuarioId}`
        );

        const dados = await resposta.json();

        if (!resposta.ok) {

            alert(
                dados.mensagem ||
                "Erro ao carregar usuário."
            );

            localStorage.clear();

            window.location.href = "index.html";

            return;
        }


        if (nomeUsuario) {
            nomeUsuario.textContent = dados.nome;
        }

        if (nomeTopo) {
            nomeTopo.textContent = dados.nome;
        }

        if (pontosUsuario) {
            pontosUsuario.textContent = dados.pontos;
        }

        if (totalReciclagens) {
            totalReciclagens.textContent =
                dados.total_reciclagens;
        }


        const pontosNecessarios = 100;

        let faltam =
            pontosNecessarios -
            dados.pontos;


        if (faltam < 0) {
            faltam = 0;
        }


        if (proximoBeneficio) {
            proximoBeneficio.textContent = faltam;
        }

    } catch (erro) {

        console.error(
            "Erro ao carregar usuário:",
            erro
        );

        alert(
            "Erro ao conectar ao servidor."
        );
    }
}

async function carregarHistorico() {
    if (!listaHistorico) {
        return;
    }

    try {
        const resposta = await fetch(
            `/historico/${usuarioId}`
        );
        const historico = await resposta.json();

        if (!resposta.ok) {
            throw new Error(historico.mensagem || "Erro ao carregar histórico.");
        }

        listaHistorico.innerHTML = "";

        if (!historico.length) {
            listaHistorico.innerHTML = "<p>Nenhuma reciclagem confirmada ainda.</p>";
            return;
        }

        historico.forEach((item) => {
            const registro = document.createElement("article");
            registro.className = "itemHistorico";

            const nome = document.createElement("strong");
            nome.textContent = item.tipo_residuo || item.material;

            const pontos = document.createElement("strong");
            pontos.textContent = `+${item.pontos_ganhos} pontos`;

            const detalhes = document.createElement("small");
            detalhes.textContent = `${item.material} | Lixeira: ${item.lixeira} | Confiança: ${item.confianca}% | ${new Date(item.data_reciclagem).toLocaleString("pt-BR")}`;

            registro.append(nome, pontos, detalhes);
            listaHistorico.appendChild(registro);
        });
    } catch (erro) {
        console.error("Erro ao carregar histórico:", erro);
        listaHistorico.innerHTML = "<p>Não foi possível carregar o histórico.</p>";
    }
}

async function carregarEstatisticas() {
    if (!estatisticasMateriais) {
        return;
    }

    try {
        const resposta = await fetch(
            `/estatisticas/${usuarioId}`
        );
        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Erro ao carregar estatísticas.");
        }

        estatisticasMateriais.innerHTML = "";
        Object.entries(dados).forEach(([material, total]) => {
            const indicador = document.createElement("span");
            indicador.textContent = `${material}: ${total}`;
            estatisticasMateriais.appendChild(indicador);
        });
    } catch (erro) {
        console.error("Erro ao carregar estatísticas:", erro);
    }
}


// =====================================================
// BOTÃO SAIR
// =====================================================

const btnSair =
    document.getElementById("btnSair");


if (btnSair) {

    btnSair.addEventListener(
        "click",
        function () {

            console.log("Botão sair clicado");

            // Parar câmera antes de sair
            pararCamera();

            // Apagar dados do login
            localStorage.removeItem("usuarioId");
            localStorage.removeItem("usuarioNome");
            localStorage.removeItem("usuarioEmail");

            // Redirecionar
            window.location.href = "index.html";
        }
    );

}


// =====================================================
// ELEMENTOS DA CÂMERA
// =====================================================

const camera =
    document.getElementById("camera");

const seletorImagem =
    document.getElementById("seletorImagem");

const canvas =
    document.getElementById("canvas");

const fotoPreview =
    document.getElementById("fotoPreview");

const btnAbrirCamera =
    document.getElementById("btnAbrirCamera");

const btnTirarFoto =
    document.getElementById("btnTirarFoto");

const btnAnalisar =
    document.getElementById("btnAnalisar");

const btnNovaFoto =
    document.getElementById("btnNovaFoto");

const resultadoIA =
    document.getElementById("resultadoIA");

const carregamentoIA =
    document.getElementById("carregamentoIA");

const textoCarregamentoIA =
    document.getElementById("textoCarregamentoIA");

const materialIdentificado =
    document.getElementById(
        "materialIdentificado"
    );

const confiancaIA =
    document.getElementById(
        "confiancaIA"
    );

const mensagemIA =
    document.getElementById(
        "mensagemIA"
    );

const tipoIdentificado =
    document.getElementById("tipoIdentificado");

const lixeiraIdentificada =
    document.getElementById("lixeiraIdentificada");

const pontosIA =
    document.getElementById("pontosIA");

const objetosIdentificados =
    document.getElementById("objetosIdentificados");

const modalResultadoIA =
    document.getElementById("modalResultadoIA");

const fotoModalIA =
    document.getElementById("fotoModalIA");

const statusModalIA =
    document.getElementById("statusModalIA");

const materialModalIA =
    document.getElementById("materialModalIA");

const tipoModalIA =
    document.getElementById("tipoModalIA");

const lixeiraModalIA =
    document.getElementById("lixeiraModalIA");

const confiancaModalIA =
    document.getElementById("confiancaModalIA");

const pontosModalIA =
    document.getElementById("pontosModalIA");

const barraConfiancaIA =
    document.getElementById("barraConfiancaIA");

const mensagemModalIA =
    document.getElementById("mensagemModalIA");

const btnFecharModalIA =
    document.getElementById("btnFecharModalIA");

const btnCancelarModalIA =
    document.getElementById("btnCancelarModalIA");


// =====================================================
// ELEMENTOS DA RECICLAGEM
// =====================================================

const btnConfirmarReciclagem =
    document.getElementById(
        "btnConfirmarReciclagem"
    );

const mensagemReciclagem =
    document.getElementById(
        "mensagemReciclagem"
    );


// Resultado da IA
let resultadoReciclagem = null;

const CONFIANCA_MINIMA_IA = 70;

function resultadoPodeSerConfirmado(resultado) {
    return resultado &&
        resultado.modo === "real" &&
        resultado.classificavel === true &&
        Number(resultado.confianca) >= CONFIANCA_MINIMA_IA;
}


// =====================================================
// VARIÁVEIS DA CÂMERA
// =====================================================

let streamCamera = null;

let fotoBlob = null;

function alterarCarregamentoIA(ativo, texto) {
    if (!carregamentoIA) {
        return;
    }

    carregamentoIA.hidden = !ativo;
    carregamentoIA.setAttribute("aria-busy", String(ativo));

    if (textoCarregamentoIA && texto) {
        textoCarregamentoIA.textContent = texto;
    }
}

function fecharModalResultado() {
    if (modalResultadoIA) {
        modalResultadoIA.hidden = true;
    }
}

function mostrarModalResultado(resultado) {
    if (!modalResultadoIA) {
        return;
    }

    const confianca = Number(resultado.confianca) || 0;
    const aceito = resultadoPodeSerConfirmado(resultado);

    fotoModalIA.src = fotoPreview.src;
    materialModalIA.textContent = resultado.material || "Desconhecido";
    tipoModalIA.textContent = resultado.tipo || "Não identificado";
    lixeiraModalIA.textContent = resultado.lixeira || "Não identificado";
    confiancaModalIA.textContent = `${confianca}%`;
    pontosModalIA.textContent = aceito ? `+${resultado.pontos} pontos` : "0 pontos";
    barraConfiancaIA.style.width = `${confianca}%`;
    mensagemModalIA.textContent = resultado.modo === "simulado"
        ? "Modo simulado: a foto não foi confirmada por uma IA visual."
        : (resultado.justificativa || resultado.mensagem);
    statusModalIA.textContent = aceito
        ? "♻️ LIXO ACEITO PARA RECICLAGEM"
        : "⚠️ NÃO FOI POSSÍVEL IDENTIFICAR COM SEGURANÇA";
    btnConfirmarReciclagem.hidden = !aceito;
    btnCancelarModalIA.textContent = aceito ? "Cancelar" : "Fechar";
    modalResultadoIA.hidden = false;
}

if (btnFecharModalIA) {
    btnFecharModalIA.addEventListener("click", fecharModalResultado);
}

if (btnCancelarModalIA) {
    btnCancelarModalIA.addEventListener("click", fecharModalResultado);
}

function prepararImagem(blob) {
    fotoBlob = blob;
    fotoPreview.src = URL.createObjectURL(blob);
    fotoPreview.style.display = "block";
    camera.style.display = "none";
    btnAnalisar.style.display = "inline-block";
    btnNovaFoto.style.display = "inline-block";
    btnAbrirCamera.style.display = "none";
    pararCamera();
}

function otimizarImagem(blob) {
    return new Promise((resolver, rejeitar) => {
        const imagem = new Image();
        const url = URL.createObjectURL(blob);

        imagem.onload = () => {
            const limite = 1280;
            const escala = Math.min(1, limite / Math.max(imagem.width, imagem.height));
            const largura = Math.max(1, Math.round(imagem.width * escala));
            const altura = Math.max(1, Math.round(imagem.height * escala));
            const canvasOtimizacao = document.createElement("canvas");

            canvasOtimizacao.width = largura;
            canvasOtimizacao.height = altura;
            canvasOtimizacao.getContext("2d").drawImage(imagem, 0, 0, largura, altura);
            canvasOtimizacao.toBlob((resultado) => {
                URL.revokeObjectURL(url);
                resultado ? resolver(resultado) : rejeitar(new Error("Não foi possível preparar a imagem."));
            }, "image/jpeg", 0.78);
        };

        imagem.onerror = () => {
            URL.revokeObjectURL(url);
            rejeitar(new Error("Não foi possível ler a imagem."));
        };
        imagem.src = url;
    });
}

if (seletorImagem) {
    seletorImagem.addEventListener("change", function () {
        const arquivo = seletorImagem.files[0];

        if (!arquivo) {
            return;
        }

        prepararImagem(arquivo);
    });
}


// =====================================================
// ABRIR CÂMERA
// =====================================================

if (btnAbrirCamera) {

    btnAbrirCamera.addEventListener(
        "click",
        async function () {

            try {

                streamCamera =
                    await navigator.mediaDevices.getUserMedia({

                        video: {
                            facingMode: {
                                ideal: "environment"
                            }
                        },

                        audio: false
                    });


                camera.srcObject =
                    streamCamera;


                camera.style.display =
                    "block";


                btnAbrirCamera.style.display =
                    "none";


                btnTirarFoto.style.display =
                    "inline-block";


            } catch (erro) {

                console.error(
                    "Erro ao abrir câmera:",
                    erro
                );


                alert(
                    "Não foi possível abrir a câmera. Verifique a permissão do navegador."
                );
            }
        }
    );
}


// =====================================================
// TIRAR FOTO
// =====================================================

if (btnTirarFoto) {

    btnTirarFoto.addEventListener(
        "click",
        function () {

            if (
                !camera.videoWidth ||
                !camera.videoHeight
            ) {

                alert(
                    "A câmera ainda não está pronta."
                );

                return;
            }


            canvas.width =
                camera.videoWidth;

            canvas.height =
                camera.videoHeight;


            const contexto =
                canvas.getContext("2d");


            contexto.drawImage(
                camera,
                0,
                0,
                canvas.width,
                canvas.height
            );


            // Mostrar foto

            fotoPreview.src = canvas.toDataURL("image/jpeg", 0.90);


            fotoPreview.style.display =
                "block";


            camera.style.display =
                "none";


            btnTirarFoto.style.display =
                "none";


            btnAnalisar.style.display =
                "inline-block";


            btnNovaFoto.style.display =
                "inline-block";


            // Parar câmera

            pararCamera();


            // Converter para Blob

            canvas.toBlob(
                function (blob) {

                    fotoBlob = blob;

                },
                "image/jpeg",
                0.90
            );
        }
    );
}


// =====================================================
// ANALISAR FOTO
// =====================================================

if (btnAnalisar) {

    btnAnalisar.addEventListener(
        "click",
        async function () {

            if (!fotoBlob) {

                alert(
                    "Tire uma foto primeiro."
                );

                return;
            }


            btnAnalisar.disabled =
                true;

            btnConfirmarReciclagem.style.display = "none";
            mensagemReciclagem.style.display = "none";
            mensagemReciclagem.hidden = true;
            alterarCarregamentoIA(true, "Enviando a imagem para análise...");

            btnAnalisar.textContent =
                "🤖 Analisando...";


            resultadoIA.style.display =
                "block";


            materialIdentificado.textContent =
                "Analisando...";


            confiancaIA.textContent =
                "";


            mensagemIA.textContent =
                "A inteligência artificial está analisando a imagem.";


            try {

                // ==========================================
                // FORM DATA
                // ==========================================

                const formData = new FormData();
                const imagemParaAnalise = await otimizarImagem(fotoBlob);


                formData.append(
                    "imagem",
                    imagemParaAnalise,
                    "reciclagem.jpg"
                );


                formData.append(
                    "usuarioId",
                    usuarioId
                );


                // ==========================================
                // ENVIAR PARA BACKEND
                // ==========================================

                const resposta =
                    await fetch(
                        "/analisar-imagem",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                const dados =
                    await resposta.json();


                console.log(
                    "Resposta da IA:",
                    dados
                );


                if (!resposta.ok) {

                    throw new Error(
                        dados.mensagem ||
                        "Erro ao analisar imagem."
                    );
                }


                // ==========================================
                // GUARDAR RESULTADO DA IA
                // ==========================================

                resultadoReciclagem =
                    dados;


                // ==========================================
                // MOSTRAR RESULTADO
                // ==========================================

                materialIdentificado.textContent =
                    dados.material;

                    tipoIdentificado.textContent = dados.tipo;
                    lixeiraIdentificada.textContent = dados.lixeira;
                    pontosIA.textContent = `+${dados.pontos || 0}`;

                    objetosIdentificados.innerHTML = "";

                    if (dados.multiplosObjetos && Array.isArray(dados.objetos)) {
                        const aviso = document.createElement("p");
                        aviso.textContent = "Foram encontrados vários objetos. Selecione um para registrar:";
                        objetosIdentificados.appendChild(aviso);

                        dados.objetos.forEach((objeto, indice) => {
                            const botao = document.createElement("button");
                            const objetoResultado = { ...objeto, modo: objeto.modo || dados.modo };
                            botao.type = "button";
                            botao.textContent = `${indice + 1}. ${objeto.tipo} - ${objeto.material} (${objeto.confianca}%)`;
                            botao.addEventListener("click", () => {
                                resultadoReciclagem = objetoResultado;
                                materialIdentificado.textContent = objetoResultado.material;
                                tipoIdentificado.textContent = objetoResultado.tipo;
                                lixeiraIdentificada.textContent = objetoResultado.lixeira;
                                confiancaIA.textContent = `${objetoResultado.confianca}%`;
                                pontosIA.textContent = `+${objetoResultado.pontos || 0}`;
                                btnConfirmarReciclagem.style.display = resultadoPodeSerConfirmado(objetoResultado)
                                    ? "block"
                                    : "none";
                            });
                            objetosIdentificados.appendChild(botao);
                        });
                    }


                confiancaIA.textContent =
                    `${dados.confianca}%`;


                                mensagemIA.textContent = dados.modo === "simulado"
                                        ? `⚠️ Modo simulado: sugestão de referência para demonstração. ` +
                                            `A foto não foi confirmada por uma IA visual e não gera pontos.`
                                        : `✅ Lixo recebido e identificado. ` +
                                            `Material: ${dados.material}. ` +
                                            `Confiança da IA: ${dados.confianca}%. ` +
                                            `${dados.mensagem}`;


                // ==========================================
                // MOSTRAR BOTÃO DE CONFIRMAÇÃO
                // ==========================================

                if (resultadoPodeSerConfirmado(dados)) {

                    btnConfirmarReciclagem.style.display =
                        "block";

                } else {

                    btnConfirmarReciclagem.style.display =
                        "none";
                }

                mostrarModalResultado(dados);


            } catch (erro) {

                console.error(
                    "Erro na análise:",
                    erro
                );


                materialIdentificado.textContent =
                    "Erro";


                confiancaIA.textContent =
                    "";


                mensagemIA.textContent =
                    erro.message;


                btnConfirmarReciclagem.style.display =
                    "none";


            } finally {

                alterarCarregamentoIA(false);

                btnAnalisar.disabled =
                    false;


                btnAnalisar.textContent =
                    "🤖 Identificar material";
            }
        }
    );
}


// =====================================================
// NOVA FOTO
// =====================================================

if (btnNovaFoto) {

    btnNovaFoto.addEventListener(
        "click",
        function () {

            fotoBlob = null;

            resultadoReciclagem = null;


            fotoPreview.src = "";

            fotoPreview.style.display =
                "none";


            resultadoIA.style.display =
                "none";


            btnAnalisar.style.display =
                "none";


            btnNovaFoto.style.display =
                "none";


            btnConfirmarReciclagem.style.display =
                "none";

            btnConfirmarReciclagem.hidden = false;
            btnConfirmarReciclagem.disabled = false;
            btnConfirmarReciclagem.textContent = "♻️ Confirmar e adicionar pontos";


            mensagemReciclagem.style.display =
                "none";
            mensagemReciclagem.hidden = true;

            alterarCarregamentoIA(false);
            fecharModalResultado();


            btnAbrirCamera.style.display =
                "inline-block";
        }
    );
}


// =====================================================
// CONFIRMAR RECICLAGEM
// =====================================================

if (btnConfirmarReciclagem) {

    btnConfirmarReciclagem.addEventListener(
        "click",
        async function () {

            if (!resultadoReciclagem) {

                alert(
                    "Primeiro identifique um material."
                );

                return;
            }


            const usuarioAtual =
                localStorage.getItem(
                    "usuarioId"
                );


            if (!usuarioAtual) {

                alert(
                    "Usuário não encontrado."
                );

                window.location.href =
                    "index.html";

                return;
            }


            const codigoConfirmacao =
                crypto.randomUUID();


            btnConfirmarReciclagem.disabled =
                true;


            btnConfirmarReciclagem.textContent =
                "Registrando pontos...";


            try {

                const resposta =
                    await fetch(
                        "/confirmar-reciclagem",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                usuarioId:
                                    Number(usuarioAtual),

                                material:
                                    resultadoReciclagem.material,

                                tipo:
                                    resultadoReciclagem.tipo,

                                lixeira:
                                    resultadoReciclagem.lixeira,

                                confianca:
                                    resultadoReciclagem.confianca,

                                pontos:
                                    resultadoReciclagem.pontos,

                                justificativa:
                                    resultadoReciclagem.justificativa,

                                modo:
                                    resultadoReciclagem.modo,

                                imagemPath:
                                    resultadoReciclagem.imagemPath,

                                codigoConfirmacao:
                                    codigoConfirmacao
                            })
                        }
                    );


                const dados =
                    await resposta.json();


                if (!resposta.ok) {

                    throw new Error(
                        dados.mensagem ||
                        "Erro ao confirmar."
                    );
                }


                // ==========================================
                // SUCESSO
                // ==========================================

                mensagemReciclagem.textContent =
                    `✅ Lixo aceito e reciclagem confirmada! ` +
                    `Material: ${resultadoReciclagem.material}. ` +
                    `Confiança da IA: ${resultadoReciclagem.confianca}%. ` +
                    `+${dados.pontosGanhos} pontos adicionados à sua conta. ` +
                    `Saldo atual: ${dados.pontos} pontos.`;


                mensagemReciclagem.style.display =
                    "block";
                mensagemReciclagem.hidden = false;

                resultadoIA.style.display = "block";
                mensagemIA.textContent =
                    `✅ Reciclagem registrada no banco de dados. ` +
                    `+${dados.pontosGanhos} pontos adicionados. ` +
                    `Saldo atual: ${dados.pontos} pontos.`;
                pontosIA.textContent =
                    `+${dados.pontosGanhos} pontos | saldo: ${dados.pontos} pontos`;
                resultadoIA.scrollIntoView({ behavior: "smooth", block: "center" });

                statusModalIA.textContent = "✅ LIXO ACEITO E REGISTRADO";
                mensagemModalIA.textContent =
                    `+${dados.pontos_adicionados} pontos adicionados. ` +
                    `Saldo atual: ${dados.pontos_totais} pontos.`;
                pontosModalIA.textContent =
                    `+${dados.pontos_adicionados} pontos | saldo: ${dados.pontos_totais}`;


                // Atualizar pontos

                if (pontosUsuario) {

                    pontosUsuario.textContent =
                        dados.pontos;
                }


                // Atualizar reciclagens

                if (totalReciclagens) {

                    totalReciclagens.textContent =
                        dados.totalReciclagens;
                }

                await carregarUsuario();
                await carregarHistorico();
                await carregarEstatisticas();


                btnConfirmarReciclagem.textContent =
                    "✅ Reciclagem confirmada";
                btnConfirmarReciclagem.disabled = true;

                btnNovaFoto.style.display = "inline-block";


            } catch (erro) {

                console.error(
                    erro
                );


                alert(
                    erro.message
                );


                btnConfirmarReciclagem.disabled =
                    false;


                btnConfirmarReciclagem.textContent =
                    "♻️ Confirmar reciclagem";
            }
        }
    );
}


// =====================================================
// PARAR CÂMERA
// =====================================================

function pararCamera() {

    if (streamCamera) {

        streamCamera
            .getTracks()
            .forEach(
                track => track.stop()
            );


        streamCamera = null;
    }
}


// =====================================================
// INICIAR
// =====================================================

carregarUsuario();
carregarHistorico();
carregarEstatisticas();


