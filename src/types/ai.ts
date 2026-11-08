export interface AiMessage {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export interface AiConversationSummary {
  _id: string;
  title: string;
  preview: string;
  messageCount: number;
  lastMessageAt?: string;
  createdAt?: string;
}

export interface AiConversation {
  _id: string;
  title: string;
  messages: AiMessage[];
  lastMessageAt?: string;
}

export interface AiUsageSnapshot {
  feature: string;
  periodKey: string;
  allowed: boolean;
  reason: string | null;
  limit: number | null;
  used: number;
  remaining: number | null;
}

export interface AiChatResponse {
  data: {
    conversationId: string;
    title: string;
    reply: string;
    messages: AiMessage[];
    usage?: AiUsageSnapshot;
  };
  message: string;
}

export interface AiAccessTrial {
  status: "available" | "active" | "expired";
  used: boolean;
  startedAt: string | null;
  expiresAt: string | null;
}

export interface AiFeatureAccess {
  feature: string;
  plan: "free" | "pro" | "super";
  hasAccess: boolean;
  source: "subscription" | "trial" | null;
  trial: AiAccessTrial;
}

export interface AiAccess {
  feature: "juvo_ai" | string;
  plan: "free" | "pro" | "super";
  hasAccess: boolean;
  source: "subscription" | "trial" | null;
  trial: AiAccessTrial;
  features?: Record<string, AiFeatureAccess>;
  usage?: Record<string, AiUsageSnapshot>;
}

export interface AiAccessResponse {
  data: AiAccess;
  message: string;
}
