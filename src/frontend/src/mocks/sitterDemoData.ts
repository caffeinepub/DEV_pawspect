/**
 * Rich realistic demo dataset for the Sitter Portal Demo (Morgan Pawley).
 * All amounts are in cents. All timestamps are BigInt nanoseconds.
 *
 * NOTE: No imports from ../backend — enum values are inlined as string literals
 * to avoid triggering backend actor initialization before the app tree is ready.
 *
 * Timestamps are relative to Date.now() so they stay "live" across sessions.
 */

const now = Date.now();
const ns = (ms: number): bigint => BigInt(Math.floor(ms)) * 1_000_000n;
const daysAgo = (d: number) => now - d * 86_400_000;
const daysFrom = (d: number) => now + d * 86_400_000;

// Helper: build a timestamp at a specific hour on a day offset from now
const dayAtHour = (dayOffset: number, hour: number, minute = 0) =>
  daysFrom(dayOffset) -
  new Date(daysFrom(dayOffset)).getHours() * 3600000 -
  new Date(daysFrom(dayOffset)).getMinutes() * 60000 -
  new Date(daysFrom(dayOffset)).getSeconds() * 1000 -
  new Date(daysFrom(dayOffset)).getMilliseconds() +
  hour * 3600000 +
  minute * 60000;

// ── Demo Sitter ────────────────────────────────────────────────────────────────
export const demoSitter = {
  id: BigInt(9001),
  name: "Morgan Pawley",
  bio: "Professional pet sitter with 5 years of experience in Boulder, CO. CPR certified, fully insured, and passionate about giving pets the love and attention they deserve while their families are away. I treat every pet like my own — from energetic pups to shy cats and everything in between. [badges:CPR Certified,Insured,5 Years Experience]",
  services: [
    "Dog Walking",
    "Cat Sitting",
    "Drop-In Visit",
    "Dog Boarding",
    "Overnight Stay",
    "Dog Bath",
  ],
  hourlyRate: BigInt(18),
  location: "Boulder, CO",
  photoUrl: "",
  phone: "303-555-0178",
  rating: 4.9,
  reviewCount: BigInt(47),
  isActive: true,
  owner: undefined,
  serviceRates: [
    { service: "Dog Walking", ratePerHour: BigInt(18) },
    { service: "Cat Sitting", ratePerHour: BigInt(15) },
    { service: "Drop-In Visit", ratePerHour: BigInt(20) },
    { service: "Dog Boarding", ratePerHour: BigInt(45) },
    { service: "Overnight Stay", ratePerHour: BigInt(55) },
    { service: "Dog Bath", ratePerHour: BigInt(25) },
  ],
  /** Page builder toggle state — realistic demo mix showing sitters can
   *  selectively hide sections they haven't filled out yet. */
  pageComponents: {
    showGallery: true,
    showAvailability: true,
    showStats: true,
    showCertifications: false, // not filled out yet — shows value of toggle
    showResponseTime: true,
    showPromo: false, // no active promo pinned
    showRepeatClients: true,
    showReviews: true,
    showPetTypes: true,
    showCredentials: true, // 4 of 7 credentials checked — on display
  },
  /** Self-reported professional credentials checklist (4 of 7 checked) */
  credentialChecklist: {
    hasBusinessLicense: false,
    isInsuredAndBonded: true,
    hasBackgroundCheck: true,
    hasReferences: true,
    usesServiceAgreement: true,
    hasCertificationOrTraining: false,
    isProfessionalMember: false,
  },
};

// ── Demo Bookings ──────────────────────────────────────────────────────────────
// IMPORTANT: AgendaTab.BookingLike expects pets[].name (not petName).
// All bookings use `name` property so AgendaTab renders them correctly.
// Timestamps use dayAtHour() so bookings fall in visible agenda time slots (7AM–9PM).
export const demoBookings = [
  // 1. TODAY confirmed — Jamie Chen, Dog Walking at 9 AM (shows in day view)
  {
    id: BigInt(2001),
    status: "confirmed",
    startDate: ns(dayAtHour(0, 9)),
    endDate: ns(dayAtHour(0, 10)),
    clientName: "Jamie Chen",
    clientEmail: "jamie.chen@example.com",
    clientPhone: "3035550101",
    pets: [
      {
        name: "Biscuit",
        petName: "Biscuit",
        petType: "Dog",
        breed: "Golden Retriever",
        petNotes: "Loves fetch, gets excited around squirrels",
      },
    ],
    services: ["Dog Walking"],
    sitterIds: [BigInt(9001)],
    notes: "Please use the side gate. Key is under the mat.",
    isRecurring: false,
    isRebook: false,
    createdAt: ns(daysAgo(3)),
    serviceSchedule: [
      {
        date: new Date(dayAtHour(0, 9)).toISOString().split("T")[0],
        slots: [
          {
            service: "Dog Walking",
            startTime: "09:00",
            endTime: "10:00",
            sitterId: BigInt(9001),
            durationMinutes: BigInt(60),
            ratePerHour: BigInt(18),
          },
        ],
      },
    ],
  },
  // 2. TOMORROW confirmed — Alex Rivera, Cat Sitting at 10 AM
  {
    id: BigInt(2002),
    status: "confirmed",
    startDate: ns(dayAtHour(1, 10)),
    endDate: ns(dayAtHour(2, 10)),
    clientName: "Alex Rivera",
    clientEmail: "alex.rivera@example.com",
    clientPhone: "3035550202",
    pets: [
      {
        name: "Luna",
        petName: "Luna",
        petType: "Cat",
        breed: "Siamese",
        petNotes:
          "Shy at first but warms up quickly. Needs wet food twice daily.",
      },
    ],
    services: ["Cat Sitting"],
    sitterIds: [BigInt(9001)],
    notes:
      "Luna likes to hide under the bed initially — don't worry, she'll come out.",
    isRecurring: false,
    isRebook: true,
    createdAt: ns(daysAgo(5)),
    serviceSchedule: [
      {
        date: new Date(dayAtHour(1, 10)).toISOString().split("T")[0],
        slots: [
          {
            service: "Cat Sitting",
            startTime: "10:00",
            endTime: "11:00",
            sitterId: BigInt(9001),
            durationMinutes: BigInt(60),
            ratePerHour: BigInt(15),
          },
        ],
      },
    ],
  },
  // 3. Pending — Sam Torres, Drop-In Visit in 3 days at 2 PM
  {
    id: BigInt(2003),
    status: "pending",
    startDate: ns(dayAtHour(3, 14)),
    endDate: ns(dayAtHour(3, 14, 30)),
    clientName: "Sam Torres",
    clientEmail: "sam.torres@example.com",
    clientPhone: "3035550303",
    pets: [
      {
        name: "Mochi",
        petName: "Mochi",
        petType: "Dog",
        breed: "Shih Tzu",
        petNotes: "Loves cuddles and treats",
      },
    ],
    services: ["Drop-In Visit"],
    sitterIds: [BigInt(9001)],
    notes: "30-minute visit to feed and play.",
    isRecurring: false,
    isRebook: false,
    createdAt: ns(daysAgo(1)),
    serviceSchedule: [
      {
        date: new Date(dayAtHour(3, 14)).toISOString().split("T")[0],
        slots: [
          {
            service: "Drop-In Visit",
            startTime: "14:00",
            endTime: "14:30",
            sitterId: BigInt(9001),
            durationMinutes: BigInt(30),
            ratePerHour: BigInt(20),
          },
        ],
      },
    ],
  },
  // 4. Pending — Jordan Kim, Meet & Greet in 5 days at 11 AM
  {
    id: BigInt(2004),
    status: "pending",
    startDate: ns(dayAtHour(5, 11)),
    endDate: ns(dayAtHour(5, 11, 30)),
    clientName: "Jordan Kim",
    clientEmail: "jordan.kim@example.com",
    clientPhone: "3035550404",
    pets: [
      {
        name: "Pepper",
        petName: "Pepper",
        petType: "Dog",
        breed: "Border Collie",
        petNotes: "High energy, needs lots of stimulation",
      },
    ],
    services: ["Drop-In Visit"],
    sitterIds: [BigInt(9001)],
    notes:
      "Meet & greet to see if Morgan is a good fit for our high-energy boy.",
    isRecurring: false,
    isRebook: false,
    createdAt: ns(daysAgo(0)),
    serviceSchedule: [
      {
        date: new Date(dayAtHour(5, 11)).toISOString().split("T")[0],
        slots: [
          {
            service: "Drop-In Visit",
            startTime: "11:00",
            endTime: "11:30",
            sitterId: BigInt(9001),
            durationMinutes: BigInt(30),
            ratePerHour: BigInt(20),
          },
        ],
      },
    ],
  },
  // 5. Completed — Jamie Chen, Dog Walking (7 days ago — paid)
  {
    id: BigInt(2005),
    status: "completed",
    startDate: ns(dayAtHour(-7, 9)),
    endDate: ns(dayAtHour(-7, 10)),
    clientName: "Jamie Chen",
    clientEmail: "jamie.chen@example.com",
    clientPhone: "3035550101",
    pets: [
      {
        name: "Biscuit",
        petName: "Biscuit",
        petType: "Dog",
        breed: "Golden Retriever",
        petNotes: "Loves fetch",
      },
    ],
    services: ["Dog Walking"],
    sitterIds: [BigInt(9001)],
    notes: "",
    isRecurring: false,
    isRebook: true,
    createdAt: ns(daysAgo(10)),
    serviceSchedule: [
      {
        date: new Date(daysAgo(7)).toISOString().split("T")[0],
        slots: [
          {
            service: "Dog Walking",
            startTime: "09:00",
            endTime: "10:00",
            sitterId: BigInt(9001),
            durationMinutes: BigInt(60),
            ratePerHour: BigInt(18),
          },
        ],
      },
    ],
  },
  // 6. Completed — Casey Morgan, Dog Bath + Drop-In (12 days ago — paid)
  {
    id: BigInt(2006),
    status: "completed",
    startDate: ns(dayAtHour(-12, 10)),
    endDate: ns(dayAtHour(-12, 11, 30)),
    clientName: "Casey Morgan",
    clientEmail: "casey.morgan@example.com",
    clientPhone: "3035550505",
    pets: [
      {
        name: "Scout",
        petName: "Scout",
        petType: "Dog",
        breed: "Labrador",
        petNotes: "Loves water, easy to bathe",
      },
    ],
    services: ["Dog Bath", "Drop-In Visit"],
    sitterIds: [BigInt(9001)],
    notes: "Scout rolled in mud — extra wash needed.",
    isRecurring: false,
    isRebook: false,
    createdAt: ns(daysAgo(14)),
    serviceSchedule: [],
  },
  // 7. Completed — Alex Rivera, Cat Sitting 2 days (18–16 days ago — paid with discount)
  {
    id: BigInt(2007),
    status: "completed",
    startDate: ns(daysAgo(18)),
    endDate: ns(daysAgo(16)),
    clientName: "Alex Rivera",
    clientEmail: "alex.rivera@example.com",
    clientPhone: "3035550202",
    pets: [
      {
        name: "Luna",
        petName: "Luna",
        petType: "Cat",
        breed: "Siamese",
        petNotes: "Shy but sweet",
      },
    ],
    services: ["Cat Sitting"],
    sitterIds: [BigInt(9001)],
    notes: "2-day cat sitting while owner travels.",
    isRecurring: false,
    isRebook: false,
    createdAt: ns(daysAgo(21)),
    serviceSchedule: [],
  },
  // 8. Completed — Sam Torres, Dog Boarding (25–23 days ago — paid)
  {
    id: BigInt(2008),
    status: "completed",
    startDate: ns(daysAgo(25)),
    endDate: ns(daysAgo(23)),
    clientName: "Sam Torres",
    clientEmail: "sam.torres@example.com",
    clientPhone: "3035550303",
    pets: [
      {
        name: "Mochi",
        petName: "Mochi",
        petType: "Dog",
        breed: "Shih Tzu",
        petNotes: "Loves cuddles",
      },
    ],
    services: ["Dog Boarding"],
    sitterIds: [BigInt(9001)],
    notes: "Boarding for 2 nights while Sam is out of town.",
    isRecurring: false,
    isRebook: false,
    createdAt: ns(daysAgo(28)),
    serviceSchedule: [],
  },
  // 9. Completed — Casey Morgan, Dog Walking (22 days ago — paid)
  {
    id: BigInt(2009),
    status: "completed",
    startDate: ns(dayAtHour(-22, 9)),
    endDate: ns(dayAtHour(-22, 10)),
    clientName: "Casey Morgan",
    clientEmail: "casey.morgan@example.com",
    clientPhone: "3035550505",
    pets: [
      {
        name: "Scout",
        petName: "Scout",
        petType: "Dog",
        breed: "Labrador",
        petNotes: "Very fast walker",
      },
    ],
    services: ["Dog Walking"],
    sitterIds: [BigInt(9001)],
    notes: "",
    isRecurring: false,
    isRebook: false,
    createdAt: ns(daysAgo(24)),
    serviceSchedule: [],
  },
  // 10. Confirmed future — Jordan Kim, Dog Walking in 4 days at 9 AM
  {
    id: BigInt(2010),
    status: "confirmed",
    startDate: ns(dayAtHour(4, 9)),
    endDate: ns(dayAtHour(4, 10)),
    clientName: "Jordan Kim",
    clientEmail: "jordan.kim@example.com",
    clientPhone: "3035550404",
    pets: [
      {
        name: "Pepper",
        petName: "Pepper",
        petType: "Dog",
        breed: "Border Collie",
        petNotes: "Needs a long run",
      },
    ],
    services: ["Dog Walking"],
    sitterIds: [BigInt(9001)],
    notes: "Saturday morning walk — Pepper gets very excited!",
    isRecurring: true,
    isRebook: false,
    createdAt: ns(daysAgo(8)),
    serviceSchedule: [
      {
        date: new Date(dayAtHour(4, 9)).toISOString().split("T")[0],
        slots: [
          {
            service: "Dog Walking",
            startTime: "09:00",
            endTime: "10:00",
            sitterId: BigInt(9001),
            durationMinutes: BigInt(60),
            ratePerHour: BigInt(18),
          },
        ],
      },
    ],
  },
  // 11. Declined — Taylor Smith, Dog Walking (4 days ago — declined with alternatives)
  {
    id: BigInt(2011),
    status: "declined",
    startDate: ns(dayAtHour(-4, 10)),
    endDate: ns(dayAtHour(-4, 11)),
    clientName: "Taylor Smith",
    clientEmail: "taylor.smith@example.com",
    clientPhone: "3035550606",
    pets: [
      {
        name: "Bella",
        petName: "Bella",
        petType: "Dog",
        breed: "Golden Retriever",
        petNotes: "Very friendly, pulls on leash",
      },
    ],
    services: ["Dog Walking"],
    sitterIds: [BigInt(9001)],
    notes: "",
    isRecurring: false,
    isRebook: false,
    createdAt: ns(daysAgo(5)),
    serviceSchedule: [
      {
        date: new Date(daysAgo(4)).toISOString().split("T")[0],
        slots: [
          {
            service: "Dog Walking",
            startTime: "10:00",
            endTime: "11:00",
            sitterId: BigInt(9001),
            durationMinutes: BigInt(60),
            ratePerHour: BigInt(18),
          },
        ],
      },
    ],
    declineReason:
      "I have a family commitment that came up unexpectedly and can't make this time work. I'd love to help — please check the alternative windows below!",
    alternativeWindows: [
      {
        date: new Date(daysFrom(1)).toISOString().split("T")[0],
        time: "09:00",
        duration: "1 hour",
      },
      {
        date: new Date(daysFrom(2)).toISOString().split("T")[0],
        time: "14:00",
        duration: "1 hour",
      },
    ],
  },
];

// ── Demo Payments ──────────────────────────────────────────────────────────────
export const demoPayments = [
  // Paid — booking 2005 (Dog Walking $18)
  {
    bookingId: BigInt(2005),
    status: "paid",
    method: "manual",
    totalAmount: BigInt(1800), // $18.00
    confirmedAt: ns(daysAgo(5)),
    paidDate: new Date(daysAgo(5)).toISOString().split("T")[0],
    splits: [{ sitterId: BigInt(9001), paid: true, amount: BigInt(1800) }],
    adHocItems: [],
  },
  // Paid — booking 2006 (Dog Bath $25 + Drop-In $20 = $45)
  {
    bookingId: BigInt(2006),
    status: "paid",
    method: "manual",
    totalAmount: BigInt(4500), // $45.00
    confirmedAt: ns(daysAgo(10)),
    paidDate: new Date(daysAgo(10)).toISOString().split("T")[0],
    splits: [{ sitterId: BigInt(9001), paid: true, amount: BigInt(4500) }],
    adHocItems: [
      { description: "Extra playtime - 30 min", amountCents: BigInt(1000) },
    ],
  },
  // Paid — booking 2007 (Cat Sitting 2 days, 10% return client discount: $120 → $108)
  {
    bookingId: BigInt(2007),
    status: "paid",
    method: "manual",
    totalAmount: BigInt(10800), // $108.00
    originalAmount: BigInt(12000), // $120.00 before discount
    discountPercent: BigInt(10),
    discountAmount: BigInt(1200),
    confirmedAt: ns(daysAgo(14)),
    paidDate: new Date(daysAgo(14)).toISOString().split("T")[0],
    splits: [{ sitterId: BigInt(9001), paid: true, amount: BigInt(10800) }],
    adHocItems: [],
  },
  // Paid — booking 2008 (Dog Boarding 2 nights: $45×2 = $90)
  {
    bookingId: BigInt(2008),
    status: "paid",
    method: "manual",
    totalAmount: BigInt(9000), // $90.00
    confirmedAt: ns(daysAgo(21)),
    paidDate: new Date(daysAgo(21)).toISOString().split("T")[0],
    splits: [{ sitterId: BigInt(9001), paid: true, amount: BigInt(9000) }],
    adHocItems: [],
  },
  // Paid — booking 2009 (Dog Walking $18)
  {
    bookingId: BigInt(2009),
    status: "paid",
    method: "manual",
    totalAmount: BigInt(1800), // $18.00
    confirmedAt: ns(daysAgo(20)),
    paidDate: new Date(daysAgo(20)).toISOString().split("T")[0],
    splits: [{ sitterId: BigInt(9001), paid: true, amount: BigInt(1800) }],
    adHocItems: [],
  },
  // Pending — booking 2001 (Dog Walking $18)
  {
    bookingId: BigInt(2001),
    status: "pending",
    method: "manual",
    totalAmount: BigInt(1800), // $18.00 (pending)
    splits: [{ sitterId: BigInt(9001), paid: false, amount: BigInt(1800) }],
    adHocItems: [],
  },
  // Pending — booking 2002 (Cat Sitting: $95 pending)
  {
    bookingId: BigInt(2002),
    status: "pending",
    method: "manual",
    totalAmount: BigInt(9500), // $95.00 (pending)
    splits: [{ sitterId: BigInt(9001), paid: false, amount: BigInt(9500) }],
    adHocItems: [],
  },
  // Pending — booking 2003 (Drop-In $55 pending)
  {
    bookingId: BigInt(2003),
    status: "pending",
    method: "manual",
    totalAmount: BigInt(5500), // $55.00
    splits: [{ sitterId: BigInt(9001), paid: false, amount: BigInt(5500) }],
    adHocItems: [],
  },
];

// ── Demo Availability ──────────────────────────────────────────────────────────
export const demoAvailability = [
  { dayOfWeek: BigInt(1), startTime: BigInt(8 * 60), endTime: BigInt(18 * 60) }, // Mon
  { dayOfWeek: BigInt(2), startTime: BigInt(8 * 60), endTime: BigInt(18 * 60) }, // Tue
  { dayOfWeek: BigInt(3), startTime: BigInt(8 * 60), endTime: BigInt(18 * 60) }, // Wed
  { dayOfWeek: BigInt(4), startTime: BigInt(8 * 60), endTime: BigInt(18 * 60) }, // Thu
  { dayOfWeek: BigInt(5), startTime: BigInt(8 * 60), endTime: BigInt(18 * 60) }, // Fri
  { dayOfWeek: BigInt(6), startTime: BigInt(9 * 60), endTime: BigInt(15 * 60) }, // Sat
  // Sun (0) not available
];

// ── Demo Service Logs ──────────────────────────────────────────────────────────
export const demoServiceLogs = [
  {
    id: BigInt(3001),
    status: "completed",
    bookingId: BigInt(2005),
    sitterId: BigInt(9001),
    notes:
      "Biscuit was so energetic today! Had a great 60-minute walk through Chautauqua Park. He spotted a squirrel but stayed focused. Home safe, water bowl filled.",
    createdAt: ns(daysAgo(7) + 3_600_000),
    startTime: ns(daysAgo(7)),
    stopTime: ns(daysAgo(7) + 3_600_000),
  },
  {
    id: BigInt(3002),
    status: "completed",
    bookingId: BigInt(2006),
    sitterId: BigInt(9001),
    notes:
      "Scout's bath went great — he actually loved the water! Did a thorough scrub, blow-dry, and 30-min playtime after. He came home smelling like a champ.",
    createdAt: ns(daysAgo(12) + 5_400_000),
    startTime: ns(daysAgo(12)),
    stopTime: ns(daysAgo(12) + 5_400_000),
  },
  {
    id: BigInt(3003),
    status: "completed",
    bookingId: BigInt(2007),
    sitterId: BigInt(9001),
    notes:
      "Luna seemed anxious on day 1 — notified owner immediately via text. By day 2 she was curled up on my lap. Fed twice daily, litter box kept clean, sent daily photo updates.",
    createdAt: ns(daysAgo(16)),
    startTime: ns(daysAgo(18)),
    stopTime: ns(daysAgo(16)),
    issueReported: true,
    issueNote: "Luna seemed anxious on arrival — notified owner immediately.",
  },
  {
    id: BigInt(3004),
    status: "completed",
    bookingId: BigInt(2009),
    sitterId: BigInt(9001),
    notes:
      "Scout's morning walk — had a big run around the park. He was a total star on the leash today. Dropped off happy and tired. ❤️",
    createdAt: ns(daysAgo(22) + 3_600_000),
    startTime: ns(daysAgo(22)),
    stopTime: ns(daysAgo(22) + 3_600_000),
  },
];

// ── Demo Reviews ───────────────────────────────────────────────────────────────
export const demoReviews = [
  {
    bookingId: BigInt(2005),
    rating: 5,
    reviewText:
      "Morgan was amazing with Biscuit! He came home so happy and tired — exactly what we hoped for. Will definitely book again!",
    createdAt: ns(daysAgo(4)),
    clientName: "Jamie Chen",
  },
  {
    bookingId: BigInt(2006),
    rating: 5,
    reviewText:
      "Scout looked AND smelled like a totally new dog after Morgan's bath session. Bonus playtime was such a lovely touch. Highly recommend!",
    createdAt: ns(daysAgo(9)),
    clientName: "Casey Morgan",
  },
  {
    bookingId: BigInt(2007),
    rating: 5,
    reviewText:
      "Morgan was our nervous rescue pup's sitter and she handled Luna's anxiety with so much patience. The daily updates and photos were a lifesaver. 10/10.",
    createdAt: ns(daysAgo(13)),
    clientName: "Alex Rivera",
  },
  {
    bookingId: BigInt(2008),
    rating: 4,
    reviewText:
      "Mochi had a wonderful stay. Morgan is super communicative and clearly cares about the animals. Would book again without hesitation.",
    createdAt: ns(daysAgo(20)),
    clientName: "Sam Torres",
  },
  {
    bookingId: BigInt(2009),
    rating: 5,
    reviewText:
      "Scout's walk was perfect. Morgan is reliable, on time, and clearly loves dogs. Our go-to sitter for walks!",
    createdAt: ns(daysAgo(19)),
    clientName: "Casey Morgan",
  },
];

// ── Demo Tips ──────────────────────────────────────────────────────────────────
export const demoTips = [
  {
    bookingId: BigInt(2005),
    amountCents: BigInt(1000),
    clientName: "Jamie Chen",
    createdAt: ns(daysAgo(4)),
  },
  {
    bookingId: BigInt(2006),
    amountCents: BigInt(1500),
    clientName: "Casey Morgan",
    createdAt: ns(daysAgo(9)),
  },
  {
    bookingId: BigInt(2007),
    amountCents: BigInt(1200),
    clientName: "Alex Rivera",
    createdAt: ns(daysAgo(13)),
  },
];

// ── Demo Private Data ──────────────────────────────────────────────────────────
export const demoPrivateData = {
  emergencyContact: undefined,
  earningsGoal: 150000, // $1,500 in cents
};

// ── Demo Sitter Stats ──────────────────────────────────────────────────────────
export const demoSitterStats = {
  repeatClientCount: BigInt(3),
  totalEarningsCents: BigInt(284000), // $2,840
  currentMonthEarningsCents: BigInt(68000), // $680
  repeatClientRatePct: 78,
  totalCompletedBookings: BigInt(23),
};

// ── Demo CRM Clients ───────────────────────────────────────────────────────────
export const demoCRMClients = [
  {
    clientName: "Jamie Chen",
    clientEmail: "jamie.chen@example.com",
    clientPhone: "303-555-0101",
    lastBookingDate: ns(daysAgo(7)),
    totalBookings: 8,
    totalSpent: 18400, // $184.00
    tag: "VIP" as const,
    pets: ["Biscuit (Golden Retriever)"],
  },
  {
    clientName: "Casey Morgan",
    clientEmail: "casey.morgan@example.com",
    clientPhone: "303-555-0505",
    lastBookingDate: ns(daysAgo(12)),
    totalBookings: 5,
    totalSpent: 22500, // $225.00
    tag: "VIP" as const,
    pets: ["Scout (Labrador)"],
  },
  {
    clientName: "Alex Rivera",
    clientEmail: "alex.rivera@example.com",
    clientPhone: "303-555-0202",
    lastBookingDate: ns(daysAgo(18)),
    totalBookings: 3,
    totalSpent: 32400, // $324.00
    tag: "Regular" as const,
    pets: ["Luna (Siamese Cat)"],
  },
  {
    clientName: "Sam Torres",
    clientEmail: "sam.torres@example.com",
    clientPhone: "303-555-0303",
    lastBookingDate: ns(daysAgo(25)),
    totalBookings: 2,
    totalSpent: 14500, // $145.00
    tag: "Regular" as const,
    pets: ["Mochi (Shih Tzu)"],
  },
  {
    clientName: "Jordan Kim",
    clientEmail: "jordan.kim@example.com",
    clientPhone: "303-555-0404",
    lastBookingDate: ns(daysAgo(0)),
    totalBookings: 1,
    totalSpent: 0,
    tag: "New" as const,
    pets: ["Pepper (Border Collie)"],
  },
];

// ── Demo Deal Offers ───────────────────────────────────────────────────────────
export const demoDealOffers = [
  {
    id: "offer-demo-1",
    couponCode: "LOYAL20",
    description: "20% off for returning clients — thank you for your loyalty!",
    discountType: "percent" as const,
    discountValue: 20,
    expirationDate: ns(daysFrom(14)),
    clientEmails: ["jamie.chen@example.com", "casey.morgan@example.com"],
    redeemedCount: 1,
    isActive: true,
    sentDate: ns(daysAgo(3)),
  },
  {
    id: "offer-demo-2",
    couponCode: "SPRING10",
    description: "Spring special — $10 off your next dog walk or drop-in visit",
    discountType: "fixed" as const,
    discountValue: 10,
    expirationDate: ns(daysFrom(30)),
    clientEmails: [
      "jamie.chen@example.com",
      "casey.morgan@example.com",
      "alex.rivera@example.com",
      "sam.torres@example.com",
    ],
    redeemedCount: 2,
    isActive: true,
    sentDate: ns(daysAgo(7)),
  },
  {
    id: "offer-demo-3",
    couponCode: "WINTER15",
    description: "Holiday appreciation — 15% off any boarding service",
    discountType: "percent" as const,
    discountValue: 15,
    expirationDate: ns(daysAgo(30)),
    clientEmails: ["alex.rivera@example.com", "sam.torres@example.com"],
    redeemedCount: 1,
    isActive: false,
    sentDate: ns(daysAgo(75)),
  },
];
