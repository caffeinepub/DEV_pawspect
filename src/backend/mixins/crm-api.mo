import Map      "mo:core/Map";
import List     "mo:core/List";
import Int      "mo:core/Int";
import Time     "mo:core/Time";
import Principal "mo:core/Principal";
import CRMTypes "../types/crm-deals";
import CRMLib   "../lib/crm-deals";
import EmailClient "../email/EmailClient";
import EmailTemplates "../email/EmailTemplates";
import SubscriptionTypes "../types/subscription";

// Public API mixin for the CRM deal-offer / coupon domain.
// Receives the dealOffers map, sitters map, bookings map, and payments map as injected state.
mixin (
  dealOffers : Map.Map<Text, CRMTypes.DealOffer>,
  dealOfferCounter : { var value : Nat },
  sitters : Map.Map<Nat, {
    id : Nat;
    name : Text;
    owner : ?Principal;
    isActive : Bool;
    bio : Text;
    services : [Text];
    hourlyRate : Nat;
    location : Text;
    photoUrl : Text;
    phone : Text;
    rating : Float;
    reviewCount : Nat;
    serviceRates : [{ service : Text; ratePerHour : Nat }];
    birthdate : ?Int;
    isAnonymized : ?Bool;
  }>,
  bookings : Map.Map<Nat, {
    id : Nat;
    sitterIds : [Nat];
    clientEmail : Text;
    clientPhone : Text;
    clientName : Text;
    status : { #pending; #confirmed; #completed; #cancelled; #declined };
    pets : [{ petName : Text; petType : Text; breed : ?Text; petNotes : ?Text }];
    services : [Text];
    startDate : Int;
    endDate : Int;
    notes : Text;
    createdAt : Int;
    isRecurring : Bool;
    recurrencePattern : ?{ #weekly; #biweekly; #monthly };
    recurrenceEndDate : ?Int;
    paymentSessionId : ?Text;
    stripePaymentIntentId : ?Text;
    tip : ?Nat;
    schedule : ?[{ date : Int; slots : [{ startTime : Int; endTime : Int }] }];
    serviceSchedule : ?[{
      date : Text;
      slots : [{
        service : Text;
        sitterId : Nat;
        startTime : Text;
        endTime : Text;
        ratePerHour : Nat;
        durationMinutes : Nat;
      }];
    }];
    declineReason : ?Text;
    alternativeWindows : ?[{ date : Text; time : Text; duration : Text }];
    agreements : ?{ terms : Bool; privacy : Bool; communications : Bool; callRequest : Bool; cancellationPolicy : Bool; nonEmploymentAck : Bool; termsVersion : Nat };
    isAdHoc : Bool;
    adHocClientContact : ?Text;
  }>,
  payments : Map.Map<Nat, {
    bookingId : Nat;
    totalAmount : Nat;
    status : { #pending; #paid; #refunded };
    method : { #stripe; #manual };
    notes : ?Text;
    stripePaymentIntentId : ?Text;
    manualConfirmedBy : ?Principal;
    confirmedAt : ?Int;
    splits : [{ sitterId : Nat; amount : Nat; paid : Bool }];
    paidDate : ?Text;
    discountPercent : ?Nat;
    discountAmount : ?Nat;
    originalAmount : ?Nat;
    completionNotes : ?Text;
    actualEndTime : ?Int;
    adHocItems : [{ description : Text; amountCents : Int; createdAt : Int }];
    paymentMethodDetails : ?{
      #venmo : { handle : Text };
      #applePayCash : { sitterPhone : Text };
      #cash : { instructions : Text };
    };
  }>,
  subscriptionState : Map.Map<Nat, SubscriptionTypes.SubscriptionRecord>,
  sitterLicensing   : Map.Map<Nat, { isGrandfathered : ?Bool }>,
) {

  let _crmBaseUrl = "https://pawspect.co";

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  func normEmail(email : Text) : Text { email.toLower() };

  // Check if a sitter is frozen (grandfathered sitters are never frozen)
  func isSitterFrozenForCRM(sitterId : Nat) : Bool {
    let isGrandfathered : Bool = switch (sitterLicensing.get(sitterId)) {
      case (?entry) { entry.isGrandfathered == ?true };
      case (null)   { true };
    };
    if (isGrandfathered) { return false };
    switch (subscriptionState.get(sitterId)) {
      case (null) { false };
      case (?r)   { r.isFrozen };
    };
  };

  // ---------------------------------------------------------------------------
  // createDealOffer
  // ---------------------------------------------------------------------------

  /// Create a deal offer and send branded emails to all specified client emails.
  /// Returns the created DealOffer or an error.
  public shared ({ caller }) func createDealOffer(
    sitterId      : Nat,
    discountType  : CRMTypes.DiscountType,
    discountValue : Float,
    description   : Text,
    expirationDate : Int,
    clientEmails  : [Text],
    maxUses       : ?Nat,
  ) : async { #ok : CRMTypes.DealOffer; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be logged in");
    };
    // Verify the caller owns this sitter profile
    switch (sitters.get(sitterId)) {
      case (null) { return #err("Sitter not found") };
      case (?profile) {
        if (profile.owner != ?caller) {
          return #err("Unauthorized: You can only create offers for your own sitter profile");
        };
        // Freeze enforcement: frozen sitters cannot send deal offers
        if (isSitterFrozenForCRM(sitterId)) {
          return #err("Account is suspended. Please reactivate your subscription to send deal offers.");
        };
      };
    };

    if (clientEmails.size() == 0) {
      return #err("At least one client email is required");
    };

    if (discountValue <= 0.0) {
      return #err("Discount value must be greater than zero");
    };

    switch (discountType) {
      case (#percent) {
        if (discountValue > 100.0) {
          return #err("Percentage discount cannot exceed 100%");
        };
      };
      case (#fixed) { /* any positive dollar amount is fine */ };
    };

    let now = Time.now();

    // Generate a unique coupon code using timestamp + incrementing counter
    dealOfferCounter.value += 1;
    let seed = (now.toNat() % 999_983) + dealOfferCounter.value * 31_337;
    let code = CRMLib.generateCouponCode(seed);

    // Normalize client emails
    let normalizedEmails = clientEmails.map(func(e : Text) : Text { normEmail(e) });

    let offer : CRMTypes.DealOffer = {
      id             = code;
      couponCode     = code;
      sitterId;
      discountType;
      discountValue;
      description;
      expirationDate;
      clientEmails   = normalizedEmails;
      sentAt         = now;
      redeemedBy     = [];
      redeemedCount  = 0;
      maxUses;
      isActive       = true;
    };

    dealOffers.add(code, offer);

    // Send branded deal offer email to each client
    let sitterName = switch (sitters.get(sitterId)) {
      case (null) { "Your sitter" };
      case (?s) { s.name };
    };
    let discText = CRMLib.discountText(offer);

    // Format expiration date as a readable string (approximate YYYY-MM-DD)
    let expSeconds = expirationDate / 1_000_000_000;
    let expDays = expSeconds / 86400;
    let expYears = expDays / 365 + 1970;
    let expRemDays = expDays - (expYears - 1970) * 365;
    let expMonths = expRemDays / 30 + 1;
    let expDay = expRemDays - (expMonths - 1) * 30 + 1;
    let expDateStr = expYears.toText() # "-" #
      (if (expMonths < 10) { "0" # expMonths.toText() } else { expMonths.toText() }) # "-" #
      (if (expDay < 10) { "0" # expDay.toText() } else { expDay.toText() });

    let bookingUrl = _crmBaseUrl # "/#/find-sitters";

    for (email in normalizedEmails.values()) {
      // Try to look up the client's name from booking history
      let clientName : Text = switch (bookings.values().find(func(b) : Bool {
        normEmail(b.clientEmail) == email and
          b.sitterIds.any(func(id : Nat) : Bool { id == sitterId })
      })) {
        case (null) { "Valued Client" };
        case (?b)   { b.clientName };
      };

      let html = EmailTemplates.dealOfferEmail(
        clientName,
        sitterName,
        description,
        discText,
        code,
        expDateStr,
        bookingUrl,
      );
      try {
        ignore await EmailClient.sendEmail(
          [email],
          sitterName # " has a special offer for you! " # discText,
          html,
        );
      } catch (_) { /* email is best-effort */ };
    };

    #ok(offer)
  };

  // ---------------------------------------------------------------------------
  // getDealOffersBySitter
  // ---------------------------------------------------------------------------

  /// Returns all deal offers created by the given sitter, newest first.
  public query ({ caller }) func getDealOffersBySitter(sitterId : Nat) : async [CRMTypes.DealOffer] {
    if (caller.isAnonymous()) { return [] };
    // Allow the sitter who owns the profile
    let isOwner = switch (sitters.get(sitterId)) {
      case (null) { false };
      case (?s) { s.owner == ?caller };
    };
    if (not isOwner) { return [] };

    let result = dealOffers.values()
      .filter(func(o : CRMTypes.DealOffer) : Bool { o.sitterId == sitterId })
      .toArray();
    result.sort(func(a : CRMTypes.DealOffer, b : CRMTypes.DealOffer) : { #less; #equal; #greater } {
      Int.compare(b.sentAt, a.sentAt)
    })
  };

  // ---------------------------------------------------------------------------
  // validateCoupon (read-only)
  // ---------------------------------------------------------------------------

  /// Check that a coupon code exists, is active, and has not expired.
  /// Returns the offer with discount details so the frontend can show a preview.
  public query func validateCoupon(couponCode : Text) : async { #ok : CRMTypes.DealOffer; #err : Text } {
    let code = couponCode.toUpper();
    switch (dealOffers.get(code)) {
      case (null) { #err("Coupon code not found") };
      case (?offer) {
        switch (CRMLib.validateOffer(offer)) {
          case (?errMsg) { #err(errMsg) };
          case (null)    { #ok(offer) };
        };
      };
    };
  };

  // ---------------------------------------------------------------------------
  // redeemCoupon
  // ---------------------------------------------------------------------------

  /// Validate and mark a coupon as redeemed by the given client email.
  /// This is called during booking checkout.
  public shared func redeemCoupon(
    couponCode  : Text,
    clientEmail : Text,
  ) : async { #ok : CRMTypes.DealOffer; #err : Text } {
    let code = couponCode.toUpper();
    let normClient = normEmail(clientEmail);

    switch (dealOffers.get(code)) {
      case (null) { return #err("Coupon code not found") };
      case (?offer) {
        // Validate
        switch (CRMLib.validateOffer(offer)) {
          case (?errMsg) { return #err(errMsg) };
          case (null) { /* continue */ };
        };

        // Check if already redeemed by this client
        let alreadyRedeemed = offer.redeemedBy.any(func(e : Text) : Bool { e == normClient });
        if (alreadyRedeemed) {
          return #err("This coupon has already been used by this account");
        };

        // Record redemption
        let newRedeemedBy = offer.redeemedBy.concat([normClient]);
        let updated : CRMTypes.DealOffer = {
          offer with
          redeemedBy    = newRedeemedBy;
          redeemedCount = offer.redeemedCount + 1;
        };
        dealOffers.add(code, updated);
        #ok(updated)
      };
    };
  };

  // ---------------------------------------------------------------------------
  // getSitterClientsForCRM
  // ---------------------------------------------------------------------------

  /// Return deduplicated client records for all bookings where sitterId appears.
  /// Sorted by lastBookingDate descending (most recent first).
  /// Tags: "VIP" (≥3 bookings), "Regular" (2), "New" (1).
  public query ({ caller }) func getSitterClientsForCRM(sitterId : Nat) : async [CRMTypes.CRMClient] {
    if (caller.isAnonymous()) { return [] };
    // Only the owning sitter may call this
    let isOwner = switch (sitters.get(sitterId)) {
      case (null) { false };
      case (?s) { s.owner == ?caller };
    };
    if (not isOwner) { return [] };

    // Aggregate by normalized email
    let clientMap = Map.empty<Text, {
      var clientName      : Text;
      var clientPhone     : Text;
      var bookingCount    : Nat;
      var lastBookingDate : Int;
      var totalSpentCents : Nat;
    }>();

    for ((bookingId, booking) in bookings.entries()) {
      let hasSitter = booking.sitterIds.any(func(id : Nat) : Bool { id == sitterId });
      if (not hasSitter) { /* skip */ } else {
        let emailKey = normEmail(booking.clientEmail);
        if (emailKey == "") { /* skip bookings with no email */ } else {
          // Amount paid (in cents)
          let paidCents : Nat = switch (payments.get(bookingId)) {
            case (null) { 0 };
            case (?p) {
              if (p.status == #paid) { p.totalAmount } else { 0 }
            };
          };

          switch (clientMap.get(emailKey)) {
            case (null) {
              // First entry for this client
              clientMap.add(emailKey, {
                var clientName      = booking.clientName;
                var clientPhone     = booking.clientPhone;
                var bookingCount    = 1;
                var lastBookingDate = booking.createdAt;
                var totalSpentCents = paidCents;
              });
            };
            case (?existing) {
              existing.bookingCount    += 1;
              existing.totalSpentCents += paidCents;
              if (booking.createdAt > existing.lastBookingDate) {
                existing.lastBookingDate := booking.createdAt;
                existing.clientName     := booking.clientName;
                existing.clientPhone    := booking.clientPhone;
              };
            };
          };
        };
      };
    };

    // Convert map to array with tags
    let result = List.empty<CRMTypes.CRMClient>();
    for ((email, data) in clientMap.entries()) {
      let tag = if (data.bookingCount >= 3) { "VIP" } else if (data.bookingCount >= 2) { "Regular" } else { "New" };
      result.add({
        clientName      = data.clientName;
        clientEmail     = email;
        clientPhone     = data.clientPhone;
        bookingCount    = data.bookingCount;
        lastBookingDate = data.lastBookingDate;
        totalSpent      = data.totalSpentCents.toFloat() / 100.0;
        tags            = [tag];
      });
    };

    let arr = result.toArray();
    arr.sort(func(a : CRMTypes.CRMClient, b : CRMTypes.CRMClient) : { #less; #equal; #greater } {
      Int.compare(b.lastBookingDate, a.lastBookingDate)
    })
  };
};
