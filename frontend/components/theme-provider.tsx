"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

function ThemeKeyboardShortcut() {
  const { setTheme, resolvedTheme } = useTheme();

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept if modifier keys like Ctrl, Cmd, or Alt are pressed
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      // Check if the pressed key is 'd' or 'D'
      if (event.key.toLowerCase() !== "d") {
        return;
      }

      // Do NOT trigger if the user is actively typing in an input, textarea, select, or editable element
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          tagName === "SELECT" ||
          target.isContentEditable ||
          Boolean(target.closest?.("[contenteditable='true']"))
        ) {
          return;
        }
      }

      // Toggle between light and dark
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setTheme, resolvedTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeKeyboardShortcut />
      {children}
    </NextThemesProvider>
  );
}
