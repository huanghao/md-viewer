import { useSyncExternalStore } from 'react';
import { agentStore, type AgentState } from './store';

/** 订阅 store 的一个切片；选择器返回引用不变的值时组件不重渲染。 */
export function useAgentState<T>(select: (s: AgentState) => T): T {
  return useSyncExternalStore(agentStore.subscribe, () => select(agentStore.getState()));
}
