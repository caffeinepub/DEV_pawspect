/**
 * PhotoUpload — object-storage extension component
 *
 * Uploads sitter profile photos to the Caffeine blob gateway via StorageClient
 * from @caffeineai/object-storage (accessed via core-infrastructure config).
 * Enforces strict content guidelines and supports drag-and-drop and
 * click-to-browse from device photo library (no camera capture forced).
 */

import { cn } from "@/lib/utils";
import { loadConfig } from "@caffeineai/core-infrastructure";
import { CheckCircle, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onUploadComplete: (url: string) => void;
  label?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const GUIDELINES = [
  { icon: "✓", text: "Professional, clear photo preferred" },
  { icon: "✓", text: "Good lighting, in-focus image" },
  { icon: "✓", text: "Minimum 400×400px recommended" },
  { icon: "✗", text: "No inappropriate, offensive, or misleading content" },
];

async function uploadToStorage(
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  const config = await loadConfig();
  onProgress(5);

  // Guard: if backend_host is missing, the literal string "undefined", or empty,
  // object-storage is not configured — throw a user-friendly error instead of
  // passing a bad value to HttpAgent (which would crash the whole app).
  const rawHost = config.backend_host;
  const host =
    rawHost && rawHost !== "undefined" && rawHost !== "" ? rawHost : null;
  if (!host) {
    throw new Error(
      "Photo storage is not configured for this environment. Please try again later.",
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storagePkg = "@caffeineai/object-storage";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storageModule: any = await import(/* @vite-ignore */ storagePkg);
  const { StorageClient, ExternalBlob } = storageModule;

  const { HttpAgent } = await import("@icp-sdk/core/agent");
  const agent = new HttpAgent({ host });
  if (host.includes("localhost")) {
    await agent
      .fetchRootKey()
      .catch((e: unknown) =>
        console.warn("[PhotoUpload] fetchRootKey failed:", e),
      );
  }

  const bucketName = config.bucket_name ?? config.project_id ?? "default";
  const gatewayUrl =
    config.storage_gateway_url ?? config.backend_host ?? "https://icp-api.io";
  const canisterId = config.backend_canister_id;
  const projectId = config.project_id ?? "pawspect";

  console.debug("[PhotoUpload] StorageClient config:", {
    bucketName,
    gatewayUrl,
    canisterId,
    projectId,
  });

  const client = new StorageClient(
    bucketName,
    gatewayUrl,
    canisterId,
    projectId,
    agent,
  );

  onProgress(20);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct: number) =>
    onProgress(20 + pct * 0.75),
  );

  const { hash } = await client.putFile(await blob.getBytes(), (pct: number) =>
    onProgress(20 + pct * 0.75),
  );

  onProgress(97);
  const url = await client.getDirectURL(hash);
  onProgress(100);
  return url as string;
}

export function PhotoUpload({
  currentPhotoUrl,
  onUploadComplete,
  label = "Profile Photo",
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayPhoto = preview ?? currentPhotoUrl;

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setSuccess(false);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Please select a JPEG, PNG, or WebP image.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(
          `File is too large. Maximum 5 MB (yours: ${(file.size / 1024 / 1024).toFixed(1)} MB).`,
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      setIsUploading(true);
      setUploadProgress(0);
      try {
        const url = await uploadToStorage(file, (pct) =>
          setUploadProgress(pct),
        );
        setSuccess(true);
        onUploadComplete(url);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(`Upload failed: ${msg}. Please try again.`);
        setPreview(null);
        console.error("[PhotoUpload] upload error:", err);
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const handleRemovePreview = () => {
    setPreview(null);
    setSuccess(false);
    setError(null);
  };

  // ─── Existing / just-uploaded photo preview ──────────────────────────────
  if (displayPhoto && !showChange) {
    return (
      <div className="space-y-3 w-full">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="relative w-full max-w-[200px] aspect-square overflow-hidden rounded-xl shadow-premium mx-auto sm:mx-0 shrink-0">
            <img
              src={displayPhoto}
              alt="Profile"
              className="h-full w-full object-cover"
            />
            {preview && (
              <button
                type="button"
                onClick={handleRemovePreview}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow transition-smooth hover:scale-110"
                aria-label="Remove preview"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 pt-1">
            {success && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <CheckCircle className="h-4 w-4 shrink-0" /> Photo uploaded!
              </span>
            )}
            <button
              type="button"
              data-ocid="photo_upload.change_button"
              onClick={() => setShowChange(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-smooth hover:border-primary hover:text-primary min-h-[44px]"
            >
              <Upload className="h-4 w-4 shrink-0" />
              Change Photo
            </button>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, or WebP · Max 5 MB
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Upload zone ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 w-full">
      <p className="text-sm font-semibold text-foreground">{label}</p>

      <label
        data-ocid="photo_upload.dropzone"
        htmlFor="photo-upload-input"
        className={cn(
          "relative flex w-full min-h-[120px] sm:min-h-[160px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 sm:p-8 transition-all duration-300 cursor-pointer hover:border-primary hover:bg-primary/5",
          isDragging && "border-primary bg-primary/10",
          isUploading && "pointer-events-none opacity-70",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* NOTE: no `capture` attribute — device will offer photo library, not camera */}
        <input
          ref={inputRef}
          id="photo-upload-input"
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          onChange={handleInputChange}
          data-ocid="photo_upload.input"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3 w-full max-w-[200px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              Uploading… {Math.round(uploadProgress)}%
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm sm:text-base">
                <span className="hidden sm:inline">
                  Drop your photo here, or{" "}
                </span>
                <span className="text-primary underline-offset-2 hover:underline">
                  <span className="sm:hidden">Tap to upload a photo</span>
                  <span className="hidden sm:inline">browse</span>
                </span>
              </p>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                JPEG, PNG, or WebP · Max 5 MB
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5 shrink-0" />
              Choose from your photo library
            </span>
          </div>
        )}
      </label>

      {/* Error */}
      {error && (
        <p
          data-ocid="photo_upload.error_state"
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
        >
          <X className="h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      )}

      {/* Content guidelines */}
      <div className="upload-guidelines">
        <div className="mb-2 flex items-center gap-2">
          <ImageIcon className="h-3.5 w-3.5 text-accent shrink-0" />
          <strong className="text-xs font-semibold uppercase tracking-widest text-foreground">
            Photo Guidelines
          </strong>
        </div>
        <ul className="space-y-1">
          {GUIDELINES.map((g) => (
            <li
              key={g.text}
              className="flex gap-2 text-xs text-muted-foreground"
            >
              <span
                className={
                  g.icon === "✓"
                    ? "text-emerald-500 shrink-0"
                    : "text-destructive shrink-0"
                }
              >
                {g.icon}
              </span>
              {g.text}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          By uploading, you confirm this photo complies with our{" "}
          <span className="font-medium text-foreground">content policy</span>.
        </p>
      </div>

      {showChange && (
        <button
          type="button"
          onClick={() => setShowChange(false)}
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
