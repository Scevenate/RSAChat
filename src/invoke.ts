import type { EmptyMessage, FileMessage, Packet, PartialMessage } from "./types";
import { recvFileTcp, recvRequestTcp, recvTextTcp, sendFileTcp, sendRequestTcp, sendTextTcp } from "./middle/tcp";
import { sendSsl, recvSsl, recvPub, recvSec, sendPub } from "./side/ssl";
import { popQueue } from "./side/queue";

export const download = (message: FileMessage) => {
    return () => {
        const file = new Blob([Uint8Array.fromBase64(message.content)]);
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = message.name;
        a.click();
        URL.revokeObjectURL(url);
    }
}

export const request = (message: PartialMessage | EmptyMessage) => {
    return () => {
        console.log(`Request ${message.side} ${message.seq}`)
        const packet = sendRequestTcp(message.seq);
        sendSsl(JSON.stringify(packet));
    }
}

const leftTextarea = document.getElementById("left-textarea") as HTMLTextAreaElement;
const leftP = document.getElementById("left-p") as HTMLParagraphElement;
const middleTextarea = document.getElementById("middle-textarea") as HTMLTextAreaElement;
const middleFile = document.getElementById("middle-file") as HTMLInputElement;
const middleButton = document.getElementById("middle-button") as HTMLButtonElement;
const rightTextarea = document.getElementById("right-textarea") as HTMLTextAreaElement;
const rightP = document.getElementById("right-p") as HTMLParagraphElement;
const rightButton = document.getElementById("right-button") as HTMLButtonElement;

export const init = async () => {
    leftTextarea.value = "";
    leftTextarea.readOnly = false;
    leftTextarea.placeholder = "Friend's public key here...";
    leftP.textContent = "Either load friend's public key...";
    middleTextarea.disabled = true;
    middleFile.disabled = true;
    middleButton.disabled = true;
    rightTextarea.value = "Generating Key...";
    rightTextarea.readOnly = true;
    rightTextarea.placeholder = "";
    rightP.textContent = "Or send your public key to friend.";
    rightButton.disabled = true;
    rightTextarea.value = await sendPub();
    rightButton.disabled = false;
}

let initFinished = false;

const initFinish = () => {
    initFinished = true;
    leftTextarea.value = "";
    leftTextarea.readOnly = false;
    leftTextarea.placeholder = "Friend's message here...";
    leftP.textContent = "";
    rightTextarea.value = "";
    rightTextarea.readOnly = true;
    rightTextarea.placeholder = "";
    rightP.textContent = "No message in queue.";
    middleTextarea.disabled = false;
    middleFile.disabled = false;
    middleButton.disabled = false;
}

export const left = () => {
    let initLeft = 0;
    return async () => {
        if (!initFinished) {
            switch (initLeft) {
                case 0: {
                    let encapsulatedSecret: string;
                    try {
                        encapsulatedSecret = await recvPub(leftTextarea.value);
                    } catch (error) {
                        leftP.textContent = (error as Error).message;
                        return;
                    }
                    initLeft = 1;
                    leftTextarea.value = encapsulatedSecret;
                    leftTextarea.readOnly = true;
                    leftTextarea.placeholder = "";
                    leftP.textContent = "Send secret to friend to finish exchange.";
                    break;
                }
                case 1:
                    initLeft = 2;
                    initFinish();
                    break;
            }
            return;
        }
        try {
            const packet = JSON.parse(await recvSsl(leftTextarea.value) as string) as Packet;
            switch (packet.type) {
                case "request": {
                    const packets = recvRequestTcp(packet);
                    for (const packet of packets) {
                        sendSsl(JSON.stringify(packet));
                    }
                    leftP.textContent = "Request accepted.";
                    break;
                }
                case "text":
                    recvTextTcp(packet);
                    leftP.textContent = "";
                    break;
                case "file":
                    recvFileTcp(packet);
                    leftP.textContent = "";
                    break;
            }
            leftTextarea.value = "";
        } catch (error) {
            leftP.textContent = (error as Error).message;
            return;
        }
    }
}

export const right = () => {
    let initRight = 0;
    return async () => {
        if (!initFinished) {
            switch (initRight) {
                case 0:
                    if (rightTextarea.value === "") return;
                    initRight = 1;
                    rightTextarea.value = "";
                    rightTextarea.readOnly = false;
                    rightTextarea.placeholder = "Friend's secret here...";
                    rightP.textContent = "Load friend's secret to finish exchange.";
                    break;
                case 1:
                    try {
                        await recvSec(rightTextarea.value);
                    } catch (error) {
                        rightP.textContent = (error as Error).message;
                        return;
                    }
                    initRight = 2;
                    initFinish();
                    break;
                }
            return;
        }
        popQueue();
    }
}

export const middle = () => {
    return async () => {
        if (middleTextarea.value !== "") {
            const packets = sendTextTcp(middleTextarea.value);
            for (const packet of packets) {
                sendSsl(JSON.stringify(packet));
            }
            middleTextarea.value = "";
        }
        if (middleFile.files !== null && middleFile.files.length > 0) {
            const packets = sendFileTcp(middleFile.files[0]!.name, new Uint8Array(await middleFile.files[0]!.arrayBuffer()).toBase64());
            for (const packet of packets) {
                sendSsl(JSON.stringify(packet));
            }
            middleFile.value = "";
        }
    }
}
