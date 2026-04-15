import type { MainMessage, Message } from "@/types";
import { download, request } from "@/invoke";

/**
 * The message storage maintains the following order:
 *   1. Timestamp first.
 *   2. Side second, friend to main to my.
 *   3. Seq third.
 */

const main = document.getElementById("main") as HTMLDivElement;

export const messages = new Array<Message>();

let mainSeq = 0;

export const pushMainMessage = (type: "info" | "warning" | "error", content: string) => {
    const message: MainMessage = {
        side: "main",
        type: type,
        seq: mainSeq++,
        timestamp: Date.now(),
        content: content,
    }
    pushMessage(message);
}

export const pushMessage = (message: Message) => {
    let index = messages.length;
    while (index > 0 && messages[index - 1]!.timestamp > message.timestamp) index--;
    while (index > 0 && messages[index - 1]!.timestamp === message.timestamp
        && messages[index - 1]!.side === "my" && messages[index - 1]!.seq > message.seq) index--;
    if (message.side === "my") {
        messages.splice(index, 0, message);
        insertHTML(message, index);
        return;
    }
    while (index > 0 && messages[index - 1]!.timestamp === message.timestamp
        && messages[index - 1]!.side === "my") index--;
    while (index > 0 && messages[index - 1]!.timestamp === message.timestamp
        && messages[index - 1]!.side === "main" && messages[index - 1]!.seq > message.seq) index--;
    if (message.side === "main") {
        messages.splice(index, 0, message);
        insertHTML(message, index);
        return;
    }
    while (index > 0 && messages[index - 1]!.timestamp === message.timestamp
        && messages[index - 1]!.side === "main") index--;
    while (index > 0 && messages[index - 1]!.timestamp === message.timestamp
        && messages[index - 1]!.side === "friend" && messages[index - 1]!.seq > message.seq) index--;
    messages.splice(index, 0, message);
    insertHTML(message, index);
}

export const deleteMessage = (side: "my" | "friend" | "main", seq: number) => {
    let index = messages.length;
    while (index >= 0 && (messages[index - 1]!.side !== side || messages[index - 1]!.seq !== seq)) index--;
    index--;
    if (index < 0) return;
    messages.splice(index, 1);
    deleteHTML(index);
}

const insertHTML = (message: Message, index: number) => {
    const div = document.createElement("div");
    div.className = `${message.side} ${message.type} message`;
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
                div.addEventListener("click", download(message));
                break;
            case "partial":
                div.innerHTML = `<p>Transferred ${message.transferred}/${message.fragments}. Click to request retransmission.</p>`;
                div.addEventListener("click", request(message));
                break;
            case "empty":
                div.innerHTML = `<p>Missing message. Click to request retransmission.</p>`;
                div.addEventListener("click", request(message));
                break;
        }
    }
    main.insertBefore(div, main.children[index] as HTMLDivElement);
}

const deleteHTML = (index: number) => {
    const div = main.children[index] as HTMLDivElement;
    div.remove();
}