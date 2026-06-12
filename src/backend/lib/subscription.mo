import Types "../types/subscription";
import Time "mo:core/Time";
import Int "mo:core/Int";

// Pure / stateless helpers for subscription domain logic.
// All state is owned by main.mo and injected by callers.
module {
  public type SubscriptionRecord  = Types.SubscriptionRecord;
  public type SitterLicenseStatus = Types.SitterLicenseStatus;

  /// 30 days expressed in nanoseconds.
  let thirtyDaysNs : Int = 2_592_000_000_000_000;
  /// 7-day grace period after cancellation before account freezes.
  public let gracePeriodNs : Int = 604_800_000_000_000;

  /// A new, empty SubscriptionRecord with trialStartedAt set to now.
  public func newRecord() : SubscriptionRecord {
    {
      trialStartedAt         = ?Time.now();
      isFrozen               = false;
      frozenAt               = null;
      isSubscribed           = false;
      subscriptionStartedAt  = null;
      lastPaymentAt          = null;
      stripeCustomerId       = null;
      stripeSubscriptionId   = null;
      trialReminderSent      = null;
      trialExpiredEmailSent  = null;
      isFreePlan             = null;
    };
  };

  /// A blank SubscriptionRecord with no trial date (for lazy init when we need a
  /// default before the caller sets one).
  public func emptyRecord() : SubscriptionRecord {
    {
      trialStartedAt         = null;
      isFrozen               = false;
      frozenAt               = null;
      isSubscribed           = false;
      subscriptionStartedAt  = null;
      lastPaymentAt          = null;
      stripeCustomerId       = null;
      stripeSubscriptionId   = null;
      trialReminderSent      = null;
      trialExpiredEmailSent  = null;
      isFreePlan             = null;
    };
  };

  /// Compute the full license status for a sitter given their grandfathered flag
  /// and their SubscriptionRecord (or null if none exists yet).
  ///
  /// Lazy init: if no record exists the function treats the sitter as having
  /// started their trial right now (trialStartedAt = Time.now() for the purpose of
  /// the response; the CALLER must persist the new record separately if needed).
  public func computeStatus(
    isGrandfatheredFlag : Bool,
    recordOpt : ?SubscriptionRecord,
  ) : SitterLicenseStatus {
    // Grandfathered — short-circuit, always fully licensed, never frozen.
    if (isGrandfatheredFlag) {
      return {
        isGrandfathered      = true;
        trialActive          = false;
        isLicensed           = true;
        trialDaysRemaining   = null;
        trialStartedAt       = null;
        isFrozen             = false;
        isSubscribed         = false;
        subscriptionStatus   = "grandfathered";
        stripeCustomerId     = null;
        stripeSubscriptionId = null;
      };
    };

    let record : SubscriptionRecord = switch (recordOpt) {
      case (?r) { r };
      case (null) { emptyRecord() };
    };

    // Frozen check (non-grandfathered only).
    if (record.isFrozen) {
      return {
        isGrandfathered      = false;
        trialActive          = false;
        isLicensed           = false;
        trialDaysRemaining   = ?0;
        trialStartedAt       = record.trialStartedAt;
        isFrozen             = true;
        isSubscribed         = false;
        subscriptionStatus   = "frozen";
        stripeCustomerId     = record.stripeCustomerId;
        stripeSubscriptionId = record.stripeSubscriptionId;
      };
    };

    // Active paid subscription.
    if (record.isSubscribed) {
      return {
        isGrandfathered      = false;
        trialActive          = false;
        isLicensed           = true;
        trialDaysRemaining   = null;
        trialStartedAt       = record.trialStartedAt;
        isFrozen             = false;
        isSubscribed         = true;
        subscriptionStatus   = "active";
        stripeCustomerId     = record.stripeCustomerId;
        stripeSubscriptionId = record.stripeSubscriptionId;
      };
    };

    // Trial logic.
    let nowNs : Int = Time.now();
    let startNs : Int = switch (record.trialStartedAt) {
      case (?t) { t };
      case (null) { nowNs };   // no record yet → treat as just started
    };

    let elapsedNs : Int = nowNs - startNs;
    if (elapsedNs < thirtyDaysNs) {
      // Still within the 30-day trial window.
      let remainingNs  : Int = thirtyDaysNs - elapsedNs;
      let oneDayNs     : Int = 24 * 60 * 60 * 1_000_000_000;
      // Ceiling division: (remainingNs + oneDayNs - 1) / oneDayNs
      let daysLeft : Nat = ((remainingNs + oneDayNs - 1) / oneDayNs).toNat();
      return {
        isGrandfathered      = false;
        trialActive          = true;
        isLicensed           = false;
        trialDaysRemaining   = ?daysLeft;
        trialStartedAt       = ?startNs;
        isFrozen             = false;
        isSubscribed         = false;
        subscriptionStatus   = "trial";
        stripeCustomerId     = null;
        stripeSubscriptionId = null;
      };
    };

    // Trial expired.
    {
      isGrandfathered      = false;
      trialActive          = false;
      isLicensed           = false;
      trialDaysRemaining   = ?0;
      trialStartedAt       = ?startNs;
      isFrozen             = false;
      isSubscribed         = false;
      subscriptionStatus   = "expired";
      stripeCustomerId     = null;
      stripeSubscriptionId = null;
    };
  };
};
