// OpenAI-Embedding-Client.
// Schritt 9.7 / Kap. 5.5: text-embedding-3-small (1536 Dim).
//
// Erwartet Env-Var OPENAI_API_KEY (in Supabase via `supabase secrets set`).

const OPENAI_API_URL = "https://api.openai.com/v1/embeddings";
const EMBEDDING_MODEL = "text-embedding-3-small";

export interface EmbeddingResult {
  embedding: number[];
  tokens_used: number;
}

export async function generateEmbedding(
  input: string,
): Promise<EmbeddingResult> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set in environment");
  }

  if (!input || input.trim().length === 0) {
    throw new Error("Embedding input text is empty");
  }

  // OpenAI hat ein Token-Limit von 8191 fuer text-embedding-3-small.
  // Wir kuerzen defensiv auf ~6000 Zeichen (~1500 Tokens) — genug fuer alle
  // realistischen Coffee/Customer-Profile.
  const truncated = input.slice(0, 6000);

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: truncated,
      encoding_format: "float",
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `OpenAI API error ${response.status}: ${errText}`,
    );
  }

  const json = await response.json();
  const embedding: number[] = json.data?.[0]?.embedding;
  const tokens: number = json.usage?.total_tokens ?? 0;

  if (!Array.isArray(embedding) || embedding.length !== 1536) {
    throw new Error(
      `Unexpected embedding format: length=${embedding?.length}`,
    );
  }

  return { embedding, tokens_used: tokens };
}

// pgvector erwartet das Format '[0.1,0.2,...]' als Text-Literal.
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
