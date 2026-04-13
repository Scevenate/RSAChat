import type { FilePacket, TextMessage, TextPacket } from "@/types";
import { insertMessage } from "@/storage/message";

const fragmentSize = 256;

let sendSeq = 0;
let recvSeq = 0;

const fragments = new Map<number, string>();
    
export const sendTextTcp = (content: string): Array<TextPacket> => {
    const message: TextMessage = {
        side: "my",
        seq: sendSeq++,
        type: "text",
        timestamp: Date.now(),
        content: content,
    }
    insertMessage(message);
    const fragments = Math.ceil(content.length / fragmentSize);
    const packets = new Array<TextPacket>();
    for (let i = 0; i < fragments; i++) {
        const fragment = content.slice(i * fragmentSize, (i + 1) * fragmentSize);
        packets.push({
            seq: message.seq,
            type: "text",
            timestamp: message.timestamp,
            content: fragment,
            fragments: fragments,
            offset: i,
        });
    }
    return packets;
}

export const sendFileTcp = (name: string, contentBytes: Uint8Array): Array<FilePacket> => {
    const content = contentBytes.toBase64();
    const fragments = Math.ceil(content.length / fragmentSize);
    const packets = new Array<FilePacket>();
    for (let i = 0; i < fragments; i++) {
        const fragment = content.slice(i * fragmentSize, (i + 1) * fragmentSize);
        packets.push({
            seq: sendSeq++,
            type: "file",
            timestamp: Date.now(),
            name: name,
            content: fragment.toString(),
            fragments: fragments,
            offset: i * fragmentSize,
        });
    }
    return packets;
}

