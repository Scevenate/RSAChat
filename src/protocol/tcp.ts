let sendSeq = 0;
let recvSeq = 0;

const fragments = new Map<number, string>();

export const sendTextTcp = (content: string) => {}