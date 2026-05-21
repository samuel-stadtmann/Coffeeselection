import crypto from "crypto";

/**
 * Magic-Link-Token fuer Bewertungs-Email-1-Klick-Sterne.
 *
 * Hintergrund:
 *   Customer klickt Stern in Mail → soll DIREKT bewerten koennen, ohne
 *   sich erst einloggen zu muessen. Vor allem Gast-Customers (kein
 *   Passwort) waeren sonst aus dem Bewertungs-Flow ausgeschlossen.
 *
 * Sicherheit:
 *   - Token enthaelt customer_id + order_id + coffee_id + Ablauf (exp)
 *   - Signiert mit HMAC-SHA256 unter Verwendung von CRON_SECRET (existierende
 *     Server-Side-Secret, niemals an Customer ausgeliefert)
 *   - URL-safe base64-encoded ("Magic Link"-Format)
 *   - Ablauf nach 14 Tagen (laenger waere unschoen falls Mail in
 *     Datenleck landet)
 *
 * Token-Format:
 *   <base64url(payload-json)>.<base64url(hmac-sha256)>
 *
 * Verwendung:
 *   - createRatingToken(): in cron/rating-reminders-Endpoint vor Mail-Versand
 *   - verifyRatingToken(): in /api/rate/via-token-Endpoint
 */

type TokenPayload = {
  cid: string; // customer_id (uuid)
  oid: string; // order_id (uuid)
  fid: string; // coffee_id (uuid, 'fid' weil flavor/coffee)
  exp: number; // unix sec
};

export type RatingTokenContent = {
  customer_id: string;
  order_id: string;
  coffee_id: string;
  expires_at: Date;
};

const DEFAULT_VALIDITY_DAYS = 14;

function getSecret(): string {
  const s = process.env.CRON_SECRET?.trim();
  if (!s) {
    throw new Error(
      "CRON_SECRET ist nicht gesetzt — Rating-Magic-Links koennen nicht " +
        "signiert/verifiziert werden. Setze die Var in der Hosting-Plattform."
    );
  }
  return s;
}

function base64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(s: string): Buffer {
  // Padding-Restore
  const padded = s + "=".repeat((4 - (s.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function sign(payloadB64: string): string {
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(payloadB64);
  return base64urlEncode(hmac.digest());
}

/**
 * Token erzeugen — gibt die Long-String fuer den URL-Param zurueck.
 */
export function createRatingToken(args: {
  customer_id: string;
  order_id: string;
  coffee_id: string;
  validityDays?: number;
}): string {
  const expSec =
    Math.floor(Date.now() / 1000) +
    (args.validityDays ?? DEFAULT_VALIDITY_DAYS) * 24 * 60 * 60;
  const payload: TokenPayload = {
    cid: args.customer_id,
    oid: args.order_id,
    fid: args.coffee_id,
    exp: expSec,
  };
  const payloadB64 = base64urlEncode(Buffer.from(JSON.stringify(payload)));
  const sigB64 = sign(payloadB64);
  return `${payloadB64}.${sigB64}`;
}

/**
 * Token verifizieren — gibt den Inhalt zurueck oder null bei
 * Invalid/Expired/Tampered.
 */
export function verifyRatingToken(token: string): RatingTokenContent | null {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [payloadB64, sigB64] = token.split(".", 2);
  if (!payloadB64 || !sigB64) return null;

  // Signature pruefen (timing-safe)
  const expectedSig = sign(payloadB64);
  if (expectedSig.length !== sigB64.length) return null;
  if (
    !crypto.timingSafeEqual(
      Buffer.from(expectedSig),
      Buffer.from(sigB64)
    )
  ) {
    return null;
  }

  // Payload parsen
  let payload: TokenPayload;
  try {
    payload = JSON.parse(base64urlDecode(payloadB64).toString("utf8"));
  } catch {
    return null;
  }
  if (
    typeof payload?.cid !== "string" ||
    typeof payload?.oid !== "string" ||
    typeof payload?.fid !== "string" ||
    typeof payload?.exp !== "number"
  ) {
    return null;
  }

  // Ablauf pruefen
  if (Date.now() / 1000 > payload.exp) return null;

  return {
    customer_id: payload.cid,
    order_id: payload.oid,
    coffee_id: payload.fid,
    expires_at: new Date(payload.exp * 1000),
  };
}
