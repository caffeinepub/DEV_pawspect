import { Button } from "@/components/ui/button";
import { Check, Copy, ExternalLink, Link2, Share2 } from "lucide-react";
import { useState } from "react";
import { BUSINESS_CONFIG } from "../config/business";
import { useGetSitterHandle } from "../hooks/useQueries";

interface StorefrontShareLinkProps {
  sitterId: bigint | null;
}

export default function StorefrontShareLink({
  sitterId,
}: StorefrontShareLinkProps) {
  const { data: handle, isLoading } = useGetSitterHandle(sitterId);
  const [copied, setCopied] = useState(false);
  const [socialCopied, setSocialCopied] = useState(false);

  const appUrl = BUSINESS_CONFIG.appUrl;
  const storefrontUrl = handle
    ? `${appUrl}/#/sitter/${encodeURIComponent(handle)}`
    : null;

  const socialText = handle
    ? `Book me for your pet's next adventure: ${storefrontUrl}`
    : "";

  const handleCopy = async () => {
    if (!storefrontUrl) return;
    try {
      await navigator.clipboard.writeText(storefrontUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select the text
    }
  };

  const handleSocialCopy = async () => {
    if (!socialText) return;
    try {
      await navigator.clipboard.writeText(socialText);
      setSocialCopied(true);
      setTimeout(() => setSocialCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleViewPage = () => {
    if (!storefrontUrl) return;
    window.open(storefrontUrl, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div
        className="rounded-2xl p-5 border animate-pulse mb-5"
        style={{
          background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
          borderColor: "#c7d2fe",
        }}
      >
        <div className="h-4 w-40 bg-indigo-200 rounded-lg mb-3" />
        <div className="h-10 w-full bg-indigo-100 rounded-xl" />
      </div>
    );
  }

  if (!handle || !storefrontUrl) {
    return (
      <div
        className="rounded-2xl p-5 border mb-5 flex items-start gap-3"
        style={{
          background: "linear-gradient(135deg, #fefce8 0%, #fff7ed 100%)",
          borderColor: "#fde68a",
        }}
        data-ocid="storefront_share.setup.card"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
        >
          <Link2 size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-800">
            Your public page is being set up
          </p>
          <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
            Your shareable booking link will appear here once your profile is
            active and your handle is assigned.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border mb-5"
      style={{
        background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
        borderColor: "#c7d2fe",
        boxShadow: "0 2px 16px oklch(0.50 0.18 265 / 0.10)",
      }}
      data-ocid="storefront_share.card"
    >
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
          >
            <Share2 size={14} className="text-white" />
          </div>
          <p className="text-sm font-bold text-indigo-900">
            Your Public Booking Page is Live!
          </p>
        </div>
        <p className="text-xs text-indigo-600 mb-4 ml-10">
          Share this link anywhere — clients can see your services and book you
          instantly.
        </p>

        {/* URL display + copy */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-indigo-200 bg-white/70"
            data-ocid="storefront_share.url.display"
          >
            <Link2 size={13} className="text-indigo-400 shrink-0" />
            <span className="text-xs font-mono text-indigo-700 truncate">
              {storefrontUrl}
            </span>
          </div>
          <Button
            size="sm"
            data-ocid="storefront_share.copy.button"
            onClick={handleCopy}
            className="shrink-0 rounded-xl h-10 px-4 font-semibold transition-all"
            style={{
              background: copied
                ? "linear-gradient(135deg, #059669, #10b981)"
                : "linear-gradient(135deg, #6366f1, #4f46e5)",
              border: "none",
              color: "white",
            }}
          >
            {copied ? (
              <>
                <Check size={13} className="mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={13} className="mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            data-ocid="storefront_share.view_page.button"
            onClick={handleViewPage}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl border border-indigo-200 bg-white/60 text-indigo-700 hover:bg-white/90 transition-colors"
          >
            <ExternalLink size={12} />
            View My Page
          </button>
          <button
            type="button"
            data-ocid="storefront_share.social_copy.button"
            onClick={handleSocialCopy}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl border border-indigo-200 bg-white/60 text-indigo-700 hover:bg-white/90 transition-colors"
          >
            {socialCopied ? (
              <>
                <Check size={12} className="text-emerald-600" />
                Copied for sharing!
              </>
            ) : (
              <>
                <Share2 size={12} />
                Copy for social
              </>
            )}
          </button>
        </div>
      </div>

      {/* Social share text preview */}
      <div
        className="px-5 pb-5 border-t border-indigo-100"
        style={{ paddingTop: "12px" }}
      >
        <p className="text-xs font-semibold text-indigo-500 mb-2 uppercase tracking-wide">
          Ready-to-share text
        </p>
        <div className="bg-white/70 rounded-xl px-3 py-2.5 border border-indigo-100">
          <p className="text-xs text-indigo-700 leading-relaxed break-all">
            {socialText}
          </p>
        </div>
      </div>
    </div>
  );
}
