const queue = new Array<string>();

const rightTextarea = document.getElementById("right-textarea") as HTMLTextAreaElement;
const rightP = document.getElementById("right-p") as HTMLParagraphElement;

export const pushQueue = (message: string) => {
    queue.push(message);
    if (queue.length === 1)
        rightTextarea.value = message;
    rightP.textContent = `${queue.length} message${queue.length === 1 ? "" : "s"} in queue.`;
        
}

export const popQueue = () => {
    queue.shift();
    if (queue.length === 0) {
        rightTextarea.value = "";
        rightP.textContent = `No message in queue.`;
    } else {
        rightTextarea.value = queue[0]!;
        rightP.textContent = `${queue.length} message${queue.length === 1 ? "" : "s"} in queue.`;
    }
}