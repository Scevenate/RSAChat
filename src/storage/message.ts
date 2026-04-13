import type { MainMessage, Message } from "@/types";

/**
 * The message storage maintains the following order:
 *   1. Timestamp first.
 *   2. Side second, friend to main to my.
 *   3. Seq third.
 */

const storage = new Array<Message>();

let mainSeq = 0;

export const pushMainMessage = (type: "info" | "warning" | "error", content: string): number => {
    const message: MainMessage = {
        side: "main",
        type: type,
        seq: mainSeq,
        timestamp: Date.now(),
        content: content,
    }
    let index = storage.length;
    while (index >= 0 && storage[index]!.side === "my") index--;
    storage.splice(index, 0, message);
    return mainSeq++;
}

export const insertMessage = (message: Message): number => {
    let index = storage.length;
    while (index > 0 && storage[index - 1]!.timestamp > message.timestamp) index--;
    while (index > 0 && storage[index - 1]!.timestamp === message.timestamp
        && storage[index - 1]!.side === "my" && storage[index - 1]!.seq > message.seq) index--;
    if (message.side === "my") {
        storage.splice(index, 0, message);
        return index;
    }
    while (index > 0 && storage[index - 1]!.timestamp === message.timestamp
        && storage[index]!.side === "my") index--;
    while (index > 0 && storage[index - 1]!.timestamp === message.timestamp
        && storage[index]!.side === "main" && storage[index]!.seq > message.seq) index--;
    if (message.side === "main") {
        storage.splice(index, 0, message);
        return index;
    }
    while (index < storage.length && storage[index]!.timestamp === message.timestamp
        && storage[index]!.side === "main") index--;
    while (index < storage.length && storage[index]!.timestamp === message.timestamp
        && storage[index]!.side === "friend" && storage[index]!.seq < message.seq) index++;
    storage.splice(index, 0, message);
    return index;
}

export const deleteMessage = (side: "my" | "friend" | "main", seq: number) => {
    let index = storage.length;
    while (index >= 0 && (storage[index - 1]!.side !== side || storage[index - 1]!.seq !== seq)) index--;
    if (index < 0) return false;
    storage.splice(index, 1);
    return true;
}