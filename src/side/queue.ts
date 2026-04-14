const queue = new Array<string>();

const right = document.getElementById("right") as HTMLTextAreaElement;

export const pushQueue = (message: string) => {
    queue.push(message);
    if (queue.length === 1)
        right.value = message;
}

export const popQueue = () => {
    queue.shift();
    if (queue.length === 0)
        right.value = "";
    else
        right.value = queue[0]!;
}