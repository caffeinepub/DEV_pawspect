// Domain logic for CRM deal-offer / coupon system.
// Stateless helper functions — no state owned here.
import Types "../types/crm-deals";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Float "mo:core/Float";

module {

  // ---------------------------------------------------------------------------
  // Coupon code generation
  // Generate a 6-char uppercase alphanumeric code seeded from a nanosecond
  // timestamp + an offer-sequence counter to ensure uniqueness within a single
  // canister tick.
  // ---------------------------------------------------------------------------
  let _alphabet : [Char] = [
    'A','B','C','D','E','F','G','H','J','K',
    'L','M','N','P','Q','R','S','T','U','V',
    'W','X','Y','Z','2','3','4','5','6','7','8','9',
  ];

  public func generateCouponCode(seed : Nat) : Text {
    var s = seed;
    var code = "";
    var i = 0;
    while (i < 6) {
      let idx = s % _alphabet.size();
      code #= Text.fromChar(_alphabet[idx]);
      s := (s / _alphabet.size()) + (s * 31 + 7) % 999_983;
      i += 1;
    };
    "DEAL-" # code
  };

  // ---------------------------------------------------------------------------
  // Helpers to compute discount values for PaymentRecord integration
  // ---------------------------------------------------------------------------

  /// Given a deal offer and the original amount in cents, return the discount
  /// amount in cents and the new total.
  public func applyDiscount(offer : Types.DealOffer, originalCents : Nat) : { discountCents : Nat; newTotalCents : Nat } {
    switch (offer.discountType) {
      case (#percent) {
        let pct = if (offer.discountValue > 100.0) { 100.0 } else { offer.discountValue };
        let discountCents = (originalCents.toFloat() * pct / 100.0).toInt();
        let dc : Nat = if (discountCents < 0) { 0 } else { discountCents.toNat() };
        let newTotal = if (dc >= originalCents) { 0 } else { originalCents - dc };
        { discountCents = dc; newTotalCents = newTotal };
      };
      case (#fixed) {
        let fixedCents = (offer.discountValue * 100.0).toInt();
        let dc : Nat = if (fixedCents < 0) { 0 } else { fixedCents.toNat() };
        let newTotal = if (dc >= originalCents) { 0 } else { originalCents - dc };
        { discountCents = dc; newTotalCents = newTotal };
      };
    };
  };

  /// Human-readable discount string, e.g. "20% off" or "$5.00 off"
  public func discountText(offer : Types.DealOffer) : Text {
    switch (offer.discountType) {
      case (#percent) {
        let pct = offer.discountValue.toInt();
        pct.toText() # "% off"
      };
      case (#fixed) {
        let dollars = offer.discountValue.toInt();
        let cents = ((offer.discountValue - dollars.toFloat()) * 100.0).toInt();
        let centsText = if (cents < 10) { "0" # cents.toText() } else { cents.toText() };
        "$" # dollars.toText() # "." # centsText # " off"
      };
    };
  };

  /// Check if an offer is currently redeemable (active, not expired, uses remaining).
  /// Returns null if OK, or an error message Text.
  public func validateOffer(offer : Types.DealOffer) : ?Text {
    if (not offer.isActive) { return ?"Coupon is no longer active" };
    let now : Int = Time.now();
    if (now > offer.expirationDate) { return ?"Coupon has expired" };
    switch (offer.maxUses) {
      case (null) { /* unlimited */ };
      case (?max) {
        if (offer.redeemedCount >= max) {
          return ?"Coupon has reached its maximum number of uses"
        };
      };
    };
    null
  };
};
