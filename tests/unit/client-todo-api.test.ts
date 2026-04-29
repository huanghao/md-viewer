import { afterEach, describe, expect, it, mock } from 'bun:test';
import {
  fetchTodos,
  apiCreateTodo,
  apiUpdateTodo,
  apiDeleteTodo,
} from '../../src/client/api/todos';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('fetchTodos', () => {
  it('fetches without filter when no argument given', async () => {
    let capturedUrl = '';
    globalThis.fetch = mock((input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return Promise.resolve(new Response(JSON.stringify({ todos: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }) as typeof fetch;

    await fetchTodos();
    expect(capturedUrl).toBe('/api/todos');
  });

  it('appends ?done=false when filtering open todos', async () => {
    let capturedUrl = '';
    globalThis.fetch = mock((input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return Promise.resolve(new Response(JSON.stringify({ todos: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }) as typeof fetch;

    await fetchTodos({ done: false });
    expect(capturedUrl).toBe('/api/todos?done=false');
  });

  it('appends ?done=true when filtering done todos', async () => {
    let capturedUrl = '';
    globalThis.fetch = mock((input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return Promise.resolve(new Response(JSON.stringify({ todos: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }) as typeof fetch;

    await fetchTodos({ done: true });
    expect(capturedUrl).toBe('/api/todos?done=true');
  });

  it('returns empty array on API error', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('error', { status: 500 }))
    ) as typeof fetch;

    const result = await fetchTodos();
    expect(result).toEqual([]);
  });

  it('returns todos array from response', async () => {
    const todo = { id: 't1', filePath: '/a.md', quote: 'q', note: '', done: false, createdAt: 1 };
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ todos: [todo] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    ) as typeof fetch;

    const result = await fetchTodos();
    expect(result).toEqual([todo]);
  });
});

describe('apiCreateTodo', () => {
  it('posts to /api/todos with correct payload', async () => {
    let capturedInput = '';
    let capturedBody: any;
    globalThis.fetch = mock((input: RequestInfo | URL, init?: RequestInit) => {
      capturedInput = String(input);
      capturedBody = JSON.parse(String(init?.body));
      return Promise.resolve(new Response(JSON.stringify({ todo: { id: 't1' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }) as typeof fetch;

    await apiCreateTodo({ filePath: '/a.md', quote: 'hello', note: 'world' });
    expect(capturedInput).toBe('/api/todos');
    expect(capturedBody).toEqual({ filePath: '/a.md', quote: 'hello', note: 'world' });
  });

  it('returns null on failure', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('{}', { status: 400 }))
    ) as typeof fetch;

    const result = await apiCreateTodo({ filePath: '/a.md', quote: 'x' });
    expect(result).toBeNull();
  });
});

describe('apiUpdateTodo', () => {
  it('posts to /api/todos/update with id and patch', async () => {
    let capturedBody: any;
    globalThis.fetch = mock((_input: RequestInfo | URL, init?: RequestInit) => {
      capturedBody = JSON.parse(String(init?.body));
      return Promise.resolve(new Response(JSON.stringify({ todo: { id: 't1', done: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }) as typeof fetch;

    await apiUpdateTodo('t1', { done: true });
    expect(capturedBody).toEqual({ id: 't1', done: true });
  });
});

describe('apiDeleteTodo', () => {
  it('posts to /api/todos/delete with id', async () => {
    let capturedBody: any;
    globalThis.fetch = mock((_input: RequestInfo | URL, init?: RequestInit) => {
      capturedBody = JSON.parse(String(init?.body));
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as typeof fetch;

    const result = await apiDeleteTodo('t1');
    expect(capturedBody).toEqual({ id: 't1' });
    expect(result).toBe(true);
  });

  it('returns false on failure', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('{}', { status: 404 }))
    ) as typeof fetch;

    const result = await apiDeleteTodo('nonexistent');
    expect(result).toBe(false);
  });
});
