// Types for the CRM deal-offer / coupon domain.
module {

  public type DiscountType = {
    #percent;  // discountValue is 0–100
    #fixed;    // discountValue is dollar amount (not cents)
  };

  /// A deal offer / coupon created by a sitter and sent to one or more clients.
  public type DealOffer = {
    id              : Text;         // auto-generated "DEAL-XXXXXX"
    couponCode      : Text;         // same as id — kept explicit for clarity
    sitterId        : Nat;          // sitter profile ID who created this offer
    discountType    : DiscountType;
    discountValue   : Float;        // percent (0–100) or fixed dollar amount
    description     : Text;         // sitter's custom message / offer description
    expirationDate  : Int;          // nanoseconds timestamp
    clientEmails    : [Text];       // client emails the offer was sent to
    sentAt          : Int;          // nanoseconds timestamp
    redeemedBy      : [Text];       // client emails that have redeemed
    redeemedCount   : Nat;
    maxUses         : ?Nat;         // null = unlimited
    isActive        : Bool;
  };

  /// Flat client record returned by getSitterClientsForCRM.
  public type CRMClient = {
    clientName      : Text;
    clientEmail     : Text;
    clientPhone     : Text;
    bookingCount    : Nat;
    lastBookingDate : Int;          // nanoseconds timestamp of most recent booking createdAt
    totalSpent      : Float;        // sum of paid PaymentRecord.totalAmount in dollars
    tags            : [Text];       // ["VIP"] | ["Regular"] | ["New"]
  };
};
