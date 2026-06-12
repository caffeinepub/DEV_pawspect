import { ArrowLeft, Calendar, CheckCircle } from "lucide-react";
import React from "react";

interface Props {
  sitterName: string;
  bookingId: string;
  date: string;
  service: string;
  onMyBookings: () => void;
  onBookAgain: () => void;
}

export default function SuccessStep({
  sitterName,
  bookingId,
  date,
  service,
  onMyBookings,
  onBookAgain,
}: Props) {
  return (
    <div className="text-center py-8 px-4 space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          You're Booked!
        </h2>
        <p className="text-gray-600">
          {sitterName} will take great care of your pets
          {date ? ` on ${date}` : ""}.
        </p>
      </div>
      <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Service</span>
          <span className="font-medium text-gray-900">{service}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Sitter</span>
          <span className="font-medium text-gray-900">{sitterName}</span>
        </div>
        {bookingId && (
          <div className="flex justify-between">
            <span className="text-gray-500">Reference</span>
            <span className="font-mono text-xs text-gray-700">
              {bookingId.toString().slice(0, 12).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <button
          type="button"
          data-ocid="booking.view_bookings_button"
          onClick={onMyBookings}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          View My Bookings
        </button>
        <button
          type="button"
          data-ocid="booking.book_again_button"
          onClick={onBookAgain}
          className="w-full py-3.5 bg-white border-2 border-indigo-200 hover:border-indigo-400 text-indigo-600 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Book Again
        </button>
      </div>
    </div>
  );
}
