// Recurring booking email template functions.
// All 4 functions produce branded HTML email bodies.
// Uses amber brand color (#F59E0B) to distinguish recurring booking emails.
import RecurringTypes "../types/recurring-bookings";

module {

  // Represents one occurrence row passed into recurring email templates.
  public type OccurrenceRow = {
    bookingId : Nat;
    date      : Text;   // formatted display date, e.g. "April 28, 2026"
    dayName   : Text;   // e.g. "Monday"
    timeRange : Text;   // e.g. "4:00 PM – 5:00 PM"
    service   : Text;   // display name of service(s)
    status    : Text;   // "Pending Confirmation" | "Confirmed" | "Declined"
    costText  : Text;   // e.g. "$15.00"
  };

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  func amberHeader() : Text {
    "<div style=\"font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f5f5f5; padding: 0; margin: 0;\">" #
    "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background: #f5f5f5;\">" #
    "<tr><td align=\"center\" style=\"padding: 40px 20px 0;\">" #
    "<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.08);\">" #
    "<tr><td style=\"background: linear-gradient(135deg, #92400e 0%, #F59E0B 100%); padding: 36px 40px;\">" #
    "<h1 style=\"color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;\">Pawspect</h1>" #
    "<p style=\"color: rgba(255,255,255,0.85); font-size: 14px; margin: 6px 0 0;\">Recurring Pet Care Booking</p>" #
    "</td></tr>" #
    "<tr><td style=\"padding: 40px;\">"
  };

  func clientFooter(sitterEmail : Text, sitterName : Text) : Text {
    "</td></tr>" #
    "<tr><td style=\"background: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;\">" #
    "<p style=\"color: #374151; font-size: 14px; margin: 0 0 8px; font-weight: 600;\">Questions about your booking?</p>" #
    "<p style=\"color: #4b5563; font-size: 13px; margin: 0 0 4px; line-height: 1.6;\">" #
    "Contact " # sitterName # " at <a href=\"mailto:" # sitterEmail # "\" style=\"color: #F59E0B; text-decoration: none; font-weight: 600;\">" # sitterEmail # "</a>" #
    "</p>" #
    "<p style=\"color: #9ca3af; font-size: 12px; margin: 12px 0 4px; line-height: 1.6;\">" #
    "Pawspect is a software platform only. All service agreements are between you and your sitter." #
    "</p>" #
    "<p style=\"color: #9ca3af; font-size: 12px; margin: 4px 0 0; line-height: 1.6;\">" #
    "App or platform questions? <a href=\"https://pawspect.co\" style=\"color: #9ca3af; text-decoration: none;\">pawspect.co</a> &bull; Data Driven Design Group, LLC" #
    "</p>" #
    "<p style=\"color: #9ca3af; font-size: 12px; margin: 4px 0 0; line-height: 1.5;\">Pawspect is a software platform only. Data Driven Design Group, LLC is not a party to any service agreements.</p>" #
    "<p style=\"color: #9ca3af; font-size: 12px; margin: 6px 0 0;\">&#169; 2025 Data Driven Design Group, LLC. All rights reserved.</p>" #
    "</td></tr></table></td></tr></table></div>"
  };

  func sitterFooter(appUrl : Text) : Text {
    "</td></tr>" #
    "<tr><td style=\"background: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;\">" #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;\">" #
    "Manage this and all other bookings from your <a href=\"" # appUrl # "/#/sitter-dashboard\" style=\"color: #F59E0B; text-decoration: none; font-weight: 600;\">Pawspect Sitter Dashboard</a>." #
    "</p>" #
    "<p style=\"color: #374151; font-size: 13px; margin: 6px 0 0; font-weight: 600;\">Data Driven Design Group, LLC | Pawspect | pawspect.co | Colorado, USA</p>" #
    "<p style=\"color: #9ca3af; font-size: 12px; margin: 4px 0 0; line-height: 1.5;\">Pawspect is a software platform only. All service arrangements are between sitter and client. Data Driven Design Group, LLC is not a party to any service agreements.</p>" #
    "<p style=\"color: #9ca3af; font-size: 12px; margin: 6px 0 0;\">&#169; 2025 Data Driven Design Group, LLC. All rights reserved.</p>" #
    "</td></tr></table></td></tr></table></div>"
  };

  func amberCtaButton(btnLabel : Text, url : Text) : Text {
    "<div style=\"margin: 28px 0;\">" #
    "<a href=\"" # url # "\" style=\"background: linear-gradient(135deg, #92400e, #F59E0B); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;\">&rarr; " # btnLabel # "</a>" #
    "</div>"
  };

  func infoRow(rowLabel : Text, value : Text) : Text {
    "<tr>" #
    "<td style=\"padding: 8px 0; color: #6b7280; font-size: 14px; width: 160px; vertical-align: top;\">" # rowLabel # "</td>" #
    "<td style=\"padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; vertical-align: top;\">" # value # "</td>" #
    "</tr>"
  };

  func infoTable(rows : Text) : Text {
    "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width: 100%; margin: 16px 0;\">" # rows # "</table>"
  };

  func divider() : Text {
    "<hr style=\"border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;\">"
  };

  // Render an HTML table of occurrence rows.
  // Alternating row background for readability.
  func occurrenceTable(rows : [OccurrenceRow]) : Text {
    let header =
      "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 16px 0;\">" #
      "<tr style=\"background: linear-gradient(135deg, #92400e, #F59E0B);\">" #
      "<th style=\"padding: 10px 12px; text-align: left; font-size: 12px; color: #ffffff; font-weight: 600;\">Date</th>" #
      "<th style=\"padding: 10px 12px; text-align: left; font-size: 12px; color: #ffffff; font-weight: 600;\">Time</th>" #
      "<th style=\"padding: 10px 12px; text-align: left; font-size: 12px; color: #ffffff; font-weight: 600;\">Service</th>" #
      "<th style=\"padding: 10px 12px; text-align: right; font-size: 12px; color: #ffffff; font-weight: 600;\">Amount</th>" #
      "<th style=\"padding: 10px 12px; text-align: center; font-size: 12px; color: #ffffff; font-weight: 600;\">Status</th>" #
      "</tr>";

    var bodyRows = "";
    var idx : Nat = 0;
    for (row in rows.values()) {
      let bg = if (idx % 2 == 0) { "#ffffff" } else { "#fafafa" };
      let statusColor = if (row.status == "Confirmed") { "#16a34a" }
        else if (row.status == "Declined") { "#dc2626" }
        else { "#d97706" };
      bodyRows #= "<tr style=\"background: " # bg # ";\">" #
        "<td style=\"padding: 10px 12px; font-size: 13px; color: #111827;\">" # row.dayName # ", " # row.date # "</td>" #
        "<td style=\"padding: 10px 12px; font-size: 13px; color: #374151;\">" # row.timeRange # "</td>" #
        "<td style=\"padding: 10px 12px; font-size: 13px; color: #374151;\">" # row.service # "</td>" #
        "<td style=\"padding: 10px 12px; font-size: 13px; color: #111827; font-weight: 600; text-align: right;\">" # row.costText # "</td>" #
        "<td style=\"padding: 10px 12px; font-size: 12px; font-weight: 700; text-align: center; color: " # statusColor # ";\">" # row.status # "</td>" #
        "</tr>";
      idx += 1;
    };

    header # bodyRows # "</table>"
  };

  // Recurring pattern label
  func patternLabel(group : RecurringTypes.BookingGroup) : Text {
    switch (group.recurrenceRule.pattern) {
      case (#weekly)   { "Weekly" };
      case (#biweekly) { "Every 2 weeks" };
      case (#monthly)  { "Monthly" };
    };
  };

  // ============================================================
  // clientRecurringBookingReceived
  // Email to the CLIENT when a recurring booking group is created.
  // ============================================================
  public func clientRecurringBookingReceived(
    group         : RecurringTypes.BookingGroup,
    occurrences   : [OccurrenceRow],
    sitterName    : Text,
    sitterEmail   : Text,
    totalCostText : Text,
    appUrl        : Text,
  ) : Text {
    let occCount = occurrences.size().toText();
    amberHeader() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Your recurring booking request has been received! &#128197;</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">" #
    "Hi " # group.clientInfo.name # ", we&rsquo;ve received your recurring pet care booking request for <strong>" # occCount # " sessions</strong> with <strong>" # sitterName # "</strong>. " #
    "Your sitter will review and confirm each session within 24 hours." #
    "</p>" #
    infoTable(
      infoRow("Group ID:", group.groupId) #
      infoRow("Sitter:", sitterName) #
      infoRow("Schedule:", patternLabel(group)) #
      infoRow("Sessions:", occCount) #
      infoRow("Time:", group.startTime # " &ndash; " # group.endTime) #
      infoRow("Est. Total:", totalCostText) #
      infoRow("Status:", "Pending sitter confirmation")
    ) #
    divider() #
    "<h3 style=\"color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 8px;\">Your scheduled sessions</h3>" #
    occurrenceTable(occurrences) #
    divider() #
    "<div style=\"background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #92400e; font-size: 14px; margin: 0; font-weight: 600;\">What happens next?</p>" #
    "<p style=\"color: #78350f; font-size: 13px; margin: 8px 0 0; line-height: 1.6;\">" #
    sitterName # " will review your recurring booking request and confirm each session. " #
    "You&rsquo;ll receive email updates as each session is confirmed. " #
    "You can track all sessions at any time using the button below." #
    "</p>" #
    "</div>" #
    amberCtaButton("Track My Bookings on Pawspect", appUrl) #
    clientFooter(sitterEmail, sitterName)
  };

  // ============================================================
  // sitterRecurringBookingAlert
  // Email to the SITTER when a recurring booking group is received.
  // ============================================================
  public func sitterRecurringBookingAlert(
    group         : RecurringTypes.BookingGroup,
    occurrences   : [OccurrenceRow],
    sitterName    : Text,
    totalCostText : Text,
    appUrl        : Text,
  ) : Text {
    let occCount = occurrences.size().toText();
    amberHeader() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">New recurring booking request &#128197; &mdash; action required</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">" #
    "Hi " # sitterName # ", <strong>" # group.clientInfo.name # "</strong> has requested a recurring pet care schedule with you. " #
    "This is a <strong>" # patternLabel(group) # "</strong> schedule with <strong>" # occCount # " sessions</strong> totaling <strong>" # totalCostText # "</strong>. " #
    "Please review and confirm or decline each session from your dashboard." #
    "</p>" #
    infoTable(
      infoRow("Client:", group.clientInfo.name) #
      infoRow("Client Email:", group.clientInfo.email) #
      infoRow("Client Phone:", group.clientInfo.phone) #
      infoRow("Schedule:", patternLabel(group)) #
      infoRow("Sessions:", occCount) #
      infoRow("Time:", group.startTime # " &ndash; " # group.endTime) #
      infoRow("Est. Total:", totalCostText)
    ) #
    divider() #
    "<h3 style=\"color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 8px;\">Sessions to confirm</h3>" #
    occurrenceTable(occurrences) #
    divider() #
    "<div style=\"background: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #713f12; font-size: 14px; margin: 0; font-weight: 600;\">&#9200; Action required within 24 hours</p>" #
    "<p style=\"color: #854d0e; font-size: 13px; margin: 8px 0 0; line-height: 1.6;\">" #
    "Log in to your Pawspect dashboard to confirm all sessions at once or manage them individually. " #
    "The client is waiting for your response." #
    "</p>" #
    "</div>" #
    amberCtaButton("Manage Recurring Booking in Dashboard", appUrl) #
    sitterFooter(appUrl)
  };

  // ============================================================
  // clientRecurringOccurrenceConfirmed
  // Email to the CLIENT when ONE occurrence in a recurring series is confirmed.
  // ============================================================
  public func clientRecurringOccurrenceConfirmed(
    confirmedOccurrence : OccurrenceRow,
    allOccurrences      : [OccurrenceRow],
    _group              : RecurringTypes.BookingGroup,
    sitterName          : Text,
    sitterEmail         : Text,
    clientName          : Text,
    appUrl              : Text,
  ) : Text {
    amberHeader() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">" # sitterName # " confirmed your " # confirmedOccurrence.dayName # " appointment &#10003;</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">" #
    "Hi " # clientName # ", great news &mdash; <strong>" # sitterName # "</strong> has confirmed your <strong>" # confirmedOccurrence.date # "</strong> pet care session." #
    "</p>" #
    "<div style=\"background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px 20px; margin: 0 0 20px;\">" #
    "<p style=\"color: #166534; font-size: 15px; margin: 0; font-weight: 700;\">&#10003; Confirmed session</p>" #
    infoTable(
      infoRow("Date:", confirmedOccurrence.dayName # ", " # confirmedOccurrence.date) #
      infoRow("Time:", confirmedOccurrence.timeRange) #
      infoRow("Service:", confirmedOccurrence.service) #
      infoRow("Amount:", confirmedOccurrence.costText)
    ) #
    "</div>" #
    divider() #
    "<h3 style=\"color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 8px;\">Full schedule status</h3>" #
    occurrenceTable(allOccurrences) #
    divider() #
    amberCtaButton("View All Bookings on Pawspect", appUrl) #
    clientFooter(sitterEmail, sitterName)
  };

  // ============================================================
  // clientRecurringGroupConfirmed
  // Email to the CLIENT when ALL occurrences are confirmed at once.
  // ============================================================
  public func clientRecurringGroupConfirmed(
    group         : RecurringTypes.BookingGroup,
    occurrences   : [OccurrenceRow],
    sitterName    : Text,
    sitterEmail   : Text,
    clientName    : Text,
    totalCostText : Text,
    appUrl        : Text,
  ) : Text {
    let occCount = occurrences.size().toText();
    amberHeader() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">" # sitterName # " confirmed all your recurring appointments! &#127881;</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">" #
    "Hi " # clientName # ", amazing news &mdash; <strong>" # sitterName # "</strong> has confirmed all <strong>" # occCount # " sessions</strong> in your " # patternLabel(group) # " schedule. " #
    "Your entire recurring booking is locked in!" #
    "</p>" #
    "<div style=\"background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px 20px; margin: 0 0 20px;\">" #
    infoTable(
      infoRow("Sitter:", sitterName) #
      infoRow("Schedule:", patternLabel(group)) #
      infoRow("Total sessions:", occCount) #
      infoRow("Time:", group.startTime # " &ndash; " # group.endTime) #
      infoRow("Estimated total:", totalCostText) #
      infoRow("Status:", "All Confirmed &#10003;")
    ) #
    "</div>" #
    divider() #
    "<h3 style=\"color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 8px;\">Your confirmed schedule</h3>" #
    occurrenceTable(occurrences) #
    divider() #
    "<div style=\"background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #92400e; font-size: 14px; margin: 0; font-weight: 600;\">Payment methods accepted</p>" #
    "<p style=\"color: #78350f; font-size: 13px; margin: 8px 0 0; line-height: 1.6;\">" #
    "We accept <strong>Check</strong>, <strong>Cash</strong>, <strong>Venmo</strong>, and <strong>Apple Pay Cash</strong>. " #
    "Your sitter will provide payment details for each session." #
    "</p>" #
    "</div>" #
    amberCtaButton("View My Recurring Bookings on Pawspect", appUrl) #
    clientFooter(sitterEmail, sitterName)
  };

};
