export type TextPacket = {
    seq: number,
    type: "text",
    timestamp: number,
    content: string,
    fragments: number,
    offset: number,
}

export type FilePacket = {
    seq: number,
    type: "file",
    timestamp: number,
    name: number,
    content: string,
    fragments: number,
    offset: number,
}

export type RequestPacket = {
    type: "request",
    seq: number,
    fragments?: Array<number>
}

export type Packet = TextPacket | FilePacket | RequestPacket;

export type TextMessage = {
    side: "my" | "friend",
    seq: number,
    type: "text",
    timestamp: number,
    content: string,
}

export type PartialTextMessage = {
    side: "my" | "friend",
    seq: number,
    type: "partial text",
    timestamp: number,
    content: string,
    fragments: number,
    transferred: number,
}

export type FileMessage = {
    side: "my" | "friend",
    seq: number,
    type: "file",
    name: string,
    timestamp: number,
    content: string,
}

export type PartialFileMessage = {
    side: "my" | "friend",
    seq: number,
    type: "partial file",
    name: string,
    timestamp: number,
    content: string,
    fragments: number,
    transferred: number,
}

export type MainMessage = {
    side: "main",
    seq: number,
    type: "info" | "warning" | "error",
    timestamp: number,
    content: string,
}

export type Message = TextMessage | FileMessage | MainMessage;