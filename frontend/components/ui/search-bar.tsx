import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  shortcut?: string;
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, value, onChange, onClear, placeholder = "Search students, drives, skills...", shortcut, ...props }, ref) => {
    return (
      <div className={cn("relative flex items-center w-full max-w-md", className)}>
        <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          ref={ref}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full h-9 pl-9 pr-9 text-xs bg-background border border-input rounded-lg shadow-xs placeholder:text-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          {...props}
        />
        {value ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        ) : shortcut ? (
          <kbd className="absolute right-2.5 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            {shortcut}
          </kbd>
        ) : null}
      </div>
    );
  }
);
SearchBar.displayName = "SearchBar";

export { SearchBar };
