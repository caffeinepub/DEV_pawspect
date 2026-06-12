import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Clock,
  Dog,
  Home,
  MapPin,
  Phone,
  Search,
  Shield,
  Star,
  User,
} from "lucide-react";
import { useRef } from "react";

// ── Static test data ──────────────────────────────────────────────────────────
const TEST_ZIP = "80304";
const TEST_DATE = "May 20, 2026";
const TEST_SERVICE = "Dog Walking";
const TEST_DURATION = "1 hour";
const TEST_RATE = 25;
const TEST_TIME_START = "9:00 AM";
const TEST_TIME_END = "10:00 AM";
const TEST_PET_NAME = "Buddy";
const TEST_PET_TYPE = "Dog";
const TEST_PET_BREED = "Golden Retriever";
const TEST_CLIENT_NAME = "Alex Johnson";
const TEST_CLIENT_EMAIL = "alex@example.com";
const TEST_CLIENT_PHONE = "(720) 555-0123";
const TEST_TOTAL = "$25.00";

const STEPS = [
  { id: "step-1", label: "1. ZIP Entry" },
  { id: "step-2", label: "2. Service & Date" },
  { id: "step-3", label: "3. Sitter Selection" },
  { id: "step-4", label: "4. Pet Info" },
  { id: "step-5", label: "5. Review" },
  { id: "step-6", label: "6. Confirmation" },
];

const SITTERS = [
  {
    name: "Bailey Berggren",
    rating: 4.9,
    reviews: 24,
    bookings: 87,
    repeatRate: 91,
    distance: "0.8 mi",
    rate: 25,
    credentials: ["Insured", "BG Check", "Certified"],
    selected: true,
    bio: "Passionate about animals, experienced with large breeds.",
  },
  {
    name: "Linnea Berggren",
    rating: 4.8,
    reviews: 18,
    bookings: 62,
    repeatRate: 85,
    distance: "1.2 mi",
    rate: 22,
    credentials: ["Insured", "BG Check"],
    selected: false,
    bio: "Gentle and caring — specializes in anxious dogs.",
  },
  {
    name: "Marcus Berggren",
    rating: 5.0,
    reviews: 9,
    bookings: 31,
    repeatRate: 100,
    distance: "1.5 mi",
    rate: 28,
    credentials: ["Insured", "BG Check", "Certified", "Pro Member"],
    selected: false,
    bio: "Former veterinary technician with 8 years experience.",
  },
];

// ── Shared section wrapper ────────────────────────────────────────────────────
function StepSection({
  id,
  stepNum,
  title,
  children,
}: {
  id: string;
  stepNum: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
          {stepNum}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <hr className="mb-6 border-gray-200" />
      {children}
    </section>
  );
}

// ── Step 1: ZIP Entry ─────────────────────────────────────────────────────────
function Step1ZipEntry() {
  return (
    <StepSection id="step-1" stepNum={1} title="ZIP Code Entry">
      <Card className="max-w-md mx-auto shadow-sm border border-gray-200">
        <CardContent className="p-6 space-y-5">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">
              Find a Pet Sitter Near You
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Enter your ZIP code to see available sitters in your area
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Your ZIP Code
            </Label>
            <div className="flex gap-2">
              <Input
                value={TEST_ZIP}
                readOnly
                className="font-mono text-lg font-semibold text-center tracking-widest bg-gray-50"
                data-ocid="booking_test.zip_input"
              />
            </div>
          </div>
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-indigo-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-indigo-800">
                Boulder, CO 80304
              </p>
              <p className="text-xs text-indigo-600">
                Boulder County · Mountain Time Zone
              </p>
            </div>
          </div>
          <Button
            disabled
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11"
            data-ocid="booking_test.find_sitters_button"
          >
            <Search className="w-4 h-4 mr-2" />
            Find Sitters Near Me
          </Button>
        </CardContent>
      </Card>
    </StepSection>
  );
}

// ── Step 2: Service & Date ────────────────────────────────────────────────────
function Step2ServiceDate() {
  return (
    <StepSection id="step-2" stepNum={2} title="Service & Date Selection">
      <Card className="max-w-md mx-auto shadow-sm border border-gray-200">
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Service</Label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
              <Dog className="w-4 h-4 text-indigo-500" />
              <span className="font-medium text-gray-900">{TEST_SERVICE}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Date</Label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
              <CalendarDays className="w-4 h-4 text-indigo-500" />
              <span className="font-medium text-gray-900">{TEST_DATE}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Time Window
            </Label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span className="font-medium text-gray-900">
                {TEST_TIME_START} – {TEST_TIME_END}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold text-emerald-800">
              3 sitters available for this window
            </span>
          </div>
          <Button
            disabled
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11"
            data-ocid="booking_test.service_continue_button"
          >
            Continue to Sitter Selection
          </Button>
        </CardContent>
      </Card>
    </StepSection>
  );
}

// ── Step 3: Sitter Selection ──────────────────────────────────────────────────
function Step3SitterSelection() {
  return (
    <StepSection id="step-3" stepNum={3} title="Sitter Selection">
      <div className="max-w-2xl mx-auto space-y-4">
        {SITTERS.map((sitter) => (
          <Card
            key={sitter.name}
            className={`shadow-sm border transition-all ${
              sitter.selected
                ? "border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/30"
                : "border-gray-200"
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {sitter.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{sitter.name}</h3>
                      {sitter.selected && (
                        <Badge className="bg-indigo-600 text-white text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <span className="text-lg font-bold text-indigo-700">
                      ${sitter.rate}/hr
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{sitter.bio}</p>
                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-semibold">{sitter.rating}</span>
                      <span className="text-gray-400">({sitter.reviews})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Home className="w-3.5 h-3.5 text-gray-400" />
                      {sitter.bookings} bookings
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {sitter.distance}
                    </span>
                    <span className="text-emerald-600 font-medium">
                      {sitter.repeatRate}% repeat clients
                    </span>
                  </div>
                  {/* Credential badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {sitter.credentials.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700"
                      >
                        <Shield className="w-3 h-3" />
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button
          disabled
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 max-w-2xl"
          data-ocid="booking_test.sitter_continue_button"
        >
          Continue with Bailey Berggren
        </Button>
      </div>
    </StepSection>
  );
}

// ── Step 4: Pet & Contact Info ────────────────────────────────────────────────
function Step4PetInfo() {
  return (
    <StepSection id="step-4" stepNum={4} title="Pet & Contact Info">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Booking summary bar */}
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-indigo-800 font-medium">
            <CalendarDays className="w-4 h-4" />
            {TEST_DATE}
          </span>
          <span className="flex items-center gap-1.5 text-indigo-800 font-medium">
            <Clock className="w-4 h-4" />
            {TEST_TIME_START} – {TEST_TIME_END}
          </span>
          <span className="flex items-center gap-1.5 text-indigo-800 font-medium">
            <Dog className="w-4 h-4" />
            {TEST_SERVICE}
          </span>
        </div>

        {/* Pet card */}
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-5 space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Dog className="w-4 h-4 text-indigo-500" />
              Pet Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Pet Name</Label>
                <Input
                  value={TEST_PET_NAME}
                  readOnly
                  className="bg-gray-50"
                  data-ocid="booking_test.pet_name_input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Pet Type</Label>
                <Input
                  value={TEST_PET_TYPE}
                  readOnly
                  className="bg-gray-50"
                  data-ocid="booking_test.pet_type_input"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-gray-500">Breed</Label>
                <Input
                  value={TEST_PET_BREED}
                  readOnly
                  className="bg-gray-50"
                  data-ocid="booking_test.pet_breed_input"
                />
              </div>
            </div>
            {/* Service slot mockup */}
            <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
              <p className="text-xs font-medium text-indigo-700 mb-2">
                Scheduled Service Slot
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-sm font-medium text-gray-800">
                    {TEST_SERVICE}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {TEST_TIME_START} – {TEST_TIME_END}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact info */}
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-5 space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Your Contact Info
            </h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Full Name</Label>
                <Input
                  value={TEST_CLIENT_NAME}
                  readOnly
                  className="bg-gray-50"
                  data-ocid="booking_test.client_name_input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Email</Label>
                <Input
                  value={TEST_CLIENT_EMAIL}
                  readOnly
                  className="bg-gray-50"
                  data-ocid="booking_test.client_email_input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Phone</Label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {TEST_CLIENT_PHONE}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          disabled
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11"
          data-ocid="booking_test.pet_continue_button"
        >
          Continue to Review
        </Button>
      </div>
    </StepSection>
  );
}

// ── Step 5: Review ────────────────────────────────────────────────────────────
function Step5Review() {
  return (
    <StepSection id="step-5" stepNum={5} title="Review & Confirm">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Price breakdown card */}
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-5 space-y-3">
            <h4 className="font-semibold text-gray-900">Price Breakdown</h4>
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {TEST_SERVICE}
                  </p>
                  <p className="text-xs text-gray-500">
                    ${TEST_RATE}/hr × {TEST_DURATION}
                  </p>
                </div>
                <span className="font-semibold text-gray-900">
                  ${TEST_RATE}.00
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-500">Sitter</span>
                <span className="text-sm font-medium text-gray-900">
                  Bailey Berggren
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-500">Date & Time</span>
                <span className="text-sm font-medium text-gray-900">
                  {TEST_DATE} · {TEST_TIME_START}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-lg text-indigo-700">
                  {TEST_TOTAL}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal checkboxes */}
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-5 space-y-3">
            <h4 className="font-semibold text-gray-900">
              Agreements &amp; Consent
            </h4>
            {[
              "I agree to the Terms of Service",
              "I agree to the Privacy Policy",
              "I agree to receive communications from the sitter and Pawspect",
              "I understand the cancellation policy",
              "I understand Pawspect is a software platform only — all arrangements are between me and the sitter",
            ].map((label) => (
              <div key={label} className="flex items-start gap-3">
                <Checkbox
                  checked
                  onCheckedChange={() => {}}
                  className="mt-0.5"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button
          disabled
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-base font-semibold"
          data-ocid="booking_test.confirm_button"
        >
          Confirm Booking Request
        </Button>
      </div>
    </StepSection>
  );
}

// ── Step 6: Confirmation ──────────────────────────────────────────────────────
function Step6Confirmation() {
  return (
    <StepSection id="step-6" stepNum={6} title="Booking Confirmation">
      <div className="max-w-xl mx-auto">
        <Card className="shadow-sm border border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-8 text-center space-y-5">
            {/* Celebration icon */}
            <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Booking Request Sent! 🎉
              </h3>
              <p className="text-gray-500 mt-1">
                Bailey will confirm your booking shortly.
              </p>
            </div>

            {/* Summary card */}
            <div className="rounded-xl bg-white border border-gray-200 p-4 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Sitter</span>
                <span className="text-sm font-semibold text-gray-900">
                  Bailey Berggren
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Service</span>
                <span className="text-sm font-semibold text-gray-900">
                  {TEST_SERVICE}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-sm font-semibold text-gray-900">
                  {TEST_DATE}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Time</span>
                <span className="text-sm font-semibold text-gray-900">
                  {TEST_TIME_START} – {TEST_TIME_END}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Pet</span>
                <span className="text-sm font-semibold text-gray-900">
                  {TEST_PET_NAME} ({TEST_PET_BREED})
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-indigo-700">{TEST_TOTAL}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                disabled
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11"
                data-ocid="booking_test.view_bookings_button"
              >
                View My Bookings
              </Button>
              <p className="text-xs text-gray-400">
                A confirmation email has been sent to {TEST_CLIENT_EMAIL}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </StepSection>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BookingTestPage() {
  const stepsRef = useRef<HTMLDivElement>(null);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Green banner */}
      <div
        className="w-full bg-emerald-600 text-white text-center py-2.5 px-4 text-sm font-medium"
        data-ocid="booking_test.banner"
      >
        <span className="font-bold">Booking Flow Test Page</span> — this is a
        visual preview, not a real booking &nbsp;·&nbsp; ZIP: {TEST_ZIP}
        &nbsp;·&nbsp; Sitter: Bailey Berggren
      </div>

      {/* Sticky step nav */}
      <div
        className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm"
        ref={stepsRef}
      >
        <div className="max-w-4xl mx-auto px-4 py-0">
          <div className="flex items-center overflow-x-auto gap-1 py-3 scrollbar-hide">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  i === 0
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                data-ocid={`booking_test.step_nav.${i + 1}`}
              >
                <Award className="w-3 h-3" />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Page header */}
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Pawspect Booking Flow
        </h1>
        <p className="text-gray-500 mt-1">
          Full visual walkthrough of all 6 booking steps — Boulder, CO 80304 →
          Bailey Berggren → Dog Walking
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-16">
        <Step1ZipEntry />
        <Step2ServiceDate />
        <Step3SitterSelection />
        <Step4PetInfo />
        <Step5Review />
        <Step6Confirmation />
      </div>
    </div>
  );
}
