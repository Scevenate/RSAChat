import { download, request } from "@/invoke";
import type { Message } from "@/types";

const main = document.getElementById("main") as HTMLDivElement;

export const insertHTML = (message: Message, index: number) => {
    const div = document.createElement("div");
    div.className = `${message.side} ${message.type} message`;
    div.setAttribute("side", message.side);
    div.setAttribute("seq", message.seq.toString());
    if (message.side === "main") {
        div.innerHTML = `<p>${message.content}</p>`;
    } else {
        switch (message.type) {
            case "text":
                div.innerHTML = `<p>${message.content}</p>`;
                break;
            case "file":
                div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="fileicon"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/></svg>
                <p>${message.name}</p>`;
                div.addEventListener("click", download(message.side, message.seq));
                break;
            case "partial":
                div.innerHTML = `<p>Transferred ${message.transferred}/${message.fragments}. Click to request retransmission.</p>`;
                div.addEventListener("click", request(message.side, message.seq));
                break;
            case "empty":
                div.innerHTML = `<p>Missing message. Click to request retransmission.</p>`;
                div.addEventListener("click", request(message.side, message.seq));
                break;
        }
    }
    main.insertBefore(div, main.children[index] ?? null);
}

export const deleteHTML = (index: number) => {
    const div = main.children[index] as HTMLDivElement;
    div.remove();
}