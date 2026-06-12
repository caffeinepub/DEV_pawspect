/**
 * PhotoGalleryUpload — multi-photo gallery upload with three-part legal consent.
 *
 * Each upload requires explicit legal acknowledgment before processing.
 * Consent is logged via addPhotoConsentLog mutation after storage upload.
 * Uses the same StorageClient pattern as PhotoUpload.tsx (object-storage extension).
 *
 * VIDEO UPLOAD IS PERMANENTLY DISABLED — do not add video support here.
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { loadConfig } from "@caffeineai/core-infrastructure";
import {
  AlertTriangle,
  CheckCircle,
  ImageIcon,
  Loader2,
  Plus,
  Shield,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useAddPhotoConsentLog } from "../hooks/useQueries";

// ─── Storage upload (same pattern as PhotoUpload.tsx) ─────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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
        console.warn("[PhotoGalleryUpload] fetchRootKey failed:", e),
      );
  }

  const bucketName = config.bucket_name ?? config.project_id ?? "default";
  const gatewayUrl =
    config.storage_gateway_url ?? config.backend_host ?? "https://icp-api.io";
  const canisterId = config.backend_canister_id;
  const projectId = config.project_id ?? "pawspect";

  console.debug("[PhotoGalleryUpload] StorageClient config:", {
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

// ─── Consent modal ─────────────────────────────────────────────────────────

const CONSENT_ITEMS = [
  {
    id: "consent1" as const,
    label:
      "I own the rights to this photo or have explicit permission to use it",
  },
  {
    id: "consent2" as const,
    label:
      "This photo does not contain identifiable minors without guardian consent",
  },
  {
    id: "consent3" as const,
    label:
      "I agree this photo may be publicly displayed on my profile page and I accept responsibility for its content",
  },
];

const CONTENT_GUIDELINES = [
  "No explicit, offensive, or graphic content",
  "No copyrighted images you don't own",
  "No misleading or unrelated content",
  "Professional quality photos encouraged",
  "No identifiable minors without guardian consent",
];

interface ConsentModalProps {
  file: File;
  preview: string;
  uploadProgress: number;
  isUploading: boolean;
  onConfirm: (consent1: boolean, consent2: boolean, consent3: boolean) => void;
  onCancel: () => void;
}

function ConsentModal({
  file,
  preview,
  uploadProgress,
  isUploading,
  onConfirm,
  onCancel,
}: ConsentModalProps) {
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [consent3, setConsent3] = useState(false);

  const allChecked = consent1 && consent2 && consent3;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isUploading ? onCancel : undefined}
        onKeyDown={(e) => {
          if (!isUploading && (e.key === "Escape" || e.key === "Enter"))
            onCancel();
        }}
        role="button"
        tabIndex={-1}
        aria-label="Close consent dialog"
      />

      {/* Modal */}
      <div
        data-ocid="gallery_consent.dialog"
        className="relative z-10 w-full sm:max-w-lg rounded-2xl bg-card shadow-hero border border-border overflow-hidden animate-fade-in-up max-h-[90dvh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15">
              <Shield className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">
                Photo Upload Agreement
              </p>
              <p className="text-xs text-muted-foreground">
                Required before uploading
              </p>
            </div>
          </div>
          {!isUploading && (
            <button
              type="button"
              data-ocid="gallery_consent.close_button"
              onClick={onCancel}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
              aria-label="Cancel upload"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Photo preview row */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
            <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden">
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          </div>

          {/* Content guidelines */}
          <div className="rounded-xl bg-muted/40 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground flex items-center gap-2">
              <ImageIcon className="h-3.5 w-3.5 text-accent" />
              Content Guidelines
            </p>
            <ul className="space-y-1.5">
              {CONTENT_GUIDELINES.map((g) => (
                <li
                  key={g}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>

          {/* Three-part consent checkboxes */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
              You must agree to all three:
            </p>
            {CONSENT_ITEMS.map(({ id, label }) => {
              const checked =
                id === "consent1"
                  ? consent1
                  : id === "consent2"
                    ? consent2
                    : consent3;
              const setChecked =
                id === "consent1"
                  ? setConsent1
                  : id === "consent2"
                    ? setConsent2
                    : setConsent3;
              const ocid = `gallery_consent.${id}`;
              return (
                <label
                  key={id}
                  data-ocid={ocid}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors select-none",
                    checked
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-muted/20 hover:bg-muted/40",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                      checked
                        ? "border-primary bg-primary"
                        : "border-border bg-background",
                    )}
                  >
                    {checked && (
                      <CheckCircle className="h-3.5 w-3.5 text-primary-foreground" />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    disabled={isUploading}
                  />
                  <span className="text-sm text-foreground leading-snug">
                    {label}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Platform disclaimer */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                Platform disclaimer:{" "}
              </span>
              Pawspect is not responsible for user-uploaded content. Content
              that violates our guidelines may be removed without notice. You
              are solely responsible for any content you upload.
            </p>
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div
              data-ocid="gallery_consent.loading_state"
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading…
                </span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 py-4 border-t border-border bg-muted/20">
          <Button
            type="button"
            variant="outline"
            data-ocid="gallery_consent.cancel_button"
            onClick={onCancel}
            disabled={isUploading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            data-ocid="gallery_consent.confirm_button"
            onClick={() => onConfirm(consent1, consent2, consent3)}
            disabled={!allChecked || isUploading}
            className={cn(
              "flex-1 font-semibold transition-all",
              allChecked && !isUploading
                ? "bg-gradient-to-r from-primary to-primary/90"
                : "opacity-50 cursor-not-allowed",
            )}
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading
              </span>
            ) : (
              "Upload Photo"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export interface PhotoGalleryUploadProps {
  galleryPhotos: string[];
  onPhotosChange: (photos: string[]) => void;
  sitterId: number;
  maxPhotos?: number;
}

export function PhotoGalleryUpload({
  galleryPhotos,
  onPhotosChange,
  sitterId,
  maxPhotos = 12,
}: PhotoGalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const addConsentLog = useAddPhotoConsentLog();

  // Pending file waiting for consent confirmation
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback((file: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please select a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(
        `File too large. Maximum 5 MB (yours: ${(file.size / 1024 / 1024).toFixed(1)} MB).`,
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPendingPreview(e.target?.result as string);
      setPendingFile(file);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    e.target.value = "";
  };

  const handleConsentConfirm = useCallback(
    async (c1: boolean, c2: boolean, c3: boolean) => {
      if (!pendingFile) return;
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const url = await uploadToStorage(pendingFile, (pct) =>
          setUploadProgress(pct),
        );
        // Log consent to backend — fire and forget, non-blocking on success
        addConsentLog.mutate({
          sitterId,
          photoUrl: url,
          consent1: c1,
          consent2: c2,
          consent3: c3,
        });
        onPhotosChange([...galleryPhotos, url]);
        setPendingFile(null);
        setPendingPreview(null);
      } catch (err: unknown) {
        console.error("[PhotoGalleryUpload] upload error:", err);
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(`Upload failed: ${msg}. Please try again.`);
        setPendingFile(null);
        setPendingPreview(null);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [pendingFile, galleryPhotos, onPhotosChange, sitterId, addConsentLog],
  );

  const handleConsentCancel = () => {
    setPendingFile(null);
    setPendingPreview(null);
    setUploadProgress(0);
  };

  const handleRemove = (idx: number) => {
    const next = galleryPhotos.filter((_, i) => i !== idx);
    onPhotosChange(next);
  };

  const canAddMore = galleryPhotos.length < maxPhotos;

  return (
    <div className="space-y-3">
      {/* Existing photo thumbnails */}
      {galleryPhotos.length > 0 && (
        <div
          className="grid grid-cols-3 gap-2 sm:grid-cols-4"
          data-ocid="gallery_upload.list"
        >
          {galleryPhotos.map((url, idx) => (
            <div
              key={url}
              data-ocid={`gallery_upload.item.${idx + 1}`}
              className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/30 group"
            >
              <img
                src={url}
                alt={`Gallery item ${idx + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button
                type="button"
                data-ocid={`gallery_upload.delete_button.${idx + 1}`}
                onClick={() => handleRemove(idx)}
                aria-label={`Remove photo ${idx + 1}`}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 duration-150"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add photos button / empty state */}
      {canAddMore && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="sr-only"
            onChange={handleInputChange}
            data-ocid="gallery_upload.input"
          />
          <button
            type="button"
            data-ocid="gallery_upload.upload_button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-border bg-muted/20 px-4 py-5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:text-primary",
              galleryPhotos.length === 0 && "py-8",
            )}
          >
            <Plus className="h-5 w-5 shrink-0" />
            {galleryPhotos.length === 0
              ? "Add gallery photos"
              : `Add more photos (${galleryPhotos.length}/${maxPhotos})`}
          </button>
          <p className="mt-1.5 text-xs text-muted-foreground px-1">
            JPEG, PNG, or WebP · Max 5 MB each · Up to {maxPhotos} photos
          </p>
        </div>
      )}

      {galleryPhotos.length >= maxPhotos && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxPhotos} photos reached. Remove a photo to add more.
        </p>
      )}

      {/* Error */}
      {error && (
        <p
          data-ocid="gallery_upload.error_state"
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <X className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {/* Consent modal — shown when a file is pending */}
      {pendingFile && pendingPreview && (
        <ConsentModal
          file={pendingFile}
          preview={pendingPreview}
          uploadProgress={uploadProgress}
          isUploading={isUploading}
          onConfirm={handleConsentConfirm}
          onCancel={handleConsentCancel}
        />
      )}
    </div>
  );
}
