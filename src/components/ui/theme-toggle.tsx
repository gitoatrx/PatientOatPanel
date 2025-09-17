"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex gap-1">
        <Button variant="outline" size="sm" className="w-9 px-0">
          <Sun className="h-4 w-4" />
          <span className="sr-only">Loading theme</span>
        </Button>
        <Button variant="outline" size="sm" className="w-9 px-0">
          <Moon className="h-4 w-4" />
          <span className="sr-only">Loading theme</span>
        </Button>
        <Button variant="outline" size="sm" className="w-9 px-0">
          <Monitor className="h-4 w-4" />
          <span className="sr-only">Loading theme</span>
        </Button>
      </div>
    );
  }

  const themeOptions = [
    {
      value: "light",
      icon: <Sun className="h-4 w-4" />,
      label: "Light mode",
      title: "Switch to light mode",
    },
    {
      value: "dark",
      icon: <Moon className="h-4 w-4" />,
      label: "Dark mode",
      title: "Switch to dark mode",
    },
    {
      value: "system",
      icon: <Monitor className="h-4 w-4" />,
      label: "System theme",
      title: "Switch to system theme",
    },
  ];

  return (
    <div className="flex gap-1">
      {themeOptions.map((option) => (
        <Button
          key={option.value}
          variant={theme === option.value ? "default" : "outline"}
          size="sm"
          className="w-9 px-0 cursor-pointer"
          onClick={() => setTheme(option.value)}
          title={option.title}
        >
          {option.icon}
          <span className="sr-only">{option.label}</span>
        </Button>
      ))}
    </div>
  );
}
