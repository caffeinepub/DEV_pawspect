import React from "react";

interface Props {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export default function BookingStepIndicator({ currentStep, labels }: Props) {
  return (
    <div className="flex items-center justify-center gap-1 py-3 px-2 overflow-x-auto">
      {labels.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < currentStep
                  ? "bg-indigo-600 text-white"
                  : i === currentStep
                    ? "bg-indigo-600 text-white ring-2 ring-indigo-300"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {i < currentStep ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs mt-0.5 hidden sm:block whitespace-nowrap ${
                i === currentStep
                  ? "text-indigo-600 font-medium"
                  : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div
              className={`w-6 h-0.5 flex-shrink-0 ${
                i < currentStep ? "bg-indigo-600" : "bg-gray-200"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
