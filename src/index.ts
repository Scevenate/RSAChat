import { init, left, middle, right } from "./invoke";

const leftButton = document.getElementById("left-button") as HTMLButtonElement;
const middleButton = document.getElementById("middle-button") as HTMLButtonElement;
const rightButton = document.getElementById("right-button") as HTMLButtonElement;

leftButton.addEventListener("click", left());
middleButton.addEventListener("click", middle());
rightButton.addEventListener("click", right());

init();