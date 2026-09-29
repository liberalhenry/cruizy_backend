import type { FastifyRequest } from 'fastify';
import { z, type ZodTypeAny } from 'zod';
import { blindIndex } from './crypto.js';

/** Prüfwert der Netzadresse — die Adresse selbst wird nie gespeichert. */
export function ipKey(req: FastifyRequest): string {
  return blindIndex('ip', req.ip ?? 'unbekannt').toString('hex').slice(0, 32);
}

export function body<T extends ZodTypeAny>(req: FastifyRequest, schema: T): z.infer<T> {
  return schema.parse(req.body ?? {});
}

export function query<T extends ZodTypeAny>(req: FastifyRequest, schema: T): z.infer<T> {
  return schema.parse(req.query ?? {});
}

export function params<T extends ZodTypeAny>(req: FastifyRequest, schema: T): z.infer<T> {
  return schema.parse(req.params ?? {});
}

export const uuid = z.string().uuid();
export const idParam = z.object({ id: uuid });
