"use client";

import { useCallback, useRef, useState } from "react";
import { X, Upload, Check, AlertCircle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  name: string;
  accept?: string;
  onFiles: (files: FileList | null) => void;
  hint?: string;
  maxSize?: number; // in MB
  maxFiles?: number;
  multiple?: boolean;
}

export function FileUpload({
  name,
  accept,
  onFiles,
  hint,
  maxSize = 5,
  maxFiles = 2,
  multiple = true,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = useCallback(
    (files: FileList): { valid: boolean; error?: string } => {
      const fileArray = Array.from(files);

      // Check number of files
      if (fileArray.length > maxFiles) {
        return {
          valid: false,
          error: `Maximum ${maxFiles} files allowed`,
        };
      }

      // Check total file size
      const totalSize = fileArray.reduce((sum, file) => sum + file.size, 0);
      const maxSizeBytes = maxSize * 1024 * 1024;

      if (totalSize > maxSizeBytes) {
        return {
          valid: false,
          error: `Total file size must be less than ${maxSize}MB`,
        };
      }

      return { valid: true };
    },
    [maxFiles, maxSize],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) {
        setSelectedFiles([]);
        setError(null);
        onFiles(null);
        return;
      }

      // Convert FileList to array
      const newFiles = Array.from(files);

      // If multiple is true, combine with existing files; otherwise replace
      const combinedFiles = multiple
        ? [...selectedFiles, ...newFiles]
        : newFiles;

      // Validate the combined files
      const validation = validateFiles(combinedFiles as unknown as FileList);
      if (!validation.valid) {
        setError(validation.error || "Invalid files");
        return;
      }

      setError(null);
      setSelectedFiles(combinedFiles);

      // Create a new FileList-like object for the callback
      const dataTransfer = new DataTransfer();
      combinedFiles.forEach((file) => dataTransfer.items.add(file));
      onFiles(dataTransfer.files);
    },
    [onFiles, validateFiles, selectedFiles, multiple],
  );

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);

    if (newFiles.length === 0) {
      onFiles(null);
    } else {
      // Create a new FileList-like object
      const dataTransfer = new DataTransfer();
      newFiles.forEach((file) => dataTransfer.items.add(file));
      onFiles(dataTransfer.files);
    }
  };

  const removeAllFiles = () => {
    if (inputRef.current) inputRef.current.value = "";
    setSelectedFiles([]);
    setError(null);
    onFiles(null);
  };

  // Get accepted file types for display
  const getAcceptedTypes = () => {
    if (!accept) return "JPEG, PNG, PDF, and MP4";

    const types = accept.split(",").map((type) => {
      const trimmed = type.trim();
      if (trimmed === "image/jpeg") return "JPEG";
      if (trimmed === "image/png") return "PNG";
      if (trimmed === "application/pdf") return "PDF";
      if (trimmed === "video/mp4") return "MP4";
      return trimmed.split("/")[1]?.toUpperCase() || trimmed;
    });

    return types.join(", ");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-all duration-200 min-h-[120px]",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:border-border/60 hover:bg-muted/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        )}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
      >
        {/* Cloud Upload Icon */}
        <div className="relative flex items-center justify-center">
          <div className="relative">
            <Upload className="h-6 w-6 text-muted-foreground" />
            {selectedFiles.length > 0 && (
              <Check className="h-3 w-3 text-green-600 absolute -top-0.5 -right-0.5 bg-background rounded-full shadow-sm" />
            )}
          </div>
        </div>

        {/* Main Text */}
        <div className="space-y-1">
          <div className="text-sm font-medium text-foreground">
            Choose files or drag & drop them here
          </div>

          {/* File Types and Size */}
          <div className="text-xs text-muted-foreground">
            {hint ??
              `${getAcceptedTypes()} formats, up to ${maxFiles} files, ${maxSize}MB total`}
          </div>
        </div>

        {/* Browse Button */}
        <button
          type="button"
          className="px-3 py-1.5 text-xs font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-0 focus:border-border/60 transition-colors shadow-sm cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Browse Files
        </button>
      </div>

      <input
        ref={inputRef}
        id={name}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.currentTarget.files)}
      />

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
          <span className="text-xs text-destructive">{error}</span>
        </div>
      )}

      {/* File List */}
      {selectedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-foreground">
              Selected Files ({selectedFiles.length}/{maxFiles})
            </h4>
            <button
              type="button"
              onClick={removeAllFiles}
              className="text-xs text-destructive hover:text-destructive/80 transition-colors font-medium cursor-pointer"
            >
              Remove All
            </button>
          </div>

          {/* Files List */}
          <div className="space-y-1.5">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-card border border-border rounded-md shadow-sm"
              >
                {/* File Icon/Preview */}
                <div className="flex-shrink-0">
                  {file.type.startsWith("image") ? (
                    <Image
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded object-cover border border-border"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-muted rounded flex items-center justify-center border border-border">
                      <Upload className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors focus:outline-none focus:ring-0 cursor-pointer"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Total Size */}
          <div className="flex justify-end">
            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Total: {formatFileSize(totalSize)} / {maxSize}MB
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
