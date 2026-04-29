import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { resetDbForTesting } from '../../src/annotation-storage';
import {
  createTodo, listTodos, updateTodo, deleteTodo, tidyTodos
} from '../../src/todo-storage';

let tempConfigHome = '';
let oldConfigHome: string | undefined;

beforeEach(() => {
  oldConfigHome = process.env.XDG_CONFIG_HOME;
  tempConfigHome = mkdtempSync(join(tmpdir(), 'mdv-todo-db-'));
  process.env.XDG_CONFIG_HOME = tempConfigHome;
  resetDbForTesting();
});

afterEach(() => {
  resetDbForTesting();
  if (oldConfigHome === undefined) {
    delete process.env.XDG_CONFIG_HOME;
  } else {
    process.env.XDG_CONFIG_HOME = oldConfigHome;
  }
  if (tempConfigHome) {
    rmSync(tempConfigHome, { recursive: true, force: true });
    tempConfigHome = '';
  }
});

describe('createTodo', () => {
  it('stores a todo and returns it with id', () => {
    const todo = createTodo({
      filePath: '/papers/a.md',
      quote: 'the convergence proof assumes...',
      quotePrefix: 'In section 3,',
      quoteSuffix: ', which is rarely verifiable.',
      note: '下一步查文献',
    });
    expect(todo.id).toBeTruthy();
    expect(todo.filePath).toBe('/papers/a.md');
    expect(todo.quote).toBe('the convergence proof assumes...');
    expect(todo.note).toBe('下一步查文献');
    expect(todo.done).toBe(false);
    expect(todo.createdAt).toBeGreaterThan(0);
  });

  it('stores a todo without note', () => {
    const todo = createTodo({ filePath: '/a.md', quote: 'some text' });
    expect(todo.note).toBe('');
    expect(todo.done).toBe(false);
  });
});

describe('listTodos', () => {
  it('returns todos ordered by createdAt desc', () => {
    createTodo({ filePath: '/a.md', quote: 'first' });
    createTodo({ filePath: '/b.md', quote: 'second' });
    const todos = listTodos();
    expect(todos.length).toBe(2);
    expect(todos[0].quote).toBe('second');
  });

  it('filters by done=false', () => {
    const t = createTodo({ filePath: '/a.md', quote: 'x' });
    updateTodo(t.id, { done: true });
    const open = listTodos({ done: false });
    expect(open.length).toBe(0);
  });

  it('filters by done=true', () => {
    const t = createTodo({ filePath: '/a.md', quote: 'x' });
    updateTodo(t.id, { done: true });
    const done = listTodos({ done: true });
    expect(done.length).toBe(1);
  });
});

describe('updateTodo', () => {
  it('marks done and sets doneAt', () => {
    const t = createTodo({ filePath: '/a.md', quote: 'x' });
    const updated = updateTodo(t.id, { done: true });
    expect(updated?.done).toBe(true);
    expect(updated?.doneAt).toBeGreaterThan(0);
  });

  it('unmarks done and clears doneAt', () => {
    const t = createTodo({ filePath: '/a.md', quote: 'x' });
    updateTodo(t.id, { done: true });
    const updated = updateTodo(t.id, { done: false });
    expect(updated?.done).toBe(false);
    expect(updated?.doneAt).toBeUndefined();
  });

  it('updates note', () => {
    const t = createTodo({ filePath: '/a.md', quote: 'x' });
    const updated = updateTodo(t.id, { note: 'new note' });
    expect(updated?.note).toBe('new note');
  });

  it('returns null for unknown id', () => {
    expect(updateTodo('nonexistent', { done: true })).toBeNull();
  });
});

describe('deleteTodo', () => {
  it('removes the todo', () => {
    const t = createTodo({ filePath: '/a.md', quote: 'x' });
    deleteTodo(t.id);
    expect(listTodos().length).toBe(0);
  });
});

describe('tidyTodos', () => {
  it('deletes done todos older than 0 days', () => {
    const t = createTodo({ filePath: '/a.md', quote: 'x' });
    updateTodo(t.id, { done: true });
    const result = tidyTodos({ olderThanDays: 0 });
    expect(result.deleted).toBe(1);
    expect(listTodos({ done: true }).length).toBe(0);
  });

  it('does not delete undone todos', () => {
    createTodo({ filePath: '/a.md', quote: 'x' });
    const result = tidyTodos({ olderThanDays: 0 });
    expect(result.deleted).toBe(0);
  });

  it('does not delete done todos within the threshold', () => {
    const t = createTodo({ filePath: '/a.md', quote: 'x' });
    updateTodo(t.id, { done: true });
    const result = tidyTodos({ olderThanDays: 30 });
    expect(result.deleted).toBe(0);
  });

  it('deletes todos whose file is missing when missingFiles=true', () => {
    createTodo({ filePath: '/nonexistent/does-not-exist-xyz.md', quote: 'x' });
    const result = tidyTodos({ missingFiles: true });
    expect(result.deleted).toBe(1);
  });

  it('does not delete existing file todos when missingFiles=true', () => {
    createTodo({ filePath: '/tmp', quote: 'x' }); // /tmp always exists
    const result = tidyTodos({ missingFiles: true });
    expect(result.deleted).toBe(0);
  });
});
