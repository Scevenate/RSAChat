import * as HPKE from 'hpke'
import { KEM_ML_KEM_768, KDF_SHAKE256, AEAD_ChaCha20Poly1305 } from '@panva/hpke-noble'
import { chacha20poly1305 } from '@noble/ciphers/chacha.js'
import { pushQueue } from './queue'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

const suite = new HPKE.CipherSuite(
  KEM_ML_KEM_768,
  KDF_SHAKE256,
  AEAD_ChaCha20Poly1305,
)

const kp = await suite.GenerateKeyPair()

const exportLabel = new TextEncoder().encode('RSAChat');

let recordKey: Uint8Array | null = null

const concatBytes = (a: Uint8Array, b: Uint8Array): Uint8Array => {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

// sender

const recvPub = async (publicKey: string) => {
  let publicKeyBytes: Uint8Array | null = null
  try {
    publicKeyBytes = Uint8Array.fromBase64(publicKey)
  } catch {
    throw Error('Invalid base64 string.')
  }
  let key: HPKE.Key | null = null
  try {
    key = await suite.DeserializePublicKey(publicKeyBytes)
  } catch {
    throw Error('Invalid public key.')
  }
  const { encapsulatedSecret, ctx } = await suite.SetupSender(key)
  recordKey = await ctx.Export(exportLabel, 32)
  return encapsulatedSecret.toBase64()
}

const sendSsl = async (text: string) => {
  if (recordKey === null) return null
  const nonce = new Uint8Array(12)
  crypto.getRandomValues(nonce)
  const pt = textEncoder.encode(text)
  const ct = chacha20poly1305(recordKey, nonce).encrypt(pt)
  pushQueue(concatBytes(nonce, ct).toBase64())
}

// recipient

const sendPub = async () => {
  return (await suite.SerializePublicKey(kp.publicKey)).toBase64()
}

const recvSec = async (encapsulatedSecret: string) => {
  let encapsulatedSecretBytes: Uint8Array | null = null
  try {
    encapsulatedSecretBytes = Uint8Array.fromBase64(encapsulatedSecret)
  } catch {
    throw Error('Invalid base64 string.')
  }
  recordKey = null
  let ctx: HPKE.RecipientContext | null = null
  try {
    ctx = await suite.SetupRecipient(kp.privateKey, encapsulatedSecretBytes)
  } catch {
    throw Error('Invalid encapsulated secret.')
  }
  recordKey = await ctx.Export(exportLabel, 32)
}

const recvSsl = async (ciphertext: string) => {
  if (recordKey === null) return null
  let ciphertextBytes: Uint8Array | null = null
  try {
    ciphertextBytes = Uint8Array.fromBase64(ciphertext)
  } catch {
    throw Error('Invalid base64 string.')
  }
  if (ciphertextBytes.length < 28) {
    throw Error('Invalid ciphertext.')
  }
  const nonce = ciphertextBytes.subarray(0, 12)
  const ct = ciphertextBytes.subarray(12)
  try {
    const decrypted = chacha20poly1305(recordKey, nonce).decrypt(ct)
    return textDecoder.decode(decrypted)
  } catch {
    throw Error('Invalid ciphertext.')
  }
}

export { recvPub, sendSsl, sendPub, recvSec, recvSsl }
