const BASE = import.meta.env.VITE_FUNCTIONS_URL ?? "https://us-central1-agenticsorg.cloudfunctions.net";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

export interface InterestPayload {
  email: string;
  name?: string;
  source?: string;
}

export interface RegisterPayload {
  tier: "solo" | "buddy" | "family" | "meals" | "sponsor";
  email: string;
  name: string;
  phone?: string;
  partner?: string;
  additionalPersons?: number;
  dietaryReqs?: string;
  emergencyContact?: string;
}

export const submitInterest = (data: InterestPayload) =>
  post<{ ok: boolean }>("/retreatInterest", data);

export const createRegistrationSession = (data: RegisterPayload) =>
  post<{ url: string }>("/retreatCreateCheckoutSession", data);

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export const contactRetreat = (data: ContactPayload) =>
  post<{ ok: boolean }>("/retreatContact", data);
