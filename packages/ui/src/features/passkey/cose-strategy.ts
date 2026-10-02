import { encodeCoseEC2PublicKey } from "@/core/cbor-utils.ts";

export const es256CoseStrategy = {
  alg: -7,
  name: "ES256",
  keyType: "ECDSA",
  curveName: "P-256",
  webCryptoAlg: { name: "ECDSA", namedCurve: "P-256" as const },
  encodePublicKey: encodeCoseEC2PublicKey,
};

export type CoseAlgorithmStrategy = typeof es256CoseStrategy;

export function getCoseAlgorithmStrategy(_alg?: number): CoseAlgorithmStrategy {
  return es256CoseStrategy;
}
