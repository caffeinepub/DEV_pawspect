// Types for the subscription / trial / account-freeze domain.
// All fields are optional so adding this type is fully backward-compatible
// with existing canister state that has no subscriptionState entries.
module {

  /// Full subscription state record stored per sitter in `subscriptionState` map.
  public type SubscriptionRecord = {
    trialStartedAt         : ?Int;   // nanoseconds; set when sitter profile first created/approved
    isFrozen               : Bool;   // true when account is frozen due to non-payment
    frozenAt               : ?Int;   // nanoseconds; when the account was frozen
    isSubscribed           : Bool;   // true when an active paid subscription is present
    subscriptionStartedAt  : ?Int;   // nanoseconds; first payment recorded
    lastPaymentAt          : ?Int;   // nanoseconds; most recent payment
    stripeCustomerId       : ?Text;  // Stripe customer ID (for billing portal)
    stripeSubscriptionId   : ?Text;  // active Stripe subscription ID
    // Day-25 trial reminder — optional so existing records default to null (= not sent yet)
    trialReminderSent      : ?Bool;  // true once the day-25 reminder email has been sent
    // Trial-expired email — optional flag to send once only when trial expires
    trialExpiredEmailSent  : ?Bool;  // true once the trial-expired email has been sent
    // Free plan flag — optional so existing stable records are backward-compatible (null = false)
    isFreePlan             : ?Bool;  // ?true when admin has assigned sitter to free plan
  };

  /// Rich status returned by getSitterLicenseStatus — backward-compatible superset
  /// of the previous {isGrandfathered; trialActive; isLicensed} shape.
  public type SitterLicenseStatus = {
    isGrandfathered    : Bool;
    trialActive        : Bool;
    isLicensed         : Bool;
    // New fields — safe to add (optional semantics on callers that already exist)
    trialDaysRemaining : ?Nat;   // null if grandfathered or subscribed; 0 if expired
    trialStartedAt     : ?Int;   // nanoseconds
    isFrozen           : Bool;
    isSubscribed       : Bool;
    subscriptionStatus : Text;   // "grandfathered"|"trial"|"active"|"expired"|"frozen"
    // Stripe IDs — null when not yet subscribed; used by billing portal
    stripeCustomerId     : ?Text;
    stripeSubscriptionId : ?Text;
  };
};
