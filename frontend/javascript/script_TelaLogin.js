let Card = document.querySelector(".Card");
let loginButtons = document.querySelectorAll(".LoginButton");
let cadastroButton = document.querySelector(".cadastroButton");

loginButtons.forEach((loginButton) => {
    loginButton.onclick = () => {
        Card.classList.remove("cadastroActive")
        Card.classList.add("loginActive")
    }
});

cadastroButton.onclick = () => {
    Card.classList.remove("loginActive")
    Card.classList.add("cadastroActive")
}