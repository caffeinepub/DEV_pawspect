import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import EmailClient "email/EmailClient";
import EmailTemplates "email/EmailTemplates";


import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Int "mo:core/Int";
import SitterProfileApiMixin "mixins/sitter-profile-api";
import SubscriptionApiMixin "mixins/subscription-api";
import SubscriptionLib "lib/subscription";
import SubscriptionTypes "types/subscription";
import CRMApiMixin "mixins/crm-api";
import CRMTypes "types/crm-deals";
import SitterProfileV2ApiMixin "mixins/sitter-profile-v2-api";
import SitterProfileV2Types "types/sitter-profile-v2";

import Char "mo:core/Char";
import Timer "mo:core/Timer";
import RecurringApiMixin "mixins/recurring-bookings-api";
import RecurringTypes "types/recurring-bookings";
import RecurringEmailLib "lib/recurring-email-templates";
import TeamsApiMixin "mixins/teams-api";
import TeamsLib "lib/teams";
import TeamCollabApiMixin "mixins/team-collab-api";
import TeamCollabTypes "types/team-collab";
import AdHocApiMixin "mixins/adhoc-api";
import NotifTypes "types/notifications";
import NotifLib "lib/notifications";
import Bool "mo:core/Bool";



actor {
  module SitterProfile {
    public type Id = Nat;

    public type Public = {
      id : Nat;
      name : Text;
      bio : Text;
      services : [Text];
      hourlyRate : Nat;
      location : Text;
      photoUrl : Text;
      phone : Text;
      rating : Float;
      reviewCount : Nat;
      isActive : Bool;
      owner : ?Principal;
      serviceRates : [SitterServiceRate.Public];
      // GDPR / compliance optional fields (safe to add — existing records read as null)
      birthdate    : ?Int;   // nanoseconds since epoch; nil if not provided at signup
      isAnonymized : ?Bool;  // true once account has been anonymized
    };

    public type Update = {
      id : Id;
      name : Text;
      bio : Text;
      services : [Text];
      hourlyRate : Nat;
      location : Text;
      photoUrl : Text;
      phone : Text;
      isActive : Bool;
    };

    public type Creation = {
      name : Text;
      bio : Text;
      services : [Text];
      hourlyRate : Nat;
      location : Text;
      photoUrl : Text;
      phone : Text;
      birthdate : ?Int;  // optional birthdate for age validation
    };
  };

  module SitterServiceRate {
    public type Public = {
      service : Text;
      ratePerHour : Nat;
    };
  };

  module Review {
    public type Public = {
      bookingId : Nat;
      rating : Float;
      reviewText : Text;
      createdAt : Time.Time;
    };
  };

  module Booking {
    public type Id = Nat;

    public type Pet = {
      petName : Text;
      petType : Text;
      breed : ?Text;
      petNotes : ?Text;
    };

    public type BookingStatus = {
      #pending;
      #confirmed;
      #completed;
      #cancelled;
      #declined;
    };

    public type AlternativeWindow = {
      date : Text;
      time : Text;
      duration : Text;
    };

    public type RecurrencePattern = {
      #weekly;
      #biweekly;
      #monthly;
    };

    public type TimeSlot = {
      startTime : Time.Time;
      endTime : Time.Time;
    };

    public type DaySchedule = {
      date : Time.Time;
      slots : [TimeSlot];
    };

    public type ServiceSlot = {
      service : Text;
      sitterId : Nat;
      startTime : Text;
      endTime : Text;
      ratePerHour : Nat;
      durationMinutes : Nat;
    };

    public type DayServiceSchedule = {
      date : Text;
      slots : [ServiceSlot];
    };

    public type Public = {
      id : Id;
      clientName : Text;
      clientEmail : Text;
      clientPhone : Text;
      pets : [Pet];
      services : [Text];
      sitterIds : [Nat];
      startDate : Time.Time;
      endDate : Time.Time;
      notes : Text;
      status : BookingStatus;
      createdAt : Time.Time;
      isRecurring : Bool;
      recurrencePattern : ?RecurrencePattern;
      recurrenceEndDate : ?Time.Time;
      paymentSessionId : ?Text;
      stripePaymentIntentId : ?Text;
      tip : ?Nat;
      schedule : ?[DaySchedule];
      serviceSchedule : ?[DayServiceSchedule];
      declineReason : ?Text;
      alternativeWindows : ?[AlternativeWindow];
      agreements : ?RecurringTypes.BookingAgreements;
      // Ad hoc job fields — default false / null for all existing bookings (backward compat)
      isAdHoc            : Bool;   // true = off-app job, client never contacted by app
      adHocClientContact : ?Text;  // optional contact stored for sitter reference only
    };

    public type Creation = {
      clientName : Text;
      clientEmail : Text;
      clientPhone : Text;
      pets : [Pet];
      services : [Text];
      sitterIds : [Nat];
      startDate : Time.Time;
      endDate : Time.Time;
      notes : Text;
      isRecurring : Bool;
      recurrencePattern : ?RecurrencePattern;
      recurrenceEndDate : ?Time.Time;
      tip : ?Nat;
      schedule : ?[DaySchedule];
      serviceSchedule : ?[DayServiceSchedule];
      callRequest : ?Bool;
      agreements : ?RecurringTypes.BookingAgreements;
      isAdHoc            : ?Bool;   // null = false (standard booking)
      adHocClientContact : ?Text;   // only stored when isAdHoc = true
    };
  };

  module SitterAvailability {
    public type AvailabilityEntry = {
      dayOfWeek : Nat;
      startTime : Nat;
      endTime : Nat;
    };

    public type Availability = {
      entries : [AvailabilityEntry];
    };
  };

  module ServiceLog {
    public type Id = Nat;

    public type ServiceStatus = {
      #checkedIn;
      #inProgress;
      #completed;
      #issueReported;
    };

    public type Public = {
      id : Id;
      bookingId : Booking.Id;
      sitterId : SitterProfile.Id;
      status : ServiceStatus;
      notes : Text;
      startTime : ?Time.Time;
      stopTime : ?Time.Time;
      createdAt : Time.Time;
    };

    public type Creation = {
      bookingId : Booking.Id;
      sitterId : SitterProfile.Id;
      status : ServiceStatus;
      notes : Text;
      startTime : ?Time.Time;
    };

    public type UpdateStopTime = {
      id : Id;
      stopTime : Time.Time;
    };
  };

  module PaymentRecord {
    public type PaymentStatus = {
      #pending;
      #paid;
      #refunded;
    };

    public type PaymentMethod = {
      #stripe;
      #manual;
    };

    public type PaymentSplit = {
      sitterId : SitterProfile.Id;
      amount : Nat;
      paid : Bool;
    };

    // Ad hoc line item on an invoice (extra charges or credits added by sitter)
    public type AdHocLineItem = {
      description : Text;   // free text or preset label
      amountCents : Int;    // positive = charge, negative = discount/credit
      createdAt : Int;      // nanosecond timestamp
    };

    // Structured payment method chosen by sitter when sending invoice
    public type PaymentMethodDetails = {
      #venmo : { handle : Text };
      #applePayCash : { sitterPhone : Text };
      #cash : { instructions : Text };
    };

    public type Public = {
      bookingId : Booking.Id;
      totalAmount : Nat;
      method : PaymentMethod;
      status : PaymentStatus;
      notes : ?Text;
      stripePaymentIntentId : ?Text;
      manualConfirmedBy : ?Principal;
      confirmedAt : ?Time.Time;
      splits : [PaymentSplit];
      // Extended fields — all optional so existing records remain valid
      paidDate : ?Text;         // ISO date "YYYY-MM-DD" set by sitter when invoice is paid
      discountPercent : ?Nat;   // e.g. 5, 10, 15, 20, 25
      discountAmount : ?Nat;    // discount in cents = originalAmount - totalAmount
      originalAmount : ?Nat;   // totalAmount before discount was applied
      completionNotes : ?Text;  // notes entered at service completion prompt
      actualEndTime : ?Time.Time; // actual end time if different from scheduled
      adHocItems : [AdHocLineItem];            // additional line items on invoice
      paymentMethodDetails : ?PaymentMethodDetails; // payment method chosen at send time
    };

    public type Creation = {
      bookingId : Booking.Id;
      totalAmount : Nat;
      method : PaymentMethod;
      notes : ?Text;
      splits : [PaymentSplit];
    };

    public type UpdateSplits = {
      bookingId : Booking.Id;
      splits : [PaymentSplit];
    };
  };

  module Message {
    public type Message = {
      senderId : ?Principal;
      senderName : Text;
      content : Text;
      timestamp : Time.Time;
    };
  };

  module AuditLog {
    public type Id = Nat;

    public type AuditAction = {
      #BookingDeleted;
      #PaymentDeleted;
      #SitterDeleted;
      #SitterDeactivated;
      #SitterReactivated;
      #PriceAdjusted;
      #DiscountApplied;
      #ServiceCompletionUpdated;
      #BookingDeclined;
      // GDPR actions
      #GdprExportRequested;
      #GdprExportDownloaded;
      #GdprAnonymizationRequested;
      #AccountAnonymized;
      // Subscription actions
      #AccountFrozen;
      #AccountUnfrozen;
      #SubscriptionRecorded;
      #SubscriptionCancelled;
      // Support ticket actions
      #SupportTicketOpened;
      #AdminAccessGranted;
      #SupportTicketResolved;
      #AdminAccessRevoked;
      // Consent actions
      #ConsentRecorded;
      #AdHocJobCreated;
    };

    public type Public = {
      id : Id;
      action : AuditAction;
      entityType : Text;
      entityId : Nat;
      snapshot : Text;
      deletedBy : Principal;
      timestamp : Time.Time;
    };
  };

  public type UserProfile = {
    name : Text;
    email : ?Text;
    role : Text;
  };

  module TipRecord {
    public type Public = {
      sitterId   : Nat;
      bookingId  : Nat;
      amountCents : Nat;
      clientName : Text;
      createdAt  : Time.Time;
    };
  };

  module GdprToken {
    public type Public = {
      id        : Text;
      sitterId  : Principal;
      action    : Text;   // "export" or "anonymize"
      createdAt : Int;
      used      : Bool;
    };
  };

  // ---------------------------------------------------------------------------
  // Support Ticket — enables admin scoped access to sitter data on request.
  // Admin data privacy is enforced at query level: by default admins cannot
  // see sitter personal/financial data. A sitter must open a support ticket
  // and the admin must call grantSupportAccess before scoped data is visible.
  // ---------------------------------------------------------------------------
  module SupportTicket {
    public type TicketStatus = {
      #open;
      #adminAccessing;
      #resolved;
    };

    public type Public = {
      id              : Text;
      sitterId        : Principal;
      sitterName      : Text;
      issue           : Text;
      status          : TicketStatus;
      createdAt       : Int;
      resolvedAt      : ?Int;
      adminNotes      : ?Text;
      accessGrantedAt : ?Int;
      accessRevokedAt : ?Int;
    };
  };

  // ---------------------------------------------------------------------------
  // Persistent state — all variables are stable so data survives canister upgrades.
  // With --default-persistent-actors the stable keyword is technically redundant,
  // but it is required to pass the stable-compatibility check against the .old snapshot.
  // ---------------------------------------------------------------------------
  stable let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  stable let sitters        = Map.empty<SitterProfile.Id, SitterProfile.Public>();

  // ---------------------------------------------------------------------------
  // Stable migration for bookings — adding `agreements` field to Booking.Public.
  // The deployed canister holds the old type (BookingPublicV1) which lacks that field.
  //
  // Strategy:
  //   1. Declare BookingPublicV1 matching the previously-deployed type exactly.
  //   2. Keep the stable variable named `bookings` (old type) so it receives the
  //      on-chain data from the old snapshot — this is backward-compatible.
  //   3. Declare `bookingsNew` (4-field agreements, V2 type).
  //   4. In postupgrade: copy entries from `bookings` into `bookingsV4`,
  //      defaulting the new optional field to null.
  //   5. All live reads/writes use `bookingsV4`.
  // ---------------------------------------------------------------------------
  type BookingPublicV1 = {
    id : Booking.Id;
    clientName : Text;
    clientEmail : Text;
    clientPhone : Text;
    pets : [Booking.Pet];
    services : [Text];
    sitterIds : [Nat];
    startDate : Time.Time;
    endDate : Time.Time;
    notes : Text;
    status : Booking.BookingStatus;
    createdAt : Time.Time;
    isRecurring : Bool;
    recurrencePattern : ?Booking.RecurrencePattern;
    recurrenceEndDate : ?Time.Time;
    paymentSessionId : ?Text;
    stripePaymentIntentId : ?Text;
    tip : ?Nat;
    schedule : ?[Booking.DaySchedule];
    serviceSchedule : ?[Booking.DayServiceSchedule];
    declineReason : ?Text;
    alternativeWindows : ?[Booking.AlternativeWindow];
    // `agreements` intentionally absent — mirrors the previously-deployed snapshot type
  };

  // Receives the on-chain data from the deployed canister (old type, no agreements field).
  // Must keep this name to match the snapshot.
  stable let bookings       = Map.empty<Booking.Id, BookingPublicV1>();

  // ---------------------------------------------------------------------------
  // Stable migration V2 — adding cancellationPolicy, nonEmploymentAck, termsVersion
  // to BookingAgreements (GAP 3 + GAP 7, legal compliance).
  //
  // bookingsNew: receives the deployed canister data (4-field agreements, V2 type).
  //   Must keep this name to match the stable snapshot.
  // bookingsV4: new live map with 7-field agreements. All reads/writes go here.
  //   In postupgrade: copy from bookingsNew, upgrading the agreements record.
  // ---------------------------------------------------------------------------
  type BookingAgreementsV2 = {
    terms          : Bool;
    privacy        : Bool;
    communications : Bool;
    callRequest    : Bool;
    // cancellationPolicy, nonEmploymentAck, termsVersion intentionally absent
  };

  type BookingPublicV2 = {
    id : Booking.Id;
    clientName : Text;
    clientEmail : Text;
    clientPhone : Text;
    pets : [Booking.Pet];
    services : [Text];
    sitterIds : [Nat];
    startDate : Time.Time;
    endDate : Time.Time;
    notes : Text;
    status : Booking.BookingStatus;
    createdAt : Time.Time;
    isRecurring : Bool;
    recurrencePattern : ?Booking.RecurrencePattern;
    recurrenceEndDate : ?Time.Time;
    paymentSessionId : ?Text;
    stripePaymentIntentId : ?Text;
    tip : ?Nat;
    schedule : ?[Booking.DaySchedule];
    serviceSchedule : ?[Booking.DayServiceSchedule];
    declineReason : ?Text;
    alternativeWindows : ?[Booking.AlternativeWindow];
    agreements : ?BookingAgreementsV2;   // 4-field version
  };

  // Receives on-chain data from the previously-deployed canister (4-field agreements).
  // Must keep this name to match the stable snapshot.
  stable let bookingsNew    = Map.empty<Booking.Id, BookingPublicV2>();

  // New-type map with 7-field agreements — receives on-chain data from previously-deployed canister.
  // Must keep this name to match the stable snapshot.
  stable let bookingsV3     = Map.empty<Booking.Id, BookingPublicV3>();

  // ---------------------------------------------------------------------------
  // Stable migration V4 — adding isAdHoc + adHocClientContact to Booking.Public.
  // bookingsV3 receives on-chain data (no ad hoc fields).
  // bookingsV4 is the new live map with full Booking.Public. All reads/writes go here.
  // ---------------------------------------------------------------------------
  type BookingPublicV3 = {
    id : Booking.Id;
    clientName : Text;
    clientEmail : Text;
    clientPhone : Text;
    pets : [Booking.Pet];
    services : [Text];
    sitterIds : [Nat];
    startDate : Time.Time;
    endDate : Time.Time;
    notes : Text;
    status : Booking.BookingStatus;
    createdAt : Time.Time;
    isRecurring : Bool;
    recurrencePattern : ?Booking.RecurrencePattern;
    recurrenceEndDate : ?Time.Time;
    paymentSessionId : ?Text;
    stripePaymentIntentId : ?Text;
    tip : ?Nat;
    schedule : ?[Booking.DaySchedule];
    serviceSchedule : ?[Booking.DayServiceSchedule];
    declineReason : ?Text;
    alternativeWindows : ?[Booking.AlternativeWindow];
    agreements : ?RecurringTypes.BookingAgreements;  // 7-field version
    // isAdHoc and adHocClientContact intentionally absent — mirrors previously-deployed snapshot
  };

  // New live map with full Booking.Public (includes isAdHoc + adHocClientContact).
  // All reads/writes go here. In postupgrade: copy from bookingsV4 adding defaults.
  stable let bookingsV4     = Map.empty<Booking.Id, Booking.Public>();

  // ---------------------------------------------------------------------------
  // Stable migration for auditLogs — adding #ConsentRecorded to AuditAction.
  // The deployed canister holds the old type (AuditActionV1) which lacks that variant.
  // ---------------------------------------------------------------------------
  type AuditActionV1 = {
    #BookingDeleted;
    #PaymentDeleted;
    #SitterDeleted;
    #SitterDeactivated;
    #SitterReactivated;
    #PriceAdjusted;
    #DiscountApplied;
    #ServiceCompletionUpdated;
    #BookingDeclined;
    #GdprExportRequested;
    #GdprExportDownloaded;
    #GdprAnonymizationRequested;
    #AccountAnonymized;
    #AccountFrozen;
    #AccountUnfrozen;
    #SubscriptionRecorded;
    #SubscriptionCancelled;
    #SupportTicketOpened;
    #AdminAccessGranted;
    #SupportTicketResolved;
    #AdminAccessRevoked;
    // #ConsentRecorded and #AdHocJobCreated intentionally absent — mirrors previously-deployed snapshot
  };

  type AuditLogPublicV1 = {
    id : AuditLog.Id;
    action : AuditActionV1;
    entityType : Text;
    entityId : Nat;
    snapshot : Text;
    deletedBy : Principal;
    timestamp : Time.Time;
  };

  // Receives the on-chain data (old type, no ConsentRecorded, no AdHocJobCreated).
  stable let auditLogs      = Map.empty<AuditLog.Id, AuditLogPublicV1>();

  // ---------------------------------------------------------------------------
  // Stable migration for auditLogsNew — adding #AdHocJobCreated to AuditAction.
  // The deployed canister holds auditLogsNew with AuditActionV2 (has #ConsentRecorded
  // but lacks #AdHocJobCreated).  Must keep name to match snapshot.
  // ---------------------------------------------------------------------------
  type AuditActionV2 = {
    #BookingDeleted;
    #PaymentDeleted;
    #SitterDeleted;
    #SitterDeactivated;
    #SitterReactivated;
    #PriceAdjusted;
    #DiscountApplied;
    #ServiceCompletionUpdated;
    #BookingDeclined;
    #GdprExportRequested;
    #GdprExportDownloaded;
    #GdprAnonymizationRequested;
    #AccountAnonymized;
    #AccountFrozen;
    #AccountUnfrozen;
    #SubscriptionRecorded;
    #SubscriptionCancelled;
    #SupportTicketOpened;
    #AdminAccessGranted;
    #SupportTicketResolved;
    #AdminAccessRevoked;
    #ConsentRecorded;
    // #AdHocJobCreated intentionally absent — mirrors previously-deployed auditLogsNew snapshot
  };

  type AuditLogPublicV2 = {
    id : AuditLog.Id;
    action : AuditActionV2;
    entityType : Text;
    entityId : Nat;
    snapshot : Text;
    deletedBy : Principal;
    timestamp : Time.Time;
  };

  // Receives the on-chain data from the deployed canister (has ConsentRecorded, no AdHocJobCreated).
  // Must keep this name to match the stable snapshot.
  stable let auditLogsNew   = Map.empty<AuditLog.Id, AuditLogPublicV2>();

  // New live map — starts empty on first deploy, populated in postupgrade from auditLogsNew.
  // All appendAuditLog writes go here after migration.
  stable let auditLogsV2    = Map.empty<AuditLog.Id, AuditLog.Public>();

  // ---------------------------------------------------------------------------
  // In-app notifications — keyed by notification ID.
  // Used by the ad hoc job co-sitter assignment flow and any future poll-based alerts.
  // ---------------------------------------------------------------------------
  stable let notifications    = Map.empty<Nat, NotifTypes.NotificationRecord>();
  stable let notifCounterBox  : { var value : Nat } = { var value = 0 };

  stable let availabilities = Map.empty<SitterProfile.Id, SitterAvailability.Availability>();
  stable let serviceLogs    = Map.empty<ServiceLog.Id, ServiceLog.Public>();
  stable let messages       = Map.empty<Booking.Id, List.List<Message.Message>>();
  stable let payments       = Map.empty<Booking.Id, PaymentRecord.Public>();
  stable let userProfiles   = Map.empty<Principal, UserProfile>();
  stable let reviews        = Map.empty<SitterProfile.Id, List.List<Review.Public>>();

  // Tips keyed by sitter ID — each entry is a list of tip records for that sitter
  stable let tips           = Map.empty<SitterProfile.Id, List.List<TipRecord.Public>>();
  // Private sitter data (earningsGoal, emergencyContact) keyed by sitter ID.
  // Stored separately to preserve the stable SitterProfile.Public schema.
  stable let sitterPrivate  = Map.empty<SitterProfile.Id, { earningsGoal : ?Nat; emergencyContact : ?Text }>();
  // Licensing flags — stored separately so the SitterProfile.Public type stays stable-compatible.
  // isGrandfathered: ?Bool — null or absent means the sitter pre-dates the field (treated as grandfathered).
  stable let sitterLicensing = Map.empty<SitterProfile.Id, { isGrandfathered : ?Bool }>();
  // Subscription / trial / freeze state — keyed by sitter ID.
  // Separate map so adding it is backward-compatible with existing sitter records.
  stable let subscriptionState = Map.empty<SitterProfile.Id, SubscriptionTypes.SubscriptionRecord>();
  // Kept for stable-state compatibility with previous version
  stable let serviceRates = Map.empty<Nat, Map.Map<Text, Nat>>();
  ignore serviceRates;
  // GDPR tokens keyed by token ID (Text)
  stable let gdprTokens = Map.empty<Text, GdprToken.Public>();

  // Support tickets keyed by ticket ID (Text)
  stable let supportTickets = Map.empty<Text, SupportTicket.Public>();

  // Sitter URL handles — keyed by sitter ID.
  // Handle is the URL-friendly version of sitter name (lowercase, hyphens for spaces).
  // Stored separately so SitterProfile.Public schema stays unchanged.
  stable let sitterHandles = Map.empty<SitterProfile.Id, Text>();

  // ---------------------------------------------------------------------------
  // Stable migration for sitterExtended — adding serviceRadius + serviceZip fields.
  // The deployed canister holds the old type (SitterExtendedDataV1) which lacks those
  // two fields.  Motoko M0170 requires an explicit migration when a record field is added.
  //
  // Strategy:
  //   1. Declare SitterExtendedDataV1 matching the previously-deployed type exactly.
  //   2. Keep the stable variable named `sitterExtended` (old type) so it receives the
  //      on-chain data from the old snapshot — this is backward-compatible.
  //   3. Declare `sitterExtendedNew` (new type) initialised empty.
  //   4. In postupgrade: copy entries from `sitterExtended` into `sitterExtendedNew`,
  //      defaulting the two new optional fields to null.
  //   5. The mixin is wired to `sitterExtendedNew` so all live reads/writes use new type.
  // ---------------------------------------------------------------------------
  type SitterExtendedDataV1 = {
    galleryPhotos       : ?[Text];
    responseTime        : ?Text;
    petTypesServed      : ?[Text];
    certificationsList  : ?[Text];
    acceptingNewClients : ?Bool;
    pinnedPromoOfferId  : ?Text;
    pageComponents      : ?SitterProfileV2Types.PageComponentVisibility;
    photoConsentLogs    : ?[SitterProfileV2Types.PhotoConsentLog];
    credentialChecklist : ?SitterProfileV2Types.CredentialChecklist;
    bannerUrl           : ?Text;
    // serviceRadius and serviceZip are intentionally ABSENT here — this mirrors
    // the previously-deployed stable snapshot type.
  };

  // Receives the on-chain data from the deployed canister (old type, no new fields).
  // Must keep this name to match the snapshot — Motoko resolves stability by variable name.
  stable let sitterExtended = Map.empty<SitterProfile.Id, SitterExtendedDataV1>();

  // New-type map — starts empty on first deploy, populated in postupgrade from sitterExtended.
  // All live API reads/writes go through this map.
  stable let sitterExtendedNew = Map.empty<SitterProfile.Id, SitterProfileV2Types.SitterExtendedData>();

  system func postupgrade() {
    // Migrate sitterExtended V1 entries into the new map.
    // On subsequent upgrades sitterExtended will be empty so this is a no-op.
    for ((sid, v1) in sitterExtended.entries()) {
      let migrated : SitterProfileV2Types.SitterExtendedData = {
        galleryPhotos       = v1.galleryPhotos;
        responseTime        = v1.responseTime;
        petTypesServed      = v1.petTypesServed;
        certificationsList  = v1.certificationsList;
        acceptingNewClients = v1.acceptingNewClients;
        pinnedPromoOfferId  = v1.pinnedPromoOfferId;
        pageComponents      = v1.pageComponents;
        photoConsentLogs    = v1.photoConsentLogs;
        credentialChecklist = v1.credentialChecklist;
        bannerUrl           = v1.bannerUrl;
        serviceRadius       = null;
        serviceZip          = null;
      };
      sitterExtendedNew.add(sid, migrated);
    };
    // Migrate bookings V1 entries into bookingsV4 with all defaults.
    // On subsequent upgrades bookings will be empty so this is a no-op.
    for ((bid, v1) in bookings.entries()) {
      let migrated : Booking.Public = {
        id                    = v1.id;
        clientName            = v1.clientName;
        clientEmail           = v1.clientEmail;
        clientPhone           = v1.clientPhone;
        pets                  = v1.pets;
        services              = v1.services;
        sitterIds             = v1.sitterIds;
        startDate             = v1.startDate;
        endDate               = v1.endDate;
        notes                 = v1.notes;
        status                = v1.status;
        createdAt             = v1.createdAt;
        isRecurring           = v1.isRecurring;
        recurrencePattern     = v1.recurrencePattern;
        recurrenceEndDate     = v1.recurrenceEndDate;
        paymentSessionId      = v1.paymentSessionId;
        stripePaymentIntentId = v1.stripePaymentIntentId;
        tip                   = v1.tip;
        schedule              = v1.schedule;
        serviceSchedule       = v1.serviceSchedule;
        declineReason         = v1.declineReason;
        alternativeWindows    = v1.alternativeWindows;
        agreements            = null;
        isAdHoc               = false;
        adHocClientContact    = null;
      };
      bookingsV4.add(bid, migrated);
    };
    // Migrate bookingsNew V2 entries — upgrade 4-field agreements to 7-field.
    // On subsequent upgrades bookingsNew will be empty so this is a no-op.
    for ((bid, v2) in bookingsNew.entries()) {
      let migratedAgreements : ?RecurringTypes.BookingAgreements = switch (v2.agreements) {
        case (null) { null };
        case (?ag) {
          ?{
            terms              = ag.terms;
            privacy            = ag.privacy;
            communications     = ag.communications;
            callRequest        = ag.callRequest;
            cancellationPolicy = false;
            nonEmploymentAck   = false;
            termsVersion       = 0;
          }
        };
      };
      let migrated : Booking.Public = {
        id                    = v2.id;
        clientName            = v2.clientName;
        clientEmail           = v2.clientEmail;
        clientPhone           = v2.clientPhone;
        pets                  = v2.pets;
        services              = v2.services;
        sitterIds             = v2.sitterIds;
        startDate             = v2.startDate;
        endDate               = v2.endDate;
        notes                 = v2.notes;
        status                = v2.status;
        createdAt             = v2.createdAt;
        isRecurring           = v2.isRecurring;
        recurrencePattern     = v2.recurrencePattern;
        recurrenceEndDate     = v2.recurrenceEndDate;
        paymentSessionId      = v2.paymentSessionId;
        stripePaymentIntentId = v2.stripePaymentIntentId;
        tip                   = v2.tip;
        schedule              = v2.schedule;
        serviceSchedule       = v2.serviceSchedule;
        declineReason         = v2.declineReason;
        alternativeWindows    = v2.alternativeWindows;
        agreements            = migratedAgreements;
        isAdHoc               = false;
        adHocClientContact    = null;
      };
      bookingsV4.add(bid, migrated);
    };
    // Migrate bookingsV4 entries — add isAdHoc=false + adHocClientContact=null.
    // On subsequent upgrades bookingsV4 will be empty so this is a no-op.
    for ((bid, v3) in bookingsV3.entries()) {
      let migrated : Booking.Public = {
        id                    = v3.id;
        clientName            = v3.clientName;
        clientEmail           = v3.clientEmail;
        clientPhone           = v3.clientPhone;
        pets                  = v3.pets;
        services              = v3.services;
        sitterIds             = v3.sitterIds;
        startDate             = v3.startDate;
        endDate               = v3.endDate;
        notes                 = v3.notes;
        status                = v3.status;
        createdAt             = v3.createdAt;
        isRecurring           = v3.isRecurring;
        recurrencePattern     = v3.recurrencePattern;
        recurrenceEndDate     = v3.recurrenceEndDate;
        paymentSessionId      = v3.paymentSessionId;
        stripePaymentIntentId = v3.stripePaymentIntentId;
        tip                   = v3.tip;
        schedule              = v3.schedule;
        serviceSchedule       = v3.serviceSchedule;
        declineReason         = v3.declineReason;
        alternativeWindows    = v3.alternativeWindows;
        agreements            = v3.agreements;
        isAdHoc               = false;  // all legacy bookings are standard app bookings
        adHocClientContact    = null;
      };
      bookingsV4.add(bid, migrated);
    };
    // Migrate auditLogs V1 entries — add ConsentRecorded-compatible action type.
    // On subsequent upgrades auditLogs will be empty so this is a no-op.
    for ((aid, v1) in auditLogs.entries()) {
      let migratedAction : AuditLog.AuditAction = switch (v1.action) {
        case (#BookingDeleted)             { #BookingDeleted };
        case (#PaymentDeleted)             { #PaymentDeleted };
        case (#SitterDeleted)              { #SitterDeleted };
        case (#SitterDeactivated)          { #SitterDeactivated };
        case (#SitterReactivated)          { #SitterReactivated };
        case (#PriceAdjusted)              { #PriceAdjusted };
        case (#DiscountApplied)            { #DiscountApplied };
        case (#ServiceCompletionUpdated)   { #ServiceCompletionUpdated };
        case (#BookingDeclined)            { #BookingDeclined };
        case (#GdprExportRequested)        { #GdprExportRequested };
        case (#GdprExportDownloaded)       { #GdprExportDownloaded };
        case (#GdprAnonymizationRequested) { #GdprAnonymizationRequested };
        case (#AccountAnonymized)          { #AccountAnonymized };
        case (#AccountFrozen)              { #AccountFrozen };
        case (#AccountUnfrozen)            { #AccountUnfrozen };
        case (#SubscriptionRecorded)       { #SubscriptionRecorded };
        case (#SubscriptionCancelled)      { #SubscriptionCancelled };
        case (#SupportTicketOpened)        { #SupportTicketOpened };
        case (#AdminAccessGranted)         { #AdminAccessGranted };
        case (#SupportTicketResolved)      { #SupportTicketResolved };
        case (#AdminAccessRevoked)         { #AdminAccessRevoked };
      };
      let migrated : AuditLog.Public = {
        id         = v1.id;
        action     = migratedAction;
        entityType = v1.entityType;
        entityId   = v1.entityId;
        snapshot   = v1.snapshot;
        deletedBy  = v1.deletedBy;
        timestamp  = v1.timestamp;
      };
      auditLogsV2.add(aid, migrated);
    };
    // Migrate auditLogsNew V2 entries — passthrough adding #AdHocJobCreated support.
    // On subsequent upgrades auditLogsNew will be empty so this is a no-op.
    for ((aid, v2) in auditLogsNew.entries()) {
      let migratedAction : AuditLog.AuditAction = switch (v2.action) {
        case (#BookingDeleted)             { #BookingDeleted };
        case (#PaymentDeleted)             { #PaymentDeleted };
        case (#SitterDeleted)              { #SitterDeleted };
        case (#SitterDeactivated)          { #SitterDeactivated };
        case (#SitterReactivated)          { #SitterReactivated };
        case (#PriceAdjusted)              { #PriceAdjusted };
        case (#DiscountApplied)            { #DiscountApplied };
        case (#ServiceCompletionUpdated)   { #ServiceCompletionUpdated };
        case (#BookingDeclined)            { #BookingDeclined };
        case (#GdprExportRequested)        { #GdprExportRequested };
        case (#GdprExportDownloaded)       { #GdprExportDownloaded };
        case (#GdprAnonymizationRequested) { #GdprAnonymizationRequested };
        case (#AccountAnonymized)          { #AccountAnonymized };
        case (#AccountFrozen)              { #AccountFrozen };
        case (#AccountUnfrozen)            { #AccountUnfrozen };
        case (#SubscriptionRecorded)       { #SubscriptionRecorded };
        case (#SubscriptionCancelled)      { #SubscriptionCancelled };
        case (#SupportTicketOpened)        { #SupportTicketOpened };
        case (#AdminAccessGranted)         { #AdminAccessGranted };
        case (#SupportTicketResolved)      { #SupportTicketResolved };
        case (#AdminAccessRevoked)         { #AdminAccessRevoked };
        case (#ConsentRecorded)            { #ConsentRecorded };
      };
      let migrated : AuditLog.Public = {
        id         = v2.id;
        action     = migratedAction;
        entityType = v2.entityType;
        entityId   = v2.entityId;
        snapshot   = v2.snapshot;
        deletedBy  = v2.deletedBy;
        timestamp  = v2.timestamp;
      };
      auditLogsV2.add(aid, migrated);
    };
  };

  // CRM deal-offer / coupon state
  stable let dealOffers = Map.empty<Text, CRMTypes.DealOffer>();
  // Mutable counter box (stable record with a var field so the mixin can increment it)
  stable let dealOfferCounterBox : { var value : Nat } = { var value = 0 };

  // callRequest flag stored separately to keep Booking.Public schema stable-compatible.
  // True when the client checks "Please call me to discuss this booking".
  stable let bookingCallRequests = Map.empty<Booking.Id, Bool>();

  // Recurring booking groups — keyed by groupId (Text).
  // Each BookingGroup holds the group metadata + occurrenceIds pointing to
  // individual Booking records in the standard `bookings` map.
  stable let bookingGroups = Map.empty<Text, RecurringTypes.BookingGroup>();

  // Counter for generating group IDs. Incremented atomically by the mixin.
  stable let recurringGroupCounterBox : { var value : Nat } = { var value = 0 };

  // nextBookingIdBox is used by the recurring mixin to allocate booking IDs.
  // Starts at 500_000 to avoid collisions with IDs allocated by the main createBooking path.
  // Both ID spaces (1..499999 for one-off bookings, 500000+ for recurring occurrences) are
  // stored in the same `bookings` map and are globally unique.
  stable let nextBookingIdBox : { var value : Nat } = { var value = 500_000 };

  stable var nextSitterId     : Nat = 1;
  stable var nextBookingId    : Nat = 1;
  stable var nextServiceLogId : Nat = 1;
  stable var nextAuditLogId   : Nat = 1;

  stable var stripeConfig : ?Stripe.StripeConfiguration = null;
  stable var adminEmail : Text = "";
  // Stripe subscription price ID — set to empty by default; must be configured via setStripeConfig.
  // Fix 2: remove hardcoded key values from source. All keys set via admin functions.
  stable var stripePriceId : Text = "";
  stable var stripePublishableKey : Text = "";

  // Secure Stripe key override vars — set via updateStripeConfig() by admins.
  // When non-empty these take precedence over the default values above,
  // so live keys can be rotated without a full canister redeploy.
  stable var stripeSecretKeyOverride      : Text = "";
  stable var stripePublishableKeyOverride : Text = "";
  stable var stripePriceIdOverride        : Text = "";
  stable var stripeLiveMode               : Bool = false;

  // Free plan Stripe price ID — optional reference product for admin-assigned lifetime/free accounts.
  // Does not trigger Stripe checkout; it is stored for record-keeping and display only.
  stable var stripeFreePlanPriceId : Text = "";

  // Stripe webhook signing secret — set via setStripeWebhookSecret() by admins.
  // Used to validate Stripe-Signature headers on incoming webhook calls.
  stable var stripeWebhookSecret : Text = "";

  // Wire in the sitter-profile domain mixin (getSitterPrivateData, updateSitterEarningsGoal,
  // getCompletedBookingsCount).  Must come after both `sitters` and `bookings` are declared.
  include SitterProfileApiMixin(sitters, bookingsV4, sitterPrivate);

  // Wire in the subscription domain mixin.
  include SubscriptionApiMixin(subscriptionState, sitterLicensing);

  // Wire in the CRM deal-offer / coupon domain mixin.
  include CRMApiMixin(dealOffers, dealOfferCounterBox, sitters, bookingsV4, payments, subscriptionState, sitterLicensing);

  // Wire in the sitter-profile-v2 extended data mixin.
  include SitterProfileV2ApiMixin(sitters, bookingsV4, sitterExtendedNew);

  // Wire in the recurring booking group domain mixin.
  // Shares the bookings map (for occurrence storage), sitters, sitterExtendedNew,
  // a boxed nextBookingId counter, and a dedicated group counter.
  include RecurringApiMixin(bookingGroups, bookingsV4, sitters, sitterExtendedNew, nextBookingIdBox, recurringGroupCounterBox);

  // Teams stable state — keyed stores for teams, invites, and co-booking assignments.
  let teams       = Map.empty<Text, TeamsLib.Team>();
  let teamInvites = Map.empty<Text, TeamsLib.TeamInvite>();
  let coAssignments = Map.empty<Nat, TeamsLib.CoBookingAssignment>();

  // Wire in the teams domain mixin.
  include TeamsApiMixin(teams, teamInvites, coAssignments);

  // Team collaboration state — messages and job threads for Slack-like team UX.
  // Polled by frontend at 3-5 second intervals (no WebSockets on IC).
  let teamMessages = Map.empty<Text, TeamCollabTypes.TeamMessage>();
  let jobThreads   = Map.empty<Text, TeamCollabTypes.JobThread>();

  // Wire in the team collaboration mixin.
  include TeamCollabApiMixin(teamMessages, jobThreads);

  // Wire in the ad hoc job notifications mixin.
  include AdHocApiMixin(notifications, notifCounterBox);

  // App base URL (used in email CTAs)
  let appBaseUrl = "https://pawspect.co";

  func callerIsAdmin(caller : Principal) : Bool {
    if (caller.isAnonymous()) { return false };
    switch (accessControlState.userRoles.get(caller)) {
      case (?#admin) { true };
      case (_) { false };
    };
  };

  // Check if a sitter ID is currently frozen (sync helper; grandfathered sitters are never frozen).
  func isSitterIdFrozenSync(sitterId : Nat) : Bool {
    // Grandfathered → never frozen
    let isGrandfatheredFlag : Bool = switch (sitterLicensing.get(sitterId)) {
      case (?entry) {
        switch (entry.isGrandfathered) {
          case (?true) { true };
          case (?false) { false };
          case (null) { true };
        };
      };
      case (null) { true };
    };
    if (isGrandfatheredFlag) { return false };
    switch (subscriptionState.get(sitterId)) {
      case (null) { false };
      case (?r) { r.isFrozen };
    };
  };

  func normalizePhone(phone : Text) : Text {
    let chars = phone.chars();
    let digits = chars.filter(func(c : Char) : Bool { c >= '0' and c <= '9' });
    Text.fromIter(digits);
  };

  // URL-encode an email address for use as a query parameter.
  // Replaces the characters that are most likely to appear in email addresses
  // and that are invalid or ambiguous in query strings.
  func encodeEmailForUrl(email : Text) : Text {
    var result = "";
    for (c in email.chars()) {
      result #= switch (c) {
        case '@' { "%40" };
        case '+' { "%2B" };
        case ' ' { "%20" };
        case '#' { "%23" };
        case '&' { "%26" };
        case '=' { "%3D" };
        case '?' { "%3F" };
        case _ { Text.fromChar(c) };
      };
    };
    result;
  };

  func appendAuditLog(action : AuditLog.AuditAction, entityType : Text, entityId : Nat, snapshot : Text, deletedBy : Principal) {
    let entry : AuditLog.Public = {
      id        = nextAuditLogId;
      action;
      entityType;
      entityId;
      snapshot;
      deletedBy;
      timestamp = Time.now();
    };
    auditLogsV2.add(nextAuditLogId, entry);
    nextAuditLogId += 1;
  };

  func isCallerAssignedSitter(caller : Principal, booking : Booking.Public) : Bool {
    if (caller.isAnonymous()) { return false };
    for (sitterId in booking.sitterIds.values()) {
      switch (sitters.get(sitterId)) {
        case (null) { /* skip */ };
        case (?profile) {
          if (profile.owner == ?caller) { return true };
        };
      };
    };
    false;
  };

  // Format a timestamp to a human-readable date string (YYYY-MM-DD approximation)
  func formatDate(ts : Time.Time) : Text {
    // ts is nanoseconds since epoch; convert to a simple readable form
    let seconds = ts / 1_000_000_000;
    let days = seconds / 86400;
    let years = days / 365 + 1970;
    let remaining = days - (years - 1970) * 365;
    let months = remaining / 30 + 1;
    let day = remaining - (months - 1) * 30 + 1;
    years.toText() # "-" # (if (months < 10) { "0" # months.toText() } else { months.toText() }) # "-" # (if (day < 10) { "0" # day.toText() } else { day.toText() });
  };

  func formatCents(cents : Nat) : Text {
    "$" # (cents / 100).toText() # "." # (if (cents % 100 < 10) { "0" # (cents % 100).toText() } else { (cents % 100).toText() });
  };

  // Collect sitter names from a list of IDs
  func sitterNamesText(sitterIds : [Nat]) : Text {
    let names = List.empty<Text>();
    for (id in sitterIds.values()) {
      switch (sitters.get(id)) {
        case (?p) { names.add(p.name) };
        case (null) { names.add("Unknown") };
      };
    };
    names.values().join(", ");
  };

  func petNamesText(pets : [Booking.Pet]) : Text {
    let names = pets.map(func(p) { p.petName });
    names.values().join(", ");
  };

  func servicesText(services : [Text]) : Text {
    services.values().join(", ");
  };

  // ---------------------------------------------------------------------------
  // Admin claim — PERMANENTLY DISABLED.
  // Admin access is hardcoded for Marcus Berggren, Linnea Berggren, Bailey Berggren.
  // This stub is preserved so existing frontend bindings do not break.
  // ---------------------------------------------------------------------------
  public shared ({ caller }) func claimFirstAdmin() : async Bool {
    ignore caller;
    false; // always returns false — admin access cannot be claimed this way
  };

  public query ({ caller }) func isAdminAssigned() : async Bool {
    accessControlState.adminAssigned;
  };

  // DISABLED: clearAllData has been permanently disabled for security.
  // The function signature is preserved to avoid breaking any existing frontend bindings.
  public shared ({ caller }) func clearAllData() : async { #ok; #err : Text } {
    #err("This operation has been disabled for security");
  };

  // DISABLED: Admin assignment is now permanently locked via the hardcoded admin list.
  // setCallerAsAdmin() is disabled so no one can self-promote outside of that list.
  public shared ({ caller }) func setCallerAsAdmin() : async { #ok; #err : Text } {
    #err("Admin assignment is locked. Admin access is managed by the platform.");
  };

  // Stable set of principals that have been explicitly granted admin access via grantAdminAccess.
  // Stored separately from userRoles so we can return the list without iterating the full roles map.
  stable let grantedAdminPrincipals = Map.empty<Principal, Bool>();

  // Admin-only: grant admin portal access to any principal (typically a sitter).
  // Stored in stable storage — survives every redeployment.
  public shared ({ caller }) func grantAdminAccess(targetPrincipal : Principal) : async { #ok; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can grant admin access");
    };
    if (targetPrincipal.isAnonymous()) {
      return #err("Cannot grant admin access to anonymous principal");
    };
    accessControlState.userRoles.add(targetPrincipal, #admin);
    accessControlState.adminAssigned := true;
    grantedAdminPrincipals.add(targetPrincipal, true);
    #ok;
  };

  // Admin-only: revoke admin portal access from a principal (demotes back to #user).
  // Permanent admins (Marcus Berggren, Linnea Berggren, Bailey Berggren) can never be demoted.
  public shared ({ caller }) func revokeAdminAccess(targetPrincipal : Principal) : async { #ok; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can revoke admin access");
    };
    if (targetPrincipal.isAnonymous()) {
      return #err("Cannot revoke access from anonymous principal");
    };
    // Guard: permanent admins cannot be demoted under any circumstances
    switch (userProfiles.get(targetPrincipal)) {
      case (?profile) {
        if (hardcodedAdmins.any(func(n : Text) : Bool { n == profile.name })) {
          return #err("Cannot revoke admin access from a permanent admin");
        };
      };
      case (null) {};
    };
    accessControlState.userRoles.add(targetPrincipal, #user);
    grantedAdminPrincipals.remove(targetPrincipal);
    #ok;
  };

  // Return the list of principals that have been explicitly granted admin access
  // via grantAdminAccess. Used by the frontend Sitters tab to show toggle state.
  public query func getGrantedAdmins() : async [Principal] {
    grantedAdminPrincipals.keys().toArray();
  };

  // Admin notification email management
  public shared ({ caller }) func setAdminNotificationEmail(email : Text) : async { #ok; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can set the notification email");
    };
    adminEmail := email;
    #ok;
  };

  public query ({ caller }) func getAdminNotificationEmail() : async Text {
    if (not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view the notification email");
    };
    adminEmail;
  };

  // ---------------------------------------------------------------------------
  // User Profile Functions
  // ---------------------------------------------------------------------------
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) { return null };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Hardcoded permanent admins — these names always receive admin role on profile save.
  // Linnea and Bailey also retain a sitter-compatible user role (admin supersedes it).
  let hardcodedAdmins : [Text] = ["Marcus Berggren", "Linnea Berggren", "Bailey Berggren"];

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be logged in to save profile");
    };
    // Assign role: hardcoded admins always get #admin; others get #user if no role yet
    let isHardcodedAdmin = hardcodedAdmins.any(func(n : Text) : Bool { n == profile.name });
    if (isHardcodedAdmin) {
      accessControlState.userRoles.add(caller, #admin);
      accessControlState.adminAssigned := true;
    } else {
      switch (accessControlState.userRoles.get(caller)) {
        case (null) { accessControlState.userRoles.add(caller, #user) };
        case (?_) { /* already has role — preserve it */ };
      };
    };
    userProfiles.add(caller, profile);
    #ok;
  };

  // ---------------------------------------------------------------------------
  // Sitter Profile CRUD
  // ---------------------------------------------------------------------------
  public shared ({ caller }) func createSitterProfile(input : SitterProfile.Creation) : async SitterProfile.Public {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in to create a sitter profile");
    };
    switch (accessControlState.userRoles.get(caller)) {
      case (null) { accessControlState.userRoles.add(caller, #user) };
      case (?_) { /* already has role */ };
    };

    let isAdmin = callerIsAdmin(caller);

    // Age validation: if birthdate provided, reject applicants under 18
    switch (input.birthdate) {
      case (?bd) {
        if (not isAtLeast18(bd)) {
          Runtime.trap("Applicant must be at least 18 years old to register as a sitter");
        };
      };
      case (null) { /* no birthdate provided — skip validation */ };
    };

    // US-only validation: location must be a valid US ZIP code (5 digits or ZIP+4 format)
    // This platform only accepts sitters located in the United States.
    if (not isAdmin) {
      let zip = input.location;
      let validUsZip = isValidUsZip(zip);
      if (not validUsZip) {
        Runtime.trap("Pawspect only accepts sitters located in the United States. Please enter a valid US ZIP code.");
      };
    };

    let newProfile : SitterProfile.Public = {
      id = nextSitterId;
      name = input.name;
      bio = input.bio;
      services = input.services;
      hourlyRate = input.hourlyRate;
      location = input.location;
      photoUrl = input.photoUrl;
      phone = input.phone;
      rating = 0.0;
      reviewCount = 0;
      isActive = isAdmin;
      owner = ?caller;
      serviceRates = [];
      birthdate = input.birthdate;
      isAnonymized = null;
    };

    sitters.add(nextSitterId, newProfile);
    // New sitters are NOT grandfathered — stored in the separate licensing map.
    sitterLicensing.add(nextSitterId, { isGrandfathered = ?false });
    // NOTE: subscription record is intentionally NOT created here.
    // The 30-day trial clock only starts after an admin explicitly approves the
    // application via approveSitterApplication(). Until then the sitter profile
    // sits in the admin review queue with isActive=false and no subscription.
    nextSitterId += 1;

    // Notify admin of the new sitter application (fire-and-forget, best-effort)
    if (adminEmail != "") {
      let sitterEmail = switch (userProfiles.get(caller)) {
        case (null) { "" };
        case (?up) { switch (up.email) { case (null) { "" }; case (?e) { e } } };
      };
      let servicesText_ = input.services.values().join(", ");
      let html = EmailTemplates.newSitterApplication(
        input.name,
        sitterEmail,
        servicesText_,
        input.location,
        appBaseUrl # "/#/admin-dashboard",
      );
      try {
        ignore await EmailClient.sendEmail(
          [adminEmail],
          "New sitter application: " # input.name # " \u{1F4CB}",
          html,
        );
      } catch (_) { /* email is best-effort — never let it stop the canister */ };
    };

    newProfile;
  };

  public query ({ caller }) func getSitterProfile(id : SitterProfile.Id) : async SitterProfile.Public {
    switch (sitters.get(id)) {
      case (null) { Runtime.trap("Sitter not found") };
      case (?profile) {
        // If anonymized, return a sanitized profile with generic data
        if (profile.isAnonymized == ?true) {
          return {
            profile with
            name = "Anonymized User";
            bio = "";
            phone = "";
            photoUrl = "";
            location = "";
          }
        };
        // Sitter viewing their own profile — always return full profile
        if (profile.owner == ?caller) {
          return profile;
        };
        // Admin data privacy: admins see profile with phone stripped by default.
        // Scoped access is granted only when an open #adminAccessing support ticket
        // exists for this sitter's principal.
        if (callerIsAdmin(caller)) {
          let ownerPrincipal : ?Principal = profile.owner;
          let hasAccess = switch (ownerPrincipal) {
            case (null) { false };
            case (?ownerP) {
              supportTickets.values().any(func(t : SupportTicket.Public) : Bool {
                Principal.equal(t.sitterId, ownerP) and
                (switch (t.status) { case (#adminAccessing) { true }; case (_) { false } })
              })
            };
          };
          if (not hasAccess) {
            // Public-safe subset only — strip personal contact info
            return { profile with phone = "" }
          };
          // Admin has scoped access via support ticket — return full profile
          return profile;
        };
        // All other callers: return public data
        { profile with phone = "" }
      };
    };
  };

  public query func getAllSitters() : async [SitterProfile.Public] {
    // Return all sitters with phone stripped — personal contact is not public.
    // Admins use support tickets to get scoped full-profile access when needed.
    let result = List.empty<SitterProfile.Public>();
    for ((_, s) in sitters.entries()) {
      result.add({ s with phone = "" });
    };
    result.values().toArray();
  };

  public query func getActiveSitters() : async [SitterProfile.Public] {
    sitters.values().toArray().filter(func(s : SitterProfile.Public) : Bool {
      s.isActive and s.isAnonymized != ?true
    });
  };

  public shared ({ caller }) func updateSitterProfile(input : SitterProfile.Update) : async SitterProfile.Public {
    switch (sitters.get(input.id)) {
      case (null) { Runtime.trap("Sitter not found") };
      case (?profile) {
        let isAdmin = callerIsAdmin(caller);
        if (not isAdmin and profile.owner != ?caller) {
          Runtime.trap("Unauthorized: Only the sitter or admin can update this profile");
        };
        // Fix 4: enforce account freeze on profile updates
        if (not isAdmin and isSitterIdFrozenSync(input.id)) {
          Runtime.trap("Account is suspended. Please reactivate your subscription to update your profile.");
        };

        let updated : SitterProfile.Public = {
          id = input.id;
          name = input.name;
          bio = input.bio;
          services = input.services;
          hourlyRate = input.hourlyRate;
          location = input.location;
          photoUrl = input.photoUrl;
          phone = input.phone;
          rating = profile.rating;
          reviewCount = profile.reviewCount;
          isActive = input.isActive;
          owner = profile.owner;
          serviceRates = profile.serviceRates;
          birthdate = profile.birthdate;
          isAnonymized = profile.isAnonymized;
        };

        sitters.add(input.id, updated);

        // Log activation/deactivation changes to audit trail
        if (profile.isActive != input.isActive) {
          let action = if (input.isActive) { #SitterReactivated } else { #SitterDeactivated };
          let ownerText = switch (profile.owner) {
            case (null) { "none" };
            case (?p) { p.toText() };
          };
          let snapshot = "{\"id\":" # input.id.toText() #
            ",\"name\":\"" # input.name # "\"" #
            ",\"isActive\":" # (if (input.isActive) { "true" } else { "false" }) #
            ",\"owner\":\"" # ownerText # "\"}";
          appendAuditLog(action, "Sitter", input.id, snapshot, caller);
        };

        updated;
      };
    };
  };

  // ---------------------------------------------------------------------------
  // One-time data migration: set zip code to 80304 for Linnea Berggren and
  // Bailey Berggren so they appear in Boulder Area search results.
  // Admin-only. Idempotent — safe to call multiple times.
  // ---------------------------------------------------------------------------
  public shared ({ caller }) func fixSitterZipCodes() : async { #ok : Text; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can run data migrations");
    };

    let targetNames : [Text] = ["Linnea Berggren", "Bailey Berggren"];
    let updated = List.empty<Text>();

    for ((sitterId, profile) in sitters.entries()) {
      let isTarget = targetNames.any(func(n : Text) : Bool { n == profile.name });
      if (isTarget and profile.location != "80304") {
        let fixed : SitterProfile.Public = { profile with location = "80304" };
        sitters.add(sitterId, fixed);
        updated.add(profile.name # " (id=" # sitterId.toText() # ")");
      };
    };

    if (updated.size() == 0) {
      return #ok("No changes needed — all target sitters already have zip 80304 (or were not found)");
    };
    #ok("Updated " # updated.size().toText() # " sitter(s): " # updated.values().join(", "));
  };

  public shared ({ caller }) func deleteSitterProfile(id : SitterProfile.Id) : async { #ok; #err : Text } {
    switch (sitters.get(id)) {
      case (null) { return #err("Sitter not found") };
      case (?profile) {
        if (not callerIsAdmin(caller) and profile.owner != ?caller) {
          return #err("Unauthorized: Only an admin can delete a sitter profile");
        };
        // Snapshot before deletion
        let ownerText = switch (profile.owner) {
          case (null) { "none" };
          case (?p) { p.toText() };
        };
        let snapshot = "{\"id\":" # id.toText() #
          ",\"name\":\"" # profile.name # "\"" #
          ",\"isActive\":" # (if (profile.isActive) { "true" } else { "false" }) #
          ",\"owner\":\"" # ownerText # "\"}";
        // Remove sitter and all associated data
        sitters.remove(id);
        availabilities.remove(id);
        reviews.remove(id);
        // Log to audit trail
        appendAuditLog(#SitterDeleted, "Sitter", id, snapshot, caller);
        return #ok;
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Reviews — Fix 6: require a valid completed bookingId
  // ---------------------------------------------------------------------------
  public shared ({ caller }) func submitReview(sitterId : SitterProfile.Id, rating : Float, reviewText : Text, bookingId : Booking.Id) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in to submit a review");
    };

    if (rating < 1.0 or rating > 5.0) {
      Runtime.trap("Invalid rating: Must be 1.0 - 5.0");
    };

    // Reviews come from clients — no sitter freeze check needed here.

    // Fix 6: validate the booking exists, is completed, and is for this sitter
    if (bookingId != 0) {
      switch (bookingsV4.get(bookingId)) {
        case (null) { Runtime.trap("Invalid booking ID: booking not found") };
        case (?booking) {
          // Verify booking is completed
          switch (booking.status) {
            case (#completed) { /* ok */ };
            case (_) { Runtime.trap("Reviews can only be submitted for completed bookings") };
          };
          // Verify the booking is associated with the sitter being reviewed
          let hasSitter = booking.sitterIds.any(func(id : Nat) : Bool { id == sitterId });
          if (not hasSitter) {
            Runtime.trap("This booking was not with the specified sitter");
          };
          // Prevent duplicate reviews for the same bookingId
          let existingReviews = switch (reviews.get(sitterId)) {
            case (null) { [] };
            case (?rl) { rl.values().toArray() };
          };
          let alreadyReviewed = existingReviews.any(func(r : Review.Public) : Bool { r.bookingId == bookingId });
          if (alreadyReviewed) {
            Runtime.trap("A review has already been submitted for this booking");
          };
        };
      };
    };

    switch (sitters.get(sitterId)) {
      case (null) { Runtime.trap("Sitter not found") };
      case (?profile) {
        let newReviewCount = profile.reviewCount + 1;
        let totalRating = profile.rating * profile.reviewCount.toFloat() + rating;
        let newRating = totalRating / newReviewCount.toFloat();

        let updated = {
          profile with
          rating = newRating;
          reviewCount = newReviewCount;
        };

        sitters.add(sitterId, updated);

        // Store the review text in reviews map
        let reviewEntry : Review.Public = {
          bookingId;
          rating;
          reviewText;
          createdAt = Time.now();
        };

        let reviewList = switch (reviews.get(sitterId)) {
          case (null) { List.empty<Review.Public>() };
          case (?existing) { existing };
        };
        reviewList.add(reviewEntry);
        reviews.add(sitterId, reviewList);
      };
    };
  };

  public query func getSitterReviews(sitterId : SitterProfile.Id) : async [Review.Public] {
    switch (reviews.get(sitterId)) {
      case (null) { [] };
      case (?reviewList) {
        // Return newest first
        let arr = reviewList.values().toArray();
        arr.sort(func(a : Review.Public, b : Review.Public) : { #less; #equal; #greater } {
          Int.compare(b.createdAt, a.createdAt)
        });
      };
    };
  };

  // Alias so frontend can call getReviewsBySitter interchangeably.
  public query func getReviewsBySitter(sitterId : SitterProfile.Id) : async [Review.Public] {
    switch (reviews.get(sitterId)) {
      case (null) { [] };
      case (?reviewList) {
        let arr = reviewList.values().toArray();
        arr.sort(func(a : Review.Public, b : Review.Public) : { #less; #equal; #greater } {
          Int.compare(b.createdAt, a.createdAt)
        });
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Tips
  // ---------------------------------------------------------------------------

  // Record a tip for a sitter.  Called by the booking flow or sitter dashboard.
  // Only the assigned sitter or admin may record a tip.
  public shared ({ caller }) func recordTip(sitterId : SitterProfile.Id, bookingId : Booking.Id, amountCents : Nat) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be logged in");
    };
    let isAdmin = callerIsAdmin(caller);
    switch (sitters.get(sitterId)) {
      case (null) { return #err("Sitter not found") };
      case (?profile) {
        if (not isAdmin and profile.owner != ?caller) {
          return #err("Unauthorized: Only the sitter or admin can record tips");
        };
        // Fix 4: enforce account freeze on all sitter write operations
        if (not isAdmin and isSitterIdFrozenSync(sitterId)) {
          return #err("Account is suspended. Please reactivate your subscription.");
        };
      };
    };
    let clientName = switch (bookingsV4.get(bookingId)) {
      case (null) { "Client" };
      case (?b) { b.clientName };
    };
    let tipEntry : TipRecord.Public = {
      sitterId;
      bookingId;
      amountCents;
      clientName;
      createdAt = Time.now();
    };
    let tipList = switch (tips.get(sitterId)) {
      case (null) { List.empty<TipRecord.Public>() };
      case (?existing) { existing };
    };
    tipList.add(tipEntry);
    tips.add(sitterId, tipList);
    #ok;
  };

  // Return all tip records for a given sitter, newest first.
  // Only the sitter themselves or an admin may view tips.
  public query ({ caller }) func getTipsBySitter(sitterId : SitterProfile.Id) : async [TipRecord.Public] {
    // Allow the sitter or admin
    let isAdmin = callerIsAdmin(caller);
    let isSitter = switch (sitters.get(sitterId)) {
      case (null) { false };
      case (?profile) { profile.owner == ?caller };
    };
    if (not isAdmin and not isSitter) {
      Runtime.trap("Unauthorized: Only the sitter or admin can view tips");
    };
    switch (tips.get(sitterId)) {
      case (null) { [] };
      case (?tipList) {
        let arr = tipList.values().toArray();
        arr.sort(func(a : TipRecord.Public, b : TipRecord.Public) : { #less; #equal; #greater } {
          Int.compare(b.createdAt, a.createdAt)
        });
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Ad Hoc Jobs (off-app client jobs for sitter accounting)
  // Non-app clients are NEVER contacted by the app. clientEmail is always empty.
  // ---------------------------------------------------------------------------

  // Internal helper: create a notification for a sitter.
  func createNotificationInternal(
    recipientSitterId : Nat,
    title             : Text,
    body              : Text,
    notificationType  : Text,
  ) {
    let notif = NotifLib.build(
      notifCounterBox.value,
      recipientSitterId,
      title,
      body,
      notificationType,
    );
    notifications.add(notifCounterBox.value, notif);
    notifCounterBox.value += 1;
  };

  // Internal helper: look up a sitter's email address by sitter ID.
  func lookupSitterEmailById(sitterId : Nat) : ?Text {
    switch (sitters.get(sitterId)) {
      case (null) { null };
      case (?sitter) {
        switch (sitter.owner) {
          case (null) { null };
          case (?ownerP) {
            switch (userProfiles.get(ownerP)) {
              case (null) { null };
              case (?up) { up.email };
            };
          };
        };
      };
    };
  };

  /// Create an ad hoc job record for a non-app client.
  /// CRITICAL: clientEmail and clientPhone are always empty — the non-app client
  /// is never contacted by the app under any circumstances.
  /// offAppClientAcknowledged MUST be true — sitter affirms the client has no Pawspect relationship.
  public shared ({ caller }) func createAdHocJob(
    sitterId                   : Nat,
    clientName                 : Text,
    adHocClientContact         : ?Text,
    service                    : Text,
    jobDate                    : Text,
    startTime                  : Text,
    endTime                    : Text,
    ratePerHourCents           : Nat,
    totalAmountCents           : Nat,
    coSitterId                 : ?Nat,
    teamId                     : ?Text,
    petNames                   : [Text],
    notes                      : ?Text,
    offAppClientAcknowledged   : Bool,
  ) : async { #ok : Booking.Public; #err : Text } {
    // Required legal acknowledgment: sitter must affirm the off-app client has no
    // Pawspect relationship and will not be contacted by the platform.
    if (not offAppClientAcknowledged) {
      return #err("You must acknowledge that this is an off-app client with no Pawspect relationship before logging this job.");
    };
    if (caller.isAnonymous()) {
      return #err("Must be logged in to create an ad hoc job");
    };

    // Verify primary sitter exists
    switch (sitters.get(sitterId)) {
      case (null) { return #err("Sitter not found: " # sitterId.toText()) };
      case (?_) {};
    };

    // If coSitterId supplied, teamId must also be supplied
    switch (coSitterId) {
      case (?csId) {
        switch (teamId) {
          case (null) { return #err("teamId is required when coSitterId is set") };
          case (?_) {};
        };
        switch (sitters.get(csId)) {
          case (null) { return #err("Co-sitter not found: " # csId.toText()) };
          case (?_) {};
        };
      };
      case (null) {};
    };

    // Parse duration for serviceSchedule slot
    let durationMinutes : Nat = do {
      let parseMins = func(s : Text) : Nat {
        let parts = s.split(#char ':').toArray();
        if (parts.size() != 2) { return 0 };
        switch (Nat.fromText(parts[0]), Nat.fromText(parts[1])) {
          case (?h, ?m) { h * 60 + m };
          case (_) { 0 };
        };
      };
      let sm = parseMins(startTime);
      let em = parseMins(endTime);
      if (em > sm) { em - sm } else { 0 };
    };
    ignore ratePerHourCents;  // stored in slot ratePerHour field below

    // Build sitter ID list
    let sitterIdList : [Nat] = switch (coSitterId) {
      case (null) { [sitterId] };
      case (?csId) { [sitterId, csId] };
    };

    // Build minimal pet records from names
    let petRecords : [Booking.Pet] = petNames.map(
      func(n : Text) : Booking.Pet {
        { petName = n; petType = "Dog"; breed = null; petNotes = null };
      }
    );

    // Service schedule for agenda display
    let slot : Booking.ServiceSlot = {
      service         = service;
      sitterId;
      startTime;
      endTime;
      ratePerHour     = ratePerHourCents / 100;
      durationMinutes;
    };
    let daySchedule : Booking.DayServiceSchedule = {
      date  = jobDate;
      slots = [slot];
    };

    let notesText : Text = switch (notes) {
      case (null) { "" };
      case (?n) { n };
    };

    let now = Time.now();
    let bookingId = nextBookingId;

    let newJob : Booking.Public = {
      id                    = bookingId;
      clientName;
      clientEmail           = "";     // NEVER populated for non-app clients
      clientPhone           = "";     // NEVER populated for non-app clients
      pets                  = petRecords;
      services              = [service];
      sitterIds             = sitterIdList;
      startDate             = now;
      endDate               = now;
      notes                 = notesText;
      status                = #completed;   // ad hoc jobs start as completed
      createdAt             = now;
      isRecurring           = false;
      recurrencePattern     = null;
      recurrenceEndDate     = null;
      paymentSessionId      = null;
      stripePaymentIntentId = null;
      tip                   = null;
      schedule              = null;
      serviceSchedule       = ?[daySchedule];
      declineReason         = null;
      alternativeWindows    = null;
      agreements            = null;
      isAdHoc               = true;
      adHocClientContact    = adHocClientContact;
    };

    bookingsV4.add(bookingId, newJob);
    nextBookingId += 1;

    // Compute payment splits
    let splitsList : [PaymentRecord.PaymentSplit] = switch (coSitterId, teamId) {
      case (?csId, ?tid) {
        switch (teams.get(tid)) {
          case (null) {
            [{ sitterId; amount = totalAmountCents; paid = false }];
          };
          case (?team) {
            let rawSplits = TeamsLib.computeSplitAmounts(team, totalAmountCents);
            rawSplits.map(
              func((sid, amt) : (Nat, Nat)) : PaymentRecord.PaymentSplit {
                { sitterId = sid; amount = amt; paid = false };
              }
            );
          };
        };
      };
      case (_) {
        [{ sitterId; amount = totalAmountCents; paid = false }];
      };
    };

    // Create PaymentRecord with #pending status (sitter marks it paid later)
    let paymentRecord : PaymentRecord.Public = {
      bookingId;
      totalAmount           = totalAmountCents;
      method                = #manual;
      status                = #pending;
      notes                 = notes;
      stripePaymentIntentId = null;
      manualConfirmedBy     = null;
      confirmedAt           = null;
      splits                = splitsList;
      paidDate              = null;
      discountPercent       = null;
      discountAmount        = null;
      originalAmount        = null;
      completionNotes       = null;
      actualEndTime         = null;
      adHocItems            = [];
      paymentMethodDetails  = null;
    };
    payments.add(bookingId, paymentRecord);

    // Create CoBookingAssignment if co-sitter is assigned
    switch (coSitterId, teamId) {
      case (?csId, ?tid) {
        let splitAmounts = splitsList.map<PaymentRecord.PaymentSplit, (Nat, Nat)>(
          func(s : PaymentRecord.PaymentSplit) : (Nat, Nat) { (s.sitterId, s.amount) }
        );
        let assignment = TeamsLib.buildAssignment(
          bookingId,
          tid,
          [(sitterId, "Primary"), (csId, "Co-sitter")],
          splitAmounts,
        );
        coAssignments.add(bookingId, assignment);
      };
      case (_) {};
    };

    // Audit log
    let coSitterText = switch (coSitterId) {
      case (null) { "none" };
      case (?id) { id.toText() };
    };
    let snapshot =
      "{\"bookingId\":" # bookingId.toText() #
      ",\"sitterId\":" # sitterId.toText() #
      ",\"clientName\":\"" # clientName # "\"" #
      ",\"service\":\"" # service # "\"" #
      ",\"jobDate\":\"" # jobDate # "\"" #
      ",\"totalAmountCents\":" # totalAmountCents.toText() #
      ",\"coSitterId\":\"" # coSitterText # "\"" #
      ",\"isAdHoc\":true}";
    appendAuditLog(#AdHocJobCreated, "AdHocJob", bookingId, snapshot, caller);

    // If co-sitter assigned: in-app notification + email (fire-and-forget)
    switch (coSitterId) {
      case (?csId) {
        let coSitterName = switch (sitters.get(csId)) {
          case (null) { "Co-sitter" };
          case (?s) { s.name };
        };
        let assigningName = switch (sitters.get(sitterId)) {
          case (null) { "Your partner" };
          case (?s) { s.name };
        };
        let earningText : Text = do {
          let share = splitsList.find(
            func(s : PaymentRecord.PaymentSplit) : Bool { s.sitterId == csId }
          );
          switch (share) {
            case (null) { "" };
            case (?s) { formatCents(s.amount) };
          };
        };

        // In-app notification (polling-based)
        createNotificationInternal(
          csId,
          "Off-app job assigned to you",
          assigningName # " assigned you to a " # service # " job on " # jobDate #
          (if (earningText != "") { " — your share: " # earningText } else { "" }),
          "adhoc_assignment",
        );

        // Email to co-sitter (no client contact info included — privacy)
        switch (lookupSitterEmailById(csId)) {
          case (null) { /* no email configured — skip */ };
          case (?email) {
            let html = EmailTemplates.adHocJobAssignmentEmail(
              coSitterName,
              assigningName,
              service,
              jobDate,
              startTime,
              endTime,
              earningText,
              appBaseUrl # "/#/sitter-dashboard?tab=agenda",
            );
            try {
              ignore await EmailClient.sendEmail(
                [email],
                "You've been assigned to an off-app job",
                html,
              );
            } catch (_) { /* email is best-effort */ };
          };
        };
      };
      case (null) {};
    };

    #ok(newJob);
  };

  /// Return all ad hoc jobs for a given sitter (isAdHoc = true and sitterId in sitterIds).
  public query func getAdHocJobsBySitter(sitterId : Nat) : async [Booking.Public] {
    bookingsV4.values()
      .filter(func(b : Booking.Public) : Bool {
        b.isAdHoc and b.sitterIds.any(func(id : Nat) : Bool { id == sitterId })
      })
      .toArray();
  };

  /// Mark an ad hoc job's payment as paid.
  public shared ({ caller }) func updateAdHocJobPayment(
    bookingId     : Nat,
    paidDate      : Text,
    paymentMethod : ?PaymentRecord.PaymentMethodDetails,
  ) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Must be logged in");
    };
    // Verify the booking is an ad hoc job
    switch (bookingsV4.get(bookingId)) {
      case (null) { return #err("Booking not found: " # bookingId.toText()) };
      case (?b) {
        if (not b.isAdHoc) {
          return #err("Booking " # bookingId.toText() # " is not an ad hoc job");
        };
        // Allow the assigned sitter or admin
        let isAdmin = callerIsAdmin(caller);
        if (not isAdmin and not isCallerAssignedSitter(caller, b)) {
          return #err("Unauthorized: Only the assigned sitter or admin can update payment");
        };
      };
    };
    switch (payments.get(bookingId)) {
      case (null) { return #err("Payment record not found for booking " # bookingId.toText()) };
      case (?p) {
        payments.add(bookingId, {
          p with
          status               = #paid;
          paidDate             = ?paidDate;
          confirmedAt          = ?Time.now();
          paymentMethodDetails = paymentMethod;
        });
        #ok;
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Sitter Stats (full implementation — all figures derived from real data)
  // ---------------------------------------------------------------------------

  // Returns full analytics stats for a specific sitter.
  // - totalCompletedBookings   : #completed bookings where sitterId is in sitterIds
  // - totalEarningsCents       : sum of paid PaymentRecord.totalAmount for this sitter's bookings
  // - currentMonthEarningsCents: paid payments confirmed in the current calendar month (nanoseconds)
  // - repeatClientCount        : unique contacts (email+phone key) with ≥2 completed bookings
  // - repeatClientRatePct      : repeatClientCount / uniqueClientCount * 100
  //
  // Accessible without authentication — sitter ID is the only filter.
  public query func getSitterStatsById(sitterId : SitterProfile.Id) : async {
    totalCompletedBookings    : Nat;
    totalEarningsCents        : Nat;
    currentMonthEarningsCents : Nat;
    repeatClientCount         : Nat;
    repeatClientRatePct       : Float;
    adHocJobCount             : Nat;
  } {
    var completedCount : Nat = 0;
    var totalEarnings  : Nat = 0;
    var monthEarnings  : Nat = 0;
    var adHocCount     : Nat = 0;

    // Current month boundary: compute start-of-month in nanoseconds.
    let nowNs     : Int = Time.now();
    let nowSec    : Int = nowNs / 1_000_000_000;
    let daysSince : Int = nowSec / 86_400;
    let yearsSince : Int = daysSince / 365;
    let year      : Int = 1970 + yearsSince;
    let remDays   : Int = daysSince - yearsSince * 365;
    let monthNum  : Int = remDays / 30 + 1;
    let monthStartSec : Int = (daysSince - remDays % 30) * 86_400;
    let monthStartNs  : Int = monthStartSec * 1_000_000_000;

    // Track unique client contact keys for repeat-client calculation (ad hoc excluded)
    let clientBookingCounts = Map.empty<Text, Nat>();

    for ((bookingId, booking) in bookingsV4.entries()) {
      let hasSitter = booking.sitterIds.any(func(id : Nat) : Bool { id == sitterId });
      if (not hasSitter) { /* skip */ } else {

        // Track ad hoc count
        if (booking.isAdHoc) { adHocCount += 1 };

        // Count completions
        switch (booking.status) {
          case (#completed) { completedCount += 1 };
          case (_) { /* skip */ };
        };

        // Earnings: only from paid PaymentRecords; use sitter's split amount for team bookings
        switch (payments.get(bookingId)) {
          case (null) { /* no payment record yet */ };
          case (?p) {
            if (p.status == #paid) {
              // Use this sitter's split amount (not full total) for accurate per-sitter earnings
              let sitterAmount : Nat = do {
                let splitEntry = p.splits.find(
                  func(s : PaymentRecord.PaymentSplit) : Bool { s.sitterId == sitterId }
                );
                switch (splitEntry) {
                  case (?s) { s.amount };
                  case (null) { p.totalAmount };  // fallback: no split = full amount
                };
              };
              totalEarnings += sitterAmount;
              let confirmedNs : Int = switch (p.confirmedAt) {
                case (null)  { 0 };
                case (?t)    { t };
              };
              if (confirmedNs >= monthStartNs) {
                monthEarnings += sitterAmount;
              };
            };
          };
        };

        // Build client key for repeat detection — skip ad hoc (no reliable client identity)
        if (not booking.isAdHoc) {
          let email       = booking.clientEmail.toLower();
          let phoneDigits = Text.fromIter(booking.clientPhone.toIter().filter(func(c : Char) : Bool { c >= '0' and c <= '9' }));
          let clientKey   = email # "|" # phoneDigits;
          if (clientKey != "|") {
            let prev = switch (clientBookingCounts.get(clientKey)) {
              case (null) { 0 };
              case (?n)   { n };
            };
            clientBookingCounts.add(clientKey, prev + 1);
          };
        };
      };
    };

    // Compute repeat client metrics
    let uniqueClientCount = clientBookingCounts.size();
    var repeatCount : Nat = 0;
    for ((_, cnt) in clientBookingCounts.entries()) {
      if (cnt >= 2) { repeatCount += 1 };
    };
    let repeatRatePct : Float = if (uniqueClientCount == 0) {
      0.0
    } else {
      repeatCount.toFloat() / uniqueClientCount.toFloat() * 100.0
    };

    ignore year;
    ignore monthNum;

    {
      totalCompletedBookings    = completedCount;
      totalEarningsCents        = totalEarnings;
      currentMonthEarningsCents = monthEarnings;
      repeatClientCount         = repeatCount;
      repeatClientRatePct       = repeatRatePct;
      adHocJobCount             = adHocCount;
    };
  };

  // ---------------------------------------------------------------------------
  // Sitter Service Rates
  // ---------------------------------------------------------------------------
  public query func getSitterServiceRates(sitterId : SitterProfile.Id) : async [SitterServiceRate.Public] {
    switch (sitters.get(sitterId)) {
      case (null) { Runtime.trap("Sitter not found") };
      case (?profile) { profile.serviceRates };
    };
  };

  public shared ({ caller }) func setSitterServiceRates(sitterId : SitterProfile.Id, rates : [SitterServiceRate.Public]) : async () {
    switch (sitters.get(sitterId)) {
      case (null) { Runtime.trap("Sitter not found") };
      case (?profile) {
        let isAdmin = callerIsAdmin(caller);
        if (not isAdmin and (profile.owner != ?caller)) {
          Runtime.trap("Unauthorized: Only the sitter or admin can update rates");
        };
        // Fix 4: enforce freeze on rate updates
        if (not isAdmin and isSitterIdFrozenSync(sitterId)) {
          Runtime.trap("Account is suspended. Please reactivate your subscription to update service rates.");
        };
        let updated = { profile with serviceRates = rates };
        sitters.add(sitterId, updated);
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Sitter Availability
  // ---------------------------------------------------------------------------
  public shared ({ caller }) func setSitterAvailability(sitterId : SitterProfile.Id, entries : [SitterAvailability.AvailabilityEntry]) : async () {
    switch (sitters.get(sitterId)) {
      case (null) { Runtime.trap("Sitter not found") };
      case (?profile) {
        let isAdmin = callerIsAdmin(caller);
        if (not isAdmin and profile.owner != ?caller) {
          Runtime.trap("Unauthorized: Only the sitter or admin can update availability");
        };
        // Fix 4: enforce freeze on availability updates
        if (not isAdmin and isSitterIdFrozenSync(sitterId)) {
          Runtime.trap("Account is suspended. Please reactivate your subscription to update availability.");
        };
        let availability : SitterAvailability.Availability = { entries };
        availabilities.add(sitterId, availability);
      };
    };
  };

  public query func getSitterAvailability(sitterId : SitterProfile.Id) : async [SitterAvailability.AvailabilityEntry] {
    switch (availabilities.get(sitterId)) {
      case (null) { [] };
      case (?availability) { availability.entries };
    };
  };

  // Parse "HH:MM" time string to minutes since midnight
  func parseTimeToMinutes(timeStr : Text) : ?Nat {
    let parts = timeStr.split(#char ':').toArray();
    if (parts.size() != 2) { return null };
    switch (Nat.fromText(parts[0]), Nat.fromText(parts[1])) {
      case (?h, ?m) { ?(h * 60 + m) };
      case (_) { null };
    };
  };

  // Parse "YYYY-MM-DD" date string to day-of-week using Tomohiko Sakamoto algorithm.
  // Returns: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  // (matching the existing availability schema where 0=Mon)
  func parseDateToDayOfWeek(dateStr : Text) : ?Nat {
    let parts = dateStr.split(#char '-').toArray();
    if (parts.size() != 3) { return null };
    switch (Nat.fromText(parts[0]), Nat.fromText(parts[1]), Nat.fromText(parts[2])) {
      case (?y, ?m, ?d) {
        // Tomohiko Sakamoto algorithm (returns 0=Sun, 1=Mon, ..., 6=Sat)
        let t : [Nat] = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
        let year = if (m < 3) { y - 1 } else { y };
        let dow = (year + year / 4 - year / 100 + year / 400 + t[m - 1] + d) % 7;
        // dow: 0=Sun, 1=Mon, ..., 6=Sat → remap to 0=Mon, ..., 5=Sat, 6=Sun
        let remapped = if (dow == 0) { 6 } else { dow - 1 };
        ?remapped;
      };
      case (_) { null };
    };
  };

  // Check if two time windows [aStart, aEnd) and [bStart, bEnd) overlap.
  // Uses half-open interval: overlap if aStart < bEnd AND bStart < aEnd.
  func _timesOverlap(aStart : Nat, aEnd : Nat, bStart : Nat, bEnd : Nat) : Bool {
    aStart < bEnd and bStart < aEnd;
  };

  // Check if a time (expressed as hour * 60 + minute, e.g. 9:30 = 570) falls
  // within a sitter's availability for a given dayOfWeek (0=Mon..6=Sun).
  // Returns true if available OR if no availability has been configured for that sitter.
  func _timeWithinAvailability(sitterId : Nat, dayOfWeek : Nat, startMinutes : Nat, endMinutes : Nat) : Bool {
    switch (availabilities.get(sitterId)) {
      case (null) { true }; // No availability configured → allow all
      case (?avail) {
        if (avail.entries.size() == 0) { return true };
        // Find any entry for this dayOfWeek
        let entry = avail.entries.find(func(e : SitterAvailability.AvailabilityEntry) : Bool {
          e.dayOfWeek == dayOfWeek
        });
        switch (entry) {
          case (null) { true }; // No entry for this day → allow
          case (?e) {
            // e.startTime and e.endTime are stored as minutes-since-midnight
            startMinutes >= e.startTime and endMinutes <= e.endTime;
          };
        };
      };
    };
  };

  // Check if a sitter has a conflicting booking for the given date + time window.
  // Checks bookings with status #pending, #confirmed, or #completed (active states).
  // Returns ?Text with a human-readable conflict description, or null if no conflict.
  func _findSitterConflict(sitterId : Nat, date : Text, startMin : Nat, endMin : Nat) : ?Text {
    let result = bookingsV4.values().find(func(b : Booking.Public) : Bool {
      // Only check active bookings (not cancelled or declined)
      let isActive = switch (b.status) {
        case (#cancelled) { false };
        case (#declined) { false };
        case (_) { true };
      };
      if (not isActive) { return false };
      // Check if this sitter is in this booking
      let hasSitter = b.sitterIds.any(func(id : Nat) : Bool { id == sitterId });
      if (not hasSitter) { return false };
      // Check serviceSchedule for slot overlap on the same date
      switch (b.serviceSchedule) {
        case (null) { false };
        case (?schedule) {
          schedule.any(func(day : Booking.DayServiceSchedule) : Bool {
            if (day.date != date) { return false };
            day.slots.any(func(slot : Booking.ServiceSlot) : Bool {
              if (slot.sitterId != sitterId) { return false };
              switch (parseTimeToMinutes(slot.startTime), parseTimeToMinutes(slot.endTime)) {
                case (?slotStart, ?slotEnd) {
                  _timesOverlap(startMin, endMin, slotStart, slotEnd);
                };
                case (_) { false };
              };
            });
          });
        };
      };
    });
    switch (result) {
      case (null) { null };
      case (?_) {
        ?("Sitter " # sitterId.toText() # " already has a booking that overlaps " # date # " " # startMin.toText() # "–" # endMin.toText());
      };
    };
  };

  // Public query: return all active sitters available for a given date + time window.
  // Input: date as "YYYY-MM-DD", startTime and endTime as "HH:MM".
  // Filters:
  //   1. Sitter must be active.
  //   2. Sitter's availability entries must include the requested day-of-week
  //      and the time window must fall within the entry's hours (if configured).
  //   3. No existing pending/confirmed booking for the same sitter overlaps
  //      the same date + time window.
  public query func getAvailableSittersForWindow(date : Text, startTime : Text, endTime : Text) : async [SitterProfile.Public] {
    let dayOfWeekOpt = parseDateToDayOfWeek(date);
    let startMinOpt = parseTimeToMinutes(startTime);
    let endMinOpt = parseTimeToMinutes(endTime);

    // If we can't parse the inputs we return all active sitters (graceful degradation)
    switch (dayOfWeekOpt, startMinOpt, endMinOpt) {
      case (?dayOfWeek, ?startMin, ?endMin) {
        let result = List.empty<SitterProfile.Public>();
        for ((sitterId, profile) in sitters.entries()) {
          if (not profile.isActive) { /* skip inactive */ } else {
            // Step 1: check availability matrix for this day+time
            let withinAvail = _timeWithinAvailability(sitterId, dayOfWeek, startMin, endMin);
            if (not withinAvail) { /* skip — outside configured hours */ } else {
              // Step 2: check for conflicting bookings on this date+time
              let conflict = _findSitterConflict(sitterId, date, startMin, endMin);
              switch (conflict) {
                case (?_) { /* skip — double-booking conflict */ };
                case (null) { result.add(profile) };
              };
            };
          };
        };
        result.values().toArray();
      };
      case (_) {
        // Unparseable input → return all active sitters
        sitters.values().toArray().filter(func(s : SitterProfile.Public) : Bool { s.isActive });
      };
    };
  };

  // Return all 14 hourly windows from 7:00 AM to 9:00 PM for a given date,
  // each annotated with how many active sitters are available for that window.
  // Slots with 0 available sitters are still returned so the frontend can show them as blocked.
  public query func getAvailableHourlyWindows(date : Text) : async [{startTime : Text; endTime : Text; availableSitterCount : Nat}] {
    let dayOfWeekOpt = parseDateToDayOfWeek(date);

    let result = List.empty<{startTime : Text; endTime : Text; availableSitterCount : Nat}>();

    // Generate 14 hourly slots: 07:00–08:00, 08:00–09:00, ..., 20:00–21:00
    var hour : Nat = 7;
    while (hour <= 20) {
      let startHourStr = if (hour < 10) { "0" # hour.toText() } else { hour.toText() };
      let endHour = hour + 1;
      let endHourStr = if (endHour < 10) { "0" # endHour.toText() } else { endHour.toText() };
      let startTimeStr = startHourStr # ":00";
      let endTimeStr = endHourStr # ":00";
      let startMin = hour * 60;
      let endMin = endHour * 60;

      var count : Nat = 0;

      switch (dayOfWeekOpt) {
        case (?dayOfWeek) {
          for ((sitterId, profile) in sitters.entries()) {
            if (profile.isActive) {
              let withinAvail = _timeWithinAvailability(sitterId, dayOfWeek, startMin, endMin);
              if (withinAvail) {
                let conflict = _findSitterConflict(sitterId, date, startMin, endMin);
                switch (conflict) {
                  case (null) { count += 1 };
                  case (?_) { /* has conflict — skip */ };
                };
              };
            };
          };
        };
        case (null) {
          // Unparseable date — count all active sitters as available
          for ((_, profile) in sitters.entries()) {
            if (profile.isActive) { count += 1 };
          };
        };
      };

      result.add({ startTime = startTimeStr; endTime = endTimeStr; availableSitterCount = count });
      hour += 1;
    };

    result.values().toArray();
  };

  // ---------------------------------------------------------------------------
  // Booking Functions
  // ---------------------------------------------------------------------------
  public shared func createBooking(input : Booking.Creation) : async Booking.Public {
    // Validate Sitter IDs
    for (sitterId in input.sitterIds.values()) {
      if (sitters.get(sitterId) == null) {
        Runtime.trap("Sitter with ID " # sitterId.toText() # " not found");
      };
      // Freeze enforcement: frozen sitters cannot accept new bookingsV4.
      if (isSitterIdFrozenSync(sitterId)) {
        Runtime.trap("Sitter account is currently suspended. Please contact the sitter directly.");
      };
    };

    // Backend availability enforcement: check each service slot against sitter availability
    // and existing bookings (double-booking prevention).
    switch (input.serviceSchedule) {
      case (null) { /* no schedule to check */ };
      case (?scheduleArr) {
        for (daySchedule in scheduleArr.values()) {
          let date = daySchedule.date;
          let dayOfWeekOpt = parseDateToDayOfWeek(date);
          for (slot in daySchedule.slots.values()) {
            switch (parseTimeToMinutes(slot.startTime), parseTimeToMinutes(slot.endTime)) {
              case (?startMin, ?endMin) {
                // Step 1: check sitter availability matrix for this specific day-of-week
                switch (dayOfWeekOpt) {
                  case (?dayOfWeek) {
                    if (not _timeWithinAvailability(slot.sitterId, dayOfWeek, startMin, endMin)) {
                      Runtime.trap(
                        "Availability conflict: Sitter " # slot.sitterId.toText() #
                        " is not available on " # date #
                        " from " # slot.startTime # " to " # slot.endTime #
                        " for service: " # slot.service
                      );
                    };
                  };
                  case (null) {
                    // Date unparseable — fall back to checking any matching time entry
                    switch (availabilities.get(slot.sitterId)) {
                      case (null) { /* no config → allow */ };
                      case (?avail) {
                        if (avail.entries.size() > 0) {
                          let anyMatch = avail.entries.any(func(e : SitterAvailability.AvailabilityEntry) : Bool {
                            startMin >= e.startTime and endMin <= e.endTime
                          });
                          if (not anyMatch) {
                            Runtime.trap(
                              "Availability conflict: Sitter " # slot.sitterId.toText() #
                              " is not available " # slot.startTime # "–" # slot.endTime #
                              " for service: " # slot.service
                            );
                          };
                        };
                      };
                    };
                  };
                };

                // Step 2: check for double-booking against existing pending/confirmed bookings
                for ((existingId, existingBooking) in bookingsV4.entries()) {
                  let isActive = switch (existingBooking.status) {
                    case (#cancelled) { false };
                    case (#declined) { false };
                    case (_) { true };
                  };
                  if (isActive) {
                    let hasSitter = existingBooking.sitterIds.any(func(id : Nat) : Bool { id == slot.sitterId });
                    if (hasSitter) {
                      switch (existingBooking.serviceSchedule) {
                        case (null) { /* no granular schedule — skip */ };
                        case (?existingSchedule) {
                          for (existingDay in existingSchedule.values()) {
                            if (existingDay.date == date) {
                              for (existingSlot in existingDay.slots.values()) {
                                if (existingSlot.sitterId == slot.sitterId) {
                                  switch (parseTimeToMinutes(existingSlot.startTime), parseTimeToMinutes(existingSlot.endTime)) {
                                    case (?exStart, ?exEnd) {
                                      if (_timesOverlap(startMin, endMin, exStart, exEnd)) {
                                         Runtime.trap(
                                           "Double-booking conflict: Sitter " # slot.sitterId.toText() #
                                           " is already booked on " # date #
                                           " from " # existingSlot.startTime # " to " # existingSlot.endTime #
                                           " (booking #" # existingId.toText() # ")"
                                         );
                                       };

                                    };
                                    case (_) { /* skip unparseable existing slot */ };
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    };
                  };
                };
              };
              case (_) { /* unparseable time → skip check */ };
            };
          };
        };
      };
    };

    let newBooking : Booking.Public = {
      id = nextBookingId;
      clientName = input.clientName;
      clientEmail = input.clientEmail;
      clientPhone = normalizePhone(input.clientPhone);
      pets = input.pets;
      services = input.services;
      sitterIds = input.sitterIds;
      startDate = input.startDate;
      endDate = input.endDate;
      notes = input.notes;
      status = #pending;
      createdAt = Time.now();
      isRecurring = input.isRecurring;
      recurrencePattern = input.recurrencePattern;
      recurrenceEndDate = input.recurrenceEndDate;
      paymentSessionId = null;
      stripePaymentIntentId = null;
      tip = input.tip;
      schedule = input.schedule;
      serviceSchedule = input.serviceSchedule;
      declineReason = null;
      alternativeWindows = null;
      agreements = input.agreements;
      isAdHoc               = switch (input.isAdHoc) { case (?true) { true }; case (_) { false } };
      adHocClientContact    = null;  // standard bookings never have ad hoc contact
    };

    bookingsV4.add(nextBookingId, newBooking);
    // Store callRequest flag in separate map to keep Booking.Public schema stable-compatible.
    switch (input.callRequest) {
      case (?true) { bookingCallRequests.add(nextBookingId, true) };
      case (_) { /* no entry = false */ };
    };
    // Log consent agreements to audit trail if provided (GAP 3 — structured timestamps, GAP 7 — versioned terms).
    switch (input.agreements) {
      case (?ag) {
        let consentTs : Int = Time.now();
        let snapshot = "{" #
          "\"terms\":"               # ag.terms.toText()              # "," #
          "\"privacy\":"             # ag.privacy.toText()            # "," #
          "\"communications\":"      # ag.communications.toText()     # "," #
          "\"callRequest\":"         # ag.callRequest.toText()        # "," #
          "\"cancellationPolicy\":"  # ag.cancellationPolicy.toText() # "," #
          "\"nonEmploymentAck\":"    # ag.nonEmploymentAck.toText()   # "," #
          "\"termsVersion\":"        # ag.termsVersion.toText()           # "," #
          "\"consentTimestamp\":"    # consentTs.toText()                 #
          "}";
        appendAuditLog(#ConsentRecorded, "booking", nextBookingId, snapshot, Principal.fromText("2vxsx-fae"));
      };
      case (null) { /* no agreements provided — skip logging */ };
    };
    nextBookingId += 1;
    newBooking;
  };

  // Send confirmation emails after booking — fire-and-forget (ignore errors)
  // CLIENT receives: "Booking Request Received" (pending, sitter hasn't confirmed yet)
  // SITTER receives: "New Booking Request — Action Required"
  // ADMIN receives: brief "New Booking" notification (if adminEmail configured)
  public shared func sendBookingConfirmationEmail(bookingId : Booking.Id) : async () {
    switch (bookingsV4.get(bookingId)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?booking) {
        let sitterNames = sitterNamesText(booking.sitterIds);
        let petNames = petNamesText(booking.pets);
        let servicesList = servicesText(booking.services);
        let startDateStr = formatDate(booking.startDate);
        let endDateStr = formatDate(booking.endDate);

        // EMAIL CLIENT — "Booking Request Received" (pending, not yet confirmed)
        if (booking.clientEmail != "") {
          // Resolve sitter email for client-facing footer (use first sitter's email)
          let firstSitterEmail : Text = switch (booking.sitterIds.find(func(_ : Nat) : Bool { true })) {
            case (null) { "" };
            case (?sid) {
              switch (sitters.get(sid)) {
                case (null) { "" };
                case (?sitter) {
                  switch (sitter.owner) {
                    case (null) { "" };
                    case (?ownerPrincipal) {
                      switch (userProfiles.get(ownerPrincipal)) {
                        case (null) { "" };
                        case (?up) { switch (up.email) { case (null) { "" }; case (?e) { e } } };
                      };
                    };
                  };
                };
              };
            };
          };
          let clientHtml = EmailTemplates.clientBookingReceived(
            booking.clientName,
            bookingId.toText(),
            sitterNames,
            firstSitterEmail,
            petNames,
            startDateStr,
            endDateStr,
            servicesList,
            appBaseUrl # "/#/booking-lookup?email=" # encodeEmailForUrl(booking.clientEmail) # "&tab=current",
          );
          try {
            ignore await EmailClient.sendEmail(
              [booking.clientEmail],
              "Booking request received, " # booking.clientName # "! \u{1F43E}",
              clientHtml,
            );
          } catch (_) { /* email is best-effort */ };
        };

        // EMAIL EACH SITTER — "New Booking Request — Action Required"
        for (sitterId in booking.sitterIds.values()) {
          switch (sitters.get(sitterId)) {
            case (null) { /* skip */ };
            case (?sitter) {
              // Look up sitter email from their UserProfile (keyed by owner principal)
              let sitterEmail = switch (sitter.owner) {
                case (null) { null };
                case (?ownerPrincipal) {
                  switch (userProfiles.get(ownerPrincipal)) {
                    case (null) { null };
                    case (?up) { up.email };
                  };
                };
              };
              switch (sitterEmail) {
                case (null) { /* no email configured */ };
                case (?email) {
                  let sitterHtml = EmailTemplates.sitterNewBookingAlert(
                    sitter.name,
                    booking.clientName,
                    booking.clientEmail,
                    booking.clientPhone,
                    bookingId.toText(),
                    petNames,
                    startDateStr,
                    endDateStr,
                    servicesList,
                    booking.notes,
                    appBaseUrl # "/#/sitter-dashboard",
                    switch (bookingCallRequests.get(bookingId)) { case (?v) v; case null false },
                  );
                  try {
                    ignore await EmailClient.sendEmail(
                      [email],
                      "New booking request from " # booking.clientName # " \u{1F4CB}",
                      sitterHtml,
                    );
                  } catch (_) { /* email is best-effort */ };
                };
              };
            };
          };
        };

        // EMAIL ADMIN — brief notification (if adminEmail configured)
        if (adminEmail != "") {
          let adminHtml = EmailTemplates.adminNewBookingAlert(
            booking.clientName,
            bookingId.toText(),
            sitterNames,
            petNames,
            startDateStr,
            endDateStr,
            servicesList,
            appBaseUrl # "/#/admin-dashboard",
          );
          try {
            ignore await EmailClient.sendEmail(
              [adminEmail],
              "New booking #" # bookingId.toText() # " from " # booking.clientName,
              adminHtml,
            );
          } catch (_) { /* email is best-effort */ };
        };
      };
    };
  };

  public shared ({ caller }) func updateBookingStatus(bookingId : Booking.Id, newStatus : { #confirmed; #completed; #cancelled }) : async () {
    switch (bookingsV4.get(bookingId)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?booking) {
        if (callerIsAdmin(caller)) {
          let updated = { booking with status = newStatus };
          bookingsV4.add(bookingId, updated);
          if (newStatus == #completed) {
            ignore sendServiceCompletionEmail(bookingId);
          } else if (newStatus == #confirmed) {
            ignore sendBookingConfirmedEmails(bookingId);
          };
          return;
        };

        var isOwner = false;
        for (sitterId in booking.sitterIds.values()) {
          switch (sitters.get(sitterId)) {
            case (null) { /* skip */ };
            case (?profile) {
              if (profile.owner == ?caller) {
                isOwner := true;
              };
            };
          };
        };

        if (not isOwner) {
          Runtime.trap("Unauthorized: Only an assigned sitter or admin can update the booking status");
        };

        // Freeze enforcement: frozen sitters cannot update booking status
        for (sitterId in booking.sitterIds.values()) {
          switch (sitters.get(sitterId)) {
            case (?profile) {
              if (profile.owner == ?caller and isSitterIdFrozenSync(sitterId)) {
                Runtime.trap("Account is suspended. Please reactivate your subscription to update bookings.");
              };
            };
            case (null) {};
          };
        };

        let updated = { booking with status = newStatus };
        bookingsV4.add(bookingId, updated);

        if (newStatus == #completed) {
          ignore sendServiceCompletionEmail(bookingId);
        } else if (newStatus == #confirmed) {
          ignore sendBookingConfirmedEmails(bookingId);
        };
      };
    };
  };

  // ---------------------------------------------------------------------------
  // declineBookingRequest — dedicated decline flow for sitters
  // Validates, updates status to #declined, stores reason + windows, sends email.
  // updateBookingStatus does NOT accept #declined; use this function instead.
  // ---------------------------------------------------------------------------
  public shared ({ caller }) func declineBookingRequest(
    bookingId          : Booking.Id,
    declineReason      : Text,
    alternativeWindows : [Booking.AlternativeWindow],
  ) : async { #ok; #err : Text } {
    // Validate inputs
    if (declineReason.size() < 10) {
      return #err("Decline reason must be at least 10 characters");
    };
    if (alternativeWindows.size() > 4) {
      return #err("Cannot provide more than 4 alternative windows");
    };

    switch (bookingsV4.get(bookingId)) {
      case (null) { return #err("Booking not found") };
      case (?booking) {
        // Verify status is #pending
        switch (booking.status) {
          case (#pending) { /* ok */ };
          case (_) { return #err("Only pending bookings can be declined") };
        };

        // Verify caller is an assigned sitter or admin
        let isAdmin = callerIsAdmin(caller);
        let isSitter = isCallerAssignedSitter(caller, booking);
        if (not isAdmin and not isSitter) {
          return #err("Unauthorized: Only the assigned sitter or admin can decline a booking");
        };

        // Freeze enforcement: frozen sitters cannot decline bookings
        if (not isAdmin) {
          for (sid in booking.sitterIds.values()) {
            switch (sitters.get(sid)) {
              case (?profile) {
                if (profile.owner == ?caller and isSitterIdFrozenSync(sid)) {
                  return #err("Account is suspended. Please reactivate your subscription.");
                };
              };
              case (null) {};
            };
          };
        };

        // Resolve sitter name for the email
        var sitterName : Text = "Your sitter";
        var sitterId : Nat = 0;
        for (sid in booking.sitterIds.values()) {
          switch (sitters.get(sid)) {
            case (?profile) {
              if (profile.owner == ?caller or isAdmin) {
                sitterName := profile.name;
                sitterId := sid;
              };
            };
            case (null) { /* skip */ };
          };
        };
        // If admin is declining on behalf, use first sitter
        if (isAdmin and sitterId == 0 and booking.sitterIds.size() > 0) {
          sitterId := booking.sitterIds[0];
          switch (sitters.get(sitterId)) {
            case (?profile) { sitterName := profile.name };
            case (null) { /* keep default */ };
          };
        };

        // Persist the declined state
        let updated : Booking.Public = {
          booking with
          status = #declined;
          declineReason = ?declineReason;
          alternativeWindows = ?alternativeWindows;
        };
        bookingsV4.add(bookingId, updated);

        // Audit log
        let snapshot = "{\"bookingId\":" # bookingId.toText() #
          ",\"sitterName\":\"" # sitterName # "\"" #
          ",\"declineReason\":\"" # declineReason # "\"" #
          ",\"alternativeWindowCount\":" # alternativeWindows.size().toText() # "}";
        appendAuditLog(#BookingDeclined, "Booking", bookingId, snapshot, caller);

        // Send decline email to client (best-effort, fire-and-forget)
        if (booking.clientEmail != "") {
          let petNames = petNamesText(booking.pets);
          let servicesList = servicesText(booking.services);
          let startDateStr = formatDate(booking.startDate);
          let startTimeStr = switch (booking.serviceSchedule) {
            case (null) { "See original booking" };
            case (?sched) {
              if (sched.size() > 0 and sched[0].slots.size() > 0) {
                sched[0].slots[0].startTime
              } else { "See original booking" }
            };
          };
          try {
            ignore await EmailClient.sendBookingDeclineEmail(
              booking.clientEmail,
              booking.clientName,
              sitterName,
              sitterId,
              startDateStr,
              startTimeStr,
              servicesList,
              petNames,
              declineReason,
              alternativeWindows,
              appBaseUrl,
            );
          } catch (_) { /* best-effort — never block on email */ };
        };

        #ok;
      };
    };
  };

  // ---------------------------------------------------------------------------
  // cancelBookingByClient — client-initiated cancellation flow
  // Clients can cancel #pending or #confirmed bookingsV4.
  // Within 24 hours of the booking start time, a strong warning is given and the
  // sitter is notified of their full-charge entitlement.
  // Both client and sitter receive branded cancellation emails.
  // ---------------------------------------------------------------------------
  public shared func cancelBookingByClient(
    bookingId    : Booking.Id,
    cancelReason : Text,
  ) : async { #ok; #err : Text } {
    if (cancelReason.size() < 5) {
      return #err("Cancellation reason must be at least 5 characters");
    };

    switch (bookingsV4.get(bookingId)) {
      case (null) { return #err("Booking not found") };
      case (?booking) {
        // Only pending or confirmed bookings can be cancelled by client
        switch (booking.status) {
          case (#pending)   { /* ok */ };
          case (#confirmed) { /* ok */ };
          case (#completed) { return #err("Completed bookings cannot be cancelled") };
          case (#cancelled) { return #err("Booking is already cancelled") };
          case (#declined)  { return #err("Declined bookings cannot be cancelled") };
        };

        // Check if within 24 hours of the booking start time
        let nowNs2 : Int = Time.now();
        let twentyFourHoursNs : Int = 24 * 60 * 60 * 1_000_000_000;
        let within24Hours : Bool = (booking.startDate - nowNs2) < twentyFourHoursNs;

        // Update booking status to cancelled
        let updated = { booking with status = #cancelled };
        bookingsV4.add(bookingId, updated);

        appendAuditLog(#BookingDeleted, "Booking", bookingId,
          "{\"action\":\"client_cancelled\",\"bookingId\":" # bookingId.toText() #
          ",\"reason\":\"" # cancelReason # "\"" #
          ",\"within24Hours\":" # (if within24Hours "true" else "false") # "}",
          Principal.fromText("aaaaa-aa"));

        let petNames = petNamesText(booking.pets);
        let startDateStr = formatDate(booking.startDate);

        // EMAIL CLIENT — cancellation confirmation
        if (booking.clientEmail != "") {
          try {
            let lookupUrl = appBaseUrl # "/#/booking-lookup?email=" # encodeEmailForUrl(booking.clientEmail);
            // Resolve sitter email for client-facing footer
            let sitterEmailForCancel : Text = switch (booking.sitterIds.find(func(_ : Nat) : Bool { true })) {
              case (null) { "" };
              case (?sid) {
                switch (sitters.get(sid)) {
                  case (null) { "" };
                  case (?sitter) {
                    switch (sitter.owner) {
                      case (null) { "" };
                      case (?ownerPrincipal) {
                        switch (userProfiles.get(ownerPrincipal)) {
                          case (null) { "" };
                          case (?up) { switch (up.email) { case (null) { "" }; case (?e) { e } } };
                        };
                      };
                    };
                  };
                };
              };
            };
            ignore await EmailClient.sendBookingCancelledClientEmail(
              booking.clientEmail,
              booking.clientName,
              bookingId.toText(),
              sitterNamesText(booking.sitterIds),
              sitterEmailForCancel,
              petNames,
              startDateStr,
              cancelReason,
              within24Hours,
              lookupUrl,
            );
          } catch (_) { /* email is best-effort */ };
        };

        // EMAIL each SITTER — cancellation alert
        for (sid in booking.sitterIds.values()) {
          switch (sitters.get(sid)) {
            case (null) { /* skip */ };
            case (?sitter) {
              let sitterEmail = switch (sitter.owner) {
                case (null) { null };
                case (?ownerPrincipal) {
                  switch (userProfiles.get(ownerPrincipal)) {
                    case (null) { null };
                    case (?up) { up.email };
                  };
                };
              };
              switch (sitterEmail) {
                case (null) { /* no email configured */ };
                case (?email) {
                  try {
                    ignore await EmailClient.sendBookingCancelledSitterEmail(
                      email,
                      sitter.name,
                      booking.clientName,
                      booking.clientPhone,
                      bookingId.toText(),
                      petNames,
                      startDateStr,
                      cancelReason,
                      within24Hours,
                      appBaseUrl # "/#/sitter-dashboard",
                    );
                  } catch (_) { /* email is best-effort */ };
                };
              };
            };
          };
        };

        #ok;
      };
    };
  };

  // Send "booking confirmed" emails when sitter confirms:
  // CLIENT receives: "Your Booking is Confirmed!"
  // SITTER receives: acknowledgement that they confirmed
  public shared func sendBookingConfirmedEmails(bookingId : Booking.Id) : async () {
    switch (bookingsV4.get(bookingId)) {
      case (null) { /* no-op */ };
      case (?booking) {
        let sitterNames = sitterNamesText(booking.sitterIds);
        let petNames = petNamesText(booking.pets);
        let servicesList = servicesText(booking.services);
        let startDateStr = formatDate(booking.startDate);
        let endDateStr = formatDate(booking.endDate);

        // Email CLIENT — "Your Booking is Confirmed!"
        if (booking.clientEmail != "") {
          // Resolve sitter email for client-facing footer (use first sitter's email)
          let firstSitterEmailConfirm : Text = switch (booking.sitterIds.find(func(_ : Nat) : Bool { true })) {
            case (null) { "" };
            case (?sid) {
              switch (sitters.get(sid)) {
                case (null) { "" };
                case (?sitter) {
                  switch (sitter.owner) {
                    case (null) { "" };
                    case (?ownerPrincipal) {
                      switch (userProfiles.get(ownerPrincipal)) {
                        case (null) { "" };
                        case (?up) { switch (up.email) { case (null) { "" }; case (?e) { e } } };
                      };
                    };
                  };
                };
              };
            };
          };
          let serviceBreakdownHtml = buildServiceLineItems(booking);
          let clientHtml = EmailTemplates.clientBookingConfirmed(
            booking.clientName,
            bookingId.toText(),
            sitterNames,
            firstSitterEmailConfirm,
            petNames,
            startDateStr,
            endDateStr,
            servicesList,
            serviceBreakdownHtml,
            appBaseUrl # "/#/booking-lookup?email=" # encodeEmailForUrl(booking.clientEmail) # "&tab=current",
          );
          try {
            ignore await EmailClient.sendEmail(
              [booking.clientEmail],
              "Your booking is confirmed! \u{1F43E}",
              clientHtml,
            );
          } catch (_) { /* email is best-effort */ };
        };

        // Email each SITTER — acknowledgement
        for (sitterId in booking.sitterIds.values()) {
          switch (sitters.get(sitterId)) {
            case (null) { /* skip */ };
            case (?sitter) {
              let sitterEmail = switch (sitter.owner) {
                case (null) { null };
                case (?ownerPrincipal) {
                  switch (userProfiles.get(ownerPrincipal)) {
                    case (null) { null };
                    case (?up) { up.email };
                  };
                };
              };
              switch (sitterEmail) {
                case (null) { /* no email */ };
                case (?email) {
                  let sitterHtml = EmailTemplates.sitterBookingConfirmed(
                    sitter.name,
                    booking.clientName,
                    bookingId.toText(),
                    petNames,
                    startDateStr,
                    endDateStr,
                    servicesList,
                    appBaseUrl # "/#/sitter-dashboard",
                  );
                  try {
                    ignore await EmailClient.sendEmail(
                      [email],
                      "Booking #" # bookingId.toText() # " confirmed \u{2713}",
                      sitterHtml,
                    );
                  } catch (_) { /* email is best-effort */ };
                };
              };
            };
          };
        };
      };
    };
  };

  // Collect sitter names + phone numbers for the completion/reminder email contact section.
  // Returns a comma-separated "Name: phone" string; phone comes from SitterProfile.phone field.
  func sitterContactText(sitterIds : [Nat]) : Text {
    let parts = List.empty<Text>();
    for (id in sitterIds.values()) {
      switch (sitters.get(id)) {
        case (null) { /* skip */ };
        case (?p) {
          if (p.phone != "") {
            parts.add(p.name # ": " # p.phone);
          } else {
            parts.add(p.name);
          };
        };
      };
    };
    parts.values().join(", ");
  };

  // Send service completion + invoice email
  public shared func sendServiceCompletionEmail(bookingId : Booking.Id) : async () {
    switch (bookingsV4.get(bookingId)) {
      case (null) { /* no-op */ };
      case (?booking) {
        if (booking.clientEmail == "") { return };

        let sitterNames = sitterNamesText(booking.sitterIds);
        let sitterContact = sitterContactText(booking.sitterIds);
        let petNames = petNamesText(booking.pets);
        let completedDate = formatDate(Time.now());

        // Resolve sitter email for client-facing footer (use first sitter's email)
        let firstSitterEmailCompletion : Text = switch (booking.sitterIds.find(func(_ : Nat) : Bool { true })) {
          case (null) { "" };
          case (?sid) {
            switch (sitters.get(sid)) {
              case (null) { "" };
              case (?sitter) {
                switch (sitter.owner) {
                  case (null) { "" };
                  case (?ownerPrincipal) {
                    switch (userProfiles.get(ownerPrincipal)) {
                      case (null) { "" };
                      case (?up) { switch (up.email) { case (null) { "" }; case (?e) { e } } };
                    };
                  };
                };
              };
            };
          };
        };

        // Build line items using the shared enriched builder (service + pet names + rate × duration)
        let lineItems = buildServiceLineItems(booking);

        // Get payment info
        let (subtotalText, discountText, totalText) = switch (payments.get(bookingId)) {
          case (null) { ("", "", "See sitter for total") };
          case (?p) {
            let total = p.totalAmount;
            (formatCents(total), "", formatCents(total));
          };
        };

        let html = EmailTemplates.serviceCompletion(
          booking.clientName,
          bookingId.toText(),
          sitterNames,
          firstSitterEmailCompletion,
          sitterContact,
          petNames,
          completedDate,
          lineItems,
          subtotalText,
          discountText,
          totalText,
          appBaseUrl # "/#/booking-lookup?email=" # encodeEmailForUrl(booking.clientEmail) # "&tab=past",
        );

        try {
          ignore await EmailClient.sendEmail(
            [booking.clientEmail],
            "Your pet care service is complete - Invoice enclosed \u{1F389}",
            html,
          );
        } catch (_) { /* email is best-effort */ };
      };
    };
  };

  // Send payment reminder from sitter dashboard
  public shared ({ caller }) func sendPaymentReminder(bookingId : Booking.Id) : async { #ok : Text; #err : Text } {
    // Only sitters assigned to this booking or admins may send reminders
    switch (bookingsV4.get(bookingId)) {
      case (null) { return #err("Booking not found") };
      case (?booking) {
        let isAdmin = callerIsAdmin(caller);
        let isSitter = isCallerAssignedSitter(caller, booking);
        if (not isAdmin and not isSitter) {
          return #err("Unauthorized: Only assigned sitters or admins can send payment reminders");
        };
        if (booking.clientEmail == "") {
          return #err("No client email on file for this booking");
        };

        let sitterNames = sitterNamesText(booking.sitterIds);
        let petNames = petNamesText(booking.pets);
        let startDateStr = formatDate(booking.startDate);
        let endDateStr = formatDate(booking.endDate);
        let serviceDates = startDateStr # " – " # endDateStr;

        let amountText = switch (payments.get(bookingId)) {
          case (null) { "Please contact your sitter for the total" };
          case (?p) { formatCents(p.totalAmount) };
        };

        // Resolve sitter email for client-facing footer
        let sitterEmailForReminder : Text = switch (booking.sitterIds.find(func(_ : Nat) : Bool { true })) {
          case (null) { "" };
          case (?sid) {
            switch (sitters.get(sid)) {
              case (null) { "" };
              case (?sitter) {
                switch (sitter.owner) {
                  case (null) { "" };
                  case (?ownerPrincipal) {
                    switch (userProfiles.get(ownerPrincipal)) {
                      case (null) { "" };
                      case (?up) { switch (up.email) { case (null) { "" }; case (?e) { e } } };
                    };
                  };
                };
              };
            };
          };
        };

        let html = EmailTemplates.paymentReminder(
          booking.clientName,
          bookingId.toText(),
          sitterNames,
          sitterEmailForReminder,
          sitterContactText(booking.sitterIds),
          petNames,
          amountText,
          serviceDates,
          appBaseUrl # "/#/booking-lookup?email=" # encodeEmailForUrl(booking.clientEmail) # "&tab=past",
        );

        let result = try {
          await EmailClient.sendEmail(
            [booking.clientEmail],
            "Friendly reminder - Invoice for " # petNames # " care \u{1F48C}",
            html,
          )
        } catch (e) {
          #err("Email send failed: " # e.message())
        };

        switch (result) {
          case (#ok) { #ok("Payment reminder sent to " # booking.clientEmail) };
          case (#err(e)) { #err("Failed to send reminder: " # e) };
        };
      };
    };
  };

  // Client-triggered nudge: send an email to the sitter(s) asking them to reach out
  // about an unpaid invoice. No authentication required — any caller can invoke this,
  // matching the pattern that clients have no account on the platform.
  // The bookingId parameter is passed as Text to match the frontend's string representation.
  public shared func sendClientNudgeSitter(bookingIdText : Text) : async { #ok : Text; #err : Text } {
    let bookingId = switch (Nat.fromText(bookingIdText)) {
      case (null) { return #err("Invalid booking ID") };
      case (?id) { id };
    };
    switch (bookingsV4.get(bookingId)) {
      case (null) { return #err("Booking not found") };
      case (?booking) {
        let petNames = petNamesText(booking.pets);
        let startDateStr = formatDate(booking.startDate);
        let endDateStr = formatDate(booking.endDate);
        let serviceDates = startDateStr # " \u{2013} " # endDateStr;

        let amountText = switch (payments.get(bookingId)) {
          case (null) { "Amount to be confirmed by sitter" };
          case (?p) { formatCents(p.totalAmount) };
        };

        var sentCount = 0;

        for (sitterId in booking.sitterIds.values()) {
          switch (sitters.get(sitterId)) {
            case (null) { /* skip */ };
            case (?sitter) {
              // Resolve sitter email from their UserProfile (keyed by owner principal)
              let sitterEmailOpt : ?Text = switch (sitter.owner) {
                case (null) { null };
                case (?ownerPrincipal) {
                  switch (userProfiles.get(ownerPrincipal)) {
                    case (null) { null };
                    case (?up) { up.email };
                  };
                };
              };
              // Fall back to adminEmail if sitter has no personal email stored
              let recipientEmail : ?Text = switch (sitterEmailOpt) {
                case (?e) { ?e };
                case (null) {
                  if (adminEmail != "") { ?adminEmail } else { null };
                };
              };
              switch (recipientEmail) {
                case (null) { /* no email available — skip */ };
                case (?toEmail) {
                  let html = EmailTemplates.clientNudgeSitter(
                    sitter.name,
                    booking.clientName,
                    booking.clientEmail,
                    booking.clientPhone,
                    bookingIdText,
                    petNames,
                    serviceDates,
                    amountText,
                    appBaseUrl # "/#/sitter-dashboard",
                  );
                  try {
                    ignore await EmailClient.sendEmail(
                      [toEmail],
                      "Payment follow-up from " # booking.clientName # " \u{2014} " # petNames # " care",
                      html,
                    );
                  } catch (_) { /* email is best-effort */ };
                  sentCount += 1;
                };
              };
            };
          };
        };

        if (sentCount > 0) {
          #ok("Nudge sent to " # sentCount.toText() # " sitter(s)")
        } else {
          #err("No sitter email on file for this booking — please contact your sitter directly")
        };
      };
    };
  };

  public query ({ caller }) func getBookingsBySitter(sitterId : SitterProfile.Id) : async [Booking.Public] {
    switch (sitters.get(sitterId)) {
      case (null) { Runtime.trap("Sitter not found") };
      case (?profile) {
        if (not callerIsAdmin(caller) and profile.owner != ?caller) {
          Runtime.trap("Unauthorized: Only the sitter or admin can view their bookings");
        };
      };
    };

    bookingsV4.values().toArray().filter(func(b : Booking.Public) : Bool { b.sitterIds.any(func(id) { id == sitterId }) });
  };

  // Fix 3: Add input validation and result cap to prevent data enumeration.
  // Note: ICP query calls are read-only and cannot modify state, so traditional
  // stateful rate limiting is not possible here. Input format validation and a
  // max result cap significantly reduce the bulk extraction attack surface.
  public query func getBookingsByClientEmail(clientEmail : Text) : async [Booking.Public] {
    // Input validation: require non-empty email with basic format check
    if (clientEmail.size() < 3 or not clientEmail.contains(#char '@') or not clientEmail.contains(#char '.')) {
      return [];
    };
    let normalized = clientEmail.toLower();
    let all = bookingsV4.values().toArray().filter(func(b : Booking.Public) : Bool { b.clientEmail.toLower() == normalized });
    // Cap at 50 results to prevent bulk extraction
    if (all.size() <= 50) { all } else { all.sliceToArray(0, 50) };
  };

  public query func getBookingsByClientPhone(clientPhone : Text) : async [Booking.Public] {
    // Input validation: require at least 10 digits after normalization
    let normalized = normalizePhone(clientPhone);
    if (normalized.size() < 10) {
      return [];
    };
    let all = bookingsV4.values().toArray().filter(func(b : Booking.Public) : Bool {
      normalizePhone(b.clientPhone) == normalized or b.clientPhone == clientPhone
    });
    // Cap at 50 results to prevent bulk extraction
    if (all.size() <= 50) { all } else { all.sliceToArray(0, 50) };
  };

  public query ({ caller }) func getAllBookings() : async [Booking.Public] {
    if (not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all bookings");
    };
    bookingsV4.values().toArray();
  };

  // Admin-only: hard-delete a booking and cascade-delete its payment.
  // Both deletions are snapshotted in the audit trail.
  public shared ({ caller }) func deleteBooking(bookingId : Booking.Id) : async { #ok; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can delete bookings");
    };
    switch (bookingsV4.get(bookingId)) {
      case (null) { return #err("Booking not found") };
      case (?booking) {
        let bookingSnapshot = "{\"id\":" # bookingId.toText() #
          ",\"clientName\":\"" # booking.clientName # "\"" #
          ",\"clientEmail\":\"" # booking.clientEmail # "\"" #
          ",\"clientPhone\":\"" # booking.clientPhone # "\"" #
          ",\"startDate\":" # booking.startDate.toText() #
          ",\"endDate\":" # booking.endDate.toText() #
          ",\"status\":\"" # debug_show(booking.status) # "\"" #
          ",\"createdAt\":" # booking.createdAt.toText() # "}";

        // Cascade: remove payment if present, log it first
        switch (payments.get(bookingId)) {
          case (null) { /* no payment to cascade */ };
          case (?payment) {
            let paymentSnapshot = "{\"bookingId\":" # bookingId.toText() #
              ",\"totalAmount\":" # payment.totalAmount.toText() #
              ",\"status\":\"" # debug_show(payment.status) # "\"" #
              ",\"method\":\"" # debug_show(payment.method) # "\"}";
            payments.remove(bookingId);
            appendAuditLog(#PaymentDeleted, "Payment", bookingId, paymentSnapshot, caller);
          };
        };

        bookingsV4.remove(bookingId);
        appendAuditLog(#BookingDeleted, "Booking", bookingId, bookingSnapshot, caller);
        #ok;
      };
    };
  };

  // Admin-only: hard-delete a payment record only (does NOT delete the booking).
  // Deletion is snapshotted in the audit trail.
  public shared ({ caller }) func deletePayment(bookingId : Booking.Id) : async { #ok; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can delete payments");
    };
    switch (payments.get(bookingId)) {
      case (null) { return #err("Payment not found") };
      case (?payment) {
        let snapshot = "{\"bookingId\":" # bookingId.toText() #
          ",\"totalAmount\":" # payment.totalAmount.toText() #
          ",\"status\":\"" # debug_show(payment.status) # "\"" #
          ",\"method\":\"" # debug_show(payment.method) # "\"}";
        payments.remove(bookingId);
        appendAuditLog(#PaymentDeleted, "Payment", bookingId, snapshot, caller);
        #ok;
      };
    };
  };

  // Admin-only: retrieve all audit log entries sorted by timestamp descending.
  public query ({ caller }) func getAuditLog() : async [AuditLog.Public] {
    if (not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view the audit log");
    };
    let entries = auditLogsV2.values().toArray();
    entries.sort(func(a : AuditLog.Public, b : AuditLog.Public) : { #less; #equal; #greater } {
      Int.compare(b.timestamp, a.timestamp)
    });
  };

  // ---------------------------------------------------------------------------
  // Service Log Functions
  // ---------------------------------------------------------------------------
  public shared ({ caller }) func postServiceLog(input : ServiceLog.Creation) : async ServiceLog.Public {
    switch (sitters.get(input.sitterId)) {
      case (null) { Runtime.trap("Sitter not found") };
      case (?profile) {
        let isAdmin = callerIsAdmin(caller);
        if (not isAdmin and profile.owner != ?caller) {
          Runtime.trap("Unauthorized: Only the sitter or admin can post service logs");
        };
        // Freeze enforcement: frozen sitters cannot post service logs
        if (not isAdmin and isSitterIdFrozenSync(input.sitterId)) {
          Runtime.trap("Account is suspended. Please reactivate your subscription to post service logs.");
        };
        let newLog : ServiceLog.Public = {
          id = nextServiceLogId;
          bookingId = input.bookingId;
          sitterId = input.sitterId;
          status = input.status;
          notes = input.notes;
          startTime = input.startTime;
          stopTime = null;
          createdAt = Time.now();
        };
        serviceLogs.add(nextServiceLogId, newLog);
        nextServiceLogId += 1;
        newLog;
      };
    };
  };

  public shared ({ caller }) func updateServiceLogStopTime(input : ServiceLog.UpdateStopTime) : async () {
    switch (serviceLogs.get(input.id)) {
      case (null) { Runtime.trap("Service log not found") };
      case (?log) {
        switch (sitters.get(log.sitterId)) {
          case (null) { Runtime.trap("Sitter not found") };
          case (?profile) {
            let isAdmin = callerIsAdmin(caller);
            if (not isAdmin and profile.owner != ?caller) {
              Runtime.trap("Unauthorized: Only the sitter or admin can update service logs");
            };
            // Freeze enforcement: frozen sitters cannot update service logs
            if (not isAdmin and isSitterIdFrozenSync(log.sitterId)) {
              Runtime.trap("Account is suspended. Please reactivate your subscription to update service logs.");
            };
            let updated = { log with stopTime = ?input.stopTime };
            serviceLogs.add(input.id, updated);
          };
        };
      };
    };
  };

  public query ({ caller }) func getServiceLogsByBooking(bookingId : Booking.Id) : async [ServiceLog.Public] {
    switch (bookingsV4.get(bookingId)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?booking) {
        if (not callerIsAdmin(caller) and not isCallerAssignedSitter(caller, booking)) {
          Runtime.trap("Unauthorized: Only assigned sitters or admin can view service logs");
        };

        serviceLogs.values().toArray().filter(func(log : ServiceLog.Public) : Bool { log.bookingId == bookingId });
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Payment Functions
  // ---------------------------------------------------------------------------
  public shared ({ caller }) func createPayment(input : PaymentRecord.Creation) : async PaymentRecord.Public {
    // Allow admin OR the assigned sitter of the booking to create a payment record
    let isAdmin = callerIsAdmin(caller);
    let isSitter = switch (bookingsV4.get(input.bookingId)) {
      case (null) { false };
      case (?booking) { isCallerAssignedSitter(caller, booking) };
    };
    if (not isAdmin and not isSitter) {
      Runtime.trap("Unauthorized: Only admins or the assigned sitter can create payment records");
    };
    // Freeze enforcement for non-admins
    if (not isAdmin) {
      switch (bookingsV4.get(input.bookingId)) {
        case (null) { /* will be caught below */ };
        case (?booking) {
          for (sitterId in booking.sitterIds.values()) {
            if (isSitterIdFrozenSync(sitterId)) {
              Runtime.trap("Account is suspended. Please reactivate your subscription to manage invoices.");
            };
          };
        };
      };
    };

    if (bookingsV4.get(input.bookingId) == null) { Runtime.trap("Booking not found") };

    let payment : PaymentRecord.Public = {
      bookingId = input.bookingId;
      totalAmount = input.totalAmount;
      method = input.method;
      status = #pending;
      notes = input.notes;
      stripePaymentIntentId = null;
      manualConfirmedBy = null;
      confirmedAt = null;
      splits = input.splits;
      paidDate = null;
      discountPercent = null;
      discountAmount = null;
      originalAmount = null;
      completionNotes = null;
      actualEndTime = null;
      adHocItems = [];
      paymentMethodDetails = null;
    };

    payments.add(input.bookingId, payment);
    payment;
  };

  public shared ({ caller }) func confirmManualPayment(bookingId : Booking.Id) : async () {
    // Allow admin OR the sitter assigned to this booking to mark payment as paid
    let isAdmin = callerIsAdmin(caller);
    let isSitter = switch (bookingsV4.get(bookingId)) {
      case (null) { false };
      case (?booking) { isCallerAssignedSitter(caller, booking) };
    };
    if (not isAdmin and not isSitter) {
      Runtime.trap("Unauthorized: Only admins or the assigned sitter can confirm payments");
    };

    switch (payments.get(bookingId)) {
      case (null) { Runtime.trap("Payment not found") };
      case (?payment) {
        let updated = {
          payment with
          status = #paid;
          manualConfirmedBy = ?caller;
          confirmedAt = ?Time.now();
        };
        payments.add(bookingId, updated);
      };
    };
  };

  public shared ({ caller }) func updatePaymentSplits(input : PaymentRecord.UpdateSplits) : async () {
    if (not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update payment splits");
    };
    switch (payments.get(input.bookingId)) {
      case (null) { Runtime.trap("Payment not found") };
      case (?payment) {
        let updated = { payment with splits = input.splits };
        payments.add(input.bookingId, updated);
      };
    };
  };

  public query ({ caller }) func getPayment(bookingId : Booking.Id) : async ?PaymentRecord.Public {
    // Allow admin OR the assigned sitter of the booking to view payment records
    let isAdmin = callerIsAdmin(caller);
    let isSitter = switch (bookingsV4.get(bookingId)) {
      case (null) { false };
      case (?booking) { isCallerAssignedSitter(caller, booking) };
    };
    if (not isAdmin and not isSitter) {
      Runtime.trap("Unauthorized: Only admins or the assigned sitter can view payment records");
    };
    payments.get(bookingId);
  };

  public query ({ caller }) func getAllPayments() : async [PaymentRecord.Public] {
    if (not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view payment records");
    };
    payments.values().toArray();
  };

  public query func getPaymentsByBookingIds(bookingIds : [Text]) : async [PaymentRecord.Public] {
    let result = List.empty<PaymentRecord.Public>();
    for (idText in bookingIds.values()) {
      switch (Nat.fromText(idText)) {
        case (null) { /* skip invalid */ };
        case (?id) {
          switch (payments.get(id)) {
            case (null) { /* no payment record yet */ };
            case (?p) { result.add(p) };
          };
        };
      };
    };
    result.values().toArray();
  };

  // ---------------------------------------------------------------------------
  // Message Functions
  // ---------------------------------------------------------------------------
  public shared ({ caller }) func addMessage(bookingId : Booking.Id, senderName : Text, content : Text) : async () {
    switch (bookingsV4.get(bookingId)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?booking) {
        if (not caller.isAnonymous() and not callerIsAdmin(caller) and not isCallerAssignedSitter(caller, booking)) {
          Runtime.trap("Unauthorized: Only assigned sitters, admin, or clients can add messages");
        };

        let newMessage : Message.Message = {
          senderId = if (caller.isAnonymous()) { null } else { ?caller };
          senderName;
          content;
          timestamp = Time.now();
        };

        let messageList = switch (messages.get(bookingId)) {
          case (null) { List.empty<Message.Message>() };
          case (?existing) { existing };
        };

        messageList.add(newMessage);
        messages.add(bookingId, messageList);
      };
    };
  };

  public query ({ caller }) func getMessages(bookingId : Booking.Id) : async [Message.Message] {
    switch (bookingsV4.get(bookingId)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?booking) {
        if (not callerIsAdmin(caller) and not isCallerAssignedSitter(caller, booking)) {
          Runtime.trap("Unauthorized: Only assigned sitters or admin can view messages");
        };

        switch (messages.get(bookingId)) {
          case (null) { [] };
          case (?msgList) { msgList.values().toArray() };
        };
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Invoice Discount & Price Adjustment Functions
  // ---------------------------------------------------------------------------

  // Apply a percentage discount to an invoice.
  // Callable by assigned sitter or admin.
  public shared ({ caller }) func updatePaymentWithDiscount(
    bookingId : Booking.Id,
    discountPercent : Nat,
    newTotalAmount : Nat,
    originalAmount : Nat
  ) : async { #ok; #err : Text } {
    let isAdmin = callerIsAdmin(caller);
    let isSitter = switch (bookingsV4.get(bookingId)) {
      case (null) { false };
      case (?booking) { isCallerAssignedSitter(caller, booking) };
    };
    if (not isAdmin and not isSitter) {
      return #err("Unauthorized: Only assigned sitters or admins can apply discounts");
    };
    if (bookingsV4.get(bookingId) == null) {
      return #err("Booking not found");
    };

    let discountAmount = if (originalAmount > newTotalAmount) { originalAmount - newTotalAmount } else { 0 };

    let updated = switch (payments.get(bookingId)) {
      case (null) {
        // Create a new payment record with discount
        {
          bookingId;
          totalAmount = newTotalAmount;
          method = #manual;
          status = #pending;
          notes = null;
          stripePaymentIntentId = null;
          manualConfirmedBy = null;
          confirmedAt = null;
          splits = [];
          paidDate = null;
          discountPercent = ?discountPercent;
          discountAmount = ?discountAmount;
          originalAmount = ?originalAmount;
          completionNotes = null;
          actualEndTime = null;
          adHocItems = [];
          paymentMethodDetails = null;
        }
      };
      case (?existing) {
        {
          existing with
          totalAmount = newTotalAmount;
          discountPercent = ?discountPercent;
          discountAmount = ?discountAmount;
          originalAmount = ?originalAmount;
        }
      };
    };

    payments.add(bookingId, updated);

    let snapshot = "{\"bookingId\":" # bookingId.toText() #
      ",\"discountPercent\":" # discountPercent.toText() #
      ",\"originalAmount\":" # originalAmount.toText() #
      ",\"newTotalAmount\":" # newTotalAmount.toText() #
      ",\"timestamp\":" # Time.now().toText() # "}";
    appendAuditLog(#DiscountApplied, "payment", bookingId, snapshot, caller);

    #ok;
  };

  // Manually adjust the price of an invoice (clears any existing discount).
  // Callable by assigned sitter or admin.
  public shared ({ caller }) func adjustPaymentPrice(
    bookingId : Booking.Id,
    newAmount : Nat,
    reason : Text
  ) : async { #ok; #err : Text } {
    let isAdmin = callerIsAdmin(caller);
    let isSitter = switch (bookingsV4.get(bookingId)) {
      case (null) { false };
      case (?booking) { isCallerAssignedSitter(caller, booking) };
    };
    if (not isAdmin and not isSitter) {
      return #err("Unauthorized: Only assigned sitters or admins can adjust prices");
    };
    if (bookingsV4.get(bookingId) == null) {
      return #err("Booking not found");
    };

    let oldAmount = switch (payments.get(bookingId)) {
      case (null) { 0 };
      case (?p) { p.totalAmount };
    };

    let updated = switch (payments.get(bookingId)) {
      case (null) {
        {
          bookingId;
          totalAmount = newAmount;
          method = #manual;
          status = #pending;
          notes = null;
          stripePaymentIntentId = null;
          manualConfirmedBy = null;
          confirmedAt = null;
          splits = [];
          paidDate = null;
          discountPercent = null;
          discountAmount = null;
          originalAmount = null;
          completionNotes = null;
          actualEndTime = null;
          adHocItems = [];
          paymentMethodDetails = null;
        }
      };
      case (?existing) {
        // Clear discount fields when price is manually adjusted
        {
          existing with
          totalAmount = newAmount;
          discountPercent = null;
          discountAmount = null;
          originalAmount = null;
        }
      };
    };

    payments.add(bookingId, updated);

    let snapshot = "{\"bookingId\":" # bookingId.toText() #
      ",\"oldAmount\":" # oldAmount.toText() #
      ",\"newAmount\":" # newAmount.toText() #
      ",\"reason\":\"" # reason # "\"" #
      ",\"timestamp\":" # Time.now().toText() # "}";
    appendAuditLog(#PriceAdjusted, "payment", bookingId, snapshot, caller);

    #ok;
  };

  // Set the paid date on an invoice (ISO date string "YYYY-MM-DD").
  // Callable by assigned sitter or admin.
  public shared ({ caller }) func updateInvoicePaidDate(
    bookingId : Booking.Id,
    paidDate : Text
  ) : async { #ok; #err : Text } {
    let isAdmin = callerIsAdmin(caller);
    let isSitter = switch (bookingsV4.get(bookingId)) {
      case (null) { false };
      case (?booking) { isCallerAssignedSitter(caller, booking) };
    };
    if (not isAdmin and not isSitter) {
      return #err("Unauthorized: Only assigned sitters or admins can update paid dates");
    };
    if (bookingsV4.get(bookingId) == null) {
      return #err("Booking not found");
    };

    let updated = switch (payments.get(bookingId)) {
      case (null) {
        {
          bookingId;
          totalAmount = 0;
          method = #manual;
          status = #pending;
          notes = null;
          stripePaymentIntentId = null;
          manualConfirmedBy = null;
          confirmedAt = null;
          splits = [];
          paidDate = ?paidDate;
          discountPercent = null;
          discountAmount = null;
          originalAmount = null;
          completionNotes = null;
          actualEndTime = null;
          adHocItems = [];
          paymentMethodDetails = null;
        }
      };
      case (?existing) {
        { existing with paidDate = ?paidDate }
      };
    };

    payments.add(bookingId, updated);
    #ok;
  };

  // Called when sitter submits the completion prompt — updates booking + payment with
  // final details and fires the service completion email.
  public shared ({ caller }) func updateServiceCompletion(
    bookingId : Booking.Id,
    actualEndTime : ?Time.Time,
    finalPrice : ?Nat,
    completionNotes : ?Text,
    discountPercent : ?Nat
  ) : async { #ok; #err : Text } {
    let isAdmin = callerIsAdmin(caller);
    let isSitter = switch (bookingsV4.get(bookingId)) {
      case (null) { false };
      case (?booking) { isCallerAssignedSitter(caller, booking) };
    };
    if (not isAdmin and not isSitter) {
      return #err("Unauthorized: Only assigned sitters or admins can update service completion");
    };

    switch (bookingsV4.get(bookingId)) {
      case (null) { return #err("Booking not found") };
      case (?booking) {
        // Update booking status to #completed if not already
        if (booking.status != #completed) {
          let updatedBooking = { booking with status = #completed };
          bookingsV4.add(bookingId, updatedBooking);
        };

        // Update payment record
        let existingPayment = payments.get(bookingId);
        let basePayment : PaymentRecord.Public = switch (existingPayment) {
          case (null) {
            {
              bookingId;
              totalAmount = 0;
              method = #manual;
              status = #pending;
              notes = null;
              stripePaymentIntentId = null;
              manualConfirmedBy = null;
              confirmedAt = null;
              splits = [];
              paidDate = null;
              discountPercent = null;
              discountAmount = null;
              originalAmount = null;
              completionNotes = null;
              actualEndTime = null;
              adHocItems = [];
              paymentMethodDetails = null;
            }
          };
          case (?p) { p };
        };

        // Build updated payment applying finalPrice + discount if provided
        let updatedPayment : PaymentRecord.Public = switch (finalPrice) {
          case (null) {
            // No price change — just update notes, actualEndTime, discount
            switch (discountPercent) {
              case (null) {
                {
                  basePayment with
                  completionNotes;
                  actualEndTime;
                }
              };
              case (?dp) {
                let origAmt = switch (basePayment.originalAmount) {
                  case (null) { basePayment.totalAmount };
                  case (?o) { o };
                };
                let discountAmt = origAmt * dp / 100;
                let newTotal = if (origAmt > discountAmt) { origAmt - discountAmt } else { 0 };
                {
                  basePayment with
                  completionNotes;
                  actualEndTime;
                  discountPercent = ?dp;
                  discountAmount = ?discountAmt;
                  originalAmount = ?origAmt;
                  totalAmount = newTotal;
                }
              };
            }
          };
          case (?fp) {
            switch (discountPercent) {
              case (null) {
                {
                  basePayment with
                  totalAmount = fp;
                  originalAmount = ?(basePayment.totalAmount);
                  completionNotes;
                  actualEndTime;
                }
              };
              case (?dp) {
                let discountAmt = fp * dp / 100;
                let newTotal = if (fp > discountAmt) { fp - discountAmt } else { 0 };
                {
                  basePayment with
                  totalAmount = newTotal;
                  originalAmount = ?fp;
                  discountPercent = ?dp;
                  discountAmount = ?discountAmt;
                  completionNotes;
                  actualEndTime;
                }
              };
            }
          };
        };

        payments.add(bookingId, updatedPayment);

        // Build audit snapshot
        let endTimeText = switch (actualEndTime) {
          case (null) { "null" };
          case (?t) { t.toText() };
        };
        let finalPriceText = switch (finalPrice) {
          case (null) { "null" };
          case (?p) { p.toText() };
        };
        let notesText = switch (completionNotes) {
          case (null) { "" };
          case (?n) { n };
        };
        let discountText = switch (discountPercent) {
          case (null) { "null" };
          case (?d) { d.toText() };
        };
        let snapshot = "{\"bookingId\":" # bookingId.toText() #
          ",\"actualEndTime\":" # endTimeText #
          ",\"finalPrice\":" # finalPriceText #
          ",\"completionNotes\":\"" # notesText # "\"" #
          ",\"discountPercent\":" # discountText #
          ",\"timestamp\":" # Time.now().toText() # "}";
        appendAuditLog(#ServiceCompletionUpdated, "payment", bookingId, snapshot, caller);

        // Fire service completion email (same as updateBookingStatus does)
        ignore sendServiceCompletionEmail(bookingId);

        #ok;
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Payment Audit Log Query
  // ---------------------------------------------------------------------------

  // Returns all audit entries for a specific booking (both "payment" and "booking" entity types).
  // Sorted by timestamp ascending.
  public query func getPaymentAuditLog(bookingId : Booking.Id) : async [AuditLog.Public] {
    let result = auditLogsV2.values().toArray().filter(func(entry : AuditLog.Public) : Bool {
      entry.entityId == bookingId and (entry.entityType == "payment" or entry.entityType == "booking")
    });
    result.sort(func(a : AuditLog.Public, b : AuditLog.Public) : { #less; #equal; #greater } {
      Int.compare(a.timestamp, b.timestamp)
    });
  };

  // ---------------------------------------------------------------------------
  // Admin Analytics Functions
  // ---------------------------------------------------------------------------

  // Deep admin analytics: service type breakdown, avg duration, avg time to payment.
  public query ({ caller }) func getAdminBookingAnalytics() : async {
    serviceTypeCounts : [(Text, Nat)];
    serviceTypeRevenue : [(Text, Nat)];
    avgServiceDurationMinutes : Float;
    avgTimeToPaymentMinutes : Float;
    serviceTypeDurations : [(Text, Float)];
  } {
    if (not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view analytics");
    };

    // Accumulate per-service-type counts, revenue, and duration totals using maps
    let typeCounts = Map.empty<Text, Nat>();
    let typeRevenue = Map.empty<Text, Nat>();
    let typeDurationTotal = Map.empty<Text, Nat>();
    let typeDurationCount = Map.empty<Text, Nat>();
    var totalDurationMinutes : Nat = 0;
    var totalDurationCount : Nat = 0;
    var totalTimeToPaymentNs : Int = 0;
    var paidBookingCount : Nat = 0;

    for ((bookingId, booking) in bookingsV4.entries()) {
      // Get payment for this booking to determine revenue
      let paymentOpt = payments.get(bookingId);
      let bookingRevenue = switch (paymentOpt) {
        case (null) { 0 };
        case (?p) { p.totalAmount };
      };

      // Process service schedule slots for granular data
      switch (booking.serviceSchedule) {
        case (null) {
          // Fall back to top-level services list
          for (svc in booking.services.values()) {
            let prevCount = switch (typeCounts.get(svc)) { case (null) { 0 }; case (?n) { n } };
            typeCounts.add(svc, prevCount + 1);
            // Allocate revenue evenly across services
            let svcCount = booking.services.size();
            let svcRevenue = if (svcCount > 0) { bookingRevenue / svcCount } else { 0 };
            let prevRev = switch (typeRevenue.get(svc)) { case (null) { 0 }; case (?n) { n } };
            typeRevenue.add(svc, prevRev + svcRevenue);
          };
        };
        case (?schedule) {
          for (day in schedule.values()) {
            for (slot in day.slots.values()) {
              let svc = slot.service;
              let prevCount = switch (typeCounts.get(svc)) { case (null) { 0 }; case (?n) { n } };
              typeCounts.add(svc, prevCount + 1);

              // Revenue per slot in cents (ratePerHour is dollars → * 100)
              let slotRevenue = slot.ratePerHour * slot.durationMinutes * 100 / 60;
              let prevRev = switch (typeRevenue.get(svc)) { case (null) { 0 }; case (?n) { n } };
              typeRevenue.add(svc, prevRev + slotRevenue);

              // Duration accumulation
              let prevDurTotal = switch (typeDurationTotal.get(svc)) { case (null) { 0 }; case (?n) { n } };
              let prevDurCount = switch (typeDurationCount.get(svc)) { case (null) { 0 }; case (?n) { n } };
              typeDurationTotal.add(svc, prevDurTotal + slot.durationMinutes);
              typeDurationCount.add(svc, prevDurCount + 1);

              totalDurationMinutes += slot.durationMinutes;
              totalDurationCount += 1;
            };
          };
        };
      };

      // Time to payment: only for paid bookings
      switch (paymentOpt) {
        case (null) { /* skip */ };
        case (?p) {
          if (p.status == #paid) {
            switch (p.confirmedAt) {
              case (null) { /* skip — no confirmation timestamp */ };
              case (?confirmedTime) {
                let diff = confirmedTime - booking.endDate;
                totalTimeToPaymentNs := totalTimeToPaymentNs + diff;
                paidBookingCount += 1;
              };
            };
          };
        };
      };
    };

    // Build result arrays from maps
    let serviceTypeCounts = List.empty<(Text, Nat)>();
    for ((svc, count) in typeCounts.entries()) {
      serviceTypeCounts.add((svc, count));
    };

    let serviceTypeRevenue = List.empty<(Text, Nat)>();
    for ((svc, rev) in typeRevenue.entries()) {
      serviceTypeRevenue.add((svc, rev));
    };

    let serviceTypeDurations = List.empty<(Text, Float)>();
    for ((svc, total) in typeDurationTotal.entries()) {
      let count = switch (typeDurationCount.get(svc)) { case (null) { 1 }; case (?n) { if (n == 0) { 1 } else { n } } };
      serviceTypeDurations.add((svc, total.toFloat() / count.toFloat()));
    };

    let avgServiceDurationMinutes : Float = if (totalDurationCount == 0) {
      0.0
    } else {
      totalDurationMinutes.toFloat() / totalDurationCount.toFloat()
    };

    // Convert nanoseconds to minutes: 1 minute = 60_000_000_000 ns
    let avgTimeToPaymentMinutes : Float = if (paidBookingCount == 0) {
      0.0
    } else {
      let nsPerMinute : Int = 60_000_000_000;
      let totalMinutes : Int = totalTimeToPaymentNs / nsPerMinute;
      totalMinutes.toFloat() / paidBookingCount.toFloat()
    };

    {
      serviceTypeCounts = serviceTypeCounts.values().toArray();
      serviceTypeRevenue = serviceTypeRevenue.values().toArray();
      avgServiceDurationMinutes;
      avgTimeToPaymentMinutes;
      serviceTypeDurations = serviceTypeDurations.values().toArray();
    };
  };

  // ---------------------------------------------------------------------------
  // Booking Heatmap Data
  // ---------------------------------------------------------------------------

  // Returns per-sitter, per-date, per-hour counts of confirmed vs pending bookings
  // for the last 90 days and all future bookingsV4.
  public query ({ caller }) func getBookingHeatmapData() : async [{
    sitterId : Nat;
    sitterName : Text;
    date : Text;
    hour : Nat;
    confirmedCount : Nat;
    pendingCount : Nat;
  }] {
    if (not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view heatmap data");
    };

    let nowNs = Time.now();
    // 90 days in nanoseconds
    let ninetyDaysNs : Int = 90 * 24 * 60 * 60 * 1_000_000_000;
    let cutoffNs = nowNs - ninetyDaysNs;

    // Key: "sitterId|date|hour" → {sitterId, hour, confirmedCount, pendingCount}
    let heatConfirmed = Map.empty<Text, Nat>();
    let heatPending   = Map.empty<Text, Nat>();
    let heatSitterId  = Map.empty<Text, Nat>();
    let heatHour      = Map.empty<Text, Nat>();
    let heatDate      = Map.empty<Text, Text>();

    for ((_, booking) in bookingsV4.entries()) {
      // Only pending or confirmed bookings
      let isPendingOrConfirmed = switch (booking.status) {
        case (#pending) { true };
        case (#confirmed) { true };
        case (_) { false };
      };
      if (not isPendingOrConfirmed) { /* skip */ } else {
        // Only bookings within last 90 days or future
        if (booking.startDate >= cutoffNs) {
          for (sitterId in booking.sitterIds.values()) {
            // Expand using serviceSchedule if available
            switch (booking.serviceSchedule) {
              case (?schedule) {
                for (daySchedule in schedule.values()) {
                  let date = daySchedule.date;
                  let slotHour = switch (daySchedule.slots.find(func(s : Booking.ServiceSlot) : Bool { s.sitterId == sitterId })) {
                    case (null) { 9 };
                    case (?slot) {
                      switch (parseTimeToMinutes(slot.startTime)) {
                        case (null) { 9 };
                        case (?mins) { mins / 60 };
                      };
                    };
                  };
                  let mapKey = sitterId.toText() # "|" # date # "|" # slotHour.toText();
                  heatSitterId.add(mapKey, sitterId);
                  heatHour.add(mapKey, slotHour);
                  heatDate.add(mapKey, date);
                  if (booking.status == #confirmed) {
                    let prev = switch (heatConfirmed.get(mapKey)) { case (null) { 0 }; case (?n) { n } };
                    heatConfirmed.add(mapKey, prev + 1);
                    // Ensure pending key exists
                    if (heatPending.get(mapKey) == null) { heatPending.add(mapKey, 0) };
                  } else {
                    let prev = switch (heatPending.get(mapKey)) { case (null) { 0 }; case (?n) { n } };
                    heatPending.add(mapKey, prev + 1);
                    if (heatConfirmed.get(mapKey) == null) { heatConfirmed.add(mapKey, 0) };
                  };
                };
              };
              case (null) {
                let date = formatDate(booking.startDate);
                let slotHour : Nat = 9;
                let mapKey = sitterId.toText() # "|" # date # "|" # slotHour.toText();
                heatSitterId.add(mapKey, sitterId);
                heatHour.add(mapKey, slotHour);
                heatDate.add(mapKey, date);
                if (booking.status == #confirmed) {
                  let prev = switch (heatConfirmed.get(mapKey)) { case (null) { 0 }; case (?n) { n } };
                  heatConfirmed.add(mapKey, prev + 1);
                  if (heatPending.get(mapKey) == null) { heatPending.add(mapKey, 0) };
                } else {
                  let prev = switch (heatPending.get(mapKey)) { case (null) { 0 }; case (?n) { n } };
                  heatPending.add(mapKey, prev + 1);
                  if (heatConfirmed.get(mapKey) == null) { heatConfirmed.add(mapKey, 0) };
                };
              };
            };
          };
        };
      };
    };

    // Convert maps to result array
    let result = List.empty<{
      sitterId : Nat;
      sitterName : Text;
      date : Text;
      hour : Nat;
      confirmedCount : Nat;
      pendingCount : Nat;
    }>();

    for ((mapKey, confirmed) in heatConfirmed.entries()) {
      let sitterId = switch (heatSitterId.get(mapKey)) { case (null) { 0 }; case (?n) { n } };
      let hour     = switch (heatHour.get(mapKey)) { case (null) { 9 }; case (?n) { n } };
      let date     = switch (heatDate.get(mapKey)) { case (null) { "" }; case (?t) { t } };
      let pending  = switch (heatPending.get(mapKey)) { case (null) { 0 }; case (?n) { n } };
      let sitterName = switch (sitters.get(sitterId)) {
        case (null) { "Unknown" };
        case (?p) { p.name };
      };
      result.add({
        sitterId;
        sitterName;
        date;
        hour;
        confirmedCount = confirmed;
        pendingCount = pending;
      });
    };

    result.values().toArray();
  };

  // ---------------------------------------------------------------------------
  // Admin Pending Revenue & Booking Stats
  // ---------------------------------------------------------------------------

   // Helper: compute the total service value (in cents) for a booking.
   //
   // Priority order:
   //   1. serviceSchedule slots: ratePerHour * durationMinutes * 100 / 60
   //      (ratePerHour stored in dollars; * 100 converts to cents)
   //   2. If no serviceSchedule (or empty), fall back to the assigned sitter's
   //      hourlyRate × duration derived from (endDate - startDate) in hours.
   //      This handles bookings created without a granular schedule.
   //
   // Result is always in cents, consistent with PaymentRecord.totalAmount.
   func bookingScheduleValue(booking : Booking.Public) : Nat {
     switch (booking.serviceSchedule) {
       case (?schedule) {
         var total : Nat = 0;
         for (day in schedule.values()) {
           for (slot in day.slots.values()) {
             // ratePerHour is in dollars → multiply by 100 to get cents
             total += slot.ratePerHour * slot.durationMinutes * 100 / 60;
           };
         };
         // If the schedule was present but all slots had 0 duration, fall through
         // to the sitter-rate fallback below.
         if (total > 0) { return total };
         // fall through to sitter rate fallback
       };
       case (null) {
         // No schedule — fall through to sitter rate fallback
       };
     };

     // Fallback: sitter hourlyRate × duration (hours) × 100 cents/dollar.
     // Duration is derived from booking startDate/endDate (nanoseconds).
     // Use the first assigned sitter's hourlyRate; default to 0 if no sitters.
     let ratePerHourDollars : Nat = switch (booking.sitterIds.find(func(_ : Nat) : Bool { true })) {
       case (null) { 0 };
       case (?sitterId) {
         switch (sitters.get(sitterId)) {
           case (null) { 0 };
           case (?profile) { profile.hourlyRate };
         };
       };
     };

     if (ratePerHourDollars == 0) { return 0 };

       // Convert nanosecond timestamps to fractional hours (no minimum floor)
       let durationNs : Int = booking.endDate - booking.startDate;
       let nsPerHour : Float = 3_600_000_000_000.0;
       let durationHours : Float = if (durationNs <= 0) { 0.0 }
         else { durationNs.toFloat() / nsPerHour };

       // result in cents: ratePerHour (dollars) * fractional hours * 100
       let valueCentsFloat : Float = ratePerHourDollars.toFloat() * durationHours * 100.0;
       valueCentsFloat.toInt().toNat();
   };

  // Admin-only query: returns the total pending revenue in cents.
  // Aggregates ALL pending bookings platform-wide — no caller/sitter filter.
  // Combines:
  //   1. PaymentRecord rows with status == #pending → their totalAmount (or
  //      bookingScheduleValue() fallback when totalAmount == 0)
  //   2. Bookings with status #pending or #confirmed that have NO PaymentRecord:
  //      → bookingScheduleValue() (serviceSchedule slots, or sitter hourlyRate × hours)
  public query ({ caller }) func getAdminPendingRevenue() : async Nat {
    if (not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view pending revenue");
    };

    var total : Nat = 0;

    // Track which booking IDs already have a payment record so we don't double-count
    let coveredBookingIds = Set.empty<Nat>();

    // Pass 1: sum all pending PaymentRecords.
    // If a payment record exists but totalAmount == 0 (auto-created placeholder),
    // fall back to bookingScheduleValue so we still get the correct booking value.
    for ((bookingId, payment) in payments.entries()) {
      if (payment.status == #pending) {
        coveredBookingIds.add(bookingId);
        if (payment.totalAmount > 0) {
          total += payment.totalAmount;
        } else {
          // Placeholder record — derive value from booking schedule
          switch (bookingsV4.get(bookingId)) {
            case (null) { /* booking missing, skip */ };
            case (?booking) { total += bookingScheduleValue(booking) };
          };
        };
      };
    };

    // Pass 2: add bookings that are pending/confirmed but have no payment record at all
    for ((bookingId, booking) in bookingsV4.entries()) {
      let isActive = switch (booking.status) {
        case (#pending) { true };
        case (#confirmed) { true };
        case (_) { false };
      };
      if (isActive and not coveredBookingIds.contains(bookingId)) {
        // No payment record yet — derive value from serviceSchedule
        total += bookingScheduleValue(booking);
      };
    };

    total;
  };

  // Admin-only query: returns a per-booking breakdown of the pending revenue total.
  // Each entry shows bookingId, clientName, and the amount (in cents) contributing
  // to the pending revenue sum, so admins can verify the math.
  public query ({ caller }) func getAdminPendingRevenueBreakdown() : async [{
    bookingId : Nat;
    clientName : Text;
    amount : Nat;
  }] {
    if (not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view pending revenue breakdown");
    };

    let result = List.empty<{ bookingId : Nat; clientName : Text; amount : Nat }>();

    // First collect booking IDs covered by pending payment records
    let coveredIds = Set.empty<Nat>();

    for ((bookingId, payment) in payments.entries()) {
      if (payment.status == #pending) {
        coveredIds.add(bookingId);
        let amount = if (payment.totalAmount > 0) {
          payment.totalAmount;
        } else {
          switch (bookingsV4.get(bookingId)) {
            case (null) { 0 };
            case (?booking) { bookingScheduleValue(booking) };
          };
        };
        let clientName = switch (bookingsV4.get(bookingId)) {
          case (null) { "Unknown" };
          case (?booking) { booking.clientName };
        };
        if (amount > 0) {
          result.add({ bookingId; clientName; amount });
        };
      };
    };

    // Add bookings with no payment record
    for ((bookingId, booking) in bookingsV4.entries()) {
      let isActive = switch (booking.status) {
        case (#pending) { true };
        case (#confirmed) { true };
        case (_) { false };
      };
      if (isActive and not coveredIds.contains(bookingId)) {
        let amount = bookingScheduleValue(booking);
        if (amount > 0) {
          result.add({ bookingId; clientName = booking.clientName; amount });
        };
      };
    };

    result.toArray();
  };

  // Admin-only query: returns all booking counts and revenue figures in one call.
  // This replaces the multi-query pattern in the admin dashboard analytics cards.
  public query ({ caller }) func getAdminBookingStats() : async {
    pendingCount : Nat;
    confirmedCount : Nat;
    completedCount : Nat;
    cancelledCount : Nat;
    pendingRevenue : Nat;
    confirmedRevenue : Nat;
    totalRevenue : Nat;
  } {
    if (not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view booking stats");
    };

    var pendingCount : Nat = 0;
    var confirmedCount : Nat = 0;
    var completedCount : Nat = 0;
    var cancelledCount : Nat = 0;
    var pendingRevenue : Nat = 0;
    var confirmedRevenue : Nat = 0;
    var totalRevenue : Nat = 0;

    for ((bookingId, booking) in bookingsV4.entries()) {
      switch (booking.status) {
        case (#pending) { pendingCount += 1 };
        case (#confirmed) { confirmedCount += 1 };
        case (#completed) { completedCount += 1 };
        case (#cancelled) { cancelledCount += 1 };
        case (#declined) { cancelledCount += 1 };
      };

      // Determine the value for this booking:
      //   → If a PaymentRecord exists with totalAmount > 0, use its totalAmount.
      //   → If the payment record is a placeholder (totalAmount == 0), fall back to
      //     bookingScheduleValue so the revenue cards reflect the real booking worth.
      //   → If no PaymentRecord exists, derive from serviceSchedule.
      let bookingValue = switch (payments.get(bookingId)) {
        case (?p) {
          if (p.totalAmount > 0) { p.totalAmount } else { bookingScheduleValue(booking) }
        };
        case (null) { bookingScheduleValue(booking) };
      };

      // Accumulate into the appropriate revenue bucket
      switch (booking.status) {
        case (#pending) { pendingRevenue += bookingValue };
        case (#confirmed) { confirmedRevenue += bookingValue };
        case (#completed) {
          // Only count paid payments in total revenue for completed bookings
          switch (payments.get(bookingId)) {
            case (?p) {
              if (p.status == #paid) { totalRevenue += p.totalAmount };
            };
            case (null) { /* no payment record — skip from totalRevenue */ };
          };
        };
        case (#cancelled) { /* cancelled bookings excluded from revenue */ };
        case (#declined) { /* declined bookings excluded from revenue */ };
      };
    };

    {
      pendingCount;
      confirmedCount;
      completedCount;
      cancelledCount;
      pendingRevenue;
      confirmedRevenue;
      totalRevenue;
    };
  };

  // ---------------------------------------------------------------------------
  // Coupon-aware booking creation
  // Creates a booking and, if a valid couponCode is supplied, immediately
  // validates + redeems the coupon and records the discount on the payment record.
  // Returns the new booking or traps on hard errors (invalid coupon, frozen sitter, etc.)
  // ---------------------------------------------------------------------------
  public shared func createBookingWithCoupon(input : Booking.Creation, couponCode : ?Text) : async Booking.Public {
    // Delegate to the standard createBooking (includes all double-booking checks)
    let newBooking = await createBooking(input);

    // Apply coupon if provided — any error here traps to surface it to the client
    switch (couponCode) {
      case (null) { /* no coupon — nothing to do */ };
      case (?code) {
        let upperCode = code.toUpper();
        switch (dealOffers.get(upperCode)) {
          case (null) { Runtime.trap("Coupon code not found: " # upperCode) };
          case (?offer) {
            // Active check
            if (not offer.isActive) { Runtime.trap("Coupon is no longer active") };
            // Expiry check
            let now : Int = Time.now();
            if (now > offer.expirationDate) { Runtime.trap("Coupon has expired") };
            // Uses remaining check
            switch (offer.maxUses) {
              case (?max) {
                if (offer.redeemedCount >= max) {
                  Runtime.trap("Coupon has reached its maximum number of uses");
                };
              };
              case (null) { /* unlimited */ };
            };

            // Per-client deduplication
            let clientEmail = input.clientEmail.toLower();
            let alreadyRedeemed = offer.redeemedBy.any(func(e : Text) : Bool { e == clientEmail });
            if (alreadyRedeemed) {
              Runtime.trap("You have already used this coupon");
            };

            // Record redemption
            let newRedeemedBy = offer.redeemedBy.concat([clientEmail]);
            let updatedOffer : CRMTypes.DealOffer = {
              offer with
              redeemedBy    = newRedeemedBy;
              redeemedCount = offer.redeemedCount + 1;
            };
            dealOffers.add(upperCode, updatedOffer);

            // Compute discount amount in cents
            let originalCents = bookingScheduleValue(newBooking);
            let (discountCents, newTotalCents) : (Nat, Nat) = switch (offer.discountType) {
              case (#percent) {
                let pct = if (offer.discountValue > 100.0) { 100.0 } else { offer.discountValue };
                let dc = (originalCents.toFloat() * pct / 100.0).toInt();
                let dcNat : Nat = if (dc <= 0) { 0 } else { dc.toNat() };
                let nt = if (dcNat >= originalCents) { 0 } else { originalCents - dcNat };
                (dcNat, nt)
              };
              case (#fixed) {
                let fixedCents = (offer.discountValue * 100.0).toInt();
                let dcNat : Nat = if (fixedCents <= 0) { 0 } else { fixedCents.toNat() };
                let nt = if (dcNat >= originalCents) { 0 } else { originalCents - dcNat };
                (dcNat, nt)
              };
            };
            let discountPct : Nat = if (originalCents > 0) {
              let pctFloat = discountCents.toFloat() / originalCents.toFloat() * 100.0;
              let p = pctFloat.toInt();
              if (p <= 0) { 0 } else { p.toNat() }
            } else { 0 };

            // Create or update the payment record with the coupon discount
            let discountedPayment : PaymentRecord.Public = switch (payments.get(newBooking.id)) {
              case (null) {
                {
                  bookingId     = newBooking.id;
                  totalAmount   = newTotalCents;
                  method        = #manual;
                  status        = #pending;
                  notes         = ?("Coupon applied: " # upperCode);
                  stripePaymentIntentId = null;
                  manualConfirmedBy     = null;
                  confirmedAt           = null;
                  splits                = [];
                  paidDate              = null;
                  discountPercent       = ?discountPct;
                  discountAmount        = ?discountCents;
                  originalAmount        = ?originalCents;
                  completionNotes       = null;
                  actualEndTime         = null;
                  adHocItems            = [];
                  paymentMethodDetails  = null;
                }
              };
              case (?existing) {
                {
                  existing with
                  totalAmount     = newTotalCents;
                  notes           = ?("Coupon applied: " # upperCode);
                  discountPercent = ?discountPct;
                  discountAmount  = ?discountCents;
                  originalAmount  = ?originalCents;
                }
              };
            };
            payments.add(newBooking.id, discountedPayment);
          };
        };
      };
    };

    newBooking
  };


  // Return all COMPLETED bookings matched by BOTH email AND phone.
  // Fix 3: Requiring both fields significantly reduces the enumeration attack surface
  // vs. the prior OR logic that only required one field.
  // Email is normalized to lowercase+trim; phone is stripped to digits-only.
  // Results are sorted newest-first by startDate (descending).
  // Only #completed bookings are returned — not pending/confirmed/cancelled.
  public query func getCompletedBookingsByContact(email : Text, phone : Text) : async [Booking.Public] {
    // Input validation
    if (email.size() < 3 or not email.contains(#char '@') or not email.contains(#char '.')) {
      return [];
    };
    let normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.size() < 10) {
      return [];
    };
    let normalizedEmail = email.toLower();
    let trimmedEmail = Text.fromIter(normalizedEmail.toIter().filter(func(c : Char) : Bool { c != ' ' and c != '\t' and c != '\n' and c != '\r' }));

    let matched = bookingsV4.values().toArray().filter(func(b : Booking.Public) : Bool {
      // Only completed bookings
      let isCompleted = switch (b.status) {
        case (#completed) { true };
        case (_) { false };
      };
      if (not isCompleted) { return false };
      // Fix 3: require BOTH email AND phone to match (not either/or)
      let emailMatch = trimmedEmail != "" and (b.clientEmail.toLower() == trimmedEmail);
      let phoneMatch = normalizedPhone != "" and (normalizePhone(b.clientPhone) == normalizedPhone);
      emailMatch and phoneMatch;
    });

    // Cap at 50 results, sort newest-first
    let capped = if (matched.size() <= 50) { matched } else { matched.sliceToArray(0, 50) };
    capped.sort(func(a : Booking.Public, b_ : Booking.Public) : { #less; #equal; #greater } {
      Int.compare(b_.startDate, a.startDate)
    });
  };

  // For each sitterId, check if the sitter is available for the given dates and services.
  // Returns a per-sitter availability status with a human-readable reason when unavailable.
  //
  // Checks:
  //   1. Sitter exists and is active/approved.
  //   2. Sitter's availability matrix covers the day-of-week for each date (if configured).
  //   3. No confirmed or pending booking conflicts on those dates for any of those services
  //      (using an all-day window 0–1440 since no specific times are provided for rebook checks).
  public query func checkSittersAvailabilityForRebook(sitterIds : [Nat], dates : [Text], services : [Text]) : async [{
    sitterId : Nat;
    available : Bool;
    reason : Text;
  }] {
    ignore services; // services list is informational; conflict check is date+sitter based

    let result = List.empty<{ sitterId : Nat; available : Bool; reason : Text }>();

    for (sitterId in sitterIds.values()) {
      // Check 1: sitter exists and is active
      switch (sitters.get(sitterId)) {
        case (null) {
          result.add({ sitterId; available = false; reason = "Sitter no longer active" });
        };
        case (?profile) {
          if (not profile.isActive) {
            result.add({ sitterId; available = false; reason = "Sitter no longer active" });
          } else {
            // Check 2 & 3: for each requested date
            var firstConflict : ?Text = null;
            label dateLoop for (date in dates.values()) {
              // Check availability matrix for this day-of-week
              switch (parseDateToDayOfWeek(date)) {
                case (?dayOfWeek) {
                  // If sitter has configured availability, check if this day is covered
                  switch (availabilities.get(sitterId)) {
                    case (?avail) {
                      if (avail.entries.size() > 0) {
                        let hasDay = avail.entries.any(func(e : SitterAvailability.AvailabilityEntry) : Bool {
                          e.dayOfWeek == dayOfWeek
                        });
                        if (not hasDay) {
                          // Find a human-readable day name
                          let dayName = switch (dayOfWeek) {
                            case (0) { "Monday" };
                            case (1) { "Tuesday" };
                            case (2) { "Wednesday" };
                            case (3) { "Thursday" };
                            case (4) { "Friday" };
                            case (5) { "Saturday" };
                            case (_) { "Sunday" };
                          };
                          firstConflict := ?("Not available on " # dayName);
                        };
                      };
                    };
                    case (null) { /* no config → allow */ };
                  };
                };
                case (null) { /* unparseable date → allow */ };
              };

              if (firstConflict != null) {
                break dateLoop;
              };

              // Check 3: existing booking conflicts on this date for this sitter
              // Use an all-day window (0–1440 minutes) to catch any overlap
              let conflict = _findSitterConflict(sitterId, date, 0, 1440);
              switch (conflict) {
                case (?_) {
                  firstConflict := ?("Already booked for that time");
                };
                case (null) { /* no conflict */ };
              };

              if (firstConflict != null) {
                break dateLoop;
              };
            };

            switch (firstConflict) {
              case (?reason) {
                result.add({ sitterId; available = false; reason });
              };
              case (null) {
                result.add({ sitterId; available = true; reason = "" });
              };
            };
          };
        };
      };
    };

    result.toArray();
  };

  // ---------------------------------------------------------------------------
  // Invoice: Ad Hoc Line Items & Payment Method
  // ---------------------------------------------------------------------------

  // Helper: build service line item HTML rows from booking serviceSchedule
  // Build a compact pet-name string from all pets associated with a booking.
  // Returns "" when there are no pets (so callers can skip the label).
  func allPetNamesText(pets : [Booking.Pet]) : Text {
    if (pets.size() == 0) { return "" };
    pets.map(func(p : Booking.Pet) : Text { p.petName }).values().join(" &amp; ")
  };

  // Build enriched HTML <tr> rows for the "Service Breakdown" table.
  // Each service slot gets:
  //   - Service name + pet names (e.g. "Dog Walking — Buddy &amp; Max")
  //   - A sub-line showing rate × duration (e.g. "$15/hr × 2 hrs")
  //   - The line total right-aligned
  // When serviceSchedule is absent (legacy bookings), falls back to a plain
  // services-list row with an em-dash amount.
  func buildServiceLineItems(booking : Booking.Public) : Text {
    let pets = booking.pets;
    let petLabel = allPetNamesText(pets);

    switch (booking.serviceSchedule) {
      case (null) {
        // Fallback: single row from services list
        let svc = booking.services.values().join(", ");
        let svcLabel = if (petLabel != "") { svc # " &mdash; " # petLabel } else { svc };
        "<tr><td style=\"padding: 10px 16px; font-size: 14px; color: #374151; border-top: 1px solid #e5e7eb;\">" # svcLabel # "</td>" #
        "<td style=\"padding: 10px 16px; text-align: right; font-size: 14px; color: #374151; border-top: 1px solid #e5e7eb;\">—</td></tr>"
      };
      case (?schedule) {
        let buf = List.empty<Text>();
        for (day in schedule.values()) {
          for (slot in day.slots.values()) {
            // Duration display
            let totalMins = slot.durationMinutes;
            let billedHours = totalMins / 60;
            let leftoverMins = totalMins % 60;
            let durationHrText : Text = if (leftoverMins == 0) {
              billedHours.toText() # " hr" # (if (billedHours == 1) { "" } else { "s" })
            } else {
              billedHours.toText() # "h " # leftoverMins.toText() # "m"
            };
            // Rate × duration sub-line
            let rateText = "$" # slot.ratePerHour.toText() # "/hr";
            let rateDurationLine = rateText # " &times; " # durationHrText;
            // Line total in cents (ratePerHour is dollars, convert to cents)
            let lineTotal = slot.ratePerHour * totalMins * 100 / 60;
            // Service label: name + pet names
            let serviceLabel = if (petLabel != "") {
              slot.service # " &mdash; " # petLabel
            } else { slot.service };
            buf.add(
              "<tr>" #
              "<td style=\"padding: 10px 16px; font-size: 14px; color: #374151; border-top: 1px solid #e5e7eb; vertical-align: top;\">" #
              "<span style=\"font-weight: 600;\">" # serviceLabel # "</span>" #
              "<br/><span style=\"font-size: 12px; color: #6b7280;\">" # rateDurationLine # " &bull; " # day.date # " " # slot.startTime # "&ndash;" # slot.endTime # "</span>" #
              "</td>" #
              "<td style=\"padding: 10px 16px; text-align: right; font-size: 14px; font-weight: 600; color: #111827; border-top: 1px solid #e5e7eb; vertical-align: top;\">" #
              formatCents(lineTotal) # "</td></tr>"
            );
          };
        };
        buf.values().join("")
      };
    };
  };

  // Helper: build ad hoc item HTML rows from a PaymentRecord
  func buildAdHocLineItems(adHocItems : [PaymentRecord.AdHocLineItem]) : Text {
    if (adHocItems.size() == 0) { return "" };
    let buf = List.empty<Text>();
    for (item in adHocItems.values()) {
      let amountText = if (item.amountCents >= 0) {
        formatCents(item.amountCents.toNat())
      } else {
        "-" # formatCents(Int.abs(item.amountCents))
      };
      let rowColor = if (item.amountCents < 0) { "color: #10b981;" } else { "color: #374151;" };
      buf.add(
        "<tr><td style=\"padding: 10px 16px; font-size: 14px; " # rowColor # " border-top: 1px solid #e5e7eb;\">" #
        item.description # "</td>" #
        "<td style=\"padding: 10px 16px; text-align: right; font-size: 14px; " # rowColor # " border-top: 1px solid #e5e7eb;\">" #
        amountText # "</td></tr>"
      );
    };
    buf.values().join("")
  };

  // Helper: render a payment method section as HTML for the invoice email
  func renderPaymentMethodSection(methodOpt : ?PaymentRecord.PaymentMethodDetails, totalDue : Text) : Text {
    switch (methodOpt) {
      case (null) {
        // No structured method set — use the generic payment notice
        "<div style=\"background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
        "<p style=\"color: #92400e; font-size: 14px; margin: 0; font-weight: 600;\">Payment Methods Accepted</p>" #
        "<p style=\"color: #78350f; font-size: 13px; margin: 8px 0 0; line-height: 1.6;\">We accept <strong>Check</strong>, <strong>Cash</strong>, <strong>Venmo</strong>, and <strong>Apple Pay Cash</strong>. Your sitter will provide payment details.</p>" #
        "</div>"
      };
      case (?#venmo({ handle })) {
        // URL-encode the total for Venmo deep link (strip $ and commas)
        let venmoUrl = "https://venmo.com/u/" # handle # "?txn=pay&amount=" # totalDue # "&note=Pawspect+Pet+Sitting";
        "<div style=\"background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;\">" #
        "<p style=\"color: #1e40af; font-size: 15px; margin: 0; font-weight: 700;\">&#128705; Pay via Venmo</p>" #
        "<p style=\"color: #1d4ed8; font-size: 14px; margin: 10px 0 4px;\">Send payment to: <strong>@" # handle # "</strong></p>" #
        "<a href=\"" # venmoUrl # "\" style=\"display: inline-block; background: #3d5af1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 12px;\">Open Venmo &rarr;</a>" #
        "</div>"
      };
      case (?#applePayCash({ sitterPhone })) {
        "<div style=\"background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;\">" #
        "<p style=\"color: #166534; font-size: 15px; margin: 0; font-weight: 700;\">&#63743; Pay via Apple Pay Cash</p>" #
        "<p style=\"color: #15803d; font-size: 14px; margin: 10px 0;\">Send payment to your sitter&#8217;s phone number:</p>" #
        "<p style=\"color: #14532d; font-size: 20px; font-weight: 700; margin: 4px 0 12px;\">" # sitterPhone # "</p>" #
        "<p style=\"color: #166534; font-size: 13px; margin: 0; line-height: 1.6;\">Open <strong>Messages</strong>, tap your sitter&#8217;s phone number, then use the Apple Pay button to send payment.</p>" #
        "</div>"
      };
      case (?#cash({ instructions })) {
        "<div style=\"background: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: 20px; margin: 20px 0;\">" #
        "<p style=\"color: #713f12; font-size: 15px; margin: 0; font-weight: 700;\">&#128181; Pay by Cash</p>" #
        (if (instructions != "") {
          "<p style=\"color: #854d0e; font-size: 14px; margin: 10px 0 0; line-height: 1.6;\">" # instructions # "</p>"
        } else {
          "<p style=\"color: #854d0e; font-size: 14px; margin: 10px 0 0; line-height: 1.6;\">Please pay by cash. Your sitter will coordinate the details with you directly.</p>"
        }) #
        "</div>"
      };
    };
  };

  // Helper: human-readable payment method description for confirmation email
  func paymentMethodLabel(methodOpt : ?PaymentRecord.PaymentMethodDetails) : Text {
    switch (methodOpt) {
      case (null) { "Not specified" };
      case (?#venmo({ handle })) { "Venmo (@" # handle # ")" };
      case (?#applePayCash({ sitterPhone })) { "Apple Pay Cash to " # sitterPhone };
      case (?#cash({ instructions })) { if (instructions != "") { "Cash — " # instructions } else { "Cash" } };
    };
  };

  // Replace the entire adHocItems array on a payment record.
  // Creates a payment record if none exists.
  // Callable by assigned sitter or admin.
  public shared ({ caller }) func updateInvoiceAdHocItems(
    bookingId : Booking.Id,
    items : [PaymentRecord.AdHocLineItem]
  ) : async { #ok; #err : Text } {
    let isAdmin = callerIsAdmin(caller);
    let isSitter = switch (bookingsV4.get(bookingId)) {
      case (null) { false };
      case (?booking) { isCallerAssignedSitter(caller, booking) };
    };
    if (not isAdmin and not isSitter) {
      return #err("Unauthorized: Only assigned sitters or admins can update invoice items");
    };
    if (bookingsV4.get(bookingId) == null) {
      return #err("Booking not found");
    };

    let updated = switch (payments.get(bookingId)) {
      case (null) {
        {
          bookingId;
          totalAmount = 0;
          method = #manual;
          status = #pending;
          notes = null;
          stripePaymentIntentId = null;
          manualConfirmedBy = null;
          confirmedAt = null;
          splits = [];
          paidDate = null;
          discountPercent = null;
          discountAmount = null;
          originalAmount = null;
          completionNotes = null;
          actualEndTime = null;
          adHocItems = items;
          paymentMethodDetails = null;
        }
      };
      case (?existing) {
        { existing with adHocItems = items }
      };
    };

    payments.add(bookingId, updated);

    // Audit log
    let snapshot = "{\"bookingId\":" # bookingId.toText() #
      ",\"adHocItemCount\":" # items.size().toText() #
      ",\"timestamp\":" # Time.now().toText() # "}";
    appendAuditLog(#PriceAdjusted, "payment", bookingId, snapshot, caller);

    #ok;
  };

  // Set the structured payment method on a payment record.
  // Callable by assigned sitter or admin.
  public shared ({ caller }) func setInvoicePaymentMethod(
    bookingId : Booking.Id,
    method : PaymentRecord.PaymentMethodDetails
  ) : async { #ok; #err : Text } {
    let isAdmin = callerIsAdmin(caller);
    let isSitter = switch (bookingsV4.get(bookingId)) {
      case (null) { false };
      case (?booking) { isCallerAssignedSitter(caller, booking) };
    };
    if (not isAdmin and not isSitter) {
      return #err("Unauthorized: Only assigned sitters or admins can set payment method");
    };
    if (bookingsV4.get(bookingId) == null) {
      return #err("Booking not found");
    };

    let updated = switch (payments.get(bookingId)) {
      case (null) {
        {
          bookingId;
          totalAmount = 0;
          method = #manual;
          status = #pending;
          notes = null;
          stripePaymentIntentId = null;
          manualConfirmedBy = null;
          confirmedAt = null;
          splits = [];
          paidDate = null;
          discountPercent = null;
          discountAmount = null;
          originalAmount = null;
          completionNotes = null;
          actualEndTime = null;
          adHocItems = [];
          paymentMethodDetails = ?method;
        }
      };
      case (?existing) {
        { existing with paymentMethodDetails = ?method }
      };
    };

    payments.add(bookingId, updated);
    #ok;
  };

  // Send a professional invoice email to the client.
  // Includes all service line items, ad hoc items, and payment method instructions.
  // Propagates errors — does NOT silently return #ok on failure.
  public shared ({ caller }) func sendInvoiceToClient(bookingId : Booking.Id) : async { #ok : Text; #err : Text } {
    let isAdmin = callerIsAdmin(caller);
    let isSitter = switch (bookingsV4.get(bookingId)) {
      case (null) { false };
      case (?booking) { isCallerAssignedSitter(caller, booking) };
    };
    if (not isAdmin and not isSitter) {
      return #err("Unauthorized: Only assigned sitters or admins can send invoices");
    };
    // Freeze enforcement for non-admins
    if (not isAdmin) {
      switch (bookingsV4.get(bookingId)) {
        case (null) { /* will be caught below */ };
        case (?booking) {
          for (sitterId in booking.sitterIds.values()) {
            if (isSitterIdFrozenSync(sitterId)) {
              return #err("Account is suspended. Please reactivate your subscription to send invoices.");
            };
          };
        };
      };
    };

    switch (bookingsV4.get(bookingId)) {
      case (null) { return #err("Booking not found") };
      case (?booking) {
        if (booking.clientEmail == "") {
          return #err("No client email on file for this booking");
        };

        let payment = payments.get(bookingId);
        let totalAmount = switch (payment) {
          case (null) { bookingScheduleValue(booking) };
          case (?p) { if (p.totalAmount > 0) { p.totalAmount } else { bookingScheduleValue(booking) } };
        };
        let adHocItems_ = switch (payment) {
          case (null) { [] };
          case (?p) { p.adHocItems };
        };
        let paymentMethodOpt = switch (payment) {
          case (null) { null };
          case (?p) { p.paymentMethodDetails };
        };
        let discountAmount = switch (payment) {
          case (null) { 0 };
          case (?p) { switch (p.discountAmount) { case (null) { 0 }; case (?d) { d } } };
        };
        let originalAmount = switch (payment) {
          case (null) { totalAmount };
          case (?p) { switch (p.originalAmount) { case (null) { totalAmount }; case (?o) { o } } };
        };

        let lineItems = buildServiceLineItems(booking);
        let adHocHtml = buildAdHocLineItems(adHocItems_);
        let paymentSection = renderPaymentMethodSection(paymentMethodOpt, formatCents(totalAmount));

        let subtotalText = formatCents(originalAmount);
        let discountText = if (discountAmount > 0) { formatCents(discountAmount) } else { "" };
        let totalText = formatCents(totalAmount);
        let sitterNames = sitterNamesText(booking.sitterIds);
        let petNames = petNamesText(booking.pets);
        let startDateStr = formatDate(booking.startDate);
        let endDateStr = formatDate(booking.endDate);

        // Resolve sitter email for client-facing footer
        let sitterEmailForInvoice : Text = switch (booking.sitterIds.find(func(_ : Nat) : Bool { true })) {
          case (null) { "" };
          case (?sid) {
            switch (sitters.get(sid)) {
              case (null) { "" };
              case (?sitter) {
                switch (sitter.owner) {
                  case (null) { "" };
                  case (?ownerPrincipal) {
                    switch (userProfiles.get(ownerPrincipal)) {
                      case (null) { "" };
                      case (?up) { switch (up.email) { case (null) { "" }; case (?e) { e } } };
                    };
                  };
                };
              };
            };
          };
        };

        let html = EmailTemplates.invoiceEmail(
          booking.clientName,
          bookingId.toText(),
          sitterNames,
          sitterEmailForInvoice,
          petNames,
          startDateStr,
          endDateStr,
          lineItems,
          adHocHtml,
          subtotalText,
          discountText,
          totalText,
          paymentSection,
          appBaseUrl # "/#/booking-lookup?email=" # encodeEmailForUrl(booking.clientEmail) # "&tab=past",
          false,
        );

        let result = try {
          await EmailClient.sendEmail(
            [booking.clientEmail],
            "Your Pawspect invoice — INV-" # bookingId.toText() # " \u{1F4CB}",
            html,
          )
        } catch (e) {
          #err("Email send failed: " # e.message())
        };

        switch (result) {
          case (#ok) { #ok("Invoice sent to " # booking.clientEmail) };
          case (#err(e)) { #err("Failed to send invoice: " # e) };
        };
      };
    };
  };

  // Mark an invoice as paid AND send a confirmation email to the client with:
  //   - Full invoice + PAID stamp
  //   - Rate sitter CTA
  //   - Book Again CTA
  // Propagates email errors — does NOT silently return #ok on failure.
  public shared ({ caller }) func confirmManualPaymentWithEmail(
    bookingId : Booking.Id,
    paidDate : Text
  ) : async { #ok : Text; #err : Text } {
    let isAdmin = callerIsAdmin(caller);
    let isSitter = switch (bookingsV4.get(bookingId)) {
      case (null) { false };
      case (?booking) { isCallerAssignedSitter(caller, booking) };
    };
    if (not isAdmin and not isSitter) {
      return #err("Unauthorized: Only assigned sitters or admins can confirm payments");
    };

    switch (bookingsV4.get(bookingId)) {
      case (null) { return #err("Booking not found") };
      case (?booking) {
        if (booking.clientEmail == "") {
          return #err("No client email on file for this booking");
        };

        // Mark payment as paid
        let paymentOpt = payments.get(bookingId);
        let updatedPayment : PaymentRecord.Public = switch (paymentOpt) {
          case (null) {
            {
              bookingId;
              totalAmount = bookingScheduleValue(booking);
              method = #manual;
              status = #paid;
              notes = null;
              stripePaymentIntentId = null;
              manualConfirmedBy = ?caller;
              confirmedAt = ?Time.now();
              splits = [];
              paidDate = ?paidDate;
              discountPercent = null;
              discountAmount = null;
              originalAmount = null;
              completionNotes = null;
              actualEndTime = null;
              adHocItems = [];
              paymentMethodDetails = null;
            }
          };
          case (?existing) {
            {
              existing with
              status = #paid;
              manualConfirmedBy = ?caller;
              confirmedAt = ?Time.now();
              paidDate = ?paidDate;
            }
          };
        };

        payments.add(bookingId, updatedPayment);

        // Build email
        let adHocItems_ = updatedPayment.adHocItems;
        let totalAmount = updatedPayment.totalAmount;
        let paymentMethodOpt = updatedPayment.paymentMethodDetails;

        let lineItems = buildServiceLineItems(booking);
        let adHocHtml = buildAdHocLineItems(adHocItems_);
        let totalText = formatCents(totalAmount);
        let sitterNames = sitterNamesText(booking.sitterIds);
        let petNames = petNamesText(booking.pets);
        let startDateStr = formatDate(booking.startDate);
        let endDateStr = formatDate(booking.endDate);

        // First sitter name for the rate CTA
        let sitterName = switch (booking.sitterIds.find(func(_ : Nat) : Bool { true })) {
          case (null) { "your sitter" };
          case (?sitterId) {
            switch (sitters.get(sitterId)) {
              case (null) { "your sitter" };
              case (?p) { p.name };
            };
          };
        };

        let paymentMethodUsedText = paymentMethodLabel(paymentMethodOpt);

        let html = EmailTemplates.invoicePaidConfirmation(
          booking.clientName,
          bookingId.toText(),
          sitterName,
          sitterNames,
          petNames,
          startDateStr,
          endDateStr,
          lineItems,
          adHocHtml,
          totalText,
          paymentMethodUsedText,
          appBaseUrl # "/#/booking-lookup?email=" # encodeEmailForUrl(booking.clientEmail),
          appBaseUrl # "/#/booking-lookup?email=" # encodeEmailForUrl(booking.clientEmail),
        );

        let result = try {
          await EmailClient.sendEmail(
            [booking.clientEmail],
            "Your invoice is paid — thank you, " # booking.clientName # "! \u{2705}",
            html,
          )
        } catch (e) {
          #err("Email send failed: " # e.message())
        };

        switch (result) {
          case (#ok) { #ok("Payment confirmed and confirmation email sent to " # booking.clientEmail) };
          case (#err(e)) { #err("Failed to send paid confirmation: " # e) };
        };
      };
    };
  };

  // ---------------------------------------------------------------------------
  // GDPR Helpers
  // ---------------------------------------------------------------------------

  // Generate a pseudo-random token ID from timestamp + a byte from Random.
  // Best-effort uniqueness; ICP Random.blob() requires async context.
  func makeTokenId(prefix : Text) : Text {
    let nowText = Time.now().toText();
    prefix # "-" # nowText;
  };

  // Find the sitter profile ID that is owned by a given principal.
  func findSitterIdByOwner(owner : Principal) : ?Nat {
    var found : ?Nat = null;
    for ((id, p) in sitters.entries()) {
      if (p.owner == ?owner) { found := ?id };
    };
    found;
  };

  // Lookup the sitter's email from their UserProfile.
  func lookupSitterEmail(sitterPrincipal : Principal) : ?Text {
    switch (userProfiles.get(sitterPrincipal)) {
      case (null) { null };
      case (?up) { up.email };
    };
  };

  // ---------------------------------------------------------------------------
  // GDPR Export — sitter can download all their data
  // ---------------------------------------------------------------------------
  public shared ({ caller }) func exportSitterData() : async { #ok : Text; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be logged in");
    };

    let sitterIdOpt = findSitterIdByOwner(caller);
    let sitterId = switch (sitterIdOpt) {
      case (null) { return #err("No sitter profile found for your account") };
      case (?id) { id };
    };

    let profile = switch (sitters.get(sitterId)) {
      case (null) { return #err("Sitter profile not found") };
      case (?p) { p };
    };

    // Collect all bookings for this sitter
    let sitterBookings = bookingsV4.values().toArray().filter(func(b : Booking.Public) : Bool {
      b.sitterIds.any(func(id : Nat) : Bool { id == sitterId })
    });

    // Collect all payments for sitter's bookings
    let sitterBookingIds = sitterBookings.map(func(b : Booking.Public) : Nat { b.id });
    let paymentList = List.empty<Text>();
    for (bid in sitterBookingIds.values()) {
      switch (payments.get(bid)) {
        case (null) { /* no payment */ };
        case (?p) {
          paymentList.add("{\"bookingId\":" # bid.toText() #
            ",\"totalAmount\":" # p.totalAmount.toText() #
            ",\"status\":\"" # debug_show(p.status) # "\"" #
            ",\"paidDate\":" # (switch (p.paidDate) { case (null) { "null" }; case (?d) { "\"" # d # "\"" } }) # "}");
        };
      };
    };

    // Collect reviews
    let reviewList = switch (reviews.get(sitterId)) {
      case (null) { [] };
      case (?rl) { rl.values().toArray() };
    };

    // Collect tips
    let tipList = switch (tips.get(sitterId)) {
      case (null) { [] };
      case (?tl) { tl.values().toArray() };
    };

    // Subscription state
    let subState = switch (subscriptionState.get(sitterId)) {
      case (null) { "null" };
      case (?s) {
        "{\"isSubscribed\":" # (if (s.isSubscribed) { "true" } else { "false" }) #
        ",\"isFrozen\":" # (if (s.isFrozen) { "true" } else { "false" }) #
        ",\"trialStartedAt\":" # (switch (s.trialStartedAt) { case (null) { "null" }; case (?t) { t.toText() } }) # "}"
      };
    };

    // Build JSON export
    let ownerText = switch (profile.owner) {
      case (null) { "null" };
      case (?p) { "\"" # p.toText() # "\"" };
    };
    let json = "{" #
      "\"exportedAt\":" # Time.now().toText() # "," #
      "\"profile\":{" #
        "\"id\":" # sitterId.toText() # "," #
        "\"name\":\"" # profile.name # "\"," #
        "\"bio\":\"" # profile.bio # "\"," #
        "\"location\":\"" # profile.location # "\"," #
        "\"phone\":\"" # profile.phone # "\"," #
        "\"services\":[" # profile.services.values().join(",") # "]," #
        "\"hourlyRate\":" # profile.hourlyRate.toText() # "," #
        "\"rating\":" # debug_show(profile.rating) # "," #
        "\"reviewCount\":" # profile.reviewCount.toText() # "," #
        "\"owner\":" # ownerText #
      "}," #
      "\"bookingCount\":" # sitterBookings.size().toText() # "," #
      "\"payments\":[" # paymentList.values().join(",") # "]," #
      "\"reviewCount\":" # reviewList.size().toText() # "," #
      "\"tipCount\":" # tipList.size().toText() # "," #
      "\"subscription\":" # subState #
    "}";

    // Log the export event in audit trail
    appendAuditLog(#GdprExportRequested, "Sitter", sitterId,
      "{\"action\":\"gdpr_export\",\"sitterId\":" # sitterId.toText() # ",\"timestamp\":" # Time.now().toText() # "}",
      caller);

    // Send GDPR export confirmation email (best-effort)
    let sitterEmailOpt = lookupSitterEmail(caller);
    switch (sitterEmailOpt) {
      case (null) { /* no email */ };
      case (?email) {
        try {
          ignore await EmailClient.sendEmail(
            [email],
            "Your Pawspect data export is ready",
            EmailTemplates.gdprExportConfirmation(profile.name),
          );
        } catch (_) { /* best-effort */ };
      };
    };

    #ok(json);
  };

  // ---------------------------------------------------------------------------
  // GDPR Anonymize — sitter can anonymize their account
  // ---------------------------------------------------------------------------
  public shared ({ caller }) func anonymizeSitterAccount() : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be logged in");
    };

    let sitterIdOpt = findSitterIdByOwner(caller);
    let sitterId = switch (sitterIdOpt) {
      case (null) { return #err("No sitter profile found for your account") };
      case (?id) { id };
    };

    let profile = switch (sitters.get(sitterId)) {
      case (null) { return #err("Sitter profile not found") };
      case (?p) { p };
    };

    // Anonymize the sitter profile — replace personal data with placeholders
    let anonymized : SitterProfile.Public = {
      profile with
      name         = "Anonymized User";
      bio          = "";
      phone        = "";
      photoUrl     = "";
      location     = "";
      isActive     = false;
      isAnonymized = ?true;
    };
    sitters.add(sitterId, anonymized);

    // Anonymize the user profile
    switch (userProfiles.get(caller)) {
      case (null) { /* nothing to anonymize */ };
      case (?up) {
        let anonUp : UserProfile = {
          name  = "Anonymized User";
          email = ?"anonymized@deleted.com";
          role  = up.role;
        };
        userProfiles.add(caller, anonUp);
      };
    };

    // Freeze the account so it cannot be used
    let existingRecord = switch (subscriptionState.get(sitterId)) {
      case (?r) { r };
      case (null) { SubscriptionLib.emptyRecord() };
    };
    let frozenRecord : SubscriptionTypes.SubscriptionRecord = {
      existingRecord with
      isFrozen = true;
      frozenAt = ?Time.now();
    };
    subscriptionState.add(sitterId, frozenRecord);

    // Log anonymization in audit trail
    appendAuditLog(#AccountAnonymized, "Sitter", sitterId,
      "{\"action\":\"gdpr_anonymize\",\"sitterId\":" # sitterId.toText() # ",\"timestamp\":" # Time.now().toText() # "}",
      caller);

    // Send GDPR anonymize confirmation email (best-effort)
    let sitterEmailOpt = lookupSitterEmail(caller);
    let originalName = profile.name;
    switch (sitterEmailOpt) {
      case (null) { /* no email */ };
      case (?email) {
        try {
          ignore await EmailClient.sendEmail(
            [email],
            "Your Pawspect account has been anonymized",
            EmailTemplates.gdprAnonymizeConfirmation(originalName),
          );
        } catch (_) { /* best-effort */ };
      };
    };

    #ok;
  };

  // Admin-only: export sitter data on behalf of a support ticket
  public shared ({ caller }) func adminExportSitterData(sitterId : SitterProfile.Id) : async { #ok : Text; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can export sitter data");
    };
    // Verify scoped access via support ticket
    let profile = switch (sitters.get(sitterId)) {
      case (null) { return #err("Sitter not found") };
      case (?p) { p };
    };
    let hasAccess = switch (profile.owner) {
      case (null) { false };
      case (?ownerP) {
        supportTickets.values().any(func(t : SupportTicket.Public) : Bool {
          Principal.equal(t.sitterId, ownerP) and
          (switch (t.status) { case (#adminAccessing) { true }; case (_) { false } })
        })
      };
    };
    if (not hasAccess) {
      return #err("No active support ticket grants access to this sitter's data");
    };
    appendAuditLog(#GdprExportDownloaded, "Sitter", sitterId,
      "{\"action\":\"admin_export\",\"sitterId\":" # sitterId.toText() # ",\"adminPrincipal\":\"" # caller.toText() # "\",\"timestamp\":" # Time.now().toText() # "}",
      caller);
    #ok("{\"sitterId\":" # sitterId.toText() # ",\"name\":\"" # profile.name # "\",\"exportedBy\":\"admin\",\"timestamp\":" # Time.now().toText() # "}");
  };

  // Admin-only: anonymize sitter data on behalf (GDPR request to admin)
  public shared ({ caller }) func adminAnonymizeSitter(sitterId : SitterProfile.Id) : async { #ok; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can anonymize sitter data");
    };
    switch (sitters.get(sitterId)) {
      case (null) { return #err("Sitter not found") };
      case (?profile) {
        let anonymized : SitterProfile.Public = {
          profile with
          name         = "Anonymized User";
          bio          = "";
          phone        = "";
          photoUrl     = "";
          location     = "";
          isActive     = false;
          isAnonymized = ?true;
        };
        sitters.add(sitterId, anonymized);
        appendAuditLog(#GdprAnonymizationRequested, "Sitter", sitterId,
          "{\"action\":\"admin_anonymize\",\"sitterId\":" # sitterId.toText() # ",\"adminPrincipal\":\"" # caller.toText() # "\",\"timestamp\":" # Time.now().toText() # "}",
          caller);
        #ok;
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Birthdate / Age Validation (used in sitter application)
  // ---------------------------------------------------------------------------

  // Admin-only: approve a sitter application — activates the profile, starts trial, sends welcome email.
  public shared ({ caller }) func approveSitterApplication(sitterId : SitterProfile.Id) : async { #ok; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can approve sitter applications");
    };
    switch (sitters.get(sitterId)) {
      case (null) { return #err("Sitter not found") };
      case (?profile) {
        // Activate the profile
        let updated = { profile with isActive = true };
        sitters.add(sitterId, updated);

        // Auto-assign a unique URL handle if not already set
        if (sitterHandles.get(sitterId) == null) {
          let base = nameToHandle(profile.name);
          let handle = uniqueHandle(base, sitterId);
          sitterHandles.add(sitterId, handle);
        };

        // Ensure trial clock is started
        let existingRecord = subscriptionState.get(sitterId);
        switch (existingRecord) {
          case (null) {
            subscriptionState.add(sitterId, SubscriptionLib.newRecord());
          };
          case (?r) {
            switch (r.trialStartedAt) {
              case (null) {
                subscriptionState.add(sitterId, { r with trialStartedAt = ?Time.now() });
              };
              case (?_) { /* already set */ };
            };
          };
        };

        // Compute trial end date text (approx 30 days from now)
        let trialEndNs : Int = Time.now() + 30 * 24 * 60 * 60 * 1_000_000_000;
        let trialEndDate = formatDate(trialEndNs);

        // Send approved email (best-effort)
        let sitterEmailOpt : ?Text = switch (profile.owner) {
          case (null) { null };
          case (?ownerPrincipal) {
            switch (userProfiles.get(ownerPrincipal)) {
              case (null) { null };
              case (?up) { up.email };
            };
          };
        };
        switch (sitterEmailOpt) {
          case (null) { /* no email */ };
          case (?email) {
            try {
              ignore await EmailClient.sendApplicationApprovedEmail(
                email, profile.name, trialEndDate,
                appBaseUrl # "/#/sitter-dashboard",
              );
            } catch (_) { /* email is best-effort */ };
            // Also send the trial welcome email so sitters know exactly what's included
            try {
              ignore await EmailClient.sendTrialWelcomeEmail(email, profile.name, trialEndDate, appBaseUrl);
            } catch (_) { /* email is best-effort */ };
          };
        };

        appendAuditLog(#SitterReactivated, "Sitter", sitterId,
          "{\"action\":\"application_approved\",\"sitterId\":" # sitterId.toText() # "}",
          caller);
        #ok;
      };
    };
  };

  // Admin-only: reject a sitter application — deactivates the profile and sends a rejection email.
  public shared ({ caller }) func rejectSitterApplication(sitterId : SitterProfile.Id) : async { #ok; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can reject sitter applications");
    };
    switch (sitters.get(sitterId)) {
      case (null) { return #err("Sitter not found") };
      case (?profile) {
        // Ensure profile is marked inactive
        let updated = { profile with isActive = false };
        sitters.add(sitterId, updated);

        // Send rejection email (best-effort)
        let sitterEmailOpt : ?Text = switch (profile.owner) {
          case (null) { null };
          case (?ownerPrincipal) {
            switch (userProfiles.get(ownerPrincipal)) {
              case (null) { null };
              case (?up) { up.email };
            };
          };
        };
        switch (sitterEmailOpt) {
          case (null) { /* no email */ };
          case (?email) {
            try {
              ignore await EmailClient.sendApplicationRejectedEmail(email, profile.name);
            } catch (_) { /* email is best-effort */ };
          };
        };

        appendAuditLog(#SitterDeactivated, "Sitter", sitterId,
          "{\"action\":\"application_rejected\",\"sitterId\":" # sitterId.toText() # "}",
          caller);
        #ok;
      };
    };
  };

  // Day-25 trial reminder: call from frontend when sitter logs in.
  // Idempotent — trialReminderSent flag prevents duplicate sends.
  public shared ({ caller }) func checkAndSendTrialReminder() : async { #ok : Text; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be logged in");
    };

    var sitterIdOpt : ?SitterProfile.Id = null;
    for ((id, profile) in sitters.entries()) {
      if (profile.owner == ?caller) { sitterIdOpt := ?id };
    };

    let sitterId = switch (sitterIdOpt) {
      case (null) { return #ok("No sitter profile") };
      case (?id) { id };
    };

    // Grandfathered sitters never get reminder
    let isGrandfatheredFlag : Bool = switch (sitterLicensing.get(sitterId)) {
      case (?entry) {
        switch (entry.isGrandfathered) {
          case (?true) { true };
          case (_) { false };
        };
      };
      case (null) { true };
    };
    if (isGrandfatheredFlag) { return #ok("Grandfathered — no reminder needed") };

    let record = switch (subscriptionState.get(sitterId)) {
      case (?r) { r };
      case (null) { return #ok("No subscription record") };
    };

    // Already subscribed or frozen — no reminder
    if (record.isSubscribed or record.isFrozen) { return #ok("No reminder needed") };

    // Already sent
    if (record.trialReminderSent == ?true) { return #ok("Reminder already sent") };

    // Check if 5 or fewer days remain
    let nowNs : Int = Time.now();
    let startNs : Int = switch (record.trialStartedAt) {
      case (?t) { t };
      case (null) { return #ok("No trial start date") };
    };
    let thirtyDaysNs : Int = 2_592_000_000_000_000;
    let elapsedNs : Int = nowNs - startNs;
    let remainingNs : Int = thirtyDaysNs - elapsedNs;
    let fiveDaysNs : Int = 5 * 24 * 60 * 60 * 1_000_000_000;

    if (remainingNs > fiveDaysNs) {
      return #ok("Trial reminder not due yet");
    };
    if (remainingNs <= 0) {
      // Trial has expired — send the trial-expired email once if not already sent
      if (record.trialExpiredEmailSent != ?true) {
        subscriptionState.add(sitterId, { record with trialExpiredEmailSent = ?true });
        let sitterName2 : Text = switch (sitters.get(sitterId)) {
          case (null) { "Sitter" };
          case (?p) { p.name };
        };
        let sitterEmailOpt2 : ?Text = switch (sitters.get(sitterId)) {
          case (null) { null };
          case (?p) {
            switch (p.owner) {
              case (null) { null };
              case (?ownerPrincipal) {
                switch (userProfiles.get(ownerPrincipal)) {
                  case (null) { null };
                  case (?up) { up.email };
                };
              };
            };
          };
        };
        switch (sitterEmailOpt2) {
          case (null) { return #ok("Trial expired email marked sent — no email on file") };
          case (?email2) {
            try {
              ignore await EmailClient.sendTrialExpiredEmail(email2, sitterName2, appBaseUrl);
            } catch (_) { /* email is best-effort */ };
            return #ok("Trial expired email sent");
          };
        };
      };
      return #ok("Trial already expired");
    };

    // Mark as sent BEFORE sending to prevent duplicates
    subscriptionState.add(sitterId, { record with trialReminderSent = ?true });

    let sitterName : Text = switch (sitters.get(sitterId)) {
      case (null) { "Sitter" };
      case (?p) { p.name };
    };
    let sitterEmailOpt : ?Text = switch (sitters.get(sitterId)) {
      case (null) { null };
      case (?p) {
        switch (p.owner) {
          case (null) { null };
          case (?ownerPrincipal) {
            switch (userProfiles.get(ownerPrincipal)) {
              case (null) { null };
              case (?up) { up.email };
            };
          };
        };
      };
    };

    switch (sitterEmailOpt) {
      case (null) { return #ok("Reminder marked sent — no email on file") };
      case (?email) {
        let trialEndNs : Int = startNs + thirtyDaysNs;
        let trialEndDate = formatDate(trialEndNs);
        try {
          ignore await EmailClient.sendTrialReminderEmail(email, sitterName, trialEndDate, appBaseUrl);
        } catch (_) { /* email is best-effort */ };
        return #ok("Trial reminder sent");
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Server-side heartbeat: daily trial-status sweep
  //
  // Fires once every 86 400 seconds (1 day). For each non-grandfathered sitter
  // that has an active trial subscription record this function:
  //   1. Sends a day-25 reminder email when ≤ 5 days remain (idempotent via
  //      trialReminderSent flag).
  //   2. Freezes the account and sends a freeze-notification email when the
  //      trial has expired (> 30 days) and the sitter has not subscribed.
  //
  // The existing checkAndSendTrialReminder() stays as a frontend-triggered
  // fallback but this timer is the primary mechanism so sitters who never
  // log in still receive the reminder and get frozen on time.
  // ---------------------------------------------------------------------------
  func runDailyTrialSweep() : async () {
    let nowNs : Int = Time.now();
    let thirtyDaysNs : Int = 2_592_000_000_000_000;
    let fiveDaysNs   : Int = 5 * 24 * 60 * 60 * 1_000_000_000;

    for ((sitterId, record) in subscriptionState.entries()) {
      // Skip grandfathered sitters
      let isGrandfathered : Bool = switch (sitterLicensing.get(sitterId)) {
        case (?entry) { entry.isGrandfathered == ?true };
        case (null)   { true };
      };
      if (isGrandfathered) { /* skip */ }
      else {
        // Only act on sitters that are in the trial phase (not yet subscribed)
        if (not record.isSubscribed) {
          switch (record.trialStartedAt) {
            case (null) { /* trial not yet started — skip */ };
            case (?startNs) {
              let elapsedNs : Int = nowNs - startNs;
              let remainingNs : Int = thirtyDaysNs - elapsedNs;

              // --- Case 1: trial has fully expired —> freeze ---
              if (remainingNs <= 0 and not record.isFrozen) {
                let frozenRecord = {
                  record with
                  isFrozen = true;
                  frozenAt = ?nowNs;
                };
                subscriptionState.add(sitterId, frozenRecord);

                // Resolve sitter email for freeze notification
                let sitterNameF : Text = switch (sitters.get(sitterId)) {
                  case (null) { "Sitter" };
                  case (?p)   { p.name };
                };
                let sitterEmailOptF : ?Text = switch (sitters.get(sitterId)) {
                  case (null) { null };
                  case (?p)   {
                    switch (p.owner) {
                      case (null)         { null };
                      case (?ownerPrinc)  {
                        switch (userProfiles.get(ownerPrinc)) {
                          case (null) { null };
                          case (?up)  { up.email };
                        };
                      };
                    };
                  };
                };
                switch (sitterEmailOptF) {
                  case (null) { /* no email on file */ };
                  case (?emailF) {
                    try {
                      ignore await EmailClient.sendAccountFrozenEmail(emailF, sitterNameF, appBaseUrl);
                    } catch (_) { /* email is best-effort */ };
                  };
                };

              // --- Case 2: ≤ 5 days remain and reminder not yet sent —> send reminder ---
              } else if (remainingNs > 0 and remainingNs <= fiveDaysNs and record.trialReminderSent != ?true) {
                // Mark sent BEFORE sending to prevent duplicates across heartbeat cycles
                subscriptionState.add(sitterId, { record with trialReminderSent = ?true });

                let sitterNameR : Text = switch (sitters.get(sitterId)) {
                  case (null) { "Sitter" };
                  case (?p)   { p.name };
                };
                let sitterEmailOptR : ?Text = switch (sitters.get(sitterId)) {
                  case (null) { null };
                  case (?p)   {
                    switch (p.owner) {
                      case (null)         { null };
                      case (?ownerPrinc)  {
                        switch (userProfiles.get(ownerPrinc)) {
                          case (null) { null };
                          case (?up)  { up.email };
                        };
                      };
                    };
                  };
                };
                switch (sitterEmailOptR) {
                  case (null) { /* no email on file */ };
                  case (?emailR) {
                    let trialEndDate = formatDate(startNs + thirtyDaysNs);
                    try {
                      ignore await EmailClient.sendTrialReminderEmail(emailR, sitterNameR, trialEndDate, appBaseUrl);
                    } catch (_) { /* email is best-effort */ };
                  };
                };
              };
            };
          };
        };
      };
    };
  };

  // Kick off a recurring 24-hour timer that drives the trial-status sweep.
  // Timer.recurringTimer fires the callback every `duration`, starting after
  // the first `duration` has elapsed.  The timer ID is stored so it can be
  // inspected if needed; it is not otherwise used at runtime.
  let _dailyTrialTimerId : Timer.TimerId =
    Timer.recurringTimer<system>(#seconds(86_400), runDailyTrialSweep);

  // Returns true if the given birthdate (nanoseconds since epoch) corresponds
  // to a person who is at least 18 years old as of today.
  // US ZIP code validation — 5-digit or ZIP+4 format (NNNNN or NNNNN-NNNN)
  // Returns true only for valid US postal codes.
  // US ZIP code validation — 5-digit or ZIP+4 format (NNNNN or NNNNN-NNNN)
  // Returns true only for valid US postal codes.
  func isValidUsZip(zip : Text) : Bool {
    let chars = zip.chars().toArray();
    let len = chars.size();
    if (len == 5) {
      // All 5 chars must be digits
      chars.all(func(c : Char) : Bool { c >= '0' and c <= '9' })
    } else if (len == 10) {
      // Format: NNNNN-NNNN
      let first5 = chars.sliceToArray(0, 5);
      let dash   = chars[5];
      let last4  = chars.sliceToArray(6, 10);
      first5.all(func(c : Char) : Bool { c >= '0' and c <= '9' }) and
      dash == '-' and
      last4.all(func(c : Char) : Bool { c >= '0' and c <= '9' })
    } else {
      false
    }
  };

      func isAtLeast18(birthdateNs : Int) : Bool {
    let nowNs : Int = Time.now();
    let ageNs : Int = nowNs - birthdateNs;
    // 18 years in nanoseconds (approximate: 18 * 365.25 days)
    let eighteenYearsNs : Int = 18 * 365 * 24 * 60 * 60 * 1_000_000_000;
    ageNs >= eighteenYearsNs;
  };

  // ---------------------------------------------------------------------------
  // getSitterLicenseStatus — public query called by the frontend (useQueries.ts)
  // Returns full subscription/trial status for the calling sitter.
  // ---------------------------------------------------------------------------
  public shared query ({ caller }) func getSitterLicenseStatus() : async SubscriptionTypes.SitterLicenseStatus {
    if (caller.isAnonymous()) {
      return {
        isGrandfathered      = false;
        trialActive          = false;
        isLicensed           = false;
        trialDaysRemaining   = null;
        trialStartedAt       = null;
        isFrozen             = false;
        isSubscribed         = false;
        subscriptionStatus   = "unknown";
        stripeCustomerId     = null;
        stripeSubscriptionId = null;
      };
    };

    // Find the sitter profile owned by this caller
    var sitterIdOpt : ?SitterProfile.Id = null;
    for ((id, profile) in sitters.entries()) {
      if (profile.owner == ?caller) { sitterIdOpt := ?id };
    };

    let sitterId = switch (sitterIdOpt) {
      case (null) {
        // No sitter profile yet — return a neutral status
        return {
          isGrandfathered      = false;
          trialActive          = false;
          isLicensed           = false;
          trialDaysRemaining   = null;
          trialStartedAt       = null;
          isFrozen             = false;
          isSubscribed         = false;
          subscriptionStatus   = "unknown";
          stripeCustomerId     = null;
          stripeSubscriptionId = null;
        };
      };
      case (?id) { id };
    };

    // Resolve grandfathered flag (null in the map → grandfathered by legacy rule)
    let isGrandfatheredFlag : Bool = switch (sitterLicensing.get(sitterId)) {
      case (?entry) {
        switch (entry.isGrandfathered) {
          case (?true)  { true };
          case (?false) { false };
          case (null)   { true };
        };
      };
      case (null) { true };
    };

    SubscriptionLib.computeStatus(isGrandfatheredFlag, subscriptionState.get(sitterId));
  };

  // ---------------------------------------------------------------------------
  // Public Sitter Storefront — Phase 3 support
  // ---------------------------------------------------------------------------

  // Convert a sitter name to a URL-friendly handle: lowercase, spaces → hyphens,
  // strip non-alphanumeric chars (except hyphens).
  func nameToHandle(name : Text) : Text {
    var result = "";
    for (c in name.toLower().chars()) {
      if (c >= 'a' and c <= 'z') {
        result #= Text.fromChar(c);
      } else if (c >= '0' and c <= '9') {
        result #= Text.fromChar(c);
      } else if (c == ' ' or c == '-') {
        result #= "-";
      };
      // other chars dropped
    };
    // Strip duplicate hyphens by splitting and rejoining non-empty parts
    let parts = result.split(#char '-').filter(func(s : Text) : Bool { s.size() > 0 });
    parts.join("-");
  };

  // Check whether a given handle is already taken by any sitter OTHER than excludeSitterId.
  // Falls back to comparing against the derived handle when no explicit stored handle exists.
  func handleIsTaken(handle : Text, excludeSitterId : Nat) : Bool {
    var taken = false;
    for ((sid, profile) in sitters.entries()) {
      if (sid != excludeSitterId) {
        let existing = switch (sitterHandles.get(sid)) {
          case (?h) { h };
          case (null) { nameToHandle(profile.name) };
        };
        if (existing == handle) { taken := true };
      };
    };
    taken;
  };

  // Derive a unique handle for a sitter, appending -2, -3, etc. on collision.
  // excludeSitterId is the sitter being assigned — its own current handle is excluded.
  func uniqueHandle(base : Text, excludeSitterId : Nat) : Text {
    if (not handleIsTaken(base, excludeSitterId)) { return base };
    var suffix = 2;
    var candidate = base # "-" # suffix.toText();
    while (handleIsTaken(candidate, excludeSitterId)) {
      suffix += 1;
      candidate := base # "-" # suffix.toText();
    };
    candidate;
  };

  // Return the URL handle for a sitter. Falls back to derived handle from name.
  public query func getSitterHandle(sitterId : SitterProfile.Id) : async ?Text {
    switch (sitters.get(sitterId)) {
      case (null) { null };
      case (?profile) {
        let stored = sitterHandles.get(sitterId);
        switch (stored) {
          case (?h) { ?h };
          case (null) { ?nameToHandle(profile.name) };
        };
      };
    };
  };

  // Admin or sitter: explicitly set a custom handle.
  public shared ({ caller }) func setSitterHandle(sitterId : SitterProfile.Id, handle : Text) : async { #ok; #err : Text } {
    switch (sitters.get(sitterId)) {
      case (null) { return #err("Sitter not found") };
      case (?profile) {
        if (not callerIsAdmin(caller) and profile.owner != ?caller) {
          return #err("Unauthorized: Only the sitter or admin can set handle");
        };
        sitterHandles.add(sitterId, handle);
        #ok;
      };
    };
  };

  // Return all (sitterId, handle) pairs for client-side routing.
  public query func getAllSitterHandles() : async [(Nat, Text)] {
    let result = List.empty<(Nat, Text)>();
    for ((sitterId, profile) in sitters.entries()) {
      if (profile.isActive and profile.isAnonymized != ?true) {
        let handle = switch (sitterHandles.get(sitterId)) {
          case (?h) { h };
          case (null) { nameToHandle(profile.name) };
        };
        result.add((sitterId, handle));
      };
    };
    result.values().toArray();
  };

  // Public sitter profile for the storefront page — no auth required.
  // Returns null if the sitter is not found, not active, or is anonymized.
  public query func getPublicSitterProfile(handle : Text) : async ?{
    id : Nat;
    name : Text;
    bio : ?Text;
    profilePhotoUrl : ?Text;
    services : [{
      serviceName : Text;
      price : Float;
      duration : ?Text;
    }];
    averageRating : Float;
    reviewCount : Nat;
    reviews : [{
      rating : Nat;
      comment : ?Text;
      clientName : Text;
      createdAt : Int;
    }];
    badges : [Text];
    isActive : Bool;
  } {
    // Find sitter by handle (case-insensitive)
    let normalizedHandle = handle.toLower();

    var foundId : ?SitterProfile.Id = null;
    for ((sitterId, profile) in sitters.entries()) {
      if (profile.isActive and profile.isAnonymized != ?true) {
        let storedHandle = switch (sitterHandles.get(sitterId)) {
          case (?h) { h.toLower() };
          case (null) { nameToHandle(profile.name) };
        };
        if (storedHandle == normalizedHandle) {
          foundId := ?sitterId;
        };
      };
    };

    let sitterId = switch (foundId) {
      case (null) { return null };
      case (?id) { id };
    };

    let profile = switch (sitters.get(sitterId)) {
      case (null) { return null };
      case (?p) { p };
    };

    // Build service items from serviceRates
    let serviceItems : [{ serviceName : Text; price : Float; duration : ?Text }] = profile.serviceRates.map(
      func(r : { service : Text; ratePerHour : Nat }) : { serviceName : Text; price : Float; duration : ?Text } {
        { serviceName = r.service; price = r.ratePerHour.toFloat(); duration = null }
      }
    );

    // Build public reviews (newest first, limit to most recent 10)
    let publicReviews : [{ rating : Nat; comment : ?Text; clientName : Text; createdAt : Int }] = switch (reviews.get(sitterId)) {
      case (null) { [] };
      case (?reviewList) {
        let arr = reviewList.values().toArray();
        let sorted = arr.sort(func(a : Review.Public, b : Review.Public) : { #less; #equal; #greater } {
          Int.compare(b.createdAt, a.createdAt)
        });
        let buf = List.empty<{ rating : Nat; comment : ?Text; clientName : Text; createdAt : Int }>();
        for (r in sorted.values()) {
          let ratingNat : Nat = if (r.rating >= 4.5) { 5 } else if (r.rating >= 3.5) { 4 } else if (r.rating >= 2.5) { 3 } else if (r.rating >= 1.5) { 2 } else { 1 };
          buf.add({
            rating = ratingNat;
            comment = if (r.reviewText == "") { null } else { ?r.reviewText };
            clientName = "Verified Client";
            createdAt = r.createdAt;
          });
        };
        buf.values().toArray();
      };
    };

    // Build badges
    let badges = List.empty<Text>();
    if (profile.reviewCount >= 10) { badges.add("Top Rated") };
    if (profile.reviewCount >= 5) { badges.add("Experienced") };
    if (profile.rating >= 4.8) { badges.add("5-Star Sitter") };

    ?{
      id = sitterId;
      name = profile.name;
      bio = if (profile.bio == "") { null } else { ?profile.bio };
      profilePhotoUrl = if (profile.photoUrl == "") { null } else { ?profile.photoUrl };
      services = serviceItems;
      averageRating = profile.rating;
      reviewCount = profile.reviewCount;
      reviews = publicReviews;
      badges = badges.values().toArray();
      isActive = profile.isActive;
    };
  };

  // Public query: returns the last `limit` reviews for a sitter, newest first.
  // No auth required — used by the public storefront page.
  // Returns an empty array if the sitter has no reviews.
  public query func getSitterPublicReviews(sitterId : SitterProfile.Id, limit : Nat) : async [{
    rating : Nat;
    comment : ?Text;
    clientName : Text;
    createdAt : Int;
  }] {
    switch (reviews.get(sitterId)) {
      case (null) { [] };
      case (?reviewList) {
        let arr = reviewList.values().toArray();
        let sorted = arr.sort(func(a : Review.Public, b : Review.Public) : { #less; #equal; #greater } {
          Int.compare(b.createdAt, a.createdAt)
        });
        let sliceEnd : Int = if (limit == 0 or limit >= sorted.size()) {
          sorted.size().toInt()
        } else {
          limit.toInt()
        };
        let sliced = sorted.sliceToArray(0, sliceEnd);
        sliced.map<Review.Public, { rating : Nat; comment : ?Text; clientName : Text; createdAt : Int }>(
          func(r) {
            let ratingNat : Nat = if (r.rating >= 4.5) { 5 } else if (r.rating >= 3.5) { 4 } else if (r.rating >= 2.5) { 3 } else if (r.rating >= 1.5) { 2 } else { 1 };
            {
              rating = ratingNat;
              comment = if (r.reviewText == "") { null } else { ?r.reviewText };
              clientName = "Verified Client";
              createdAt = r.createdAt;
            }
          }
        );
      };
    };
  };

  // Admin-only: one-time migration to assign URL handles to all approved sitters
  // that don't have one yet. Safe to call multiple times — skips sitters that already
  // have a stored handle. Returns the count of handles assigned.
  public shared ({ caller }) func backfillSitterHandles() : async { #ok : Nat; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can run migrations");
    };
    var assigned : Nat = 0;
    for ((sitterId, profile) in sitters.entries()) {
      if (profile.isActive and sitterHandles.get(sitterId) == null) {
        let base = nameToHandle(profile.name);
        let handle = uniqueHandle(base, sitterId);
        sitterHandles.add(sitterId, handle);
        assigned += 1;
      };
    };
    #ok(assigned);
  };

  // ---------------------------------------------------------------------------
  // Support Ticket System — admin data privacy enforcement
  // ---------------------------------------------------------------------------

  // Sitter opens a support ticket. Admin gets notified. Access is NOT granted until
  // the admin explicitly calls grantSupportAccess.
  public shared ({ caller }) func openSupportTicket(issue : Text) : async { #ok : Text; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be logged in");
    };
    // Must have a sitter profile
    let sitterIdOpt = findSitterIdByOwner(caller);
    let sitterId = switch (sitterIdOpt) {
      case (null) { return #err("No sitter profile found for your account") };
      case (?id) { id };
    };
    let sitterProfile = switch (sitters.get(sitterId)) {
      case (null) { return #err("Sitter profile not found") };
      case (?p) { p };
    };

    // Generate a unique ticket ID: "TKT-" + timestamp + "-" + sitter ID
    let ticketId = "TKT-" # Time.now().toText() # "-" # sitterId.toText();
    let now : Int = Time.now();

    let ticket : SupportTicket.Public = {
      id              = ticketId;
      sitterId        = caller;
      sitterName      = sitterProfile.name;
      issue;
      status          = #open;
      createdAt       = now;
      resolvedAt      = null;
      adminNotes      = null;
      accessGrantedAt = null;
      accessRevokedAt = null;
    };

    supportTickets.add(ticketId, ticket);

    // Audit log
    let snapshot = "{\"ticketId\":\"" # ticketId # "\",\"sitterId\":\"" # caller.toText() # "\",\"issue\":\"" # issue # "\"}";
    appendAuditLog(#SupportTicketOpened, "SupportTicket", sitterId, snapshot, caller);

    // Email admin (best-effort)
    let adminNotifyEmail = if (adminEmail != "") { adminEmail } else { "dataddgroup@gmail.com" };
    try {
      ignore await EmailClient.sendEmail(
        [adminNotifyEmail],
        "Support ticket opened by " # sitterProfile.name # " [" # ticketId # "]",
        EmailTemplates.supportTicketNotifyAdmin(
          sitterProfile.name,
          ticketId,
          issue,
          appBaseUrl # "/#/admin-dashboard",
        ),
      );
    } catch (_) { /* best-effort */ };

    // Confirmation email to sitter (best-effort)
    let sitterEmailOpt = lookupSitterEmail(caller);
    switch (sitterEmailOpt) {
      case (null) { /* no email */ };
      case (?email) {
        try {
          ignore await EmailClient.sendEmail(
            [email],
            "Your support request has been received [" # ticketId # "]",
            EmailTemplates.supportTicketReceivedSitter(sitterProfile.name, ticketId, issue),
          );
        } catch (_) { /* best-effort */ };
      };
    };

    #ok(ticketId);
  };

  // Admin-only: list all support tickets, newest first.
  public query ({ caller }) func getSupportTickets() : async [SupportTicket.Public] {
    if (not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view support tickets");
    };
    let arr = supportTickets.values().toArray();
    arr.sort(func(a : SupportTicket.Public, b : SupportTicket.Public) : { #less; #equal; #greater } {
      Int.compare(b.createdAt, a.createdAt)
    });
  };

  // Sitter-only: list their own support tickets, newest first.
  public query ({ caller }) func getMySupportTickets() : async [SupportTicket.Public] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let mine = supportTickets.values().toArray().filter(func(t : SupportTicket.Public) : Bool {
      Principal.equal(t.sitterId, caller)
    });
    mine.sort(func(a : SupportTicket.Public, b : SupportTicket.Public) : { #less; #equal; #greater } {
      Int.compare(b.createdAt, a.createdAt)
    });
  };

  // Admin-only: grant scoped access to a sitter's data for a specific open ticket.
  public shared ({ caller }) func grantSupportAccess(ticketId : Text) : async { #ok : Text; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can grant support access");
    };
    switch (supportTickets.get(ticketId)) {
      case (null) { return #err("Ticket not found: " # ticketId) };
      case (?ticket) {
        switch (ticket.status) {
          case (#open) { /* ok to grant */ };
          case (#adminAccessing) { return #err("Admin access is already granted for this ticket") };
          case (#resolved) { return #err("Ticket is already resolved") };
        };

        let now : Int = Time.now();
        let updated : SupportTicket.Public = {
          ticket with
          status          = #adminAccessing;
          accessGrantedAt = ?now;
        };
        supportTickets.add(ticketId, updated);

        // Find sitter profile ID for audit log
        var sitterProfileId : Nat = 0;
        for ((id, p) in sitters.entries()) {
          switch (p.owner) {
            case (?ownerP) {
              if (Principal.equal(ownerP, ticket.sitterId)) { sitterProfileId := id };
            };
            case (null) {};
          };
        };

        let snap = "{\"ticketId\":\"" # ticketId # "\",\"adminPrincipal\":\"" # caller.toText() # "\",\"sitterId\":\"" # ticket.sitterId.toText() # "\",\"grantedAt\":" # now.toText() # "}";
        appendAuditLog(#AdminAccessGranted, "SupportTicket", sitterProfileId, snap, caller);

        // Notify sitter (best-effort)
        let sitterEmailOpt = lookupSitterEmail(ticket.sitterId);
        switch (sitterEmailOpt) {
          case (null) { /* no email */ };
          case (?email) {
            try {
              ignore await EmailClient.sendEmail(
                [email],
                "Admin access granted for your support ticket [" # ticketId # "]",
                EmailTemplates.supportAccessGrantedSitter(ticket.sitterName, ticketId),
              );
            } catch (_) { /* best-effort */ };
          };
        };

        #ok("Access granted for ticket " # ticketId);
      };
    };
  };

  // Admin-only: resolve a support ticket and revoke admin access.
  public shared ({ caller }) func resolveSupportTicket(ticketId : Text, notes : Text) : async { #ok : Text; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can resolve support tickets");
    };
    switch (supportTickets.get(ticketId)) {
      case (null) { return #err("Ticket not found: " # ticketId) };
      case (?ticket) {
        switch (ticket.status) {
          case (#resolved) { return #err("Ticket is already resolved") };
          case (#open) { /* ok to resolve */ };
          case (#adminAccessing) { /* ok to resolve — will also revoke access */ };
        };

        let now : Int = Time.now();
        let updated : SupportTicket.Public = {
          ticket with
          status          = #resolved;
          resolvedAt      = ?now;
          adminNotes      = ?notes;
          accessGrantedAt = null;
          accessRevokedAt = ?now;
        };
        supportTickets.add(ticketId, updated);

        // Find sitter profile ID for audit log
        var sitterProfileId : Nat = 0;
        for ((id, p) in sitters.entries()) {
          switch (p.owner) {
            case (?ownerP) {
              if (Principal.equal(ownerP, ticket.sitterId)) { sitterProfileId := id };
            };
            case (null) {};
          };
        };

        let snapResolved = "{\"ticketId\":\"" # ticketId # "\",\"adminPrincipal\":\"" # caller.toText() # "\",\"sitterId\":\"" # ticket.sitterId.toText() # "\",\"resolvedAt\":" # now.toText() # "}";
        appendAuditLog(#SupportTicketResolved, "SupportTicket", sitterProfileId, snapResolved, caller);

        let snapRevoked = "{\"ticketId\":\"" # ticketId # "\",\"adminPrincipal\":\"" # caller.toText() # "\",\"sitterId\":\"" # ticket.sitterId.toText() # "\",\"revokedAt\":" # now.toText() # "}";
        appendAuditLog(#AdminAccessRevoked, "SupportTicket", sitterProfileId, snapRevoked, caller);

        // Notify sitter (best-effort)
        let sitterEmailOpt = lookupSitterEmail(ticket.sitterId);
        switch (sitterEmailOpt) {
          case (null) { /* no email */ };
          case (?email) {
            try {
              ignore await EmailClient.sendEmail(
                [email],
                "Your support ticket has been resolved [" # ticketId # "]",
                EmailTemplates.supportTicketResolvedSitter(ticket.sitterName, ticketId, notes),
              );
            } catch (_) { /* best-effort */ };
          };
        };

        #ok("Ticket " # ticketId # " resolved and admin access revoked");
      };
    };
  };

  // Returns true if there is an open ticket for this sitter with status #adminAccessing.
  // Used by the frontend and getSitterProfile to gate admin scoped data access.
  public query func hasSupportAccess(sitterPrincipal : Principal) : async Bool {
    supportTickets.values().any(func(t : SupportTicket.Public) : Bool {
      Principal.equal(t.sitterId, sitterPrincipal) and
      (switch (t.status) { case (#adminAccessing) { true }; case (_) { false } })
    })
  };

  // ---------------------------------------------------------------------------
  // Stripe Integration
  // ---------------------------------------------------------------------------
  public query func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  // Returns the Stripe publishable key and price ID for the frontend.
  // These are safe to expose publicly (publishable key is designed for client-side use).
  public query func getStripePublicConfig() : async { publishableKey : Text; priceId : Text; isLiveMode : Bool } {
    let pubKey = if (stripePublishableKeyOverride != "") { stripePublishableKeyOverride } else { stripePublishableKey };
    let price  = if (stripePriceIdOverride != "")        { stripePriceIdOverride }        else { stripePriceId };
    { publishableKey = pubKey; priceId = price; isLiveMode = stripeLiveMode };
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can configure Stripe");
    };
    stripeConfig := ?config;
  };

  // Admin-only: securely update Stripe keys and price ID without a canister redeploy.
  // The secret key is stored in a stable var (override) and used by getStripeConfig().
  // The publishable key and price ID are exposed via getStripePublicConfig() for the frontend.
  // NEVER returns or logs the secret key — only stores it.
  public shared ({ caller }) func updateStripeConfig(
    secretKey      : Text,
    publishableKey : Text,
    priceId        : Text,
    liveMode       : Bool,
  ) : async { #ok; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can update Stripe configuration");
    };
    if (secretKey == "") {
      return #err("Secret key cannot be empty");
    };
    if (publishableKey == "") {
      return #err("Publishable key cannot be empty");
    };
    if (priceId == "") {
      return #err("Price ID cannot be empty");
    };
    stripeSecretKeyOverride      := secretKey;
    stripePublishableKeyOverride := publishableKey;
    stripePriceIdOverride        := priceId;
    stripeLiveMode               := liveMode;
    // Also update the legacy stripeConfig so isStripeConfigured() returns true
    stripeConfig := ?{ secretKey; allowedCountries = ["US"] };
    // Audit log — use SubscriptionRecorded as a proxy for "config updated" since
    // adding new AuditAction variants breaks stable compatibility.
    appendAuditLog(#SubscriptionRecorded, "StripeConfig", 0,
      "{\"action\":\"stripe_config_updated\",\"liveMode\":" # (if liveMode "true" else "false") # "}",
      caller);
    #ok;
  };

  func getStripeConfig() : Stripe.StripeConfiguration {
    // If an override secret key has been set by an admin, use it (live or updated test key).
    if (stripeSecretKeyOverride != "") {
      return { secretKey = stripeSecretKeyOverride; allowedCountries = ["US"] };
    };
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe is not configured. Please set Stripe keys via the admin panel.") };
      case (?config) { config };
    };
  };

  // Admin-only: set the Stripe webhook signing secret.
  // This secret is used to validate Stripe-Signature headers on webhook calls.
  // Obtain it from Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret.
  public shared ({ caller }) func setStripeWebhookSecret(secret : Text) : async { #ok; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can set the webhook secret");
    };
    stripeWebhookSecret := secret;
    appendAuditLog(#SubscriptionRecorded, "StripeConfig", 0,
      "{\"action\":\"webhook_secret_updated\"}",
      caller);
    #ok;
  };

  // Admin-only: set or update the free plan Stripe price ID.
  // This is a reference price ID for the free/lifetime Stripe product — used for record-keeping only.
  // It does NOT trigger any Stripe checkout; free-plan assignment is handled entirely in the backend.
  public shared ({ caller }) func setFreePlanPriceId(priceId : Text) : async { #ok; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can set the free plan price ID");
    };
    stripeFreePlanPriceId := priceId;
    appendAuditLog(#SubscriptionRecorded, "StripeConfig", 0,
      "{\"action\":\"free_plan_price_id_updated\"}",
      caller);
    #ok;
  };

  // Admin query: return the currently configured free plan Stripe price ID.
  public query func getStripeFreePlanPriceId() : async Text {
    stripeFreePlanPriceId;
  };

  // Admin-only: assign a sitter to the free/lifetime plan.
  // Sets isFreePlan = true, isGrandfathered = true (via sitterLicensing), clears freeze.
  // Does NOT call Stripe — this is a backend-only assignment.
  // Sends a subscription confirmed email to notify the sitter.
  public shared ({ caller }) func assignSitterToFreePlan(sitterId : SitterProfile.Id) : async { #ok; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can assign sitters to the free plan");
    };
    switch (sitters.get(sitterId)) {
      case (null) { return #err("Sitter not found") };
      case (?profile) {
        // Update subscription record: isFreePlan = true, unfreeze, mark subscribed
        let existingRecord = switch (subscriptionState.get(sitterId)) {
          case (?r) { r };
          case (null) { SubscriptionLib.emptyRecord() };
        };
        let updated : SubscriptionTypes.SubscriptionRecord = {
          existingRecord with
          isFreePlan   = ?true;
          isFrozen     = false;
          frozenAt     = null;
          isSubscribed = true;
        };
        subscriptionState.add(sitterId, updated);

        // Also set the grandfathered flag so computeStatus() treats them as lifetime
        let existingLicensing = switch (sitterLicensing.get(sitterId)) {
          case (?e) { e };
          case (null) { { isGrandfathered = null } };
        };
        sitterLicensing.add(sitterId, { existingLicensing with isGrandfathered = ?true });

        appendAuditLog(#SubscriptionRecorded, "Subscription", sitterId,
          "{\"action\":\"admin_assigned_free_plan\",\"sitterId\":" # sitterId.toText() # ",\"adminPrincipal\":\"" # caller.toText() # "\"}",
          caller);

        // Send subscription confirmed email (best-effort)
        let sitterEmailOpt : ?Text = switch (profile.owner) {
          case (null) { null };
          case (?ownerPrincipal) {
            switch (userProfiles.get(ownerPrincipal)) {
              case (null) { null };
              case (?up) { up.email };
            };
          };
        };
        switch (sitterEmailOpt) {
          case (null) { /* no email on file */ };
          case (?email) {
            try {
              ignore await EmailClient.sendSubscriptionConfirmedEmail(email, profile.name, appBaseUrl);
            } catch (_) { /* email is best-effort */ };
          };
        };
        #ok;
      };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfig(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    // For backward compat — delegate to subscription checkout so any existing callers still work.
    ignore items; // items param ignored; subscription uses the pre-configured priceId
    ignore caller;
    let activePriceId = if (stripePriceIdOverride != "") { stripePriceIdOverride } else { stripePriceId };
    await Stripe.createSubscriptionCheckoutSession(
      getStripeConfig(),
      caller,
      activePriceId,
      successUrl,
      cancelUrl,
      transform,
    );
  };

  /// Create a proper subscription checkout session using the configured Stripe Price ID.
  /// This is what the sitter portal "Subscribe Now" button should call.
  public shared ({ caller }) func createSubscriptionCheckoutSession(successUrl : Text, cancelUrl : Text) : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in to subscribe");
    };
    let activePriceId = if (stripePriceIdOverride != "") { stripePriceIdOverride } else { stripePriceId };
    await Stripe.createSubscriptionCheckoutSession(
      getStripeConfig(),
      caller,
      activePriceId,
      successUrl,
      cancelUrl,
      transform,
    );
  };

  // Admin-only: freeze a sitter account (non-payment or manual action).
  // Sends a freeze notification email.
  public shared ({ caller }) func freezeSitterAccount(sitterId : SitterProfile.Id) : async { #ok; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can freeze accounts");
    };
    switch (sitters.get(sitterId)) {
      case (null) { return #err("Sitter not found") };
      case (?profile) {
        let now = Time.now();
        let existingRecord = switch (subscriptionState.get(sitterId)) {
          case (?r) { r };
          case (null) { SubscriptionLib.emptyRecord() };
        };
        let updated : SubscriptionTypes.SubscriptionRecord = {
          existingRecord with
          isFrozen = true;
          frozenAt = ?now;
        };
        subscriptionState.add(sitterId, updated);
        appendAuditLog(#AccountFrozen, "Subscription", sitterId,
          "{\"action\":\"account_frozen\",\"sitterId\":" # sitterId.toText() # ",\"frozenAt\":" # now.toText() # "}",
          caller);

        // Send freeze notification email (best-effort)
        let sitterEmailOpt : ?Text = switch (profile.owner) {
          case (null) { null };
          case (?ownerPrincipal) {
            switch (userProfiles.get(ownerPrincipal)) {
              case (null) { null };
              case (?up) { up.email };
            };
          };
        };
        switch (sitterEmailOpt) {
          case (null) { /* no email */ };
          case (?email) {
            try {
              ignore await EmailClient.sendAccountFrozenEmail(email, profile.name, appBaseUrl);
            } catch (_) { /* email is best-effort */ };
          };
        };
        #ok;
      };
    };
  };

  // Admin-only: unfreeze / reactivate a sitter account.
  // Sends a reactivation confirmation email.
  public shared ({ caller }) func unfreezeSitterAccount(sitterId : SitterProfile.Id) : async { #ok; #err : Text } {
    if (not callerIsAdmin(caller)) {
      return #err("Unauthorized: Only admins can reactivate accounts");
    };
    switch (sitters.get(sitterId)) {
      case (null) { return #err("Sitter not found") };
      case (?profile) {
        let now = Time.now();
        let existingRecord = switch (subscriptionState.get(sitterId)) {
          case (?r) { r };
          case (null) { SubscriptionLib.emptyRecord() };
        };
        let updated : SubscriptionTypes.SubscriptionRecord = {
          existingRecord with
          isFrozen = false;
          frozenAt = null;
        };
        subscriptionState.add(sitterId, updated);
        appendAuditLog(#AccountUnfrozen, "Subscription", sitterId,
          "{\"action\":\"account_unfrozen\",\"sitterId\":" # sitterId.toText() # ",\"unfrozenAt\":" # now.toText() # "}",
          caller);

        // Send reactivation email (best-effort)
        let sitterEmailOpt : ?Text = switch (profile.owner) {
          case (null) { null };
          case (?ownerPrincipal) {
            switch (userProfiles.get(ownerPrincipal)) {
              case (null) { null };
              case (?up) { up.email };
            };
          };
        };
        switch (sitterEmailOpt) {
          case (null) { /* no email */ };
          case (?email) {
            try {
              ignore await EmailClient.sendReactivationConfirmationEmail(
                email, profile.name, appBaseUrl # "/#/sitter-dashboard");
            } catch (_) { /* email is best-effort */ };
          };
        };
        #ok;
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Stripe Webhook Handler
  // Handles three event types fired by Stripe:
  //   checkout.session.completed  → activate subscription, store real customer/subscription IDs
  //   invoice.payment_failed      → freeze account, send freeze email
  //   customer.subscription.deleted → freeze account, send freeze email
  //
  // Security: Webhook signature hardening.
  // Full HMAC-SHA256 verification requires an off-chain proxy (the Internet Computer
  // does not have a native HMAC implementation). We implement several guards:
  // 1. Webhook secret must be configured — rejects calls when secret is empty.
  // 2. Stripe-Signature header format validated (t= and v1= must both be present).
  // 3. Timestamp check: extract t= value and reject if >5 minutes old (replay attack prevention).
  // 4. All webhook attempts are logged in the audit trail with outcome.
  // TODO: For full HMAC-SHA256 security, route Stripe webhooks through an off-chain proxy.
  // ---------------------------------------------------------------------------
  public shared func handleStripeWebhook(eventType : Text, payload : Text, stripeSignatureHeader : Text) : async () {
    let nowNs : Int = Time.now();

    // GUARD 1: Webhook secret must be configured
    if (stripeWebhookSecret == "") {
      appendAuditLog(#SubscriptionRecorded, "StripeWebhook", 0,
        "{\"action\":\"webhook_rejected\",\"reason\":\"no_secret_configured\",\"eventType\":\"" # eventType # "\"}",
        Principal.fromText("aaaaa-aa"));
      Runtime.trap("Webhook rejected: No webhook secret is configured. Set the webhook secret via setStripeWebhookSecret() in the admin panel before webhooks will be accepted.");
    };

    // GUARD 2: Stripe-Signature header must be present and non-empty
    if (stripeSignatureHeader == "") {
      appendAuditLog(#SubscriptionRecorded, "StripeWebhook", 0,
        "{\"action\":\"webhook_rejected\",\"reason\":\"missing_signature_header\",\"eventType\":\"" # eventType # "\"}",
        Principal.fromText("aaaaa-aa"));
      Runtime.trap("Webhook rejected: Stripe-Signature header is missing. Ensure webhooks are sent from Stripe with a valid signature.");
    };

    // GUARD 3: Header format must contain t= (timestamp) and v1= (signature)
    let hasTimestamp = stripeSignatureHeader.contains(#text "t=");
    let hasV1 = stripeSignatureHeader.contains(#text "v1=");
    if (not hasTimestamp or not hasV1) {
      appendAuditLog(#SubscriptionRecorded, "StripeWebhook", 0,
        "{\"action\":\"webhook_rejected\",\"reason\":\"invalid_header_format\",\"eventType\":\"" # eventType # "\"}",
        Principal.fromText("aaaaa-aa"));
      Runtime.trap("Webhook rejected: Stripe-Signature header format is invalid (missing t= or v1=).");
    };

    // GUARD 4: Timestamp replay-attack prevention — reject if >5 minutes old.
    // Extract the t= value from the header (format: "t=TIMESTAMP,v1=SIG...")
    // Note: full HMAC-SHA256 of (t + "." + payload) == v1 is not yet possible on ICP.
    let timestampValid : Bool = label tscheck : Bool {
      let parts = stripeSignatureHeader.split(#char ',');
      var tsText : ?Text = null;
      for (part in parts) {
        if (part.size() > 2) {
          let kv = part.split(#char '=');
          switch (kv.next()) {
            case (?k) {
              if (k == "t") {
                switch (kv.next()) {
                  case (?v) { tsText := ?v };
                  case (null) {};
                };
              };
            };
            case (null) {};
          };
        };
      };
      switch (tsText) {
        case (null) { break tscheck false };
        case (?ts) {
          // ts is seconds since epoch from Stripe; Time.now() is nanoseconds
          let tsSecondsOpt : ?Int = do {
            var acc : Int = 0;
            var ok = true;
            for (c in ts.chars()) {
              if (c >= '0' and c <= '9') {
                acc := acc * 10 + (c.toNat32() - '0'.toNat32() : Nat32).toNat();
              } else {
                ok := false;
              };
            };
            if (ok and ts.size() > 0) { ?acc } else { null };
          };
          switch (tsSecondsOpt) {
            case (null) { break tscheck false };
            case (?tsSeconds) {
              let tsNs : Int = tsSeconds * 1_000_000_000;
              let diffNs : Int = nowNs - tsNs;
              let fiveMinNs : Int = 5 * 60 * 1_000_000_000;
              // Accept if within ±5 minutes (allow minor clock skew)
              diffNs >= -fiveMinNs and diffNs <= fiveMinNs
            };
          };
        };
      };
    };

    if (not timestampValid) {
      appendAuditLog(#SubscriptionRecorded, "StripeWebhook", 0,
        "{\"action\":\"webhook_rejected\",\"reason\":\"timestamp_too_old_or_invalid\",\"eventType\":\"" # eventType # "\"}",
        Principal.fromText("aaaaa-aa"));
      Runtime.trap("Webhook rejected: Timestamp in Stripe-Signature header is missing, invalid, or more than 5 minutes old. This may indicate a replay attack.");
    };

    // Log the accepted webhook call
    appendAuditLog(#SubscriptionRecorded, "StripeWebhook", 0,
      "{\"action\":\"webhook_accepted\",\"eventType\":\"" # eventType # "\",\"timestamp\":" # nowNs.toText() # "}",
      Principal.fromText("aaaaa-aa"));

    // Helper: find sitter ID by Stripe customer ID
    func findSitterByCustomerId(customerId : Text) : ?SitterProfile.Id {
      var found : ?SitterProfile.Id = null;
      for ((sid, record) in subscriptionState.entries()) {
        switch (record.stripeCustomerId) {
          case (?cid) { if (cid == customerId) { found := ?sid } };
          case (null) {};
        };
      };
      found;
    };

    // Helper: extract a JSON string field value
    func extractJsonField(json : Text, fieldName : Text) : ?Text {
      let patterns = ["\"" # fieldName # "\":\"", "\"" # fieldName # "\": \""];
      var result : ?Text = null;
      for (pattern in patterns.values()) {
        if (json.contains(#text pattern)) {
          let parts = json.split(#text pattern);
          switch (parts.next()) {
            case (null) {};
            case (?_) {
              switch (parts.next()) {
                case (?after) {
                  switch (after.split(#text "\"").next()) {
                    case (?value) {
                      if (value.size() > 0) { result := ?value };
                    };
                    case (_) {};
                  };
                };
                case (null) {};
              };
            };
          };
        };
      };
      result;
    };

    if (eventType == "checkout.session.completed") {
      // Extract client_reference_id (sitter principal) and customer/subscription IDs
      let clientRefOpt = extractJsonField(payload, "client_reference_id");
      let customerIdOpt = extractJsonField(payload, "customer");
      let subscriptionIdOpt = extractJsonField(payload, "subscription");

      let resolvedOwner : ?Principal = switch (clientRefOpt) {
        case (null) { null };
        case (?ref) {
          try { ?Principal.fromText(ref) } catch (_) { null }
        };
      };

      // Find sitter ID either by principal or by customer ID
      var sitterIdOpt : ?SitterProfile.Id = null;
      switch (resolvedOwner) {
        case (?owner) {
          for ((id, profile) in sitters.entries()) {
            if (profile.owner == ?owner) { sitterIdOpt := ?id };
          };
        };
        case (null) {
          // Try by customer ID
          switch (customerIdOpt) {
            case (?cid) { sitterIdOpt := findSitterByCustomerId(cid) };
            case (null) {};
          };
        };
      };

      switch (sitterIdOpt) {
        case (null) { /* unknown sitter — ignore */ };
        case (?sitterId) {
          let now = Time.now();
          let existingRecord = switch (subscriptionState.get(sitterId)) {
            case (?r) { r };
            case (null) { SubscriptionLib.emptyRecord() };
          };
          let updated : SubscriptionTypes.SubscriptionRecord = {
            existingRecord with
            isSubscribed          = true;
            isFrozen              = false;
            frozenAt              = null;
            subscriptionStartedAt = switch (existingRecord.subscriptionStartedAt) {
              case (null) { ?now };
              case (?t)   { ?t };
            };
            lastPaymentAt        = ?now;
            stripeCustomerId     = switch (customerIdOpt) {
              case (?cid) { ?cid };
              case (null) { existingRecord.stripeCustomerId };
            };
            stripeSubscriptionId = switch (subscriptionIdOpt) {
              case (?sid) { ?sid };
              case (null) { existingRecord.stripeSubscriptionId };
            };
          };
          subscriptionState.add(sitterId, updated);
          appendAuditLog(#SubscriptionRecorded, "Subscription", sitterId,
            "{\"action\":\"webhook_checkout_completed\",\"timestamp\":" # now.toText() # "}",
            Principal.fromText("aaaaa-aa"));

          // Send subscription confirmed email (best-effort)
          switch (sitters.get(sitterId)) {
            case (null) { /* skip */ };
            case (?profile) {
              let emailOpt : ?Text = switch (profile.owner) {
                case (null) { null };
                case (?p) {
                  switch (userProfiles.get(p)) {
                    case (null) { null };
                    case (?up) { up.email };
                  };
                };
              };
              switch (emailOpt) {
                case (null) { /* no email */ };
                case (?email) {
                  try {
                    ignore await EmailClient.sendSubscriptionConfirmedEmail(email, profile.name, appBaseUrl);
                  } catch (_) { /* best-effort */ };
                };
              };
            };
          };
        };
      };

    } else if (eventType == "invoice.payment_failed" or eventType == "customer.subscription.deleted") {
      // Extract customer ID and find the sitter to freeze
      let customerIdOpt = extractJsonField(payload, "customer");
      switch (customerIdOpt) {
        case (null) { /* no customer ID in payload — ignore */ };
        case (?customerId) {
          let sitterIdOpt = findSitterByCustomerId(customerId);
          switch (sitterIdOpt) {
            case (null) { /* unknown customer — ignore */ };
            case (?sitterId) {
              let now = Time.now();
              let existingRecord = switch (subscriptionState.get(sitterId)) {
                case (?r) { r };
                case (null) { SubscriptionLib.emptyRecord() };
              };
              let updated : SubscriptionTypes.SubscriptionRecord = {
                existingRecord with
                isFrozen              = true;
                frozenAt              = ?now;
                isSubscribed          = false;
                stripeSubscriptionId  = null;
              };
              subscriptionState.add(sitterId, updated);
              appendAuditLog(#AccountFrozen, "Subscription", sitterId,
                "{\"action\":\"webhook_" # eventType # "\",\"customerId\":\"" # customerId # "\",\"timestamp\":" # now.toText() # "}",
                Principal.fromText("aaaaa-aa"));

              // Send freeze email (best-effort)
              switch (sitters.get(sitterId)) {
                case (null) { /* skip */ };
                case (?profile) {
                  let emailOpt : ?Text = switch (profile.owner) {
                    case (null) { null };
                    case (?p) {
                      switch (userProfiles.get(p)) {
                        case (null) { null };
                        case (?up) { up.email };
                      };
                    };
                  };
                  switch (emailOpt) {
                    case (null) { /* no email */ };
                    case (?email) {
                      try {
                        ignore await EmailClient.sendAccountFrozenEmail(email, profile.name, appBaseUrl);
                      } catch (_) { /* best-effort */ };
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
    // Unknown event types are silently ignored
  };

  // Confirm a Stripe checkout session after the client is redirected back to the success URL.
  // The frontend calls this with the session_id from the URL query parameter.
  // Verifies with Stripe that payment succeeded, then records the subscription payment
  // and sends a reactivation confirmation email to the sitter.
  public shared ({ caller }) func confirmStripeCheckoutSession(sessionId : Text) : async { #ok : Text; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be logged in");
    };

    // Step 1: Verify the session with Stripe
    let status = try {
      await Stripe.getSessionStatus(getStripeConfig(), sessionId, transform)
    } catch (e) {
      return #err("Stripe verification failed: " # e.message());
    };

        switch (status) {
      case (#failed({ error })) {
        return #err("Stripe session failed: " # error);
      };
      case (#completed({ response = _; userPrincipal })) {
        // Step 2: Resolve sitter ID — use client_reference_id from Stripe if present,
        // otherwise fall back to the calling principal's sitter profile.
        let resolvedOwner : Principal = switch (userPrincipal) {
          case (?principalText) {
            try { Principal.fromText(principalText) } catch (_) { caller }
          };
          case (null) { caller };
        };

        var sitterIdOpt : ?SitterProfile.Id = null;
        for ((id, profile) in sitters.entries()) {
          if (profile.owner == ?resolvedOwner) { sitterIdOpt := ?id };
        };

        let sitterId = switch (sitterIdOpt) {
          case (null) { return #err("No sitter profile found for this account") };
          case (?id) { id };
        };

        // Step 3: Record the subscription payment (clears freeze, sets isSubscribed)
        let existingRecord = switch (subscriptionState.get(sitterId)) {
          case (?r) { r };
          case (null) { SubscriptionLib.emptyRecord() };
        };
        let now = Time.now();
        let updatedRecord : SubscriptionTypes.SubscriptionRecord = {
          existingRecord with
          isSubscribed          = true;
          isFrozen              = false;
          frozenAt              = null;
          subscriptionStartedAt = switch (existingRecord.subscriptionStartedAt) {
            case (null) { ?now };
            case (?t)   { ?t };
          };
          lastPaymentAt        = ?now;
          // Preserve real Stripe customer/subscription IDs if already set by webhook.
          // Do NOT overwrite with the session ID — the webhook will store real cus_/sub_ IDs.
          stripeCustomerId     = existingRecord.stripeCustomerId;
          stripeSubscriptionId = existingRecord.stripeSubscriptionId;
        };
        subscriptionState.add(sitterId, updatedRecord);
        appendAuditLog(#SubscriptionRecorded, "Subscription", sitterId,
          "{\"action\":\"checkout_confirmed\",\"sessionId\":\"" # sessionId # "\",\"timestamp\":" # now.toText() # "}",
          caller);

        // Step 4: Send reactivation confirmation email (best-effort)
        switch (sitters.get(sitterId)) {
          case (null) { /* skip email */ };
          case (?sitterProfile) {
            let sitterEmailOpt : ?Text = switch (sitterProfile.owner) {
              case (null) { null };
              case (?ownerPrincipal) {
                switch (userProfiles.get(ownerPrincipal)) {
                  case (null) { null };
                  case (?up) { up.email };
                };
              };
            };
            switch (sitterEmailOpt) {
              case (null) { /* no email on file */ };
              case (?email) {
                try {
                  ignore await EmailClient.sendReactivationConfirmationEmail(
                    email,
                    sitterProfile.name,
                    appBaseUrl # "/#/sitter-dashboard",
                  );
                } catch (_) { /* email is best-effort */ };
              };
            };
          };
        };

        #ok("Subscription activated successfully");
      };
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // ---------------------------------------------------------------------------
  // sendRecurringBookingEmails
  // Fire-and-forget email sender called by the frontend after createRecurringBookingGroup
  // returns successfully.  Looks up the sitter's email from userProfiles and sends:
  //   • clientRecurringBookingReceived → to client
  //   • sitterRecurringBookingAlert    → to sitter
  // ---------------------------------------------------------------------------
  public shared func sendRecurringBookingEmails(groupId : Text) : async () {
    let group = switch (bookingGroups.get(groupId)) {
      case (null) { return };
      case (?g)   { g };
    };

    let sitterProfile = switch (sitters.get(group.sitterId)) {
      case (null) { return };
      case (?s)   { s };
    };
    let sitterName = sitterProfile.name;
    let sitterEmail : Text = switch (sitterProfile.owner) {
      case (null) { "" };
      case (?ownerP) {
        switch (userProfiles.get(ownerP)) {
          case (null) { "" };
          case (?up)  { switch (up.email) { case (null) { "" }; case (?e) { e } } };
        };
      };
    };

    // Build occurrence rows from the group's booking IDs
    let occRowsList = List.empty<RecurringEmailLib.OccurrenceRow>();
    let monthNamesLocal : [Text] = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    let dayNamesLocal : [Text] = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    func fmtDate_(ts : Time.Time) : Text {
      let secs : Int = ts / 1_000_000_000;
      let days : Int = secs / 86_400;
      let years : Int = days / 365 + 1970;
      let rem   : Int = days - (years - 1970) * 365;
      let months : Int = rem / 30 + 1;
      let day   : Int = rem - (months - 1) * 30 + 1;
      let mIdx  : Nat = if (months < 1) { 0 } else if (months > 12) { 11 } else { (months - 1).toNat() };
      monthNamesLocal[mIdx] # " " # day.toNat().toText() # ", " # years.toNat().toText()
    };
    func fmtDay_(ts : Time.Time) : Text {
      let nsPerDay : Int = 86_400 * 1_000_000_000;
      let days : Int = ts / nsPerDay;
      let dow : Nat = Int.abs(Int.rem(days + 4, 7));
      if (dow < 7) { dayNamesLocal[dow] } else { "Sunday" }
    };
    let serviceText = group.serviceIds.values().join(", ");
    let perOccCents : Nat = 1500; // default $15 per occurrence; real cost in group is totalCostCents on creation
    let costText_ = "$" # (perOccCents / 100).toText() # "." # (if (perOccCents % 100 < 10) { "0" # (perOccCents % 100).toText() } else { (perOccCents % 100).toText() });

    for (bookingId in group.occurrenceIds.values()) {
      switch (bookingsV4.get(bookingId)) {
        case (null) { /* skip */ };
        case (?b) {
          occRowsList.add({
            bookingId = bookingId;
            date      = fmtDate_(b.startDate);
            dayName   = fmtDay_(b.startDate);
            timeRange = group.startTime # " \u{2013} " # group.endTime;
            service   = serviceText;
            status    = "Pending Confirmation";
            costText  = costText_;
          });
        };
      };
    };
    let occRows = occRowsList.values().toArray();
    let totalCostCents = perOccCents * group.occurrenceIds.size();
    let totalCostText  = "$" # (totalCostCents / 100).toText() # "." # (if (totalCostCents % 100 < 10) { "0" # (totalCostCents % 100).toText() } else { (totalCostCents % 100).toText() });
    let clientUrl = appBaseUrl # "/#/booking-lookup?email=" # group.clientInfo.email # "&tab=current";
    let sitterUrl = appBaseUrl # "/#/sitter-dashboard";

    // Send to client
    if (group.clientInfo.email != "") {
      let clientHtml = RecurringEmailLib.clientRecurringBookingReceived(
        group, occRows, sitterName, sitterEmail, totalCostText, clientUrl
      );
      try {
        ignore await EmailClient.sendEmail(
          [group.clientInfo.email],
          "Your recurring pet care booking request has been received \u{1F4C5}",
          clientHtml,
        );
      } catch (_) { /* email is best-effort */ };
    };

    // Send to sitter
    if (sitterEmail != "") {
      let sitterHtml = RecurringEmailLib.sitterRecurringBookingAlert(
        group, occRows, sitterName, totalCostText, sitterUrl
      );
      try {
        ignore await EmailClient.sendEmail(
          [sitterEmail],
          "New recurring booking request from " # group.clientInfo.name # " \u{1F4C5}",
          sitterHtml,
        );
      } catch (_) { /* email is best-effort */ };
    };
  };

  // ---------------------------------------------------------------------------
  // sendRecurringGroupConfirmedEmails
  // Fire-and-forget: sends the "all confirmed" email to the client.
  // Called by the frontend after confirmRecurringGroup returns #ok.
  // ---------------------------------------------------------------------------
  public shared func sendRecurringGroupConfirmedEmails(groupId : Text) : async () {
    let group = switch (bookingGroups.get(groupId)) {
      case (null) { return };
      case (?g)   { g };
    };
    let sitterProfile = switch (sitters.get(group.sitterId)) {
      case (null) { return };
      case (?s)   { s };
    };
    let sitterName = sitterProfile.name;
    let sitterEmail : Text = switch (sitterProfile.owner) {
      case (null) { "" };
      case (?ownerP) {
        switch (userProfiles.get(ownerP)) {
          case (null) { "" };
          case (?up)  { switch (up.email) { case (null) { "" }; case (?e) { e } } };
        };
      };
    };

    let monthNamesL : [Text] = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    let dayNamesL : [Text] = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    func fmtDate2_(ts : Time.Time) : Text {
      let secs : Int = ts / 1_000_000_000;
      let days : Int = secs / 86_400;
      let years : Int = days / 365 + 1970;
      let rem   : Int = days - (years - 1970) * 365;
      let months : Int = rem / 30 + 1;
      let day   : Int = rem - (months - 1) * 30 + 1;
      let mIdx  : Nat = if (months < 1) { 0 } else if (months > 12) { 11 } else { (months - 1).toNat() };
      monthNamesL[mIdx] # " " # day.toNat().toText() # ", " # years.toNat().toText()
    };
    func fmtDay2_(ts : Time.Time) : Text {
      let nsPerDay : Int = 86_400 * 1_000_000_000;
      let days : Int = ts / nsPerDay;
      let dow : Nat = Int.abs(Int.rem(days + 4, 7));
      if (dow < 7) { dayNamesL[dow] } else { "Sunday" }
    };
    let serviceText2 = group.serviceIds.values().join(", ");
    let perOccCents2 : Nat = 1500;
    let costTxt2 = "$" # (perOccCents2 / 100).toText() # ".00";
    let occRowsList2 = List.empty<RecurringEmailLib.OccurrenceRow>();
    for (bookingId in group.occurrenceIds.values()) {
      switch (bookingsV4.get(bookingId)) {
        case (null) {};
        case (?b) {
          let statusTxt = switch (b.status) {
            case (#confirmed) { "Confirmed" };
            case (#declined)  { "Declined"  };
            case (#cancelled) { "Cancelled" };
            case (_)          { "Pending Confirmation" };
          };
          occRowsList2.add({
            bookingId = bookingId;
            date      = fmtDate2_(b.startDate);
            dayName   = fmtDay2_(b.startDate);
            timeRange = group.startTime # " \u{2013} " # group.endTime;
            service   = serviceText2;
            status    = statusTxt;
            costText  = costTxt2;
          });
        };
      };
    };
    let occRows2 = occRowsList2.values().toArray();
    let totalCents2 = perOccCents2 * group.occurrenceIds.size();
    let totalTxt2   = "$" # (totalCents2 / 100).toText() # ".00";
    let clientUrl2  = appBaseUrl # "/#/booking-lookup?email=" # group.clientInfo.email # "&tab=current";

    if (group.clientInfo.email != "") {
      let html = RecurringEmailLib.clientRecurringGroupConfirmed(
        group, occRows2, sitterName, sitterEmail, group.clientInfo.name, totalTxt2, clientUrl2
      );
      try {
        ignore await EmailClient.sendEmail(
          [group.clientInfo.email],
          sitterName # " confirmed all your recurring appointments! \u{1F389}",
          html,
        );
      } catch (_) { /* best-effort */ };
    };
  };

  // ─── API Usage Tracking (ZIP timezone lookup meter) ───────────────────────

  var apiDailyLimit   : Nat  = 500;
  var apiMonthlyLimit : Nat  = 5000;
  var apiDailyCount   : Nat  = 0;
  var apiMonthlyCount : Nat  = 0;
  var apiCountResetDate : Text = "";

  /// Admin-only: update the daily and monthly call limits.
  public shared ({ caller }) func setApiLimits(daily : Nat, monthly : Nat) : async () {
    assert callerIsAdmin(caller);
    apiDailyLimit   := daily;
    apiMonthlyLimit := monthly;
  };

  /// Returns current usage counts and configured limits.
  public query func getApiUsageLimits() : async {
    dailyLimit   : Nat;
    monthlyLimit : Nat;
    dailyCount   : Nat;
    monthlyCount : Nat;
    resetDate    : Text;
  } {
    {
      dailyLimit   = apiDailyLimit;
      monthlyLimit = apiMonthlyLimit;
      dailyCount   = apiDailyCount;
      monthlyCount = apiMonthlyCount;
      resetDate    = apiCountResetDate;
    };
  };

  /// Records one API call for the given date string (YYYY-MM-DD).
  /// Resets the daily counter whenever the date changes.
  public shared func recordApiCall(date : Text) : async () {
    if (date != apiCountResetDate) {
      apiDailyCount     := 0;
      apiCountResetDate := date;
    };
    apiDailyCount   += 1;
    apiMonthlyCount += 1;
  };

};

