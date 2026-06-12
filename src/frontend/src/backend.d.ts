import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CredentialChecklist {
    isProfessionalMember?: boolean;
    hasCertificationOrTraining?: boolean;
    hasReferences?: boolean;
    hasBusinessLicense?: boolean;
    isInsuredAndBonded?: boolean;
    usesServiceAgreement?: boolean;
    hasBackgroundCheck?: boolean;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface BookingGroup {
    startTime: string;
    status: GroupStatus;
    clientInfo: ClientInfo;
    sitterId: bigint;
    endTime: string;
    createdAt: Time;
    occurrenceIds: Array<bigint>;
    recurrenceRule: RecurrenceRule;
    serviceIds: Array<string>;
    groupId: string;
    petInfo: Array<PetInfo>;
}
export interface Update {
    id: Id;
    bio: string;
    name: string;
    hourlyRate: bigint;
    photoUrl: string;
    isActive: boolean;
    phone: string;
    location: string;
    services: Array<string>;
}
export interface Public__3 {
    bookingId: bigint;
    sitterId: bigint;
    clientName: string;
    createdAt: Time;
    amountCents: bigint;
}
export interface SubscriptionRecord {
    isFrozen: boolean;
    frozenAt?: bigint;
    stripeSubscriptionId?: string;
    trialExpiredEmailSent?: boolean;
    isFreePlan?: boolean;
    stripeCustomerId?: string;
    lastPaymentAt?: bigint;
    isSubscribed: boolean;
    trialReminderSent?: boolean;
    subscriptionStartedAt?: bigint;
    trialStartedAt?: bigint;
}
export interface SitterBookingStats {
    completedVisits: bigint;
    totalBookings: bigint;
    uniqueClients: bigint;
    repeatClients: bigint;
}
export interface JobThread {
    status: Variant_closed_open;
    bookingId: bigint;
    createdAt: bigint;
    duties: Array<DutyAssignment>;
    teamId: string;
    threadId: string;
}
export interface DealOffer {
    id: string;
    redeemedBy: Array<string>;
    redeemedCount: bigint;
    couponCode: string;
    discountValue: number;
    sitterId: bigint;
    discountType: DiscountType;
    description: string;
    sentAt: bigint;
    isActive: boolean;
    expirationDate: bigint;
    maxUses?: bigint;
    clientEmails: Array<string>;
}
export interface Public__4 {
    id: string;
    status: TicketStatus;
    sitterId: Principal;
    createdAt: bigint;
    accessRevokedAt?: bigint;
    accessGrantedAt?: bigint;
    issue: string;
    adminNotes?: string;
    sitterName: string;
    resolvedAt?: bigint;
}
export interface Creation {
    startTime?: Time;
    status: ServiceStatus;
    bookingId: Id;
    sitterId: Id;
    notes: string;
}
export interface Creation__1 {
    bio: string;
    birthdate?: bigint;
    name: string;
    hourlyRate: bigint;
    photoUrl: string;
    phone: string;
    location: string;
    services: Array<string>;
}
export interface NotificationRecord {
    id: bigint;
    title: string;
    body: string;
    notificationType: string;
    createdAt: bigint;
    isRead: boolean;
    recipientSitterId: bigint;
}
export interface RecurringGroupCreation {
    agreements: BookingAgreements;
    startTime: string;
    totalCostCents: bigint;
    clientInfo: ClientInfo;
    sitterId: bigint;
    endTime: string;
    serviceDuration: bigint;
    recurrenceRule: RecurrenceRule;
    serviceIds: Array<string>;
    petInfo: Array<PetInfo>;
}
export interface Public__1 {
    service: string;
    ratePerHour: bigint;
}
export interface Creation__2 {
    method: PaymentMethod;
    bookingId: Id;
    totalAmount: bigint;
    notes?: string;
    splits: Array<PaymentSplit>;
}
export interface DayServiceSchedule {
    date: string;
    slots: Array<ServiceSlot>;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface CoBookingAssignment {
    bookingId: bigint;
    assignments: Array<[bigint, string]>;
    teamId: string;
    splitAmounts: Array<[bigint, bigint]>;
}
export interface Team {
    status: Variant_active_dissolved;
    name: string;
    createdAt: bigint;
    memberIds: Array<bigint>;
    teamId: string;
    splitPercentages: Array<[bigint, bigint]>;
}
export interface TeamMessage {
    msgId: string;
    content: string;
    msgType: Variant_channel_jobThread;
    threadBookingId?: bigint;
    senderSitterId: bigint;
    sentAt: bigint;
    teamId: string;
}
export interface Public__2 {
    id: Id;
    startTime?: Time;
    status: ServiceStatus;
    bookingId: Id;
    sitterId: Id;
    createdAt: Time;
    stopTime?: Time;
    notes: string;
}
export interface TimeSlot {
    startTime: Time;
    endTime: Time;
}
export interface AdHocLineItem {
    createdAt: bigint;
    description: string;
    amountCents: bigint;
}
export interface SitterLicenseStatus {
    trialDaysRemaining?: bigint;
    trialActive: boolean;
    isFrozen: boolean;
    isGrandfathered: boolean;
    stripeSubscriptionId?: string;
    subscriptionStatus: string;
    stripeCustomerId?: string;
    isSubscribed: boolean;
    isLicensed: boolean;
    trialStartedAt?: bigint;
}
export interface DaySchedule {
    date: Time;
    slots: Array<TimeSlot>;
}
export interface Public {
    id: bigint;
    bio: string;
    owner?: Principal;
    birthdate?: bigint;
    name: string;
    hourlyRate: bigint;
    photoUrl: string;
    isAnonymized?: boolean;
    isActive: boolean;
    serviceRates: Array<Public__1>;
    rating: number;
    phone: string;
    reviewCount: bigint;
    location: string;
    services: Array<string>;
}
export interface Creation__3 {
    tip?: bigint;
    agreements?: BookingAgreements;
    endDate: Time;
    serviceSchedule?: Array<DayServiceSchedule>;
    isRecurring: boolean;
    clientName: string;
    adHocClientContact?: string;
    pets: Array<Pet>;
    clientEmail: string;
    recurrencePattern?: RecurrencePattern;
    recurrenceEndDate?: Time;
    notes: string;
    clientPhone: string;
    isAdHoc?: boolean;
    schedule?: Array<DaySchedule>;
    callRequest?: boolean;
    sitterIds: Array<bigint>;
    services: Array<string>;
    startDate: Time;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface AvailabilityEntry {
    startTime: bigint;
    endTime: bigint;
    dayOfWeek: bigint;
}
export interface RecurrenceRule {
    occurrenceCount?: bigint;
    pattern: RecurrencePattern;
    endDate?: Time;
    daysOfWeek: Uint8Array;
    startDate: Time;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface BookingAgreements {
    terms: boolean;
    termsVersion: bigint;
    cancellationPolicy: boolean;
    communications: boolean;
    nonEmploymentAck: boolean;
    privacy: boolean;
    callRequest: boolean;
}
export interface ServiceSlot {
    service: string;
    startTime: string;
    sitterId: bigint;
    endTime: string;
    durationMinutes: bigint;
    ratePerHour: bigint;
}
export type PaymentMethodDetails = {
    __kind__: "venmo";
    venmo: {
        handle: string;
    };
} | {
    __kind__: "cash";
    cash: {
        instructions: string;
    };
} | {
    __kind__: "applePayCash";
    applePayCash: {
        sitterPhone: string;
    };
};
export interface PetInfo {
    name: string;
    type: string;
    notes: string;
    breed: string;
}
export interface DutyTask {
    doneAt?: bigint;
    done: boolean;
    taskId: string;
    taskLabel: string;
}
export interface UserProfile {
    name: string;
    role: string;
    email?: string;
}
export type Time = bigint;
export interface CRMClient {
    clientName: string;
    lastBookingDate: bigint;
    tags: Array<string>;
    clientEmail: string;
    totalSpent: number;
    clientPhone: string;
    bookingCount: bigint;
}
export interface PageComponentVisibility {
    showAvailability: boolean;
    showCredentials: boolean;
    showResponseTime: boolean;
    showCertifications: boolean;
    showPetTypes: boolean;
    showStats: boolean;
    showGallery: boolean;
    showPromo: boolean;
    showReviews: boolean;
    showRepeatClients: boolean;
}
export interface UpdateSplits {
    bookingId: Id;
    splits: Array<PaymentSplit>;
}
export interface Pet {
    petNotes?: string;
    petName: string;
    petType: string;
    breed?: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface PaymentSplit {
    sitterId: Id;
    paid: boolean;
    amount: bigint;
}
export interface OccurrenceAvailability {
    date: Time;
    available: boolean;
    conflictReason?: string;
}
export interface TeamInvite {
    status: Variant_expired_pending_accepted_declined;
    expiresAt: bigint;
    inviteId: string;
    createdAt: bigint;
    toSitterId?: bigint;
    inviteCode: string;
    teamId?: string;
    fromSitterId: bigint;
}
export interface Public__7 {
    id: Id;
    action: AuditAction;
    snapshot: string;
    entityId: bigint;
    timestamp: Time;
    entityType: string;
    deletedBy: Principal;
}
export interface AlternativeWindow {
    duration: string;
    date: string;
    time: string;
}
export interface Public__8 {
    id: Id;
    tip?: bigint;
    agreements?: BookingAgreements;
    status: BookingStatus;
    paymentSessionId?: string;
    endDate: Time;
    serviceSchedule?: Array<DayServiceSchedule>;
    isRecurring: boolean;
    clientName: string;
    adHocClientContact?: string;
    createdAt: Time;
    pets: Array<Pet>;
    clientEmail: string;
    recurrencePattern?: RecurrencePattern;
    recurrenceEndDate?: Time;
    alternativeWindows?: Array<AlternativeWindow>;
    notes: string;
    clientPhone: string;
    stripePaymentIntentId?: string;
    isAdHoc: boolean;
    schedule?: Array<DaySchedule>;
    declineReason?: string;
    sitterIds: Array<bigint>;
    services: Array<string>;
    startDate: Time;
}
export interface SitterPublicV2Extension {
    pageComponents?: PageComponentVisibility;
    serviceRadius?: bigint;
    serviceZip?: string;
    acceptingNewClients?: boolean;
    bannerUrl?: string;
    certificationsList?: Array<string>;
    responseTime?: string;
    petTypesServed?: Array<string>;
    credentialChecklist?: CredentialChecklist;
    pinnedPromoOfferId?: string;
    galleryPhotos?: Array<string>;
}
export interface Public__5 {
    bookingId: bigint;
    createdAt: Time;
    reviewText: string;
    rating: number;
}
export type Id = bigint;
export interface Message {
    content: string;
    timestamp: Time;
    senderName: string;
    senderId?: Principal;
}
export interface UpdateStopTime {
    id: Id;
    stopTime: Time;
}
export interface SitterProfileV2Update {
    sitterId: bigint;
    pageComponents?: PageComponentVisibility;
    serviceRadius?: bigint;
    serviceZip?: string;
    acceptingNewClients?: boolean;
    bannerUrl?: string;
    certificationsList?: Array<string>;
    responseTime?: string;
    petTypesServed?: Array<string>;
    credentialChecklist?: CredentialChecklist;
    pinnedPromoOfferId?: string;
    galleryPhotos?: Array<string>;
}
export interface DutyAssignment {
    status: Variant_assigned_done_inProgress;
    tasks: Array<DutyTask>;
    createdAt: bigint;
    description: string;
    assignedSitterId: bigint;
    dutyId: string;
}
export interface ClientInfo {
    name: string;
    email: string;
    phone: string;
}
export interface Public__6 {
    status: PaymentStatus;
    method: PaymentMethod;
    originalAmount?: bigint;
    bookingId: Id;
    actualEndTime?: Time;
    discountAmount?: bigint;
    adHocItems: Array<AdHocLineItem>;
    confirmedAt?: Time;
    discountPercent?: bigint;
    paidDate?: string;
    manualConfirmedBy?: Principal;
    totalAmount: bigint;
    notes?: string;
    paymentMethodDetails?: PaymentMethodDetails;
    stripePaymentIntentId?: string;
    splits: Array<PaymentSplit>;
    completionNotes?: string;
}
export enum AuditAction {
    SupportTicketOpened = "SupportTicketOpened",
    AccountFrozen = "AccountFrozen",
    BookingDeleted = "BookingDeleted",
    GdprExportRequested = "GdprExportRequested",
    SupportTicketResolved = "SupportTicketResolved",
    AccountUnfrozen = "AccountUnfrozen",
    ServiceCompletionUpdated = "ServiceCompletionUpdated",
    SubscriptionRecorded = "SubscriptionRecorded",
    GdprAnonymizationRequested = "GdprAnonymizationRequested",
    PriceAdjusted = "PriceAdjusted",
    AccountAnonymized = "AccountAnonymized",
    ConsentRecorded = "ConsentRecorded",
    PaymentDeleted = "PaymentDeleted",
    BookingDeclined = "BookingDeclined",
    SubscriptionCancelled = "SubscriptionCancelled",
    DiscountApplied = "DiscountApplied",
    AdminAccessRevoked = "AdminAccessRevoked",
    AdHocJobCreated = "AdHocJobCreated",
    SitterDeleted = "SitterDeleted",
    GdprExportDownloaded = "GdprExportDownloaded",
    SitterDeactivated = "SitterDeactivated",
    SitterReactivated = "SitterReactivated",
    AdminAccessGranted = "AdminAccessGranted"
}
export enum BookingStatus {
    cancelled = "cancelled",
    pending = "pending",
    completed = "completed",
    confirmed = "confirmed",
    declined = "declined"
}
export enum DiscountType {
    fixed = "fixed",
    percent = "percent"
}
export enum GroupStatus {
    active = "active",
    cancelled = "cancelled",
    completed = "completed"
}
export enum PaymentMethod {
    stripe = "stripe",
    manual = "manual"
}
export enum PaymentStatus {
    pending = "pending",
    paid = "paid",
    refunded = "refunded"
}
export enum RecurrencePattern {
    monthly = "monthly",
    biweekly = "biweekly",
    weekly = "weekly"
}
export enum ServiceStatus {
    completed = "completed",
    checkedIn = "checkedIn",
    issueReported = "issueReported",
    inProgress = "inProgress"
}
export enum TicketStatus {
    resolved = "resolved",
    adminAccessing = "adminAccessing",
    open = "open"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_active_dissolved {
    active = "active",
    dissolved = "dissolved"
}
export enum Variant_assigned_done_inProgress {
    assigned = "assigned",
    done = "done",
    inProgress = "inProgress"
}
export enum Variant_cancelled_completed_confirmed {
    cancelled = "cancelled",
    completed = "completed",
    confirmed = "confirmed"
}
export enum Variant_channel_jobThread {
    channel = "channel",
    jobThread = "jobThread"
}
export enum Variant_closed_open {
    closed = "closed",
    open = "open"
}
export enum Variant_expired_pending_accepted_declined {
    expired = "expired",
    pending = "pending",
    accepted = "accepted",
    declined = "declined"
}
export interface backendInterface {
    acceptInviteByCode(inviteCode: string): Promise<{
        __kind__: "ok";
        ok: Team;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addMessage(bookingId: Id, senderName: string, content: string): Promise<void>;
    addPhotoConsentLog(sitterId: bigint, photoUrl: string, consent1: boolean, consent2: boolean, consent3: boolean): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adjustPaymentPrice(bookingId: Id, newAmount: bigint, reason: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminAnonymizeSitter(sitterId: Id): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminExportSitterData(sitterId: Id): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    anonymizeSitterAccount(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    approveSitterApplication(sitterId: Id): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignCoSitters(bookingId: bigint, teamId: string, assignmentsList: Array<[bigint, string]>): Promise<{
        __kind__: "ok";
        ok: CoBookingAssignment;
    } | {
        __kind__: "err";
        err: string;
    }>;
    assignDuty(threadId: string, assignedSitterId: bigint, description: string, taskLabels: Array<string>): Promise<{
        __kind__: "ok";
        ok: DutyAssignment;
    } | {
        __kind__: "err";
        err: string;
    }>;
    assignSitterToFreePlan(sitterId: Id): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    backfillSitterHandles(): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    cancelBookingByClient(bookingId: Id, cancelReason: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    cancelRecurringGroup(groupId: string, cancelledBy: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    cancelSubscription(sitterId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    checkAndSendTrialReminder(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    checkSittersAvailabilityForRebook(sitterIds: Array<bigint>, dates: Array<string>, services: Array<string>): Promise<Array<{
        sitterId: bigint;
        available: boolean;
        reason: string;
    }>>;
    claimFirstAdmin(): Promise<boolean>;
    clearAllData(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    confirmManualPayment(bookingId: Id): Promise<void>;
    confirmManualPaymentWithEmail(bookingId: Id, paidDate: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    confirmRecurringGroup(groupId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    confirmRecurringOccurrence(bookingId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    confirmStripeCheckoutSession(sessionId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Create an ad hoc job record for a non-app client.
     * / CRITICAL: clientEmail and clientPhone are always empty — the non-app client
     * / is never contacted by the app under any circumstances.
     * / offAppClientAcknowledged MUST be true — sitter affirms the client has no Pawspect relationship.
     */
    createAdHocJob(sitterId: bigint, clientName: string, adHocClientContact: string | null, service: string, jobDate: string, startTime: string, endTime: string, ratePerHourCents: bigint, totalAmountCents: bigint, coSitterId: bigint | null, teamId: string | null, petNames: Array<string>, notes: string | null, offAppClientAcknowledged: boolean): Promise<{
        __kind__: "ok";
        ok: Public__8;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createBooking(input: Creation__3): Promise<Public__8>;
    createBookingWithCoupon(input: Creation__3, couponCode: string | null): Promise<Public__8>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createDealOffer(sitterId: bigint, discountType: DiscountType, discountValue: number, description: string, expirationDate: bigint, clientEmails: Array<string>, maxUses: bigint | null): Promise<{
        __kind__: "ok";
        ok: DealOffer;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createJobThread(teamId: string, bookingId: bigint): Promise<{
        __kind__: "ok";
        ok: JobThread;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createNotification(recipientSitterId: bigint, title: string, body: string, notificationType: string): Promise<NotificationRecord>;
    createPayment(input: Creation__2): Promise<Public__6>;
    createRecurringBookingGroup(input: RecurringGroupCreation): Promise<{
        __kind__: "ok";
        ok: BookingGroup;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createSitterProfile(input: Creation__1): Promise<Public>;
    /**
     * / Create a proper subscription checkout session using the configured Stripe Price ID.
     * / This is what the sitter portal "Subscribe Now" button should call.
     */
    createSubscriptionCheckoutSession(successUrl: string, cancelUrl: string): Promise<string>;
    createTeamInvite(toSitterId: bigint, proposedName: string, splitPercentages: Array<[bigint, bigint]>): Promise<{
        __kind__: "ok";
        ok: TeamInvite;
    } | {
        __kind__: "err";
        err: string;
    }>;
    declineBookingRequest(bookingId: Id, declineReason: string, alternativeWindows: Array<AlternativeWindow>): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    declineRecurringOccurrence(bookingId: bigint, reason: string, alternatives: Array<{
        duration: string;
        date: string;
        time: string;
    }>): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteBooking(bookingId: Id): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deletePayment(bookingId: Id): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteSitterProfile(id: Id): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    dissolveTeamAdmin(teamId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    exportSitterData(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    fixSitterZipCodes(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    freezeSitterAccount(sitterId: Id): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    generateTeamInviteLink(teamId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getActiveSitters(): Promise<Array<Public>>;
    /**
     * / Return all ad hoc jobs for a given sitter (isAdHoc = true and sitterId in sitterIds).
     */
    getAdHocJobsBySitter(sitterId: bigint): Promise<Array<Public__8>>;
    getAdminBookingAnalytics(): Promise<{
        serviceTypeDurations: Array<[string, number]>;
        serviceTypeCounts: Array<[string, bigint]>;
        avgServiceDurationMinutes: number;
        avgTimeToPaymentMinutes: number;
        serviceTypeRevenue: Array<[string, bigint]>;
    }>;
    getAdminBookingStats(): Promise<{
        pendingCount: bigint;
        cancelledCount: bigint;
        completedCount: bigint;
        confirmedCount: bigint;
        pendingRevenue: bigint;
        totalRevenue: bigint;
        confirmedRevenue: bigint;
    }>;
    getAdminNotificationEmail(): Promise<string>;
    getAdminPendingRevenue(): Promise<bigint>;
    getAdminPendingRevenueBreakdown(): Promise<Array<{
        bookingId: bigint;
        clientName: string;
        amount: bigint;
    }>>;
    getAllBookings(): Promise<Array<Public__8>>;
    getAllPayments(): Promise<Array<Public__6>>;
    getAllSitterHandles(): Promise<Array<[bigint, string]>>;
    getAllSitters(): Promise<Array<Public>>;
    getAllSubscriptionStates(): Promise<Array<[bigint, SubscriptionRecord]>>;
    getAllTeamsAdmin(): Promise<Array<Team>>;
    /**
     * / Returns current usage counts and configured limits.
     */
    getApiUsageLimits(): Promise<{
        monthlyCount: bigint;
        monthlyLimit: bigint;
        dailyCount: bigint;
        dailyLimit: bigint;
        resetDate: string;
    }>;
    getAuditLog(): Promise<Array<Public__7>>;
    getAvailableHourlyWindows(date: string): Promise<Array<{
        startTime: string;
        availableSitterCount: bigint;
        endTime: string;
    }>>;
    getAvailableSittersForWindow(date: string, startTime: string, endTime: string): Promise<Array<Public>>;
    getBookingHeatmapData(): Promise<Array<{
        pendingCount: bigint;
        sitterId: bigint;
        date: string;
        hour: bigint;
        confirmedCount: bigint;
        sitterName: string;
    }>>;
    getBookingsByClientEmail(clientEmail: string): Promise<Array<Public__8>>;
    getBookingsByClientPhone(clientPhone: string): Promise<Array<Public__8>>;
    getBookingsBySitter(sitterId: Id): Promise<Array<Public__8>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCoBookingAssignment(bookingId: bigint): Promise<CoBookingAssignment | null>;
    getCompletedBookingsByContact(email: string, phone: string): Promise<Array<Public__8>>;
    getCompletedBookingsCount(sitterId: bigint): Promise<bigint>;
    getDealOffersBySitter(sitterId: bigint): Promise<Array<DealOffer>>;
    getGrantedAdmins(): Promise<Array<Principal>>;
    getJobThread(bookingId: bigint): Promise<JobThread | null>;
    getJobThreadMessages(bookingId: bigint, limit: bigint): Promise<Array<TeamMessage>>;
    getJobThreadsForTeam(teamId: string): Promise<Array<JobThread>>;
    getMessages(bookingId: Id): Promise<Array<Message>>;
    getMySupportTickets(): Promise<Array<Public__4>>;
    getMyTeams(): Promise<Array<Team>>;
    getNotificationsBySitter(sitterId: bigint): Promise<Array<NotificationRecord>>;
    getPayment(bookingId: Id): Promise<Public__6 | null>;
    getPaymentAuditLog(bookingId: Id): Promise<Array<Public__7>>;
    getPaymentsByBookingIds(bookingIds: Array<string>): Promise<Array<Public__6>>;
    getPendingInvitesForSitter(sitterId: bigint): Promise<Array<TeamInvite>>;
    getPublicSitterProfile(handle: string): Promise<{
        id: bigint;
        bio?: string;
        reviews: Array<{
            clientName: string;
            createdAt: bigint;
            comment?: string;
            rating: bigint;
        }>;
        name: string;
        badges: Array<string>;
        isActive: boolean;
        averageRating: number;
        profilePhotoUrl?: string;
        reviewCount: bigint;
        services: Array<{
            serviceName: string;
            duration?: string;
            price: number;
        }>;
    } | null>;
    getRecurringGroup(groupId: string): Promise<BookingGroup | null>;
    getRecurringGroupsByClient(clientEmail: string): Promise<Array<BookingGroup>>;
    getRecurringGroupsBySitter(sitterId: bigint): Promise<Array<BookingGroup>>;
    getReviewsBySitter(sitterId: Id): Promise<Array<Public__5>>;
    getServiceLogsByBooking(bookingId: Id): Promise<Array<Public__2>>;
    getSitterAvailability(sitterId: Id): Promise<Array<AvailabilityEntry>>;
    getSitterBookingStats(sitterId: bigint): Promise<SitterBookingStats>;
    getSitterClientsForCRM(sitterId: bigint): Promise<Array<CRMClient>>;
    getSitterCredentials(sitterId: bigint): Promise<CredentialChecklist | null>;
    getSitterExtendedPublic(sitterId: bigint): Promise<SitterPublicV2Extension | null>;
    getSitterHandle(sitterId: Id): Promise<string | null>;
    getSitterLicenseStatus(): Promise<SitterLicenseStatus>;
    getSitterPageComponents(sitterId: bigint): Promise<PageComponentVisibility | null>;
    getSitterPrivateData(sitterId: bigint): Promise<{
        __kind__: "ok";
        ok: {
            emergencyContact?: string;
            earningsGoal?: bigint;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    getSitterProfile(id: Id): Promise<Public>;
    getSitterPublicReviews(sitterId: Id, limit: bigint): Promise<Array<{
        clientName: string;
        createdAt: bigint;
        comment?: string;
        rating: bigint;
    }>>;
    getSitterReviews(sitterId: Id): Promise<Array<Public__5>>;
    getSitterServiceRates(sitterId: Id): Promise<Array<Public__1>>;
    getSitterStatsById(sitterId: Id): Promise<{
        repeatClientCount: bigint;
        totalEarningsCents: bigint;
        currentMonthEarningsCents: bigint;
        repeatClientRatePct: number;
        totalCompletedBookings: bigint;
        adHocJobCount: bigint;
    }>;
    getSittersForSelection(clientZip: string): Promise<Array<{
        id: bigint;
        bio: string;
        owner?: Principal;
        serviceRadius?: bigint;
        birthdate?: bigint;
        name: string;
        hourlyRate: bigint;
        photoUrl: string;
        isAnonymized?: boolean;
        isActive: boolean;
        serviceZip?: string;
        memberSince?: bigint;
        bookingsCompleted: bigint;
        acceptingNewClients?: boolean;
        serviceRates: Array<{
            service: string;
            ratePerHour: bigint;
        }>;
        repeatClientRate: bigint;
        credentialsChecklist: {
            isProfessionalMember?: boolean;
            hasCertificationOrTraining?: boolean;
            hasReferences?: boolean;
            hasBusinessLicense?: boolean;
            isInsuredAndBonded?: boolean;
            usesServiceAgreement?: boolean;
            hasBackgroundCheck?: boolean;
        };
        rating: number;
        reviewCount: bigint;
        location: string;
        services: Array<string>;
    }>>;
    getSittersNearZip(clientZip: string, _radiusMiles: bigint): Promise<Array<{
        id: bigint;
        bio: string;
        owner?: Principal;
        serviceRadius?: bigint;
        birthdate?: bigint;
        name: string;
        hourlyRate: bigint;
        photoUrl: string;
        isAnonymized?: boolean;
        isActive: boolean;
        serviceZip?: string;
        acceptingNewClients?: boolean;
        serviceRates: Array<{
            service: string;
            ratePerHour: bigint;
        }>;
        rating: number;
        reviewCount: bigint;
        location: string;
        services: Array<string>;
    }>>;
    getStripeFreePlanPriceId(): Promise<string>;
    getStripePublicConfig(): Promise<{
        isLiveMode: boolean;
        priceId: string;
        publishableKey: string;
    }>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getSubscriptionState(sitterId: bigint): Promise<SubscriptionRecord | null>;
    getSupportTickets(): Promise<Array<Public__4>>;
    getTeamBookings(teamId: string): Promise<Array<bigint>>;
    getTeamById(teamId: string): Promise<Team | null>;
    getTeamMessages(teamId: string, limit: bigint): Promise<Array<TeamMessage>>;
    getTipsBySitter(sitterId: Id): Promise<Array<Public__3>>;
    getUnreadNotificationCount(sitterId: bigint): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    grantAdminAccess(targetPrincipal: Principal): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    grantSupportAccess(ticketId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    handleStripeWebhook(eventType: string, payload: string, stripeSignatureHeader: string): Promise<void>;
    hasSupportAccess(sitterPrincipal: Principal): Promise<boolean>;
    initSitterTrial(sitterId: bigint): Promise<void>;
    isAdminAssigned(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isSitterFrozen(sitterId: bigint): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    leaveTeam(teamId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    markNotificationRead(notificationId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    openSupportTicket(issue: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    postServiceLog(input: Creation): Promise<Public__2>;
    /**
     * / Records one API call for the given date string (YYYY-MM-DD).
     * / Resets the daily counter whenever the date changes.
     */
    recordApiCall(date: string): Promise<void>;
    recordSubscriptionPayment(sitterId: bigint, stripeSubscriptionId: string, stripeCustomerId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    recordTip(sitterId: Id, bookingId: Id, amountCents: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    redeemCoupon(couponCode: string, clientEmail: string): Promise<{
        __kind__: "ok";
        ok: DealOffer;
    } | {
        __kind__: "err";
        err: string;
    }>;
    rejectSitterApplication(sitterId: Id): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    resolveSupportTicket(ticketId: string, notes: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    respondToInvite(inviteId: string, accept: boolean): Promise<{
        __kind__: "ok";
        ok: Team;
    } | {
        __kind__: "err";
        err: string;
    }>;
    revokeAdminAccess(targetPrincipal: Principal): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    saveCallerUserProfile(profile: UserProfile): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    seedBaileyLinneaTeam(): Promise<{
        __kind__: "ok";
        ok: Team;
    } | {
        __kind__: "err";
        err: string;
    }>;
    seedBaileyLinneaTeamWithIds(baileyId: bigint, linneaId: bigint): Promise<{
        __kind__: "ok";
        ok: Team;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendBookingConfirmationEmail(bookingId: Id): Promise<void>;
    sendBookingConfirmedEmails(bookingId: Id): Promise<void>;
    sendClientNudgeSitter(bookingIdText: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendInvoiceToClient(bookingId: Id): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendPaymentReminder(bookingId: Id): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendRecurringBookingEmails(groupId: string): Promise<void>;
    sendRecurringGroupConfirmedEmails(groupId: string): Promise<void>;
    sendServiceCompletionEmail(bookingId: Id): Promise<void>;
    sendTeamMessage(teamId: string, senderSitterId: bigint, content: string, threadBookingId: bigint | null): Promise<{
        __kind__: "ok";
        ok: TeamMessage;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setAdminNotificationEmail(email: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin-only: update the daily and monthly call limits.
     */
    setApiLimits(daily: bigint, monthly: bigint): Promise<void>;
    setCallerAsAdmin(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setFreePlanPriceId(priceId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setInvoicePaymentMethod(bookingId: Id, method: PaymentMethodDetails): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setSitterAvailability(sitterId: Id, entries: Array<AvailabilityEntry>): Promise<void>;
    setSitterHandle(sitterId: Id, handle: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setSitterPageComponents(sitterId: bigint, components: PageComponentVisibility): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setSitterServiceRates(sitterId: Id, rates: Array<Public__1>): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    setStripeWebhookSecret(secret: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    submitReview(sitterId: Id, rating: number, reviewText: string, bookingId: Id): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unfreezeSitterAccount(sitterId: Id): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Mark an ad hoc job's payment as paid.
     */
    updateAdHocJobPayment(bookingId: bigint, paidDate: string, paymentMethod: PaymentMethodDetails | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateBookingStatus(bookingId: Id, newStatus: Variant_cancelled_completed_confirmed): Promise<void>;
    updateCredentialChecklist(sitterId: bigint, credentials: CredentialChecklist): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateDutyStatus(threadId: string, dutyId: string, status: Variant_assigned_done_inProgress): Promise<{
        __kind__: "ok";
        ok: DutyAssignment;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateInvoiceAdHocItems(bookingId: Id, items: Array<AdHocLineItem>): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateInvoicePaidDate(bookingId: Id, paidDate: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updatePaymentSplits(input: UpdateSplits): Promise<void>;
    updatePaymentWithDiscount(bookingId: Id, discountPercent: bigint, newTotalAmount: bigint, originalAmount: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateServiceCompletion(bookingId: Id, actualEndTime: Time | null, finalPrice: bigint | null, completionNotes: string | null, discountPercent: bigint | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateServiceLogStopTime(input: UpdateStopTime): Promise<void>;
    updateSitterEarningsGoal(goal: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateSitterProfile(input: Update): Promise<Public>;
    updateSitterProfileV2(update: SitterProfileV2Update): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateStripeConfig(secretKey: string, publishableKey: string, priceId: string, liveMode: boolean): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateTaskDone(threadId: string, dutyId: string, taskId: string, done: boolean): Promise<{
        __kind__: "ok";
        ok: DutyTask;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateTeamSplits(teamId: string, splits: Array<[bigint, bigint]>): Promise<{
        __kind__: "ok";
        ok: Team;
    } | {
        __kind__: "err";
        err: string;
    }>;
    validateCoupon(couponCode: string): Promise<{
        __kind__: "ok";
        ok: DealOffer;
    } | {
        __kind__: "err";
        err: string;
    }>;
    validateRecurringAvailability(sitterId: bigint, occurrenceDates: Array<Time>, startTime: string, endTime: string, serviceIds: Array<string>, clientZip: string): Promise<Array<OccurrenceAvailability>>;
}
