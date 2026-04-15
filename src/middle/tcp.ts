import type { FileMessage, FilePacket, Packet, RequestPacket, TextMessage, TextPacket } from "@/types";
import { deleteMessage, messages, pushMessage } from "@/middle/messages";

const fragmentSize = 683;  // Roughly 0.5 KB data

let sendSeq = 0;
let recvSeq = 0;

type Fragments = {
    fragments: number,  // 0 if empty, we don't know how many fragments are there. Correspondingly transferred is 0, packets is [].
    transferred: number,
    packets: Array<Packet | null>,
}

const fragments = new Map<number, Fragments>();
    
export const sendTextTcp = (content: string): Array<TextPacket> => {
    const message: TextMessage = {
        side: "my",
        seq: sendSeq++,
        type: "text",
        timestamp: Date.now(),
        content: content,
    }
    pushMessage(message);
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

export const sendFileTcp = (name: string, content: string): Array<FilePacket> => {
    const message: FileMessage = {
        side: "my",
        seq: sendSeq++,
        type: "file",
        timestamp: Date.now(),
        name: name,
        content: content,
    }
    pushMessage(message);
    const fragments = Math.ceil(content.length / fragmentSize);
    const packets = new Array<FilePacket>();
    for (let i = 0; i < fragments; i++) {
        const fragment = content.slice(i * fragmentSize, (i + 1) * fragmentSize);
        packets.push({
            seq: message.seq,
            type: "file",
            timestamp: message.timestamp,
            name: message.name,
            content: fragment,
            fragments: fragments,
            offset: i,
        });
    }
    return packets;
}

export const recvTextTcp = (packet: TextPacket) => {
    if (packet.seq >= recvSeq) {
        for (; recvSeq <= packet.seq; recvSeq++) {
            fragments.set(recvSeq, {
                fragments: 0,
                transferred: 0,
                packets: [],
            });
            pushMessage({
                side: "friend",
                seq: recvSeq,
                type: "empty",
                timestamp: Date.now(),
            });
        }
    }
    if (!fragments.has(packet.seq)) {
        throw Error("This message is already presented.");
    }
    if (fragments.get(packet.seq)!.fragments === 0) {
        fragments.set(packet.seq, {
            fragments: packet.fragments,
            transferred: 0,
            packets: new Array<Packet | null>(packet.fragments).fill(null),
        });
    }
    if (fragments.get(packet.seq)!.packets![packet.offset] !== null) {
        throw Error("This fragment is already presented.");
    }
    fragments.get(packet.seq)!.packets[packet.offset] = packet;
    fragments.get(packet.seq)!.transferred++;
    deleteMessage("friend", packet.seq);
    if (fragments.get(packet.seq)!.transferred < fragments.get(packet.seq)!.fragments) {
        pushMessage({
            side: "friend",
            seq: packet.seq,
            type: "partial",
            timestamp: packet.timestamp,
            fragments: fragments.get(packet.seq)!.fragments,
            transferred: fragments.get(packet.seq)!.transferred,
        });
    } else {
        const content = fragments.get(packet.seq)!.packets!.map((p) => (p as TextPacket).content).join("");
        const message: TextMessage = {
            side: "friend",
            seq: packet.seq,
            type: "text",
            timestamp: packet.timestamp,
            content: content,
        };
        pushMessage(message);
        fragments.delete(packet.seq);
    }
}

export const recvFileTcp = (packet: FilePacket) => {
    if (packet.seq >= recvSeq) {
        for (; recvSeq <= packet.seq; recvSeq++) {
            fragments.set(recvSeq, {
                fragments: 0,
                transferred: 0,
                packets: [],
            });
            pushMessage({
                side: "friend",
                seq: recvSeq,
                type: "empty",
                timestamp: Date.now(),
            });
        }
    }
    if (!fragments.has(packet.seq)) {
        throw Error("This message is already presented.");
    }
    if (fragments.get(packet.seq)!.fragments === 0) {
        fragments.set(packet.seq, {
            fragments: packet.fragments,
            transferred: 0,
            packets: new Array<Packet | null>(packet.fragments).fill(null),
        });
    }
    if (fragments.get(packet.seq)!.packets![packet.offset] !== null) {
        throw Error("This fragment is already presented.");
    }
    fragments.get(packet.seq)!.packets[packet.offset] = packet;
    fragments.get(packet.seq)!.transferred++;
    deleteMessage("friend", packet.seq);
    if (fragments.get(packet.seq)!.transferred < fragments.get(packet.seq)!.fragments) {
        pushMessage({
            side: "friend",
            seq: packet.seq,
            type: "partial",
            timestamp: packet.timestamp,
            fragments: fragments.get(packet.seq)!.fragments,
            transferred: fragments.get(packet.seq)!.transferred,
        });
    } else {
        const content = fragments.get(packet.seq)!.packets!.map((p) => (p as FilePacket).content).join("");
        const message: FileMessage = {
            side: "friend",
            seq: packet.seq,
            type: "file",
            name: packet.name,
            timestamp: packet.timestamp,
            content: content,
        };
        pushMessage(message);
        fragments.delete(packet.seq);
    }
}

export const sendRequestTcp = (seq: number): RequestPacket => {
    if (fragments.get(seq)!.fragments !== 0) {
        const fragmentsRequested = new Array<number>();
        for (let i = 0; i < fragments.get(seq)!.fragments; i++) {
            if (fragments.get(seq)!.packets![i] === null) {
                fragmentsRequested.push(i);
            }
        }
        return {
            type: "request",
            seq: seq,
            fragments: fragmentsRequested,
        }
    }
    return {
        type: "request",
        seq: seq,
    };
}

export const recvRequestTcp = (packet: RequestPacket): Array<TextPacket | FilePacket> => {
    const messageRequested = messages.find((m) => m.side === "my" && m.seq === packet.seq) as TextMessage | FileMessage;
    if (messageRequested.type === "text") {
        const fragments = Math.ceil(messageRequested.content.length / fragmentSize);
        const packets = new Array<TextPacket>();
        for (let i = 0; i < fragments; i++) {
            const fragment = messageRequested.content.slice(i * fragmentSize, (i + 1) * fragmentSize);
            const packetRequested = {
                seq: messageRequested.seq,
                type: "text",
                timestamp: messageRequested.timestamp,
                content: fragment,
                fragments: fragments,
                offset: i,
            } as TextPacket;
            if (packet.fragments === undefined || packet.fragments.includes(i)) {
                packets.push(packetRequested);
            }
        }
        return packets;
    } else {
        const fragments = Math.ceil(messageRequested.content.length / fragmentSize);
        const packets = new Array<FilePacket>();
        for (let i = 0; i < fragments; i++) {
            const fragment = messageRequested.content.slice(i * fragmentSize, (i + 1) * fragmentSize);
            const packetRequested = {
                seq: messageRequested.seq,
                type: "file",
                timestamp: messageRequested.timestamp,
                name: messageRequested.name,
                content: fragment,
                fragments: fragments,
                offset: i,
            } as FilePacket;
            if (packet.fragments === undefined || packet.fragments.includes(i)) {
                packets.push(packetRequested);
            }
        }
        return packets;
    }
}