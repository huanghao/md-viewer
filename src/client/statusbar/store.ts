export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'failed';

export interface StatusbarState {
  charCount: number;
  createdAt?: number;
  gitCreatedAt?: number;
  connection: ConnectionStatus;
}

let state: StatusbarState = { charCount: 0, connection: 'connecting' };
const listeners = new Set<() => void>();

function set(patch: Partial<StatusbarState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const statusbarStore = {
  getState: (): StatusbarState => state,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setFile(charCount: number, createdAt?: number, gitCreatedAt?: number): void {
    set({ charCount, createdAt, gitCreatedAt });
  },
  setConnection(connection: ConnectionStatus): void {
    set({ connection });
  },
};
