import type { EmptyMessage, FileMessage, Packet, PartialMessage } from "./types";
import { recvFileTcp, recvRequestTcp, recvTextTcp, sendFileTcp, sendRequestTcp, sendTextTcp } from "./middle/tcp";
import { sendSsl, recvSsl, recvPub, recvSec } from "./side/ssl";
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

export const left = () => {
    let initLeft = 0;
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
                    const packet = JSON.parse(await recvSsl(leftTextarea.value) as string) as Packet;
                    switch (packet.type) {
                        case "request":
                            const packets = recvRequestTcp(packet);
                            for (const packet of packets) {
                                sendSsl(JSON.stringify(packet));
                            }
                            leftP.textContent = "Request accepted.";
                            break;
                        case "text":
                            recvTextTcp(packet);
                            leftP.textContent = "";
                            break;
                        case "file":
                            recvFileTcp(packet);
                            leftP.textContent = "";
                            break;
                        default:
                            throw Error(`Invalid message type: ${(packet as any).type?.toString()}.`);
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
const middleFile = document.getElementById("middle-file") as HTMLInputElement;

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
            middleFile.files = null;
        }
    }
}

const middleButton = document.getElementById("middle-button") as HTMLButtonElement;
const rightTextarea = document.getElementById("right-textarea") as HTMLTextAreaElement;
const rightP = document.getElementById("right-p") as HTMLParagraphElement;

export const right = () => {
    let initRight = 0;
    return async () => {
        switch (initRight) {
            case 0:
                if (rightTextarea.value === "") return;
                initRight = 1;
                rightTextarea.value = "";
                rightTextarea.placeholder = "Friend's secret here...";
                rightTextarea.readOnly = false;
                rightP.textContent = "Load friend's secret to enable message sending.";
                break;
            case 1:
                try {
                    await recvSec(rightTextarea.value);
                } catch (error) {
                    rightP.textContent = (error as Error).message;
                    return;
                }
                initRight = 2;
                rightTextarea.value = "";
                rightTextarea.readOnly = true;
                rightTextarea.placeholder = "";
                rightP.textContent = "No message in queue.";
                middleTextarea.disabled = false;
                middleFile.disabled = false;
                middleButton.disabled = false;
                break;
            case 2:
                popQueue();
                break;
        }
    }
}