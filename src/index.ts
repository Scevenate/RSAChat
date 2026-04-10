const encoder = new TextEncoder();
const decoder = new TextDecoder();
let mykeyPair: CryptoKeyPair | null = null;
let friendPubKey: CryptoKey | null = null;
const friendTextarea = document.getElementById("friend-textarea") as HTMLTextAreaElement;
const messageDisplay = document.getElementById("message-display") as HTMLDivElement;
const chatboxTextarea = document.getElementById("chatbox-textarea") as HTMLTextAreaElement;
const selfTextarea = document.getElementById("self-textarea") as HTMLTextAreaElement;
const selfP = document.getElementById("self-p") as HTMLParagraphElement;
const friendP = document.getElementById("friend-p") as HTMLParagraphElement;
const friendButton = document.getElementById("friend-button") as HTMLButtonElement;
const chatboxButton = document.getElementById("chatbox-button") as HTMLButtonElement;
const selfButton = document.getElementById("self-button") as HTMLButtonElement;

async function genKeyPair () {
    return window.crypto.subtle.generateKey(
    {
        name: "RSA-OAEP",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
    );
}
function b642ab(b64: string) {
    return Uint8Array.from(window.atob(b64), c => c.charCodeAt(0)).buffer;
}
function ab2b64 (ab: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(ab);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++)
        binary += String.fromCharCode(bytes[i] as number);
    return window.btoa(binary);
}
async function key2b64 (pubkey: CryptoKey) {
    return ab2b64(await window.crypto.subtle.exportKey("spki", pubkey));
}
async function b642key (b64: string) {
    return await window.crypto.subtle.importKey("spki",
            b642ab(b64),
            {
            name: "RSA-OAEP",
            hash: "SHA-256",
            },
            true,
            ["encrypt"],
            );
}
async function encrypt (friendPubKey: CryptoKey, plaintext: string) {
    return ab2b64(await window.crypto.subtle.encrypt(
        {
        name: "RSA-OAEP",
        },
        friendPubKey,
        encoder.encode(plaintext),
    ));
}
async function decrypt (myPriKey: CryptoKey, ciphertext: string) {
    const binary = window.atob(ab2b64(await window.crypto.subtle.decrypt(
        {
        name: "RSA-OAEP",
        },
        myPriKey,
        b642ab(ciphertext),
    )));
    return decoder.decode(Uint8Array.from(binary, c => c.charCodeAt(0)))
}
async function friend () {
    if (friendTextarea.hasAttribute("readonly")) {
        friendTextarea.removeAttribute("readonly");
        friendTextarea.setAttribute("placeholder", "Friend's encrypted message here...")
        friendP.innerText = "Listening for incoming message.";
        friendTextarea.value = "";
        if (!friendPubKey) {
            messageDisplay.innerHTML = "";
        }
    }
    if (!friendTextarea.value) return;
    let newmessage = await decrypt(mykeyPair!.privateKey, friendTextarea.value);
    friendTextarea.value = "";
    messageDisplay.innerHTML += '<div class="friends message"><p>' + newmessage + "</p></div>"
    messageDisplay.scroll(0, messageDisplay.scrollHeight);
}
async function chatbox () {
    if (!chatboxTextarea.value) return;
    let newmessage = chatboxTextarea.value;
    chatboxTextarea.value = "";
    chatboxTextarea.setAttribute("disabled", "");
    messageDisplay.innerHTML += '<div class="my message"><p>' + newmessage + "</p></div>"
    messageDisplay.scroll(0, messageDisplay.scrollHeight);
    chatboxButton.setAttribute("disabled", "");
    selfTextarea.value = await encrypt(friendPubKey!, newmessage);
    selfTextarea.removeAttribute("disabled");
    selfButton.removeAttribute("disabled");
    selfP.innerText = "Message in queue."
}
async function self () {
    if (!friendPubKey) {
        if (!selfTextarea.value) return;
        friendPubKey = await b642key(selfTextarea.value);
        selfTextarea.removeAttribute("placeholder");
        selfTextarea.setAttribute("readonly", "");
        if (friendTextarea.hasAttribute("readonly")) {
            messageDisplay.innerHTML = "";
        }
    }
    selfTextarea.value = "";
    selfP.innerText = "No message in send queue";
    selfTextarea.setAttribute("disabled", "");
    selfButton.setAttribute("disabled", "");
    chatboxTextarea.removeAttribute("disabled");
    chatboxButton.removeAttribute("disabled");
}
async function main() {

    friendButton.addEventListener("click", friend);
    chatboxButton.addEventListener("click", chatbox);
    selfButton.addEventListener("click", self);

    mykeyPair = await genKeyPair();
    friendTextarea.value = await key2b64(mykeyPair.publicKey);

}

main();