import { createStore } from '../utils/create-store';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'failed';

export interface StatusbarState {
  charCount: number;
  createdAt?: number;
  gitCreatedAt?: number;
  connection: ConnectionStatus;
}

const store = createStore<StatusbarState>({ charCount: 0, connection: 'connecting' });

export const statusbarStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  setFile(charCount: number, createdAt?: number, gitCreatedAt?: number): void {
    store.merge({ charCount, createdAt, gitCreatedAt });
  },
  setConnection(connection: ConnectionStatus): void {
    store.merge({ connection });
  },
};
