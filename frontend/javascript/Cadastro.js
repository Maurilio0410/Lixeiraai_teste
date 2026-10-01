// =====================================================
// CADASTRO
// =====================================================

const formularioCadastro =
    document.getElementById("FormCadastro");


formularioCadastro.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const usuario =
            document
                .getElementById("cadastroUsuario")
                .value
                .trim();


        const email =
            document
                .getElementById("cadastroEmail")
                .value
                .trim();


        const senha =
            document
                .getElementById("cadastroSenha")
                .value;


        // ==============================
        // VALIDAÇÃO
        // ==============================

        if (!usuario || !email || !senha) {

            alert(
                "Preencha todos os campos."
            );

            return;
        }


        try {

            const resposta =
                await fetch(
                    "/cadastrar",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            usuario: usuario,

                            email: email,

                            senha: senha

                        })

                    }
                );


            const dados =
                await resposta.json();


            console.log(
                "Resposta cadastro:",
                dados
            );


            if (resposta.ok) {

                alert(
                    "Cadastro realizado com sucesso!"
                );


                formularioCadastro.reset();


            } else {

                alert(
                    dados.mensagem
                );

            }


        } catch (erro) {

            console.error(
                "Erro:",
                erro
            );


            alert(
                "Erro ao conectar ao servidor."
            );

        }

    }
);



// =====================================================
// LOGIN
// =====================================================

const formularioLogin =
    document.getElementById("FormLogin");


formularioLogin.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();


        const senha =
            document
                .getElementById("loginSenha")
                .value;


        // ==============================
        // VALIDAÇÃO
        // ==============================

        if (!email || !senha) {

            alert(
                "Digite o email e a senha."
            );

            return;
        }


        try {

            const resposta =
                await fetch(
                    "/login",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            email: email,

                            senha: senha

                        })

                    }
                );


            const dados =
                await resposta.json();


            console.log(
                "Resposta login:",
                dados
            );


            // ==============================
            // LOGIN CORRETO
            // ==============================

            if (resposta.ok) {


                alert(
                    "Login realizado com sucesso!"
                );


                // ==================================
                // SALVA O ID DO USUÁRIO
                // ==================================

                localStorage.setItem(
                    "usuarioId",
                    dados.usuario.id
                );


                // Salva também o nome

                localStorage.setItem(
                    "usuarioNome",
                    dados.usuario.nome
                );


                // Salva email

                localStorage.setItem(
                    "usuarioEmail",
                    dados.usuario.email
                );


                console.log(
                    "ID do usuário:",
                    dados.usuario.id
                );


                // ==================================
                // IR PARA O SITE
                // ==================================

                window.location.href =
                    "aplicativo.html";


            } else {

                alert(
                    dados.mensagem
                );

            }


        } catch (erro) {

            console.error(
                "Erro no login:",
                erro
            );


            alert(
                "Erro ao conectar ao servidor."
            );

        }

    }
);





