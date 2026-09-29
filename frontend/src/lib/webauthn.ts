/** Gerätegebundener Schlüssel für Stufe 2 (FV-87) — ohne Fremdbibliothek. */
const b64u = {
  toBuf(s: string): ArrayBuffer {
    const pad = '='.repeat((4 - (s.length % 4)) % 4);
    const bin = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0)).buffer;
  },
  fromBuf(b: ArrayBuffer): string {
    let s = '';
    for (const x of new Uint8Array(b)) s += String.fromCharCode(x);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
};

export function webauthnSupported() {
  return !!window.PublicKeyCredential && !!navigator.credentials;
}

export async function register(options: any) {
  const pk: PublicKeyCredentialCreationOptions = {
    ...options,
    challenge: b64u.toBuf(options.challenge),
    user: { ...options.user, id: b64u.toBuf(options.user.id) },
    excludeCredentials: (options.excludeCredentials ?? []).map((c: any) => ({ ...c, id: b64u.toBuf(c.id) })),
  };
  const cred = (await navigator.credentials.create({ publicKey: pk })) as PublicKeyCredential;
  const r = cred.response as AuthenticatorAttestationResponse;
  return {
    id: cred.id,
    rawId: b64u.fromBuf(cred.rawId),
    type: cred.type,
    response: {
      clientDataJSON: b64u.fromBuf(r.clientDataJSON),
      attestationObject: b64u.fromBuf(r.attestationObject),
      transports: r.getTransports?.() ?? [],
    },
    clientExtensionResults: cred.getClientExtensionResults(),
    authenticatorAttachment: cred.authenticatorAttachment ?? undefined,
  };
}

export async function authenticate(options: any) {
  const pk: PublicKeyCredentialRequestOptions = {
    ...options,
    challenge: b64u.toBuf(options.challenge),
    allowCredentials: (options.allowCredentials ?? []).map((c: any) => ({ ...c, id: b64u.toBuf(c.id) })),
  };
  const cred = (await navigator.credentials.get({ publicKey: pk })) as PublicKeyCredential;
  const r = cred.response as AuthenticatorAssertionResponse;
  return {
    id: cred.id,
    rawId: b64u.fromBuf(cred.rawId),
    type: cred.type,
    response: {
      clientDataJSON: b64u.fromBuf(r.clientDataJSON),
      authenticatorData: b64u.fromBuf(r.authenticatorData),
      signature: b64u.fromBuf(r.signature),
      userHandle: r.userHandle ? b64u.fromBuf(r.userHandle) : undefined,
    },
    clientExtensionResults: cred.getClientExtensionResults(),
    authenticatorAttachment: cred.authenticatorAttachment ?? undefined,
  };
}
