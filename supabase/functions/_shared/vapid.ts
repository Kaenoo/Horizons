import * as webpush from 'jsr:@negrel/webpush'

function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4)
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function convertVapidKeysToJWK(
  publicKeyBase64url: string,
  privateKeyBase64url: string,
): {
  publicKey: JsonWebKey
  privateKey: JsonWebKey
} {
  const publicBuffer = base64urlToArrayBuffer(publicKeyBase64url)
  if (publicBuffer.byteLength !== 65) {
    throw new Error('Clé publique VAPID invalide (65 octets attendus).')
  }
  const publicBytes = new Uint8Array(publicBuffer)
  const x = publicBytes.slice(1, 33)
  const y = publicBytes.slice(33, 65)
  const d = arrayBufferToBase64url(base64urlToArrayBuffer(privateKeyBase64url))

  return {
    publicKey: {
      kty: 'EC',
      crv: 'P-256',
      alg: 'ES256',
      x: arrayBufferToBase64url(x),
      y: arrayBufferToBase64url(y),
      key_ops: ['verify'],
      ext: true,
    },
    privateKey: {
      kty: 'EC',
      crv: 'P-256',
      alg: 'ES256',
      x: arrayBufferToBase64url(x),
      y: arrayBufferToBase64url(y),
      d,
      key_ops: ['sign'],
      ext: true,
    },
  }
}

export async function buildAppServer(): Promise<InstanceType<
  (typeof webpush)['ApplicationServer']
> | null> {
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const subject =
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:horizons@localhost.dev'
  if (!publicKey || !privateKey) return null
  const exported = convertVapidKeysToJWK(publicKey, privateKey)
  const vapidKeys = await webpush.importVapidKeys(exported, {
    extractable: false,
  })
  return await webpush.ApplicationServer.new({
    contactInformation: subject,
    vapidKeys,
  })
}