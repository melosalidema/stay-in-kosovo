"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useAppStore } from "@/store/app-store";

type Message = {
  role: "user" | "assistant";
  text: string;
};

export function ChatAssistant() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: t("assistant.initial")
    }
  ]);
  const [loading, setLoading] = useState(false);
  const selectedVibe = useAppStore((state) => state.selectedVibe);
  const panelRef = useRef<HTMLElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((items) =>
      items.length === 1 && items[0].role === "assistant" ? [{ role: "assistant", text: t("assistant.initial") }] : items
    );
  }, [t]);

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (open && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [open, messages, loading]);

  const submit = async () => {
    if (!message.trim() || loading) return;

    const userText = message.trim();
    setMessages((items) => [...items, { role: "user", text: userText }]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          context: {
            vibes: [selectedVibe],
            city: "Prishtina",
            budget: 3,
            transportPreference: "WALKING"
          }
        })
      });
      const payload = await response.json();
      setMessages((items) => [...items, { role: "assistant", text: payload.data.answer }]);
    } catch {
      setMessages((items) => [...items, { role: "assistant", text: t("assistant.error") }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full shadow-lift sm:bottom-5"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={t("assistant.open")}
        aria-expanded={open}
        aria-controls="chat-assistant-panel"
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.section
            ref={panelRef}
            id="chat-assistant-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t("assistant.title")}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-36 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-overlay sm:bottom-20"
          >
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p className="font-serif text-base leading-tight">{t("assistant.title")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("assistant.subtitle")}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label={t("assistant.close")}>
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </header>

            <div
              ref={messagesRef}
              className="max-h-80 space-y-3 overflow-y-auto px-4 py-4"
              aria-live="polite"
              aria-atomic="false"
            >
              {messages.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={
                    item.role === "user"
                      ? "ml-auto max-w-[86%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm text-primary-foreground"
                      : "max-w-[88%] rounded-2xl rounded-bl-md bg-secondary px-3.5 py-2.5 text-sm leading-6"
                  }
                >
                  {item.text}
                </div>
              ))}
              {loading && (
                <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-secondary px-3.5 py-2.5 text-sm text-muted-foreground">
                  {t("common.thinking")}
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-border px-4 py-3">
              <Input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submit();
                  }
                }}
                placeholder={t("assistant.placeholder")}
                aria-label={t("assistant.placeholder")}
              />
              <Button size="icon" onClick={submit} aria-label={t("assistant.send")} disabled={loading}>
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
