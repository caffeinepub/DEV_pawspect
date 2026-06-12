import { User } from "lucide-react";
import React from "react";

export interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  communicationsConsent: boolean;
}

interface Props {
  info: ClientInfo;
  onChange: (info: ClientInfo) => void;
  isReturning?: boolean;
}

export default function ClientInfoForm({ info, onChange, isReturning }: Props) {
  const up = (f: keyof ClientInfo, v: string | boolean) =>
    onChange({ ...info, [f]: v });

  return (
    <div className="space-y-3">
      {isReturning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <User className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-700 font-medium">
            Welcome back! We found your info.
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label
            htmlFor="client-first-name"
            className="text-xs text-gray-500 mb-1 block"
          >
            First Name *
          </label>
          <input
            id="client-first-name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            placeholder="Jane"
            value={info.firstName}
            onChange={(e) => up("firstName", e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="client-last-name"
            className="text-xs text-gray-500 mb-1 block"
          >
            Last Name *
          </label>
          <input
            id="client-last-name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            placeholder="Smith"
            value={info.lastName}
            onChange={(e) => up("lastName", e.target.value)}
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="client-phone"
          className="text-xs text-gray-500 mb-1 block"
        >
          Phone *
        </label>
        <input
          id="client-phone"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          placeholder="(555) 123-4567"
          value={info.phone}
          onChange={(e) => up("phone", e.target.value)}
        />
      </div>
      <div>
        <label
          htmlFor="client-email"
          className="text-xs text-gray-500 mb-1 block"
        >
          Email *
        </label>
        <input
          id="client-email"
          type="email"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          placeholder="jane@example.com"
          value={info.email}
          onChange={(e) => up("email", e.target.value)}
        />
      </div>
      <div>
        <label
          htmlFor="client-address"
          className="text-xs text-gray-500 mb-1 block"
        >
          Address
        </label>
        <input
          id="client-address"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          placeholder="123 Main St, Boulder, CO 80304"
          value={info.address}
          onChange={(e) => up("address", e.target.value)}
        />
      </div>
      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
        <input
          type="checkbox"
          id="comms"
          className="mt-0.5 w-4 h-4 text-indigo-600 rounded"
          checked={info.communicationsConsent}
          onChange={(e) => up("communicationsConsent", e.target.checked)}
        />
        <label
          htmlFor="comms"
          className="text-xs text-gray-600 leading-relaxed"
        >
          I agree to receive booking confirmations, updates, and important
          communications via email and SMS. Message rates may apply.
        </label>
      </div>
    </div>
  );
}
