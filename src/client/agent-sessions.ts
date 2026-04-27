export const activeAgentSessions = new Map<string, {
  sessionId: string;
  messages: number;
  model: string;
  streaming: boolean;
}>();
