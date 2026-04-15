import { left, middle, right } from "./invoke";
import { sendPub } from "./side/ssl";

const leftButton = document.getElementById("left-button") as HTMLButtonElement;
const middleButton = document.getElementById("middle-button") as HTMLButtonElement;
const rightButton = document.getElementById("right-button") as HTMLButtonElement;

leftButton.addEventListener("click", left());
middleButton.addEventListener("click", middle());
rightButton.addEventListener("click", right());

const rightTextarea = document.getElementById("right-textarea") as HTMLTextAreaElement;

rightTextarea.value = await sendPub();
rightButton.disabled = false;