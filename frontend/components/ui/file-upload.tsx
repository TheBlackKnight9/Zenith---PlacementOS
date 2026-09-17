"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, X, CheckCircle2, AlertCircle, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface UploadedFileItem {
  file?: File;
  fileName: string;
  fileSize: string;
  fileData?: string; // base64 data URL
  fileUrl?: string; // existing server URL if editing
}

interface FileUploadProps {
  accept?: string;
  maxSizeMb?: number;
  value?: UploadedFileItem | null;
  onChange: (file: UploadedFileItem | null) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
}

export function FileUpload({
  accept = ".pdf,application/pdf",
  maxSizeMb = 25,
  value,
  onChange,
  disabled = false,
  className,
  label = "Upload PDF Document",
  description = "Drag & drop your question bank or study material PDF here, or browse files (Max 25MB)",
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleFile = (file: File) => {
    setError(null);

    // Validate type
    if (accept && !file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF document (.pdf).");
      return;
    }

    // Validate size
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File size exceeds maximum permitted limit of ${maxSizeMb}MB.`);
      return;
    }

    const fileSizeStr = formatFileSize(file.size);

    // Read base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      onChange({
        file,
        fileName: file.name,
        fileSize: fileSizeStr,
        fileData: base64Data,
      });
    };
    reader.onerror = () => {
      setError("Failed to read file from disk.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputRef.current) inputRef.current.value = "";
    setError(null);
    onChange(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      {/* When a file is already selected / uploaded */}
      {value ? (
        <div className="relative rounded-xl border border-primary/30 bg-primary/5 p-4 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {value.fileName}
                  </p>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] h-4 px-1 gap-0.5">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Attached
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  PDF Document &bull; {value.fileSize || "Ready to publish"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="h-7 text-xs px-2"
              >
                Change PDF
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Drag & Drop Zone */
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer select-none",
            isDragOver
              ? "border-primary bg-primary/10 shadow-xs"
              : "border-border hover:border-primary/50 hover:bg-muted/30 bg-card",
            disabled && "opacity-60 cursor-not-allowed"
          )}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-105 transition-transform mb-3">
            <UploadCloud className="h-6 w-6" />
          </div>

          <p className="text-xs font-semibold text-foreground">
            {label}
          </p>
          <p className="text-[11px] text-muted-foreground max-w-sm mt-1">
            {description}
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="mt-3 h-7 text-xs gap-1.5 pointer-events-none"
          >
            <FileUp className="h-3.5 w-3.5 text-primary" />
            Browse PDF File
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive pt-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
