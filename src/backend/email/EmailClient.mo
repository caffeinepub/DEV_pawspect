// SAFETY: All functions in this module must be non-fatal. If the integrations canister is unavailable or
// INTEGRATIONS_CANISTER_ID is not set, all functions must return silently (no-op). Never trap.
// Email is best-effort — the canister must never stop due to email failures.

import Cycles "mo:core/Cycles";
import Principal "mo:core/Principal";
import Prim "mo:⛔";
import EmailService "EmailService";
import EmailTemplates "EmailTemplates";

module {
  public type SendResult = {
    #ok;
    #err : Text;
  };

  public func sendEmail(
    to : [Text],
    subject : Text,
    htmlBody : Text,
  ) : async SendResult {
    // Resolve the integrations canister ID from the environment variable.
    // If not set, silently succeed (no-op) — NEVER trap.
    let canisterIdOpt : ?Principal = switch (Prim.envVar<system>("INTEGRATIONS_CANISTER_ID")) {
      case (null) { null };
      case (?id) {
        try { ?Principal.fromText(id) } catch (_) { null }
      };
    };

    let canisterId = switch (canisterIdOpt) {
      case (null) { return #ok }; // no integrations canister configured — silent no-op
      case (?id) { id };
    };

    let maxEmailCost = 50_000_000_000;
    let currentBalance = Cycles.balance();
    if (currentBalance < maxEmailCost) {
      return #err("Not enough cycles to send email");
    };

    try {
      let emailService = actor (canisterId.toText()) : EmailService.EmailService;
      let response = await (with cycles = maxEmailCost) emailService.send_email({
        from_username = "noreply";
        to;
        cc = [];
        bcc = [];
        subject;
        html_body = htmlBody;
      });

      switch (response.result) {
        case (#Ok(_)) { #ok };
        case (#Err(e)) { #err(debug_show(e)) };
      };
    } catch (error) {
      #err("Failed to send email: " # error.message());
    };
  };

  // ============================================================
  // Subscription email senders — Phase 2
  // All are fire-and-forget: errors are swallowed, never propagated.
  // ============================================================

  public func sendTrialWelcomeEmail(
    sitterEmail : Text,
    sitterName : Text,
    trialEndDate : Text,
    appUrl : Text,
  ) : async () {
    let html = EmailTemplates.trialWelcome(sitterName, trialEndDate, appUrl);
    let _ = await sendEmail(
      [sitterEmail],
      "Welcome to Pawspect \u{2014} Your 30-day free trial has started!",
      html,
    );
  };

  public func sendTrialReminderEmail(
    sitterEmail : Text,
    sitterName : Text,
    trialEndDate : Text,
    appUrl : Text,
  ) : async () {
    let html = EmailTemplates.trialReminder(sitterName, trialEndDate, appUrl);
    let _ = await sendEmail(
      [sitterEmail],
      "5 days left in your Pawspect free trial",
      html,
    );
  };

  public func sendTrialExpiredEmail(
    sitterEmail : Text,
    sitterName : Text,
    appUrl : Text,
  ) : async () {
    let html = EmailTemplates.trialExpired(sitterName, appUrl);
    let _ = await sendEmail(
      [sitterEmail],
      "Your Pawspect trial has ended \u{2014} activate to keep your account",
      html,
    );
  };

  public func sendAccountFrozenEmail(
    sitterEmail : Text,
    sitterName : Text,
    appUrl : Text,
  ) : async () {
    let html = EmailTemplates.accountFrozen(sitterName, appUrl);
    let _ = await sendEmail(
      [sitterEmail],
      "Your Pawspect account has been paused",
      html,
    );
  };

  public func sendAccountReactivatedEmail(
    sitterEmail : Text,
    sitterName : Text,
    appUrl : Text,
  ) : async () {
    let html = EmailTemplates.accountReactivated(sitterName, appUrl);
    let _ = await sendEmail(
      [sitterEmail],
      "Your Pawspect account is active again!",
      html,
    );
  };

  public func sendSubscriptionConfirmedEmail(
    sitterEmail : Text,
    sitterName : Text,
    appUrl : Text,
  ) : async () {
    let html = EmailTemplates.subscriptionConfirmed(sitterName, appUrl);
    let _ = await sendEmail(
      [sitterEmail],
      "Subscription confirmed \u{2014} you're all set!",
      html,
    );
  };

  public func sendApplicationApprovedEmail(
    sitterEmail : Text,
    sitterName : Text,
    trialEndDate : Text,
    dashboardUrl : Text,
  ) : async () {
    let html = EmailTemplates.applicationApproved(sitterName, trialEndDate, dashboardUrl);
    let _ = await sendEmail(
      [sitterEmail],
      "Congratulations \u{2014} your Pawspect application is approved!",
      html,
    );
  };

  public func sendApplicationRejectedEmail(
    sitterEmail : Text,
    sitterName : Text,
  ) : async () {
    let html = EmailTemplates.applicationRejected(sitterName);
    let _ = await sendEmail(
      [sitterEmail],
      "Your Pawspect application \u{2014} update",
      html,
    );
  };

  public func sendFreezeNoticeEmail(
    sitterEmail : Text,
    sitterName : Text,
    appUrl : Text,
  ) : async () {
    let html = EmailTemplates.freezeNotice(sitterName, appUrl);
    let _ = await sendEmail(
      [sitterEmail],
      "Your Pawspect account has been paused",
      html,
    );
  };

  public func sendReactivationConfirmationEmail(
    sitterEmail : Text,
    sitterName : Text,
    dashboardUrl : Text,
  ) : async () {
    let html = EmailTemplates.reactivationConfirmation(sitterName, dashboardUrl);
    let _ = await sendEmail(
      [sitterEmail],
      "Welcome back \u{2014} your Pawspect subscription is active",
      html,
    );
  };

  // ============================================================
  // Booking decline email sender
  // Sends the client an email with the sitter's decline reason
  // and any alternative booking windows (each with a deep-link button).
  // ============================================================
  public func sendBookingDeclineEmail(
    clientEmail        : Text,
    clientName         : Text,
    sitterName         : Text,
    sitterId           : Nat,
    bookingDate        : Text,
    bookingTime        : Text,
    services           : Text,
    petNames           : Text,
    declineReason      : Text,
    alternativeWindows : [EmailTemplates.AlternativeWindow],
    appUrl             : Text,
  ) : async () {
    let result = EmailTemplates.bookingDeclined(
      sitterName,
      clientName,
      bookingDate,
      bookingTime,
      services,
      petNames,
      declineReason,
      alternativeWindows,
      sitterId.toText(),
      appUrl,
    );
    let _ = await sendEmail([clientEmail], result.subject, result.html);
  };

  // ============================================================
  // CRM deal offer email sender — Phase CRM
  // ============================================================

  public func sendDealOfferEmail(
    clientEmail   : Text,
    clientName    : Text,
    sitterName    : Text,
    description   : Text,
    discountText  : Text,
    couponCode    : Text,
    expirationText : Text,
    bookingUrl    : Text,
  ) : async () {
    let html = EmailTemplates.dealOfferEmail(
      clientName, sitterName, description, discountText, couponCode, expirationText, bookingUrl
    );
    let _ = await sendEmail(
      [clientEmail],
      sitterName # " has a special offer for you — " # discountText,
      html,
    );
  };

  // ============================================================
  // Booking cancellation email senders
  // Sent when a client cancels a booking.
  // ============================================================

  public func sendBookingCancelledClientEmail(
    clientEmail    : Text,
    clientName     : Text,
    bookingId      : Text,
    sitterName     : Text,
    sitterEmail    : Text,
    petNames       : Text,
    startDate      : Text,
    cancelReason   : Text,
    within24Hours  : Bool,
    appUrl         : Text,
  ) : async () {
    let html = EmailTemplates.bookingCancelledClient(
      clientName, bookingId, sitterName, sitterEmail, petNames, startDate, cancelReason, within24Hours, appUrl
    );
    let subject = if (within24Hours) {
      "Booking cancelled \u{2014} please note the 24-hour cancellation policy"
    } else {
      "Your Pawspect booking has been cancelled"
    };
    let _ = await sendEmail([clientEmail], subject, html);
  };

  public func sendBookingCancelledSitterEmail(
    sitterEmail    : Text,
    sitterName     : Text,
    clientName     : Text,
    clientPhone    : Text,
    bookingId      : Text,
    petNames       : Text,
    startDate      : Text,
    cancelReason   : Text,
    within24Hours  : Bool,
    appUrl         : Text,
  ) : async () {
    let html = EmailTemplates.bookingCancelledSitter(
      sitterName, clientName, clientPhone, bookingId, petNames, startDate, cancelReason, within24Hours, appUrl
    );
    let subject = if (within24Hours) {
      clientName # " cancelled within 24 hours \u{2014} you may charge the full amount"
    } else {
      clientName # " has cancelled their Pawspect booking"
    };
    let _ = await sendEmail([sitterEmail], subject, html);
  };

};
