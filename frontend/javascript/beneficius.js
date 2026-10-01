const usuarioId =
    localStorage.getItem("usuarioId");

if (!usuarioId) {

    window.location.href =
        "index.html";

}

const listaBeneficios =
    document.getElementById(
        "listaBeneficios"
    );

const pontosUsuario =
    document.getElementById(
        "pontosUsuario"
    );


// =====================================================
// BUSCAR PONTOS
// =====================================================

async function carregarUsuario() {

    try {

        const resposta =
            await fetch(
                `/usuario/${usuarioId}`
            );

        if (!resposta.ok) {
            return;
        }

        const usuario =
            await resposta.json();

        pontosUsuario.textContent =
            usuario.pontos || 0;

    } catch (erro) {

        console.error(
            "Erro ao carregar usuário:",
            erro
        );

    }

}


// =====================================================
// BUSCAR BENEFÍCIOS
// =====================================================

async function carregarBeneficios() {

    try {

        const resposta =
            await fetch(
                "/beneficios"
            );

        const beneficios =
            await resposta.json();

        listaBeneficios.innerHTML = "";

        beneficios.forEach(
            beneficio => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "card-beneficio";

                card.innerHTML = `

                    <h3>
                        🎁 ${beneficio.nome}
                    </h3>

                    <p>
                        ${beneficio.descricao}
                    </p>

                    <strong>
                        ${beneficio.pontos_necessarios}
                        pontos
                    </strong>

                    <br><br>

                    <button
                        onclick="resgatarBeneficio(${beneficio.id})"
                    >
                        🎁 Resgatar
                    </button>

                `;

                listaBeneficios.appendChild(
                    card
                );

            }
        );

    } catch (erro) {

        console.error(erro);

        listaBeneficios.innerHTML =
            "<p>Erro ao carregar benefícios.</p>";

    }

}


// =====================================================
// RESGATAR
// =====================================================

async function resgatarBeneficio(
    beneficioId
) {

    const confirmar =
        confirm(
            "Deseja realmente resgatar este benefício?"
        );

    if (!confirmar) {
        return;
    }

    try {

        const resposta =
            await fetch(
                "/resgatar-beneficio",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        usuarioId:
                            Number(usuarioId),

                        beneficioId:
                            Number(beneficioId)

                    })

                }
            );

        const dados =
            await resposta.json();

        if (!resposta.ok) {

            alert(
                dados.mensagem
            );

            return;

        }

        pontosUsuario.textContent =
            dados.pontosRestantes;

        alert(
            `🎉 Benefício resgatado!\n\n` +
            `Código: ${dados.codigo}\n\n` +
            `Pontos restantes: ${dados.pontosRestantes}`
        );

    } catch (erro) {

        console.error(erro);

        alert(
            "Erro ao realizar resgate."
        );

    }

}


// =====================================================
// INICIAR
// =====================================================

carregarUsuario();

carregarBeneficios();