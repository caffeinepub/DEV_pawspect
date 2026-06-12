import Types "../types/sitter-profile-v2";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Float "mo:core/Float";

// Domain logic for the sitter-profile-v2 extended fields.
// All functions are pure / stateless helpers — state is owned by main.mo.
// The sitterExtended map (Map<Nat, SitterExtendedData>) is the only new state slice.
module {
  public type SitterExtendedData    = Types.SitterExtendedData;
  public type SitterPublicV2Extension = Types.SitterPublicV2Extension;
  public type SitterProfileV2Update = Types.SitterProfileV2Update;
  public type PageComponentVisibility = Types.PageComponentVisibility;
  public type PhotoConsentLog       = Types.PhotoConsentLog;
  public type SitterBookingStats    = Types.SitterBookingStats;
  public type CredentialChecklist   = Types.CredentialChecklist;

  /// Return a default (all-null) extended record for a brand-new sitter.
  public func defaultExtended() : SitterExtendedData {
    {
      galleryPhotos       = null;
      responseTime        = null;
      petTypesServed      = null;
      certificationsList  = null;
      acceptingNewClients = null;
      pinnedPromoOfferId  = null;
      pageComponents      = null;
      photoConsentLogs    = null;
      credentialChecklist = null;
      bannerUrl           = null;
      serviceRadius       = null;
      serviceZip          = null;
    };
  };

  /// Apply a partial update to an existing (or default) extended record.
  /// Only fields that are not null in the update are overwritten.
  /// ALL fields from SitterProfileV2Update are handled here — this is the
  /// canonical place where profile updates are persisted.
  public func applyExtendedUpdate(
    existing : SitterExtendedData,
    update   : SitterProfileV2Update,
  ) : SitterExtendedData {
    {
      galleryPhotos = switch (update.galleryPhotos) {
        case (null) { existing.galleryPhotos };
        case (?v)   { ?v };
      };
      responseTime = switch (update.responseTime) {
        case (null) { existing.responseTime };
        case (?v)   { ?v };
      };
      petTypesServed = switch (update.petTypesServed) {
        case (null) { existing.petTypesServed };
        case (?v)   { ?v };
      };
      certificationsList = switch (update.certificationsList) {
        case (null) { existing.certificationsList };
        case (?v)   { ?v };
      };
      acceptingNewClients = switch (update.acceptingNewClients) {
        case (null) { existing.acceptingNewClients };
        case (?v)   { ?v };
      };
      pinnedPromoOfferId = switch (update.pinnedPromoOfferId) {
        case (null) { existing.pinnedPromoOfferId };
        case (?v)   { ?v };
      };
      pageComponents = switch (update.pageComponents) {
        case (null) { existing.pageComponents };
        case (?v)   { ?v };
      };
      credentialChecklist = switch (update.credentialChecklist) {
        case (null) { existing.credentialChecklist };
        case (?v)   { ?v };
      };
      bannerUrl = switch (update.bannerUrl) {
        case (null) { existing.bannerUrl };
        case (?v)   { ?v };
      };
      serviceRadius = switch (update.serviceRadius) {
        case (null) { existing.serviceRadius };
        case (?v)   { ?v };
      };
      serviceZip = switch (update.serviceZip) {
        case (null) { existing.serviceZip };
        case (?v)   { ?v };
      };
      // photoConsentLogs are append-only — never overwritten via update
      photoConsentLogs = existing.photoConsentLogs;
    };
  };

  /// Project to the public-safe shape (same fields — no private data in v2 extension).
  public func toPublicExtension(self : SitterExtendedData) : SitterPublicV2Extension {
    {
      galleryPhotos       = self.galleryPhotos;
      responseTime        = self.responseTime;
      petTypesServed      = self.petTypesServed;
      certificationsList  = self.certificationsList;
      acceptingNewClients = self.acceptingNewClients;
      pinnedPromoOfferId  = self.pinnedPromoOfferId;
      pageComponents      = self.pageComponents;
      credentialChecklist = self.credentialChecklist;
      bannerUrl           = self.bannerUrl;
      serviceRadius       = self.serviceRadius;
      serviceZip          = self.serviceZip;
    };
  };

  /// Append a photo consent log entry to an existing extended record.
  /// The photoConsentLogs array is immutable-append — never edited or removed.
  public func appendConsentLog(
    existing : SitterExtendedData,
    entry    : PhotoConsentLog,
  ) : SitterExtendedData {
    let currentLogs : [PhotoConsentLog] = switch (existing.photoConsentLogs) {
      case (null) { [] };
      case (?logs) { logs };
    };
    { existing with photoConsentLogs = ?currentLogs.concat([entry]) };
  };

  /// Compute booking stats for a sitter from a flat array of booking tuples.
  /// booking tuples: (sitterIds, clientEmail, clientPhone, status)
  /// No stored state — computed at query time.
  public func computeBookingStats(
    sitterId : Nat,
    allBookings : [(
      sitterIds   : [Nat],
      clientEmail : Text,
      clientPhone : Text,
      status      : { #pending; #confirmed; #completed; #cancelled; #declined },
    )],
  ) : SitterBookingStats {
    var total         : Nat = 0;
    var completed     : Nat = 0;
    let clientKeys    = Set.empty<Text>();

    for ((sitterIds, clientEmail, clientPhone, status) in allBookings.values()) {
      let hasSitter = sitterIds.any(func(id : Nat) : Bool { id == sitterId });
      if (hasSitter) {
        total += 1;
        switch (status) {
          case (#completed) { completed += 1 };
          case (_) { /* skip */ };
        };
        // Build a normalized client key for unique/repeat detection
        let emailLower = clientEmail.toLower();
        let phoneDigits = Text.fromIter(clientPhone.toIter().filter(
          func(c : Char) : Bool { c >= '0' and c <= '9' }
        ));
        let key = emailLower # "|" # phoneDigits;
        if (key != "|") {
          clientKeys.add(key);
        };
      };
    };

    let uniqueClients = clientKeys.size();

    // Count repeat clients: need to count keys that appear ≥2 times.
    // Since Set only stores unique keys, we need to re-count via a second pass.
    // Use a simple approach: build a count map inline.
    let countMap = Set.empty<Text>();
    var repeatClients : Nat = 0;
    // Track seen-once keys separately
    let seenOnce = Set.empty<Text>();
    for ((sitterIds, clientEmail, clientPhone, _) in allBookings.values()) {
      let hasSitter = sitterIds.any(func(id : Nat) : Bool { id == sitterId });
      if (hasSitter) {
        let emailLower = clientEmail.toLower();
        let phoneDigits = Text.fromIter(clientPhone.toIter().filter(
          func(c : Char) : Bool { c >= '0' and c <= '9' }
        ));
        let key = emailLower # "|" # phoneDigits;
        if (key != "|") {
          if (seenOnce.contains(key)) {
            // Seen at least twice — only count once as a repeat
            if (not countMap.contains(key)) {
              repeatClients += 1;
              countMap.add(key);
            };
          } else {
            seenOnce.add(key);
          };
        };
      };
    };

    {
      totalBookings   = total;
      uniqueClients;
      repeatClients;
      completedVisits = completed;
    };
  };

  /// Return a default all-false CredentialChecklist for sitters with no extended data.
  public func defaultCredentialChecklist() : CredentialChecklist {
    {
      hasBusinessLicense         = ?false;
      isInsuredAndBonded         = ?false;
      hasBackgroundCheck         = ?false;
      hasReferences              = ?false;
      usesServiceAgreement       = ?false;
      hasCertificationOrTraining = ?false;
      isProfessionalMember       = ?false;
    };
  };

  /// Compute bookingsCompleted (confirmed + completed) and repeatClientRate for
  /// a single sitter from the full bookings map values.
  /// Returns (bookingsCompleted, repeatClientRate) where:
  ///   - bookingsCompleted = count of #confirmed | #completed bookings for this sitter
  ///   - repeatClientRate  = % of distinct clients who have 2+ bookings with this sitter
  ///                         (0 when total distinct clients < 3)
  public func computeSelectionStats(
    sitterId    : Nat,
    allBookings : [(
      sitterIds   : [Nat],
      clientEmail : Text,
      clientPhone : Text,
      status      : { #pending; #confirmed; #completed; #cancelled; #declined },
    )],
  ) : (Nat, Nat) {
    var completed : Nat = 0;

    // Count bookings per normalized client key for this sitter
    let seenOnce     = Set.empty<Text>();
    let seenMultiple = Set.empty<Text>();

    for ((sitterIds, clientEmail, clientPhone, status) in allBookings.values()) {
      let hasSitter = sitterIds.any(func(id : Nat) : Bool { id == sitterId });
      if (hasSitter) {
        switch (status) {
          case (#confirmed) { completed += 1 };
          case (#completed) { completed += 1 };
          case (_) {};
        };
        // Build normalized client key
        let emailLower = clientEmail.toLower();
        let phoneDigits = Text.fromIter(clientPhone.toIter().filter(
          func(c : Char) : Bool { c >= '0' and c <= '9' }
        ));
        let key = emailLower # "|" # phoneDigits;
        if (key != "|") {
          if (seenOnce.contains(key)) {
            seenMultiple.add(key);
          } else {
            seenOnce.add(key);
          };
        };
      };
    };

    let totalClients  = seenOnce.size(); // seenOnce holds ALL clients (first occurrence)
    let repeatClients = seenMultiple.size();

    // repeatClientRate: 0 when fewer than 3 total clients (too few to be meaningful)
    let repeatRate : Nat = if (totalClients < 3) {
      0
    } else {
      (repeatClients * 100) / totalClients
    };

    (completed, repeatRate);
  };

  /// Return true when acceptingNewClients is null (default: open for business).
  public func isAcceptingClients(self : SitterExtendedData) : Bool {
    switch (self.acceptingNewClients) {
      case (null)    { true };
      case (?value)  { value };
    };
  };

  // ---------------------------------------------------------------------------
  // ZIP code → lat/lon lookup and Haversine distance calculation.
  // Covers the greater Boulder/Denver/Front Range Colorado area — enough for
  // the initial Pawspect launch market.  Coordinates are approximate centroids.
  // ---------------------------------------------------------------------------

  /// Look up approximate (lat, lon) for a Colorado zip code.
  /// Returns null for unknown zip codes.
  public func zipToLatLon(zip : Text) : ?(Float, Float) {
    // Format: (lat, lon) — all Colorado Front Range area
    switch (zip) {
      // Boulder area
      case "80301" { ?(40.0564, -105.2209) };
      case "80302" { ?(40.0150, -105.2705) };
      case "80303" { ?(39.9907, -105.2318) };
      case "80304" { ?(40.0378, -105.2876) };
      case "80305" { ?(39.9740, -105.2393) };
      case "80310" { ?(40.0150, -105.2705) };
      case "80314" { ?(40.0150, -105.2705) };
      // Longmont
      case "80501" { ?(40.1672, -105.1019) };
      case "80502" { ?(40.1672, -105.1019) };
      case "80503" { ?(40.1500, -105.0667) };
      case "80504" { ?(40.1736, -104.9975) };
      // Louisville / Lafayette
      case "80027" { ?(39.9778, -105.1316) };
      case "80026" { ?(39.9935, -105.0897) };
      // Superior / Broomfield
      case "80021" { ?(39.9202, -105.1186) };
      case "80023" { ?(39.9569, -104.9594) };
      case "80516" { ?(40.0381, -105.0425) };
      // Broomfield
      case "80020" { ?(39.9205, -105.0867) };
      case "80038" { ?(39.9205, -105.0867) };
      // Erie
      case "80516" { ?(40.0497, -105.0469) };
      // Westminster
      case "80030" { ?(39.8366, -105.0372) };
      case "80031" { ?(39.8632, -105.0653) };
      case "80234" { ?(39.9000, -105.0030) };
      case "80235" { ?(39.6600, -105.0720) };
      // Thornton
      case "80229" { ?(39.8919, -104.9594) };
      case "80233" { ?(39.9094, -104.9605) };
      case "80241" { ?(39.9264, -104.9603) };
      // Arvada
      case "80002" { ?(39.8028, -105.0875) };
      case "80003" { ?(39.8278, -105.0611) };
      case "80004" { ?(39.8278, -105.1111) };
      case "80005" { ?(39.8389, -105.1461) };
      case "80007" { ?(39.8644, -105.1906) };
      // Denver
      case "80201" { ?(39.7392, -104.9903) };
      case "80202" { ?(39.7516, -104.9985) };
      case "80203" { ?(39.7256, -104.9842) };
      case "80204" { ?(39.7378, -105.0208) };
      case "80205" { ?(39.7558, -104.9636) };
      case "80206" { ?(39.7256, -104.9453) };
      case "80207" { ?(39.7625, -104.9339) };
      case "80209" { ?(39.6930, -104.9755) };
      case "80210" { ?(39.6725, -104.9672) };
      case "80211" { ?(39.7697, -105.0208) };
      case "80212" { ?(39.7697, -105.0453) };
      case "80214" { ?(39.7311, -105.0650) };
      case "80215" { ?(39.7311, -105.0908) };
      case "80216" { ?(39.7767, -104.9636) };
      case "80218" { ?(39.7256, -104.9636) };
      case "80219" { ?(39.7044, -105.0197) };
      case "80220" { ?(39.7325, -104.9183) };
      case "80221" { ?(39.8075, -105.0131) };
      case "80222" { ?(39.6786, -104.9453) };
      case "80223" { ?(39.7033, -105.0022) };
      case "80224" { ?(39.6864, -104.9172) };
      case "80226" { ?(39.7297, -105.1011) };
      case "80227" { ?(39.6750, -105.0894) };
      case "80228" { ?(39.6739, -105.1408) };
      case "80230" { ?(39.7197, -104.9028) };
      case "80231" { ?(39.6800, -104.8878) };
      case "80236" { ?(39.6672, -105.0417) };
      case "80237" { ?(39.6478, -104.8989) };
      case "80238" { ?(39.7686, -104.8783) };
      case "80239" { ?(39.7656, -104.8597) };
      case "80246" { ?(39.7083, -104.9417) };
      case "80247" { ?(39.7000, -104.9028) };
      case "80249" { ?(39.7919, -104.8322) };
      case "80264" { ?(39.7392, -104.9903) };
      // Aurora
      case "80010" { ?(39.7308, -104.8717) };
      case "80011" { ?(39.7308, -104.8300) };
      case "80012" { ?(39.6956, -104.8528) };
      case "80013" { ?(39.6522, -104.8019) };
      case "80014" { ?(39.6522, -104.8411) };
      case "80015" { ?(39.6072, -104.7878) };
      case "80016" { ?(39.5633, -104.7267) };
      case "80017" { ?(39.7106, -104.8528) };
      case "80018" { ?(39.6950, -104.7528) };
      case "80019" { ?(39.7333, -104.7689) };
      // Lakewood
      case "80226" { ?(39.7217, -105.0878) };
      case "80227" { ?(39.6700, -105.0897) };
      case "80228" { ?(39.6739, -105.1408) };
      case "80232" { ?(39.6942, -105.0644) };
      // Centennial / Englewood / Highlands Ranch
      case "80110" { ?(39.6487, -104.9875) };
      case "80111" { ?(39.6011, -104.8961) };
      case "80112" { ?(39.5636, -104.8875) };
      case "80113" { ?(39.6478, -104.9983) };
      case "80120" { ?(39.6356, -104.9875) };
      case "80121" { ?(39.6094, -104.9672) };
      case "80122" { ?(39.5822, -104.9442) };
      case "80126" { ?(39.5267, -104.9719) };
      case "80127" { ?(39.5417, -105.0706) };
      case "80128" { ?(39.5556, -105.0467) };
      case "80129" { ?(39.5167, -105.0078) };
      case "80130" { ?(39.5394, -104.9208) };
      // Littleton
      case "80123" { ?(39.5961, -105.0608) };
      case "80124" { ?(39.5414, -104.8961) };
      case "80125" { ?(39.4822, -105.0025) };
      case "80160" { ?(39.6133, -105.0203) };
      case "80161" { ?(39.6133, -105.0203) };
      case "80162" { ?(39.6133, -105.0203) };
      case "80163" { ?(39.6133, -105.0203) };
      case "80165" { ?(39.6133, -105.0203) };
      case "80166" { ?(39.6133, -105.0203) };
      // Castle Rock / Castle Pines / Parker
      case "80104" { ?(39.3722, -104.8561) };
      case "80108" { ?(39.4450, -104.8722) };
      case "80109" { ?(39.3800, -104.8739) };
      case "80116" { ?(39.3186, -104.7228) };
      case "80117" { ?(39.2664, -104.5944) };
      case "80134" { ?(39.5197, -104.7561) };
      case "80138" { ?(39.5175, -104.6922) };
      // Fort Collins
      case "80521" { ?(40.5853, -105.0844) };
      case "80522" { ?(40.5853, -105.0844) };
      case "80523" { ?(40.5668, -105.0844) };
      case "80524" { ?(40.5997, -105.0608) };
      case "80525" { ?(40.5447, -105.0206) };
      case "80526" { ?(40.5261, -105.0731) };
      case "80527" { ?(40.5261, -105.0731) };
      case "80528" { ?(40.4986, -104.9939) };
      // Greeley
      case "80631" { ?(40.4233, -104.7091) };
      case "80634" { ?(40.4100, -104.7544) };
      // Loveland
      case "80537" { ?(40.3978, -105.0750) };
      case "80538" { ?(40.4233, -105.0717) };
      case "80539" { ?(40.3978, -105.0750) };
      // Golden / Jefferson County
      case "80401" { ?(39.7556, -105.2211) };
      case "80403" { ?(39.7750, -105.2217) };
      case "80419" { ?(39.7556, -105.2211) };
      // Wheat Ridge
      case "80033" { ?(39.7686, -105.0775) };
      case "80034" { ?(39.7686, -105.0775) };
      // Commerce City / Brighton
      case "80022" { ?(39.8097, -104.9347) };
      case "80601" { ?(39.9858, -104.8181) };
      case "80602" { ?(39.9497, -104.8247) };
      case "80603" { ?(40.0003, -104.8319) };
      // Fallback: unknown zip
      case _ { null };
    };
  };

  /// Haversine distance in miles between two lat/lon points.
  /// Uses Float arithmetic — sufficient precision for radius filtering.
  public func haversineDistanceMiles(lat1 : Float, lon1 : Float, lat2 : Float, lon2 : Float) : Float {
    let earthRadiusMiles : Float = 3958.8;
    let toRad : Float -> Float = func(deg) { deg * Float.pi / 180.0 };

    let dLat = toRad(lat2 - lat1);
    let dLon = toRad(lon2 - lon1);
    let rLat1 = toRad(lat1);
    let rLat2 = toRad(lat2);

    let sinDLat = Float.sin(dLat / 2.0);
    let sinDLon = Float.sin(dLon / 2.0);

    let a = sinDLat * sinDLat + Float.cos(rLat1) * Float.cos(rLat2) * sinDLon * sinDLon;
    let c = 2.0 * Float.arctan2(Float.sqrt(a), Float.sqrt(1.0 - a));
    earthRadiusMiles * c;
  };

  /// Return true if the sitter's service area covers the given client zip.
  /// A sitter with no serviceZip configured is assumed to be in the Boulder area
  /// (80304) with a 10-mile default radius — so new sitters are always visible.
  public func sitterCoversZip(
    sitterExtended : SitterExtendedData,
    sitterLocation : Text,  // SitterProfile.Public.location (zip fallback)
    clientZip      : Text,
  ) : Bool {
    // Determine the sitter's base zip (prefer serviceZip, fall back to location field)
    let sitterZip : Text = switch (sitterExtended.serviceZip) {
      case (?z) { z };
      case (null) {
        // Fall back to the profile location field if it looks like a zip (5 digits)
        if (sitterLocation.size() == 5) { sitterLocation } else { "80304" };
      };
    };

    // Determine radius (default 10 miles when not set)
    let radiusMiles : Float = switch (sitterExtended.serviceRadius) {
      case (?r) { r.toFloat() };
      case (null) { 10.0 };
    };

    // If either zip is unknown we can't compute distance — include the sitter
    switch (zipToLatLon(sitterZip), zipToLatLon(clientZip)) {
      case (?sitterCoords, ?clientCoords) {
        let dist = haversineDistanceMiles(
          sitterCoords.0, sitterCoords.1,
          clientCoords.0, clientCoords.1,
        );
        dist <= radiusMiles;
      };
      case (_, _) { true }; // unknown zip → include sitter (graceful degradation)
    };
  };
};
