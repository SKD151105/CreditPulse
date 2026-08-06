import crypto from 'crypto';

export const signPayload = (payload: string, secret: string): string => {
  const hmacHex = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `sha256=${hmacHex}`;
};

export const verifySignature = (payload: string, secret: string, signature: string): boolean => {
  const expectedSignature = signPayload(payload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
};
