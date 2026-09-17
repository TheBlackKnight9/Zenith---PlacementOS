"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground">
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          title="Toggle theme (Press 'D')"
          className="h-9 w-9 p-0 rounded-lg border-border text-foreground hover:bg-accent relative"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400" />
          <span className="sr-only">Toggle theme (Press D)</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center justify-between cursor-pointer text-xs font-medium"
        >
          <div className="flex items-center gap-2">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>Light</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center justify-between cursor-pointer text-xs font-medium"
        >
          <div className="flex items-center gap-2">
            <Moon className="h-3.5 w-3.5 text-indigo-400" />
            <span>Dark</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center justify-between cursor-pointer text-xs font-medium"
        >
          <div className="flex items-center gap-2">
            <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
            <span>System</span>
          </div>
        </DropdownMenuItem>
        <div className="border-t border-border px-2 py-1.5 mt-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Toggle theme</span>
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono font-semibold">
              D
            </kbd>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
