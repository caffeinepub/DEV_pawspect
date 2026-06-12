import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import V2Types "../types/sitter-profile-v2";
import V2Lib "../lib/sitter-profile-v2";

// Public API mixin for the sitter-profile-v2 extended fields.
// Injects the sitterExtended map alongside the existing sitters + bookings maps.
// Exposes:
//   - getSitterExtendedPublic    : query — returns v2 extension public projection
//   - updateSitterProfileV2       : update — partial update of v2 extended fields (auth required)
//   - getSitterBookingStats       : query — computed booking stats for public page
//   - addPhotoConsentLog          : update — append a consent log entry for a photo upload
//   - getSitterPageComponents     : query — returns PageComponentVisibility for a sitter
//   - setSitterPageComponents     : update — save page component visibility toggles
//   - updateCredentialChecklist   : update — save self-reported credential flags (auth required)
mixin (
  sitters : Map.Map<Nat, {
    owner        : ?Principal;
    isActive     : Bool;
    id           : Nat;
    name         : Text;
    bio          : Text;
    services     : [Text];
    hourlyRate   : Nat;
    location     : Text;
    photoUrl     : Text;
    phone        : Text;
    rating       : Float;
    reviewCount  : Nat;
    serviceRates : [{ service : Text; ratePerHour : Nat }];
    birthdate    : ?Int;
    isAnonymized : ?Bool;
  }>,
  bookings : Map.Map<Nat, {
    id          : Nat;
    sitterIds   : [Nat];
    clientEmail : Text;
    clientPhone : Text;
    clientName  : Text;
    status      : { #pending; #confirmed; #completed; #cancelled; #declined };
    pets        : [{ petName : Text; petType : Text; breed : ?Text; petNotes : ?Text }];
    services    : [Text];
    startDate   : Int;
    endDate     : Int;
    notes       : Text;
    createdAt   : Int;
    isRecurring : Bool;
    recurrencePattern     : ?{ #weekly; #biweekly; #monthly };
    recurrenceEndDate     : ?Int;
    paymentSessionId      : ?Text;
    stripePaymentIntentId : ?Text;
    tip                   : ?Nat;
    schedule              : ?[{ date : Int; slots : [{ startTime : Int; endTime : Int }] }];
    serviceSchedule       : ?[{
      date  : Text;
      slots : [{
        service         : Text;
        sitterId        : Nat;
        startTime       : Text;
        endTime         : Text;
        ratePerHour     : Nat;
        durationMinutes : Nat;
      }];
    }];
    declineReason       : ?Text;
    alternativeWindows  : ?[{ date : Text; time : Text; duration : Text }];
    agreements          : ?{ terms : Bool; privacy : Bool; communications : Bool; callRequest : Bool; cancellationPolicy : Bool; nonEmploymentAck : Bool; termsVersion : Nat };
    isAdHoc : Bool;
    adHocClientContact : ?Text;
  }>,
  sitterExtended : Map.Map<Nat, V2Types.SitterExtendedData>,
) {

  /// Public query — returns the v2 extended public fields for a sitter.
  /// Returns null when no v2 data has been saved yet (new sitters).
  public query func getSitterExtendedPublic(sitterId : Nat) : async ?V2Types.SitterPublicV2Extension {
    switch (sitterExtended.get(sitterId)) {
      case (null)    { null };
      case (?data)   { ?data.toPublicExtension() };
    };
  };

  /// Authenticated update — sitter or admin may write v2 extended fields.
  /// All fields in the update are optional; unset fields preserve existing values.
  public shared ({ caller }) func updateSitterProfileV2(update : V2Types.SitterProfileV2Update) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be logged in");
    };
    // Verify the caller is either the profile owner or an admin.
    // Admin check is done by looking at the caller's role via sitters map ownership.
    let sitterOpt = sitters.get(update.sitterId);
    let isOwner = switch (sitterOpt) {
      case (null)    { false };
      case (?sitter) { sitter.owner == ?caller };
    };
    // For admin verification we check all sitters — if the caller owns any sitter profile
    // that doesn't match, they're not automatically admin here. Instead we rely on the
    // mixin not having a direct access-control reference, so we allow admins by checking
    // if the caller is authorized: either they own the sitter profile, or we accept the call.
    // Strict rule: only the profile owner may call this function from the mixin level.
    if (not isOwner) {
      // Allow admin principals by checking if they have any sitter record with admin status.
      // Since we don't have the accessControlState here, we use a simple ownership check.
      // Admins update via their own principal — if they need to update another sitter's profile
      // they should have the sitter's owner principal. This is the safest default.
      return #err("Unauthorized: Only the profile owner can update extended profile fields");
    };

    let existing = switch (sitterExtended.get(update.sitterId)) {
      case (null)  { V2Lib.defaultExtended() };
      case (?data) { data };
    };
    let updated = V2Lib.applyExtendedUpdate(existing, update);
    sitterExtended.add(update.sitterId, updated);
    #ok;
  };

  /// Public query — computes and returns booking stats for the sitter's public page.
  /// totalBookings, uniqueClients, repeatClients, completedVisits — all derived from
  /// the live bookings map, no extra stored state required.
  public query func getSitterBookingStats(sitterId : Nat) : async V2Types.SitterBookingStats {
    // Build the flat tuple array expected by computeBookingStats
    let tuples = bookings.values().toArray().map(
      func(b) : ([Nat], Text, Text, { #pending; #confirmed; #completed; #cancelled; #declined }) {
        (b.sitterIds, b.clientEmail, b.clientPhone, b.status)
      }
    );
    V2Lib.computeBookingStats(sitterId, tuples);
  };

  /// Authenticated update — append a three-part photo consent log entry.
  /// All three consent booleans must be true; the call is rejected otherwise.
  /// Called immediately after a successful object-storage upload.
  public shared ({ caller }) func addPhotoConsentLog(
    sitterId  : Nat,
    photoUrl  : Text,
    consent1  : Bool,
    consent2  : Bool,
    consent3  : Bool,
  ) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be logged in");
    };
    // Validate all three consents
    if (not consent1 or not consent2 or not consent3) {
      return #err("All three consent acknowledgements must be accepted before uploading a photo");
    };
    // Verify caller is the sitter
    let isOwner = switch (sitters.get(sitterId)) {
      case (null)    { return #err("Sitter not found") };
      case (?sitter) { sitter.owner == ?caller };
    };
    if (not isOwner) {
      return #err("Unauthorized: Only the sitter can log photo consent for their own profile");
    };

    let entry : V2Types.PhotoConsentLog = {
      uploadedAt = Time.now();
      sitterId;
      photoUrl;
      consent1;
      consent2;
      consent3;
    };

    let existing = switch (sitterExtended.get(sitterId)) {
      case (null)  { V2Lib.defaultExtended() };
      case (?data) { data };
    };
    let updated = V2Lib.appendConsentLog(existing, entry);
    sitterExtended.add(sitterId, updated);
    #ok;
  };

  /// Public query — returns the PageComponentVisibility record for a sitter.
  /// Returns null when not yet configured (all sections visible by default).
  public query func getSitterPageComponents(sitterId : Nat) : async ?V2Types.PageComponentVisibility {
    switch (sitterExtended.get(sitterId)) {
      case (null)    { null };
      case (?data)   { data.pageComponents };
    };
  };

  /// Authenticated update — saves the page component visibility toggles.
  /// Only the sitter themselves may change their own page layout.
  public shared ({ caller }) func setSitterPageComponents(
    sitterId   : Nat,
    components : V2Types.PageComponentVisibility,
  ) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be logged in");
    };
    let isOwner = switch (sitters.get(sitterId)) {
      case (null)    { return #err("Sitter not found") };
      case (?sitter) { sitter.owner == ?caller };
    };
    if (not isOwner) {
      return #err("Unauthorized: Only the sitter can configure their own page components");
    };

    let existing = switch (sitterExtended.get(sitterId)) {
      case (null)  { V2Lib.defaultExtended() };
      case (?data) { data };
    };
    let updated = { existing with pageComponents = ?components };
    sitterExtended.add(sitterId, updated);
    #ok;
  };

  /// Public query — returns the self-reported credential checklist for a sitter.
  /// IMPORTANT: These values are self-reported and NOT verified by Pawspect.
  /// Pawspect is a software platform only and makes no representation as to the
  /// accuracy, completeness, or current status of any credential claim.
  public query func getSitterCredentials(sitterId : Nat) : async ?V2Types.CredentialChecklist {
    switch (sitterExtended.get(sitterId)) {
      case (null)  { null };
      case (?data) { data.credentialChecklist };
    };
  };

  /// Authenticated update — saves the self-reported professional credential flags.
  /// Only the sitter themselves may update their own credential checklist.
  /// DISCLAIMER: All credential flags are self-reported. Pawspect does not verify,
  /// endorse, or guarantee any credential claim. All professional obligations
  /// (licensing, insurance, background checks, etc.) are solely between the sitter
  /// and applicable authorities. Pawspect provides this field as an informational
  /// tool only and accepts no liability for inaccurate or outdated information.
  public shared ({ caller }) func updateCredentialChecklist(
    sitterId    : Nat,
    credentials : V2Types.CredentialChecklist,
  ) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be logged in");
    };
    let isOwner = switch (sitters.get(sitterId)) {
      case (null)    { return #err("Sitter not found") };
      case (?sitter) { sitter.owner == ?caller };
    };
    if (not isOwner) {
      return #err("Unauthorized: Only the sitter can update their own credential checklist");
    };

    let existing = switch (sitterExtended.get(sitterId)) {
      case (null)  { V2Lib.defaultExtended() };
      case (?data) { data };
    };
    let updated = { existing with credentialChecklist = ?credentials };
    sitterExtended.add(sitterId, updated);
    #ok;
  };

  /// Public query — returns eligible sitters for the selection step with enriched
  /// analytics fields beyond what getSittersNearZip provides.
  /// Returns all the same fields as getSittersNearZip PLUS:
  ///   - bookingsCompleted  : Nat    — confirmed + completed bookings for this sitter
  ///   - repeatClientRate   : Nat    — 0-100 % of clients who booked 2+ times (0 if < 3 clients)
  ///   - credentialsChecklist : { ... } — self-reported credential flags (all false by default)
  ///   - memberSince        : ?Int   — null (creation timestamp not yet stored on sitter records)
  ///
  /// IMPORTANT: credentialsChecklist values are self-reported by sitters.
  /// Pawspect does not verify any credential claim. All professional obligations
  /// are solely between the sitter and applicable authorities.
  public query func getSittersForSelection(clientZip : Text) : async [{
    id                  : Nat;
    name                : Text;
    bio                 : Text;
    services            : [Text];
    hourlyRate          : Nat;
    location            : Text;
    photoUrl            : Text;
    rating              : Float;
    reviewCount         : Nat;
    isActive            : Bool;
    owner               : ?Principal;
    serviceRates        : [{ service : Text; ratePerHour : Nat }];
    birthdate           : ?Int;
    isAnonymized        : ?Bool;
    serviceRadius       : ?Nat;
    serviceZip          : ?Text;
    acceptingNewClients : ?Bool;
    bookingsCompleted   : Nat;
    repeatClientRate    : Nat;
    credentialsChecklist : {
      hasBusinessLicense         : ?Bool;
      isInsuredAndBonded         : ?Bool;
      hasBackgroundCheck         : ?Bool;
      hasReferences              : ?Bool;
      usesServiceAgreement       : ?Bool;
      hasCertificationOrTraining : ?Bool;
      isProfessionalMember       : ?Bool;
    };
    memberSince : ?Int;
  }] {
    // Pre-materialise booking tuples once for the whole query (avoids N×M iteration)
    let bookingTuples = bookings.values().toArray().map(
      func(b) : ([Nat], Text, Text, { #pending; #confirmed; #completed; #cancelled; #declined }) {
        (b.sitterIds, b.clientEmail, b.clientPhone, b.status)
      }
    );

    let result = List.empty<{
      id                  : Nat;
      name                : Text;
      bio                 : Text;
      services            : [Text];
      hourlyRate          : Nat;
      location            : Text;
      photoUrl            : Text;
      rating              : Float;
      reviewCount         : Nat;
      isActive            : Bool;
      owner               : ?Principal;
      serviceRates        : [{ service : Text; ratePerHour : Nat }];
      birthdate           : ?Int;
      isAnonymized        : ?Bool;
      serviceRadius       : ?Nat;
      serviceZip          : ?Text;
      acceptingNewClients : ?Bool;
      bookingsCompleted   : Nat;
      repeatClientRate    : Nat;
      credentialsChecklist : {
        hasBusinessLicense         : ?Bool;
        isInsuredAndBonded         : ?Bool;
        hasBackgroundCheck         : ?Bool;
        hasReferences              : ?Bool;
        usesServiceAgreement       : ?Bool;
        hasCertificationOrTraining : ?Bool;
        isProfessionalMember       : ?Bool;
      };
      memberSince : ?Int;
    }>();

    for ((sitterId, sitter) in sitters.entries()) {
      if (not sitter.isActive) { /* skip */ } else if (sitter.isAnonymized == ?true) { /* skip */ } else {
        let extData = switch (sitterExtended.get(sitterId)) {
          case (null)  { V2Lib.defaultExtended() };
          case (?data) { data };
        };

        if (V2Lib.sitterCoversZip(extData, sitter.location, clientZip)) {
          let (completed, repeatRate) = V2Lib.computeSelectionStats(sitterId, bookingTuples);

          let checklist = switch (extData.credentialChecklist) {
            case (?cl) { cl };
            case (null) { V2Lib.defaultCredentialChecklist() };
          };

          result.add({
            id                  = sitter.id;
            name                = sitter.name;
            bio                 = sitter.bio;
            services            = sitter.services;
            hourlyRate          = sitter.hourlyRate;
            location            = sitter.location;
            photoUrl            = sitter.photoUrl;
            rating              = sitter.rating;
            reviewCount         = sitter.reviewCount;
            isActive            = sitter.isActive;
            owner               = sitter.owner;
            serviceRates        = sitter.serviceRates;
            birthdate           = sitter.birthdate;
            isAnonymized        = sitter.isAnonymized;
            serviceRadius       = extData.serviceRadius;
            serviceZip          = extData.serviceZip;
            acceptingNewClients = extData.acceptingNewClients;
            bookingsCompleted   = completed;
            repeatClientRate    = repeatRate;
            credentialsChecklist = {
              hasBusinessLicense         = checklist.hasBusinessLicense;
              isInsuredAndBonded         = checklist.isInsuredAndBonded;
              hasBackgroundCheck         = checklist.hasBackgroundCheck;
              hasReferences              = checklist.hasReferences;
              usesServiceAgreement       = checklist.usesServiceAgreement;
              hasCertificationOrTraining = checklist.hasCertificationOrTraining;
              isProfessionalMember       = checklist.isProfessionalMember;
            };
            memberSince = null;
          });
        };
      };
    };

    result.values().toArray();
  };

  /// Public query — returns all active sitters whose service area covers the
  /// given client zip code, filtered by each sitter's configured service radius.
  /// Sitters without a serviceZip default to Boulder (80304) with a 10-mile radius.
  /// Sitters with a zip not in our coordinate map are always included (graceful degradation).
  /// Only active, non-anonymized sitters are returned. Phone is stripped from output.
  public query func getSittersNearZip(clientZip : Text, _radiusMiles : Nat) : async [{
    id           : Nat;
    name         : Text;
    bio          : Text;
    services     : [Text];
    hourlyRate   : Nat;
    location     : Text;
    photoUrl     : Text;
    rating       : Float;
    reviewCount  : Nat;
    isActive     : Bool;
    owner        : ?Principal;
    serviceRates : [{ service : Text; ratePerHour : Nat }];
    birthdate    : ?Int;
    isAnonymized : ?Bool;
    serviceRadius : ?Nat;
    serviceZip    : ?Text;
    acceptingNewClients : ?Bool;
  }] {
    // Ignore caller-supplied radius; each sitter defines their own radius preference
    ignore _radiusMiles;

    let result = List.empty<{
      id           : Nat;
      name         : Text;
      bio          : Text;
      services     : [Text];
      hourlyRate   : Nat;
      location     : Text;
      photoUrl     : Text;
      rating       : Float;
      reviewCount  : Nat;
      isActive     : Bool;
      owner        : ?Principal;
      serviceRates : [{ service : Text; ratePerHour : Nat }];
      birthdate    : ?Int;
      isAnonymized : ?Bool;
      serviceRadius : ?Nat;
      serviceZip    : ?Text;
      acceptingNewClients : ?Bool;
    }>();

    for ((sitterId, sitter) in sitters.entries()) {
      // Only active, non-anonymized sitters
      if (not sitter.isActive) { /* skip */ } else if (sitter.isAnonymized == ?true) { /* skip */ } else {
        let extData = switch (sitterExtended.get(sitterId)) {
          case (null)  { V2Lib.defaultExtended() };
          case (?data) { data };
        };

        // Check if this sitter covers the client zip
        if (V2Lib.sitterCoversZip(extData, sitter.location, clientZip)) {
          result.add({
            id           = sitter.id;
            name         = sitter.name;
            bio          = sitter.bio;
            services     = sitter.services;
            hourlyRate   = sitter.hourlyRate;
            location     = sitter.location;
            photoUrl     = sitter.photoUrl;
            rating       = sitter.rating;
            reviewCount  = sitter.reviewCount;
            isActive     = sitter.isActive;
            owner        = sitter.owner;
            serviceRates = sitter.serviceRates;
            birthdate    = sitter.birthdate;
            isAnonymized = sitter.isAnonymized;
            serviceRadius = extData.serviceRadius;
            serviceZip    = extData.serviceZip;
            acceptingNewClients = extData.acceptingNewClients;
          });
        };
      };
    };

    result.values().toArray();
  };
};
