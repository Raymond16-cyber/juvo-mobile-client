import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  chatWithJuvoService,
  getAiAccessService,
  getConversationService,
  hasAiFeature,
  listConversationsService,
  startAiTrialService,
} from "@/api/ai";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Screen,
  TextField,
} from "@/components/ui";
import { getApiErrorMessage } from "@/lib/errors";
import { useLayout } from "@/lib/layout";
import type {
  AiAccess,
  AiConversationSummary,
  AiMessage,
} from "@/types/ai";
import { radius, spacing, typography, useAppTheme } from "@/theme";

export default function AiScreen() {
  const { colors } = useAppTheme();
  const { gutter } = useLayout();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<AiMessage>>(null);

  const [bootLoading, setBootLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<AiAccess | null>(null);
  const [conversations, setConversations] = useState<AiConversationSummary[]>(
    [],
  );
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");

  const refreshConversations = useCallback(async () => {
    const convos = await listConversationsService();
    setConversations(convos.data || []);
    return convos.data || [];
  }, []);

  const loadAccess = useCallback(async () => {
    setBootLoading(true);
    setError(null);
    try {
      const accessRes = await getAiAccessService();
      setAccess(accessRes.data);

      if (hasAiFeature(accessRes.data, "juvo_ai")) {
        const list = await refreshConversations();
        const latest = list[0];
        if (latest?._id) {
          setConversationId(latest._id);
          const detail = await getConversationService(latest._id);
          setMessages(detail.data.messages || []);
        }
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load AI."));
    } finally {
      setBootLoading(false);
    }
  }, [refreshConversations]);

  useFocusEffect(
    useCallback(() => {
      void loadAccess();
    }, [loadAccess]),
  );

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  const onStartTrial = async () => {
    setSending(true);
    try {
      const res = await startAiTrialService();
      setAccess(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not start AI trial."));
    } finally {
      setSending(false);
    }
  };

  const onSelectConversation = async (id: string) => {
    setError(null);
    setConversationId(id);
    try {
      const detail = await getConversationService(id);
      setMessages(detail.data.messages || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not open conversation."));
    }
  };

  const onNewChat = () => {
    setConversationId(undefined);
    setMessages([]);
    setInput("");
    setError(null);
  };

  const onSend = async () => {
    const message = input.trim();
    if (!message || sending) return;
    setInput("");
    setSending(true);
    setError(null);
    const optimistic: AiMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await chatWithJuvoService({
        message,
        conversationId,
      });
      setConversationId(res.data.conversationId);
      setMessages(res.data.messages || []);
      void refreshConversations().catch(() => undefined);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to send message."));
      setMessages((prev) => prev.slice(0, -1));
      setInput(message);
    } finally {
      setSending(false);
    }
  };

  if (bootLoading) {
    return (
      <Screen>
        <LoadingState label="Loading JUVO AI…" />
      </Screen>
    );
  }

  if (error && !access) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={() => void loadAccess()} />
      </Screen>
    );
  }

  const allowed = hasAiFeature(access, "juvo_ai");

  if (!allowed) {
    return (
      <Screen scroll>
        <PageHeader
          eyebrow="AI"
          title="JUVO AI"
          description="Ask about your journal, risk, or discipline."
        />
        <EmptyState
          icon="sparkles-outline"
          title="AI access required"
          description={
            access?.trial?.status === "available"
              ? "Start a free trial to chat with JUVO about your journal."
              : "Upgrade or start a trial to unlock JUVO AI on mobile."
          }
          actionLabel={
            access?.trial?.status === "available" ? "Start free trial" : undefined
          }
          onAction={
            access?.trial?.status === "available" ? onStartTrial : undefined
          }
        />
        {sending ? <LoadingState label="Starting trial…" /> : null}
      </Screen>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.fill, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={[styles.header, { paddingHorizontal: gutter }]}>
          <PageHeader
            eyebrow="AI"
            title="JUVO AI"
            description="Ask about your journal, risk, or discipline."
            action={
              <Button
                title="New"
                variant="ghost"
                fullWidth={false}
                size="sm"
                onPress={onNewChat}
              />
            }
          />
        </View>

        <View style={styles.convoBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.convoList,
              { paddingHorizontal: gutter },
            ]}
          >
            <Pressable
              onPress={onNewChat}
              style={({ pressed }) => [
                styles.convoChip,
                {
                  backgroundColor: !conversationId
                    ? colors.primarySoft
                    : colors.surfaceElevated,
                  borderColor: !conversationId ? colors.primary : colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: !conversationId ? colors.primary : colors.textSecondary,
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                New chat
              </Text>
            </Pressable>
            {conversations.map((item) => {
              const selected = item._id === conversationId;
              return (
                <Pressable
                  key={item._id}
                  onPress={() => void onSelectConversation(item._id)}
                  style={({ pressed }) => [
                    styles.convoChip,
                    {
                      backgroundColor: selected
                        ? colors.primarySoft
                        : colors.surfaceElevated,
                      borderColor: selected ? colors.primary : colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: selected ? colors.primary : colors.textSecondary,
                      fontWeight: "600",
                      fontSize: 13,
                      maxWidth: 140,
                    }}
                  >
                    {item.title || "Conversation"}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {error ? (
          <Text
            style={[
              styles.error,
              { color: colors.danger, paddingHorizontal: gutter },
            ]}
          >
            {error}
          </Text>
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, index) => String(index)}
          contentContainerStyle={[
            styles.list,
            { paddingHorizontal: gutter },
          ]}
          ListEmptyComponent={
            <EmptyState
              title="Start a conversation"
              description="Ask JUVO anything about your trading day."
              icon="chatbubble-ellipses-outline"
            />
          }
          renderItem={({ item }) => {
            const mine = item.role === "user";
            return (
              <View
                style={[
                  styles.bubble,
                  mine ? styles.bubbleMine : styles.bubbleTheirs,
                  {
                    alignSelf: mine ? "flex-end" : "flex-start",
                    backgroundColor: mine
                      ? colors.primary
                      : colors.surfaceElevated,
                    borderColor: mine ? colors.primary : colors.border,
                  },
                ]}
              >
                {!mine ? (
                  <Text
                    style={[styles.bubbleRole, { color: colors.primary }]}
                  >
                    JUVO
                  </Text>
                ) : null}
                <Text
                  style={{
                    color: mine ? "#fff" : colors.text,
                    lineHeight: 22,
                  }}
                >
                  {item.content}
                </Text>
              </View>
            );
          }}
        />

        <View
          style={[
            styles.composer,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.background,
              paddingHorizontal: gutter,
              paddingBottom: Math.max(insets.bottom, spacing.sm) + spacing.sm,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <TextField
              value={input}
              onChangeText={setInput}
              placeholder="Message JUVO…"
              editable={!sending}
              onSubmitEditing={onSend}
              returnKeyType="send"
            />
          </View>
          <Button
            title="Send"
            onPress={onSend}
            loading={sending}
            fullWidth={false}
            style={styles.send}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    paddingTop: spacing.md,
  },
  convoBar: {
    paddingBottom: spacing.sm,
  },
  convoList: {
    gap: spacing.sm,
    alignItems: "center",
  },
  convoChip: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    marginBottom: spacing.sm,
  },
  list: {
    paddingBottom: spacing.lg,
    flexGrow: 1,
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: "86%",
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  bubbleMine: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.sm,
  },
  bubbleTheirs: {
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  bubbleRole: {
    ...typography.label,
    marginBottom: 4,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  send: {
    minWidth: 84,
  },
});
