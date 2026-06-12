import { Calendar, Clock, PawPrint, User } from "lucide-react";
import React from "react";
import type { ClientInfo } from "./ClientInfoForm";
import type { Pet } from "./PetForm";

interface Props {
  sitterName: string;
  service: string;
  date: string;
  timeWindow: string;
  rate: number;
  durationHours: number;
  pets: Pet[];
  clientInfo: ClientInfo;
  termsConsent: boolean;
  liabilityConsent: boolean;
  onTermsChange: (v: boolean) => void;
  onLiabilityChange: (v: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

export default function ReviewStep({
  sitterName,
  service,
  date,
  timeWindow,
  rate,
  durationHours,
  pets,
  clientInfo,
  termsConsent,
  liabilityConsent,
  onTermsChange,
  onLiabilityChange,
  onSubmit,
  isSubmitting,
  submitError,
}: Props) {
  const total = rate * durationHours;
  const canSubmit =
    termsConsent &&
    liabilityConsent &&
    clientInfo.communicationsConsent &&
    !!clientInfo.firstName &&
    !!clientInfo.lastName &&
    !!clientInfo.phone &&
    !!clientInfo.email &&
    pets.length > 0 &&
    pets.every((p) => !!p.name);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Booking Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4 text-indigo-500" />
            <span>
              Sitter: <strong className="text-gray-900">{sitterName}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <PawPrint className="w-4 h-4 text-indigo-500" />
            <span>
              Service: <strong className="text-gray-900">{service}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>
              Date:{" "}
              <strong className="text-gray-900">{date || "Flexible"}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>
              Time: <strong className="text-gray-900">{timeWindow}</strong>
            </span>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>
              ${rate}/hr × {durationHours}hr
            </span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100">
            <span>Estimated Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
          <input
            type="checkbox"
            id="terms"
            className="mt-0.5 w-4 h-4 text-indigo-600 rounded"
            checked={termsConsent}
            onChange={(e) => onTermsChange(e.target.checked)}
          />
          <label
            htmlFor="terms"
            className="text-xs text-gray-600 leading-relaxed"
          >
            I agree to the{" "}
            <a
              href="#/terms"
              className="text-indigo-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#/privacy"
              className="text-indigo-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
            . Pawspect is a software platform only and not a party to any
            services.
          </label>
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
          <input
            type="checkbox"
            id="liability"
            className="mt-0.5 w-4 h-4 text-indigo-600 rounded"
            checked={liabilityConsent}
            onChange={(e) => onLiabilityChange(e.target.checked)}
          />
          <label
            htmlFor="liability"
            className="text-xs text-gray-600 leading-relaxed"
          >
            I understand all services are by independent sitters. Data Driven
            Design Group, LLC and Pawspect are not liable for any outcomes from
            pet care services.
          </label>
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <button
        type="button"
        data-ocid="booking.confirm_button"
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        className={`w-full py-4 rounded-2xl font-semibold text-white text-base transition-all ${
          canSubmit && !isSubmitting
            ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-98"
            : "bg-gray-300 cursor-not-allowed"
        }`}
      >
        {isSubmitting ? "Confirming..." : "Confirm Booking"}
      </button>
      {!canSubmit && (
        <p className="text-xs text-center text-gray-400">
          Complete all fields and check all boxes above
        </p>
      )}
    </div>
  );
}
