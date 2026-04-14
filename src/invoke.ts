import type { EmptyMessage, FileMessage, Packet, PartialMessage } from "./types";
import { recvFileTcp, recvRequestTcp, recvTextTcp, sendRequestTcp } from "./middle/tcp";
import { sendSsl, recvSsl, recvPub } from "./side/ssl";

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


let initLeft = 0;
const leftTextarea = document.getElementById("left-textarea") as HTMLTextAreaElement;
const leftP = document.getElementById("left-p") as HTMLParagraphElement;

export const left = () => {
    return async () => {
        switch (initLeft) {
            case 0:
                let encapsulatedSecret: string | null = null;
                try {
                    encapsulatedSecret = await recvPub(leftTextarea.value);
                } catch (error) {
                    leftP.textContent = (error as Error).message;
                    return;
                }
                initLeft = 1;
                leftTextarea.value = encapsulatedSecret;
                leftTextarea.readOnly = true;
                leftP.textContent = "Send secret to friend to enable message receiving.";
                break;
            case 1:
                initLeft = 2;
                leftTextarea.value = "";
                leftTextarea.readOnly = false;
                leftTextarea.placeholder = "Friend's message here...";
                leftP.textContent = "";
                break;
            case 2:
                try {
                    const packet = await recvSsl(leftTextarea.value);
                    const message = JSON.parse(packet as string) as Packet;
                    switch (message.type) {
                        case "request":
                            const packets = recvRequestTcp(message);
                            for (const packet of packets) {
                                sendSsl(JSON.stringify(packet));
                            }
                            leftP.textContent = "Request accepted.";
                            break;
                        case "text":
                            recvTextTcp(message);
                            break;
                        case "file":
                            recvFileTcp(message);
                            break;
                    }
                    leftTextarea.value = "";
                } catch (error) {
                    leftP.textContent = (error as Error).message;
                    return;
                }
                break;
        }
    }
}

const middleTextarea = document.getElementById("middle-textarea") as HTMLTextAreaElement;

export const middle = () => {
    return () => {
    }
}

let initRight = 0;
const rightTextarea = document.getElementById("right-textarea") as HTMLTextAreaElement;
const rightP = document.getElementById("right-p") as HTMLParagraphElement;

export const right = () => {
    return () => {
        console.log(`Right`)
    }
}