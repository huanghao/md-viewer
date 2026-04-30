export interface RagResult {
  path: string;
  heading: string | null;
  text: string;
  score: number;
  charStart: number;
}

export interface RagSearchResponse {
  results: RagResult[];
  queryTime?: number;
  error?: string;
}

export async function ragSearch(query: string, limit = 10): Promise<RagSearchResponse> {
  try {
    const resp = await fetch(`/api/rag-search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return resp.json();
  } catch {
    return { results: [], error: "network_error" };
  }
}
