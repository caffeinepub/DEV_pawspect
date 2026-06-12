import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Message } from "../backend.d";
import { useAddMessage, useMessages } from "../hooks/useQueries";

interface MessageThreadProps {
  bookingId: bigint;
  senderName: string;
}

function formatTime(ts: bigint): string {
  return new Date(Number(ts / 1000000n)).toLocaleString();
}

export default function MessageThread({
  bookingId,
  senderName,
}: MessageThreadProps) {
  const { data: messages = [] } = useMessages(bookingId);
  const addMessage = useAddMessage();
  const [content, setContent] = useState("");
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom after each render when there are new messages
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }); // no deps — runs after every render, intentional for scroll-to-bottom

  const handleSend = () => {
    if (!content.trim()) return;
    addMessage.mutate(
      { bookingId, senderName, content: content.trim() },
      { onSuccess: () => setContent("") },
    );
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Message list */}
      <div
        className="w-full max-h-[60dvh] sm:max-h-[500px] overflow-y-auto space-y-2 p-3 bg-muted/40 rounded-xl"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No messages yet. Start the conversation!
          </p>
        )}
        {(messages as Message[]).map((msg, idx) => (
          <div
            key={`${msg.timestamp}-${msg.senderName}-${idx}`}
            className={`flex ${msg.senderName === senderName ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-3 shadow-xs break-words ${
                msg.senderName === senderName
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-card text-foreground"
              }`}
              style={{ wordBreak: "break-word" }}
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`text-xs font-semibold truncate max-w-[120px] ${
                    msg.senderName === senderName
                      ? "text-primary-foreground/80"
                      : "text-primary"
                  }`}
                >
                  {msg.senderName}
                </span>
                <span
                  className={`text-xs shrink-0 ${
                    msg.senderName === senderName
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={scrollEndRef} />
      </div>

      {/* Input area — flex row, send button always visible */}
      <div className="flex items-end gap-2 w-full">
        <Textarea
          data-ocid="message.textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 min-w-0 resize-none text-base min-h-[44px] max-h-[120px]"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) handleSend();
          }}
        />
        <Button
          data-ocid="message.submit_button"
          onClick={handleSend}
          disabled={addMessage.isPending || !content.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 w-12 h-12 rounded-xl"
          size="icon"
          aria-label="Send message"
        >
          <Send size={18} />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">⌘+Enter to send quickly</p>
    </div>
  );
}
