"use client";

import { Bot, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  useEffect(() => {
    setMessages((items) =>
      items.length === 1 && items[0].role === "assistant" ? [{ role: "assistant", text: t("assistant.initial") }] : items
    );
  }, [t]);

  const submit = async () => {
    if (!message.trim()) return;

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
      setMessages((items) => [
        ...items,
        { role: "assistant", text: t("assistant.error") }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-4 right-4 z-40 h-12 w-12 rounded-full shadow-glow"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={t("assistant.open")}
      >
        <Bot className="h-5 w-5" />
      </Button>

      {open && (
        <section className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-lg border border-border bg-card shadow-glass">
          <header className="flex items-center justify-between border-b border-border p-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold">{t("assistant.title")}</p>
                <p className="text-xs text-muted-foreground">{t("assistant.subtitle")}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label={t("assistant.close")}>
              <X className="h-4 w-4" />
            </Button>
          </header>

          <div className="max-h-80 space-y-3 overflow-y-auto p-3">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={
                  item.role === "user"
                    ? "ml-auto max-w-[86%] rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "max-w-[88%] rounded-md bg-muted px-3 py-2 text-sm"
                }
              >
                {item.text}
              </div>
            ))}
            {loading && <div className="max-w-[80%] rounded-md bg-muted px-3 py-2 text-sm">{t("common.thinking")}</div>}
          </div>

          <div className="flex gap-2 border-t border-border p-3">
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
              placeholder={t("assistant.placeholder")}
            />
            <Button size="icon" onClick={submit} aria-label={t("assistant.send")}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
