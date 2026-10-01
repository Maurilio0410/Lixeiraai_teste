let Card = document.querySelector(".Card");
let loginButton = document.querySelector(".LoginButton");
let cadastroButton = document.querySelector(".cadastroButton");

loginButton.onclick = () =>{
    Card.classList.remove("cadastroActive")
    Card.classList.add("loginActive")
}

cadastroButton.onclick = () =>{
    Card.classList.remove("loginActive")
    Card.classList.add("cadastroActive")
}