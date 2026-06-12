import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  PawPrint,
  Shield,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { View } from "../App";
import {
  useConfirmAccountAnonymization,
  useConfirmGdprExport,
} from "../hooks/useQueries";

interface Props {
  navigate: (view: View) => void;
}

function parseGdprParams(): { token: string | null; action: string | null } {
  const hash = window.location.hash ?? "";
  const withoutHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const [, queryString] = withoutHash.split("?");
  if (!queryString) return { token: null, action: null };
  const params = new URLSearchParams(queryString);
  return { token: params.get("token"), action: params.get("action") };
}

export default function GdprConfirmPage({ navigate }: Props) {
  const { token, action } = parseGdprParams();
  const confirmExport = useConfirmGdprExport();
  const confirmAnonymize = useConfirmAccountAnonymization();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const didRun = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional one-shot on mount
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    if (!token || !action) {
      setErrorMsg(
        "Invalid or missing confirmation link. Please check your email and try again.",
      );
      setStatus("error");
      return;
    }

    const run = async () => {
      try {
        if (action === "export") {
          const result = await confirmExport.mutateAsync(token);
          // If result contains data, trigger a download
          if (result && typeof result === "object" && "ok" in result) {
            const data = (result as { ok: unknown }).ok;
            if (typeof data === "string" && data.startsWith("{")) {
              // It's JSON data — trigger a download
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "pawspect-data-export.json";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }
          setStatus("success");
        } else if (action === "anonymize") {
          await confirmAnonymize.mutateAsync(token);
          setStatus("success");
        } else {
          setErrorMsg("Unknown action type in confirmation link.");
          setStatus("error");
        }
      } catch (err) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. The link may be expired or already used.",
        );
        setStatus("error");
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bgStyle = {
    background:
      "linear-gradient(135deg, oklch(0.28 0.18 265) 0%, oklch(0.35 0.22 280) 50%, oklch(0.40 0.16 255) 100%)",
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={bgStyle}
    >
      {/* Brand header */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
          <PawPrint size={20} className="text-white" />
        </div>
        <span className="font-display font-bold text-white text-xl">
          Pawspect
        </span>
      </div>

      <div
        className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 text-center"
        data-ocid="gdpr-confirm.card"
      >
        {status === "loading" && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto">
              <Loader2 size={32} className="text-white animate-spin" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              Confirming Your Request…
            </h1>
            <p className="text-white/70 text-sm leading-relaxed">
              Please wait while we process your{" "}
              {action === "export"
                ? "data export"
                : action === "anonymize"
                  ? "account anonymization"
                  : "request"}
              .
            </p>
            <div
              data-ocid="gdpr-confirm.loading_state"
              className="flex items-center justify-center gap-2 text-white/50 text-xs"
            >
              <Loader2 size={12} className="animate-spin" />
              Processing…
            </div>
          </div>
        )}

        {status === "success" && action === "export" && (
          <div className="space-y-5" data-ocid="gdpr-confirm.success_state">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <Download size={32} className="text-emerald-300" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              Your Data Is Ready!
            </h1>
            <p className="text-white/70 text-sm leading-relaxed">
              Your personal data export has been downloaded. The file contains
              all personal information, bookings, invoices, and payment records
              associated with your account.
            </p>
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-sm text-emerald-200 text-left space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 size={15} className="shrink-0" />
                Download complete
              </div>
              <p className="text-emerald-200/70 text-xs leading-relaxed">
                If the download didn't start automatically, check your browser's
                download manager.
              </p>
            </div>
            <Button
              data-ocid="gdpr-confirm.primary_button"
              className="w-full h-12 rounded-xl font-bold"
              style={{
                backgroundColor: "oklch(0.72 0.18 55)",
                color: "#1a1a2e",
              }}
              onClick={() => navigate("home")}
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Button>
          </div>
        )}

        {status === "success" && action === "anonymize" && (
          <div className="space-y-5" data-ocid="gdpr-confirm.success_state">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto">
              <Shield size={32} className="text-indigo-300" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              Account Anonymized
            </h1>
            <p className="text-white/70 text-sm leading-relaxed">
              Your personal information has been replaced with anonymized
              placeholders. Your name and contact details are no longer
              associated with your account.
            </p>
            <div className="p-4 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-sm text-indigo-200 text-left space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 size={15} className="shrink-0" />
                Anonymization complete
              </div>
              <p className="text-indigo-200/70 text-xs leading-relaxed">
                Booking records have been retained for legal and audit purposes
                as required. All personal identifiable information has been
                removed.
              </p>
            </div>
            <Button
              data-ocid="gdpr-confirm.primary_button"
              className="w-full h-12 rounded-xl font-bold"
              style={{
                backgroundColor: "oklch(0.72 0.18 55)",
                color: "#1a1a2e",
              }}
              onClick={() => navigate("home")}
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-5" data-ocid="gdpr-confirm.error_state">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle size={32} className="text-red-300" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              Something Went Wrong
            </h1>
            <p className="text-white/70 text-sm leading-relaxed">
              {errorMsg ||
                "This confirmation link may be expired or already used."}
            </p>
            <div className="p-4 rounded-xl bg-red-500/15 border border-red-400/30 text-sm text-red-200 text-left">
              <p className="text-xs leading-relaxed">
                If you believe this is an error, please contact support. Your
                data has not been changed.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                data-ocid="gdpr-confirm.primary_button"
                className="w-full h-12 rounded-xl font-bold"
                style={{
                  backgroundColor: "oklch(0.72 0.18 55)",
                  color: "#1a1a2e",
                }}
                onClick={() => navigate("sitter-dashboard")}
              >
                Go to My Portal
              </Button>
              <Button
                data-ocid="gdpr-confirm.secondary_button"
                variant="outline"
                className="w-full h-11 rounded-xl border-white/30 text-white bg-white/10 hover:bg-white/20"
                onClick={() => navigate("home")}
              >
                Back to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
