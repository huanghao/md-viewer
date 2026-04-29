export interface ClientTodo {
  id: string;
  filePath: string;
  quote: string;
  quotePrefix?: string;
  quoteSuffix?: string;
  note: string;
  done: boolean;
  createdAt: number;
  doneAt?: number;
}

export async function fetchTodos(filter?: { done?: boolean }): Promise<ClientTodo[]> {
  const params = filter?.done !== undefined ? `?done=${filter.done}` : '';
  const r = await fetch(`/api/todos${params}`);
  if (!r.ok) return [];
  const j = await r.json();
  return j.todos ?? [];
}

export async function apiCreateTodo(input: {
  filePath: string;
  quote: string;
  quotePrefix?: string;
  quoteSuffix?: string;
  note?: string;
}): Promise<ClientTodo | null> {
  const r = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.todo ?? null;
}

export async function apiUpdateTodo(
  id: string,
  patch: { done?: boolean; note?: string }
): Promise<ClientTodo | null> {
  const r = await fetch('/api/todos/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...patch }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.todo ?? null;
}

export async function apiDeleteTodo(id: string): Promise<boolean> {
  const r = await fetch('/api/todos/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  return r.ok;
}
