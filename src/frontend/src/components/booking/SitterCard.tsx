import { CheckCircle, MapPin } from "lucide-react";
import React from "react";

export interface SitterInfo {
  id: string;
  name: string;
  services: string[];
  rate: number;
  distance?: number;
  isAvailable: boolean;
  bookingCount?: number;
  repeatRate?: number;
}

interface Props {
  sitter: SitterInfo;
  isSelected: boolean;
  onSelect: (s: SitterInfo) => void;
}

export default function SitterCard({ sitter, isSelected, onSelect }: Props) {
  const initials = sitter.name
    .split(" ")
    .map((n: string) => n[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      data-ocid="sitter_card"
      type="button"
      className={`w-full text-left rounded-2xl border-2 p-4 cursor-pointer transition-all ${
        isSelected
          ? "border-indigo-500 bg-indigo-50"
          : "border-gray-200 bg-white hover:border-indigo-300"
      }`}
      onClick={() => onSelect(sitter)}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {sitter.name}
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                sitter.isAvailable
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {sitter.isAvailable ? "Available" : "Busy"}
            </span>
          </div>
          {sitter.distance !== undefined && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {sitter.distance === 0
                ? "Your area"
                : `${sitter.distance.toFixed(1)} mi`}
            </p>
          )}
          <p className="text-xs text-amber-600 font-medium mt-1">
            ${sitter.rate}/hr
          </p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {sitter.services.slice(0, 4).map((s: string) => (
              <span
                key={s}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
              >
                {s}
              </span>
            ))}
            {sitter.services.length > 4 && (
              <span className="text-xs text-gray-400">
                +{sitter.services.length - 4}
              </span>
            )}
          </div>
          {(sitter.bookingCount || 0) > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {sitter.bookingCount} booking
              {sitter.bookingCount !== 1 ? "s" : ""}
              {sitter.repeatRate
                ? ` · ${Math.round(sitter.repeatRate)}% repeat`
                : ""}
            </p>
          )}
        </div>
        <div
          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${
            isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
          }`}
        >
          {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
        </div>
      </div>
    </button>
  );
}
