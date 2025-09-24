"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface TelehealthNotesPanelProps {
  recipientLabel?: string;
  placeholder?: string;
  onSubmit?: (message: string) => void;
}

export function TelehealthNotesPanel({
  recipientLabel = "Message to Medical Office Assistant",
  placeholder = "Message to Medical Office Assistant",
  onSubmit,
}: TelehealthNotesPanelProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;

    onSubmit?.(message.trim());
    setMessage("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{recipientLabel} *</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={placeholder}
            className="min-h-[140px] resize-none rounded-2xl border-gray-200 bg-slate-50 px-4 py-3 text-sm"
          />
          <Button type="submit" className="w-full sm:w-auto">
            Send Message
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
