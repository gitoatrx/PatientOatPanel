"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface PasswordGeneratorProps {
  onPasswordGenerated: (password: string) => void;
  className?: string;
}

export function PasswordGenerator({
  onPasswordGenerated,
  className,
}: PasswordGeneratorProps) {
  const [generatedPassword, setGeneratedPassword] = useState("");
  const { toast } = useToast();

  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    let password = "";

    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest with random characters
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setGeneratedPassword(password);
    onPasswordGenerated(password);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      toast({
        title: "Password copied",
        description: "Password has been copied to clipboard",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy password to clipboard",
        variant: "error",
      });
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generatePassword}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Generate Password
        </Button>
      </div>

      {generatedPassword && (
        <div className="flex items-center gap-2">
          <Input
            value={generatedPassword}
            readOnly
            className="font-mono text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
        </div>
      )}
    </div>
  );
}
