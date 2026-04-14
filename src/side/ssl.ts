import * as HPKE from 'hpke'
import { pushQueue } from './queue';
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();


// Setup

const suite = new HPKE.CipherSuite(
  HPKE.KEM_ML_KEM_768,
  HPKE.KDF_SHAKE256,
  HPKE.AEAD_ChaCha20Poly1305,
)

let senderContext: HPKE.SenderContext | null = null;
let recipientContext: HPKE.RecipientContext | null = null;

// sender

const recvPub = async (publicKey: string) => {
    let publicKeyBytes: Uint8Array | null = null;
    try {
        publicKeyBytes = Uint8Array.fromBase64(publicKey);
    } catch (error) {
        throw Error("Invalid base64 string.");
    }
    let key: HPKE.Key | null = null;
    try {
        key = await suite.DeserializePublicKey(publicKeyBytes);
    } catch (error) {
        throw Error("Invalid public key.");
    }
    let { encapsulatedSecret, ctx } = await suite.SetupSender(key);
    senderContext = ctx;
    return encapsulatedSecret.toBase64();
}

// The second step does not invoke ssl.

const sendSsl = async (text: string) => {
    if (senderContext === null) return null;
    const encrypted = await senderContext.Seal(textEncoder.encode(text));
    pushQueue(encrypted.toBase64());
}

// recipient

const kp = await suite.GenerateKeyPair();

const sendPub = async () => {
    return (await suite.SerializePublicKey(kp.publicKey)).toBase64();
}

const recvSec = async (encapsulatedSecret: string) => {
    let encapsulatedSecretBytes: Uint8Array | null = null;
    try {
        encapsulatedSecretBytes = Uint8Array.fromBase64(encapsulatedSecret);
    } catch (error) {
        throw Error("Invalid base64 string.");
    }
    let ctx: HPKE.RecipientContext | null = null;
    try {
        ctx = await suite.SetupRecipient(kp.privateKey, encapsulatedSecretBytes);
    } catch (error) {
        throw Error("Invalid encapsulated secret.");
    }
    recipientContext = ctx;
}

const recvSsl = async (ciphertext: string) => {
    if (recipientContext === null) return null;
    let ciphertextBytes: Uint8Array | null = null;
    try{
        ciphertextBytes = Uint8Array.fromBase64(ciphertext);
    } catch (error) {
        throw Error("Invalid base64 string.");
    }
    try{
        const decrypted = await recipientContext.Open(ciphertextBytes);
        return textDecoder.decode(decrypted);
    } catch (error) {
        throw Error("Invalid ciphertext.");
    }
}

export { recvPub, sendSsl, sendPub, recvSec, recvSsl };