// Professional Pawspect email templates
// Airbnb/Stripe quality — branded, warm, clear CTAs

module {

  func header() : Text {
    "<div style=\"font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f5f5f5; padding: 0; margin: 0;\">" #
    "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background: #f5f5f5;\">" #
    "<tr><td align=\"center\" style=\"padding: 40px 20px 0;\">" #
    "<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.08);\">" #
    "<tr><td style=\"background: linear-gradient(135deg, #3730a3 0%, #4f46e5 100%); padding: 36px 40px;\">" #
    "<h1 style=\"color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;\">Pawspect</h1>" #
    "<p style=\"color: rgba(255,255,255,0.8); font-size: 14px; margin: 6px 0 0;\">Premium Pet Care Platform</p>" #
    "</td></tr>" #
    "<tr><td style=\"padding: 40px;\">"
  };

  func footer() : Text {
    "</td></tr>" #
    "<tr><td style=\"background: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;\">" #
    "<p style=\"color: #374151; font-size: 13px; margin: 0; font-weight: 600;\">Data Driven Design Group, LLC | Pawspect | pawspect.co | Colorado, USA</p>" #
    "<p style=\"color: #9ca3af; font-size: 12px; margin: 6px 0 0; line-height: 1.6;\">Pawspect is a software platform only. All service arrangements are between sitter and client. Data Driven Design Group, LLC is not a party to any service agreements.</p>" #
    "<p style=\"color: #9ca3af; font-size: 12px; margin: 8px 0 0;\">&#169; 2025 Data Driven Design Group, LLC. All rights reserved.</p>" #
    "</td></tr></table></td></tr></table></div>"
  };

  // Client-facing footer: shows the sitter's email prominently as the primary contact.
  // Legal entity name in secondary line — no personal names.
  func clientFooter(sitterEmail : Text, sitterName : Text) : Text {
    "</td></tr>" #
    "<tr><td style=\"background: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;\">" #
    "<p style=\"color: #374151; font-size: 14px; margin: 0 0 8px; font-weight: 600;\">Questions about your booking?</p>" #
    "<p style=\"color: #4b5563; font-size: 13px; margin: 0 0 4px; line-height: 1.6;\">" #
    "Contact " # sitterName # " at <a href=\"mailto:" # sitterEmail # "\" style=\"color: #4f46e5; text-decoration: none; font-weight: 600;\">" # sitterEmail # "</a>" #
    "</p>" #
    "<p style=\"color: #9ca3af; font-size: 12px; margin: 12px 0 4px; line-height: 1.6;\">" #
    "Pawspect is a software platform only. All service arrangements are between you and your sitter. Data Driven Design Group, LLC is not a party to any service agreements." #
    "</p>" #
    "<p style=\"color: #9ca3af; font-size: 12px; margin: 4px 0 0; line-height: 1.6;\">" #
    "App or platform questions? <a href=\"https://pawspect.co\" style=\"color: #9ca3af; text-decoration: none;\">pawspect.co</a> &bull; Data Driven Design Group, LLC" #
    "</p>" #
    "<p style=\"color: #9ca3af; font-size: 12px; margin: 6px 0 0;\">&#169; 2025 Data Driven Design Group, LLC. All rights reserved.</p>" #
    "</td></tr></table></td></tr></table></div>"
  };

  func divider() : Text {
    "<hr style=\"border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;\">"
  };

  func ctaButton(btnLabel : Text, url : Text) : Text {
    "<div style=\"margin: 28px 0;\">" #
    "<a href=\"" # url # "\" style=\"background: linear-gradient(135deg, #3730a3, #4f46e5); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;\">&rarr; " # btnLabel # "</a>" #
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

  func paymentNotice() : Text {
    "<div style=\"background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #92400e; font-size: 14px; margin: 0; font-weight: 600;\">Payment Methods Accepted</p>" #
    "<p style=\"color: #78350f; font-size: 13px; margin: 8px 0 0; line-height: 1.6;\">" #
    "We accept <strong>Check</strong>, <strong>Cash</strong>, <strong>Venmo</strong>, and <strong>Apple Pay Cash</strong>. " #
    "No online payment processing at this time. Your sitter will provide payment details." #
    "</p>" #
    "</div>"
  };

  // ============================================================
  // Template: Booking Request Received (to CLIENT when booking is CREATED)
  // Sitter has not yet confirmed — this is the pending/received state.
  // ============================================================
  public func clientBookingReceived(
    clientName : Text,
    bookingId : Text,
    sitterNames : Text,
    sitterEmail : Text,
    petNames : Text,
    startDate : Text,
    endDate : Text,
    services : Text,
    appUrl : Text,
  ) : Text {
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Booking request received!</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">Hi " # clientName # ", we've received your pet care booking request. Your sitter will review and confirm within 24 hours. Here's a summary:</p>" #
    infoTable(
      infoRow("Booking ID:", "#" # bookingId) #
      infoRow("Sitter(s):", sitterNames) #
      infoRow("Pet(s):", petNames) #
      infoRow("Start Date:", startDate) #
      infoRow("End Date:", endDate) #
      infoRow("Services:", services) #
      infoRow("Status:", "Pending sitter confirmation")
    ) #
    divider() #
    "<div style=\"background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #1e40af; font-size: 14px; margin: 0; font-weight: 600;\">What happens next?</p>" #
    "<p style=\"color: #1d4ed8; font-size: 13px; margin: 8px 0 0; line-height: 1.6;\">" #
    "Your sitter will review your request and confirm within 24 hours. You'll receive another email once confirmed. " #
    "In the meantime, you can track your booking status using the button below." #
    "</p>" #
    "</div>" #
    paymentNotice() #
    ctaButton("Track My Booking on Pawspect", appUrl) #
    clientFooter(sitterEmail, sitterNames)
  };

  // ============================================================
  // Template: Booking Confirmed (to CLIENT when SITTER confirms)
  // Now includes a per-service breakdown table with rate x duration.
  // ============================================================
  public func clientBookingConfirmed(
    clientName : Text,
    bookingId : Text,
    sitterNames : Text,
    sitterEmail : Text,
    petNames : Text,
    startDate : Text,
    endDate : Text,
    services : Text,
    lineItems : Text,   // pre-rendered <tr> rows from buildServiceLineItems()
    appUrl : Text,
  ) : Text {
    let breakdownSection = if (lineItems != "") {
      divider() #
      "<h3 style=\"color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 12px;\">Service Breakdown</h3>" #
      "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 0 0 16px;\">" #
      "<tr style=\"background: #f9fafb;\"><th style=\"padding: 10px 16px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600;\">Service</th><th style=\"padding: 10px 16px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600;\">Amount</th></tr>" #
      lineItems #
      "</table>"
    } else { "" };
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Your booking is confirmed! &#127881;</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">Hi " # clientName # ", great news &#8212; your sitter has confirmed your pet care booking. Everything is locked in! Here's your confirmed booking summary:</p>" #
    infoTable(
      infoRow("Booking ID:", "#" # bookingId) #
      infoRow("Sitter(s):", sitterNames) #
      infoRow("Pet(s):", petNames) #
      infoRow("Start Date:", startDate) #
      infoRow("End Date:", endDate) #
      infoRow("Services:", services) #
      infoRow("Status:", "Confirmed &#10003;")
    ) #
    breakdownSection #
    divider() #
    paymentNotice() #
    ctaButton("View My Booking on Pawspect", appUrl) #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 24px 0 0; line-height: 1.6;\">" #
    "Your sitter will reach out shortly to confirm the details. If you have any questions, contact your sitter directly." #
    "</p>" #
    clientFooter(sitterEmail, sitterNames)
  };

  // ============================================================
  // Template: Booking Confirmation (alias kept for backward compat)
  // Now includes a per-service breakdown table with rate x duration.
  // ============================================================
  public func bookingConfirmation(
    clientName : Text,
    bookingId : Text,
    sitterNames : Text,
    petNames : Text,
    startDate : Text,
    endDate : Text,
    services : Text,
    totalCost : Text,
    lineItems : Text,   // pre-rendered <tr> rows from buildServiceLineItems(); pass "" to omit
    appUrl : Text,
  ) : Text {
    let breakdownSection = if (lineItems != "") {
      divider() #
      "<h3 style=\"color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 12px;\">Service Breakdown</h3>" #
      "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 0 0 16px;\">" #
      "<tr style=\"background: #f9fafb;\"><th style=\"padding: 10px 16px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600;\">Service</th><th style=\"padding: 10px 16px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600;\">Amount</th></tr>" #
      lineItems #
      "</table>"
    } else { "" };
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Your booking is confirmed!</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">Hi " # clientName # ", great news &#8212; your pet care booking has been confirmed. Here&#8217;s your booking summary:</p>" #
    infoTable(
      infoRow("Booking ID:", "#" # bookingId) #
      infoRow("Sitter(s):", sitterNames) #
      infoRow("Pet(s):", petNames) #
      infoRow("Start Date:", startDate) #
      infoRow("End Date:", endDate) #
      infoRow("Services:", services) #
      infoRow("Estimated Total:", totalCost)
    ) #
    breakdownSection #
    divider() #
    paymentNotice() #
    ctaButton("View My Booking on Pawspect", appUrl) #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 24px 0 0; line-height: 1.6;\">" #
    "Your sitter will reach out shortly to confirm the details. If you have any questions, reply to this email or visit your booking dashboard." #
    "</p>" #
    footer()
  };

  // ============================================================
  // Template: Service Completion + Invoice (to CLIENT)
  // ============================================================
  public func serviceCompletion(
    clientName : Text,
    bookingId : Text,
    sitterNames : Text,
    sitterEmail : Text,
    sitterContact : Text,
    petNames : Text,
    completedDate : Text,
    lineItems : Text,
    subtotal : Text,
    discount : Text,
    totalDue : Text,
    appUrl : Text,
  ) : Text {
    let discountSection = if (discount != "" and discount != "$0") {
      "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width: 100%; margin: 4px 0;\">" #
      "<tr><td style=\"padding: 4px 16px; font-size: 13px; color: #6b7280;\">Subtotal</td><td style=\"padding: 4px 16px; text-align: right; font-size: 13px; color: #6b7280;\">" # subtotal # "</td></tr>" #
      "<tr><td style=\"padding: 4px 16px; font-size: 13px; color: #10b981;\">Bundle Discount</td><td style=\"padding: 4px 16px; text-align: right; font-size: 13px; color: #10b981;\">-" # discount # "</td></tr>" #
      "</table>"
    } else { "" };
    let contactSection = if (sitterContact != "") {
      "<div style=\"background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
      "<p style=\"color: #0369a1; font-size: 14px; margin: 0; font-weight: 600;\">Your Sitter's Contact Info</p>" #
      "<p style=\"color: #0284c7; font-size: 14px; margin: 8px 0 0; line-height: 1.6;\">" # sitterContact # "</p>" #
      "</div>"
    } else { "" };
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Your pet care is complete! &#127937;</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">Hi " # clientName # ", your fur babies are in safe hands and your service is complete. Here&#8217;s your invoice:</p>" #
    infoTable(
      infoRow("Invoice #:", "INV-" # bookingId) #
      infoRow("Sitter(s):", sitterNames) #
      infoRow("Pet(s):", petNames) #
      infoRow("Date:", completedDate)
    ) #
    divider() #
    "<h3 style=\"color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 12px;\">Service Breakdown</h3>" #
    "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 0 0 8px;\">" #
    "<tr style=\"background: #f9fafb;\"><th style=\"padding: 10px 16px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600;\">Service</th><th style=\"padding: 10px 16px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600;\">Amount</th></tr>" #
    lineItems #
    "</table>" #
    discountSection #
    "<div style=\"background: linear-gradient(135deg, #3730a3, #4f46e5); border-radius: 8px; padding: 16px 20px; margin: 12px 0 20px;\">" #
    "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width: 100%;\"><tr>" #
    "<td style=\"color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 600;\">Total Due</td>" #
    "<td style=\"color: #ffffff; font-size: 20px; font-weight: 700; text-align: right;\">" # totalDue # "</td>" #
    "</tr></table></div>" #
    paymentNotice() #
    contactSection #
    ctaButton("Visit Pawspect to View Invoice", appUrl) #
    divider() #
    "<div style=\"background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;\">" #
    "<p style=\"color: #166534; font-size: 15px; margin: 0; font-weight: 600;\">Thank you, " # clientName # "!</p>" #
    "<p style=\"color: #15803d; font-size: 14px; margin: 8px 0 0; line-height: 1.6;\">We hope your pets had an amazing time! Your trust means everything to us. We&#8217;d love to have you back &#8212; book again anytime through Pawspect.</p>" #
    "</div>" #
    clientFooter(sitterEmail, sitterNames)
  };

  // ============================================================
  // Template: Payment Reminder (to CLIENT, triggered by sitter)
  // ============================================================
  public func paymentReminder(
    clientName : Text,
    bookingId : Text,
    sitterName : Text,
    sitterEmail : Text,
    sitterContact : Text,
    petNames : Text,
    amountDue : Text,
    serviceDates : Text,
    appUrl : Text,
  ) : Text {
    let contactSection = if (sitterContact != "") {
      "<div style=\"background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
      "<p style=\"color: #0369a1; font-size: 14px; margin: 0; font-weight: 600;\">Contact Your Sitter</p>" #
      "<p style=\"color: #0284c7; font-size: 14px; margin: 8px 0 0; line-height: 1.6;\">" # sitterContact # "</p>" #
      "</div>"
    } else { "" };
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Friendly payment reminder</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">Hi " # clientName # ", just a gentle reminder that you have an outstanding invoice for pet care services. Here are the details:</p>" #
    infoTable(
      infoRow("Invoice #:", "INV-" # bookingId) #
      infoRow("Sitter:", sitterName) #
      infoRow("Pet(s):", petNames) #
      infoRow("Service Dates:", serviceDates) #
      infoRow("Amount Due:", amountDue)
    ) #
    divider() #
    paymentNotice() #
    contactSection #
    ctaButton("View My Bookings on Pawspect", appUrl) #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 24px 0 0; line-height: 1.6;\">" #
    "If you&#8217;ve already sent payment, please disregard this message. Thank you so much for your support &#8212; we&#8217;re grateful for the opportunity to care for your pets!" #
    "</p>" #
    clientFooter(sitterEmail, sitterName)
  };

  // ============================================================
  // Template: New Booking Request Alert (to SITTER when booking is CREATED)
  // ============================================================
  public func sitterNewBookingAlert(
    sitterName : Text,
    clientName : Text,
    clientEmail : Text,
    clientPhone : Text,
    bookingId : Text,
    petNames : Text,
    startDate : Text,
    endDate : Text,
    services : Text,
    notes : Text,
    appUrl : Text,
    callRequest : Bool,
  ) : Text {
    let notesRow = if (notes != "") { infoRow("Notes:", notes) } else { "" };
    let callRequestBanner = if (callRequest) {
      "<div style=\"background: #fff7ed; border: 2px solid #f97316; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px;\">" #
      "<p style=\"color: #7c2d12; font-size: 15px; margin: 0; font-weight: 700;\">&#9990;&#65039; Call Requested</p>" #
      "<p style=\"color: #9a3412; font-size: 14px; margin: 8px 0 0; line-height: 1.6;\">" #
      "This client would like you to call them at <strong>" # clientPhone # "</strong> to discuss this booking before confirming." #
      "</p>" #
      "</div>"
    } else { "" };
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">New booking request &#8212; action required</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">Hi " # sitterName # ", you have a new pet care booking request awaiting your confirmation. Please review and confirm or decline within 24 hours.</p>" #
    callRequestBanner #
    infoTable(
      infoRow("Booking ID:", "#" # bookingId) #
      infoRow("Client:", clientName) #
      infoRow("Client Email:", clientEmail) #
      infoRow("Client Phone:", clientPhone) #
      infoRow("Pet(s):", petNames) #
      infoRow("Start Date:", startDate) #
      infoRow("End Date:", endDate) #
      infoRow("Services:", services) #
      notesRow
    ) #
    divider() #
    "<div style=\"background: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #713f12; font-size: 14px; margin: 0; font-weight: 600;\">&#9200; Action required within 24 hours</p>" #
    "<p style=\"color: #854d0e; font-size: 13px; margin: 8px 0 0; line-height: 1.6;\">" #
    "Log in to your Pawspect dashboard to confirm or decline this booking. The client is waiting for your response." #
    "</p>" #
    "</div>" #
    ctaButton("Confirm or Decline in Dashboard", appUrl) #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 24px 0 0; line-height: 1.6;\">" #
    "The client has been notified that their request is pending your confirmation." #
    "</p>" #
    footer()
  };

  // ============================================================
  // Template: New Booking Alert — alias for backward compat
  // (same as sitterNewBookingAlert)
  // ============================================================
  public func newBookingAlert(
    sitterName : Text,
    clientName : Text,
    clientEmail : Text,
    clientPhone : Text,
    bookingId : Text,
    petNames : Text,
    startDate : Text,
    endDate : Text,
    services : Text,
    notes : Text,
    appUrl : Text,
  ) : Text {
    sitterNewBookingAlert(
      sitterName, clientName, clientEmail, clientPhone,
      bookingId, petNames, startDate, endDate, services, notes, appUrl,
      false
    )
  };

  // ============================================================
  // Template: Admin New Booking Notification (to ADMIN)
  // ============================================================
  public func adminNewBookingAlert(
    clientName : Text,
    bookingId : Text,
    sitterNames : Text,
    petNames : Text,
    startDate : Text,
    endDate : Text,
    services : Text,
    appUrl : Text,
  ) : Text {
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">New booking created</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">A new booking has been submitted on Pawspect. Here's a quick summary:</p>" #
    infoTable(
      infoRow("Booking ID:", "#" # bookingId) #
      infoRow("Client:", clientName) #
      infoRow("Sitter(s):", sitterNames) #
      infoRow("Pet(s):", petNames) #
      infoRow("Start Date:", startDate) #
      infoRow("End Date:", endDate) #
      infoRow("Services:", services)
    ) #
    divider() #
    ctaButton("View in Admin Dashboard", appUrl) #
    footer()
  };

  // ============================================================
  // Template: Sitter Booking Confirmed Acknowledgement (to SITTER)
  // ============================================================
  public func sitterBookingConfirmed(
    sitterName : Text,
    clientName : Text,
    bookingId : Text,
    petNames : Text,
    startDate : Text,
    endDate : Text,
    services : Text,
    appUrl : Text,
  ) : Text {
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Booking confirmed &#10003;</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">Hi " # sitterName # ", you've confirmed the following booking. The client has been notified. Here are the details:</p>" #
    infoTable(
      infoRow("Booking ID:", "#" # bookingId) #
      infoRow("Client:", clientName) #
      infoRow("Pet(s):", petNames) #
      infoRow("Start Date:", startDate) #
      infoRow("End Date:", endDate) #
      infoRow("Services:", services)
    ) #
    divider() #
    ctaButton("View Booking", appUrl) #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 24px 0 0; line-height: 1.6;\">" #
    "Thank you for providing excellent pet care through Pawspect. You make a difference in every pet's life!" #
    "</p>" #
    footer()
  };

  // ============================================================
  // Template: Client Nudge Sitter (to SITTER, triggered by CLIENT from Invoices Due tab)
  // ============================================================
  public func clientNudgeSitter(
    sitterName : Text,
    clientName : Text,
    clientEmail : Text,
    clientPhone : Text,
    bookingId : Text,
    petNames : Text,
    serviceDates : Text,
    amountDue : Text,
    appUrl : Text,
  ) : Text {
    let contactRows =
      (if (clientEmail != "") { infoRow("Client Email:", clientEmail) } else { "" }) #
      (if (clientPhone != "") { infoRow("Client Phone:", clientPhone) } else { "" });
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Payment follow-up from " # clientName # "</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">" #
    "Hi " # sitterName # ", <strong>" # clientName # "</strong> is following up about payment for their recent pet care booking. " #
    "They'd love to hear from you to arrange payment at your earliest convenience." #
    "</p>" #
    infoTable(
      infoRow("Invoice #:", "INV-" # bookingId) #
      infoRow("Pet(s):", petNames) #
      infoRow("Service Dates:", serviceDates) #
      infoRow("Amount Due:", amountDue) #
      contactRows
    ) #
    divider() #
    "<div style=\"background: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #713f12; font-size: 14px; margin: 0; font-weight: 600;\">&#128276; Client is waiting to hear from you</p>" #
    "<p style=\"color: #854d0e; font-size: 13px; margin: 8px 0 0; line-height: 1.6;\">" #
    "Please reach out to " # clientName # " directly to confirm the payment amount and arrange how they can pay. " #
    "We accept <strong>Check</strong>, <strong>Cash</strong>, <strong>Venmo</strong>, and <strong>Apple Pay Cash</strong>." #
    "</p>" #
    "</div>" #
    ctaButton("View Booking in Dashboard", appUrl) #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 24px 0 0; line-height: 1.6;\">" #
    "This message was sent on behalf of " # clientName # " via the Pawspect platform. " #
    "Pawspect is a booking and tracking platform only — all payment arrangements are between you and your client." #
    "</p>" #
    footer()
  };

  // ============================================================
  // Template: New Sitter Application (to ADMIN)
  // ============================================================
  public func newSitterApplication(
    sitterName : Text,
    sitterEmail : Text,
    services : Text,
    location : Text,
    appUrl : Text,
  ) : Text {
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">New sitter application received</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">A new sitter has applied to join Pawspect. Review and approve or decline from the admin panel.</p>" #
    infoTable(
      infoRow("Applicant:", sitterName) #
      infoRow("Email:", sitterEmail) #
      infoRow("Location:", location) #
      infoRow("Services Offered:", services)
    ) #
    divider() #
    ctaButton("Review Application", appUrl) #
    footer()
  };

  // ============================================================
  // Template: Invoice Email (to CLIENT when sitter sends invoice / payment reminder)
  // paymentSection: pre-rendered HTML block describing how to pay
  // ============================================================
  public func invoiceEmail(
    clientName : Text,
    bookingId : Text,
    sitterNames : Text,
    sitterEmail : Text,
    petNames : Text,
    startDate : Text,
    endDate : Text,
    lineItems : Text,        // pre-rendered <tr> rows for the service table
    adHocItems : Text,       // pre-rendered <tr> rows for ad hoc items (may be empty)
    subtotal : Text,
    discount : Text,
    totalDue : Text,
    paymentSection : Text,   // fully-rendered HTML block for payment method
    appUrl : Text,
    isReminder : Bool,
  ) : Text {
    let headlineText = if (isReminder) {
      "Friendly payment reminder \u{1F4AC}"
    } else {
      "Your invoice is ready \u{1F4CB}"
    };
    let introParagraph = if (isReminder) {
      "Hi " # clientName # ", just a gentle reminder that the invoice below is still outstanding. " #
      "Please arrange payment at your earliest convenience &#8212; we truly appreciate your support!"
    } else {
      "Hi " # clientName # ", thank you for choosing Pawspect! Here is your invoice for recent pet care services."
    };
    let discountSection = if (discount != "" and discount != "$0.00") {
      "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width: 100%; margin: 4px 0;\">" #
      "<tr><td style=\"padding: 4px 16px; font-size: 13px; color: #6b7280;\">Subtotal</td><td style=\"padding: 4px 16px; text-align: right; font-size: 13px; color: #6b7280;\">" # subtotal # "</td></tr>" #
      "<tr><td style=\"padding: 4px 16px; font-size: 13px; color: #10b981;\">Discount</td><td style=\"padding: 4px 16px; text-align: right; font-size: 13px; color: #10b981;\">-" # discount # "</td></tr>" #
      "</table>"
    } else { "" };
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">" # headlineText # "</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">" # introParagraph # "</p>" #
    infoTable(
      infoRow("Invoice #:", "INV-" # bookingId) #
      infoRow("Sitter(s):", sitterNames) #
      infoRow("Pet(s):", petNames) #
      infoRow("Start Date:", startDate) #
      infoRow("End Date:", endDate)
    ) #
    divider() #
    "<h3 style=\"color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 12px;\">Service Breakdown</h3>" #
    "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 0 0 8px;\">" #
    "<tr style=\"background: #f9fafb;\"><th style=\"padding: 10px 16px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600;\">Service</th><th style=\"padding: 10px 16px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600; white-space: nowrap;\">Amount</th></tr>" #
    lineItems #
    adHocItems #
    "</table>" #
    discountSection #
    "<div style=\"background: linear-gradient(135deg, #3730a3, #4f46e5); border-radius: 8px; padding: 16px 20px; margin: 12px 0 20px;\">" #
    "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width: 100%;\"><tr>" #
    "<td style=\"color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 600;\">Total Due</td>" #
    "<td style=\"color: #ffffff; font-size: 20px; font-weight: 700; text-align: right;\">" # totalDue # "</td>" #
    "</tr></table></div>" #
    divider() #
    paymentSection #
    ctaButton("View My Bookings", appUrl) #
    clientFooter(sitterEmail, sitterNames)
  };

  // ============================================================
  // SUBSCRIPTION EMAIL TEMPLATES — Phase 2
  // ============================================================

  func subscriptionFooter() : Text {
    "</td></tr>" #
    "<tr><td style=\"background: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;\">" #
    "<p style=\"color: #374151; font-size: 13px; margin: 0; font-weight: 600;\">Data Driven Design Group, LLC | Pawspect | pawspect.co | Colorado, USA</p>" #
    "<p style=\"color: #9ca3af; font-size: 12px; margin: 6px 0 0; line-height: 1.5;\">" #
    "Pawspect is a software platform only. All service arrangements are between sitter and client. Data Driven Design Group, LLC is not a party to any service agreements." #
    "</p>" #
    "<p style=\"color: #9ca3af; font-size: 12px; margin: 6px 0 0;\">&#169; 2025 Data Driven Design Group, LLC. All rights reserved.</p>" #
    "</td></tr></table></td></tr></table></div>"
  };

  func amberBadge(icon : Text, text : Text) : Text {
    "<div style=\"text-align: center; margin: 0 0 28px;\">" #
    "<div style=\"display: inline-block; background: linear-gradient(135deg, #92400e, #f59e0b); color: #ffffff; font-size: 22px; font-weight: 800; padding: 12px 32px; border-radius: 50px;\">" # icon # " " # text # "</div>" #
    "</div>"
  };

  func featureList(items : [Text]) : Text {
    let rows = items.foldLeft(
      "",
      func(acc : Text, item : Text) : Text {
        acc #
        "<tr><td style=\"padding: 6px 0; color: #374151; font-size: 14px;\">" #
        "<span style=\"color: #f59e0b; font-weight: 700; margin-right: 8px;\">&#10003;</span>" # item #
        "</td></tr>"
      }
    );
    "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width: 100%; margin: 16px 0;\">" # rows # "</table>"
  };

  func amberCtaButton(btnLabel : Text, url : Text) : Text {
    "<div style=\"margin: 28px 0;\">" #
    "<a href=\"" # url # "\" style=\"background: linear-gradient(135deg, #92400e, #f59e0b); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;\">&rarr; " # btnLabel # "</a>" #
    "</div>"
  };

  // ============================================================
  // Template: Trial Welcome Email (to SITTER when approved, trial starts)
  // ============================================================
  public func trialWelcome(
    sitterName : Text,
    trialEndDate : Text,
    appUrl : Text,
  ) : Text {
    header() #
    amberBadge("&#127881;", "You're in!") #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Welcome to Pawspect, " # sitterName # "!</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 20px;\">" #
    "Your application has been approved and your <strong>30-day free trial starts today</strong> &#8212; full access to everything, no credit card required." #
    "</p>" #
    "<div style=\"background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 20px 24px; margin: 0 0 24px;\">" #
    "<p style=\"color: #1e40af; font-size: 14px; font-weight: 600; margin: 0 0 12px;\">Everything included in your trial:</p>" #
    featureList([
      "Booking management &amp; scheduling",
      "Professional invoicing &amp; payment tracking",
      "Client &amp; pet CRM",
      "Business analytics &amp; revenue insights",
      "Coach &amp; Growth tools",
    ]) #
    "</div>" #
    infoTable(
      infoRow("Trial ends:", trialEndDate) #
      infoRow("After trial:", "$15/month &#8212; cancel anytime") #
      infoRow("Platform fees:", "None, ever")
    ) #
    divider() #
    ctaButton("Open Your Sitter Portal", appUrl # "/#/sitter-dashboard") #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;\">" #
    "You&#8217;re all set to start running your pet sitting business like a pro. We&#8217;re rooting for you!" #
    "</p>" #
    subscriptionFooter()
  };

  // ============================================================
  // Template: Trial Reminder Email (day 25 — 5 days left)
  // ============================================================
  public func trialReminder(
    sitterName : Text,
    trialEndDate : Text,
    appUrl : Text,
  ) : Text {
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">5 days left in your free trial</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 20px;\">" #
    "Hi " # sitterName # ", your Pawspect free trial ends on <strong>" # trialEndDate # "</strong>. " #
    "You&#8217;ve been building something real &#8212; keep it going!" #
    "</p>" #
    "<div style=\"background: #fef9c3; border: 1px solid #fde047; border-radius: 10px; padding: 20px 24px; margin: 0 0 24px;\">" #
    "<p style=\"color: #713f12; font-size: 15px; font-weight: 700; margin: 0 0 4px;\">Keep everything going for just $15/month</p>" #
    "<p style=\"color: #854d0e; font-size: 14px; margin: 0; line-height: 1.6;\">" #
    "No platform fees. Cancel anytime. All your bookings, clients, and data stay exactly where they are." #
    "</p>" #
    "</div>" #
    infoTable(
      infoRow("Trial ends:", trialEndDate) #
      infoRow("Price:", "$15/month") #
      infoRow("Platform fees:", "None")
    ) #
    divider() #
    amberCtaButton("Activate Subscription", appUrl # "/#/sitter-dashboard") #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;\">" #
    "Not ready yet? No pressure &#8212; your trial is still active for 5 more days." #
    "</p>" #
    subscriptionFooter()
  };

  // ============================================================
  // Template: Trial Expired Email (day 30, not yet subscribed)
  // ============================================================
  public func trialExpired(
    sitterName : Text,
    appUrl : Text,
  ) : Text {
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Your free trial has ended</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 20px;\">" #
    "Hi " # sitterName # ", your 30-day Pawspect trial has come to an end. " #
    "Your account is paused until you activate your subscription &#8212; but nothing is lost." #
    "</p>" #
    "<div style=\"background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px; padding: 20px 24px; margin: 0 0 24px;\">" #
    "<p style=\"color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 8px;\">&#128274; Your data is safe</p>" #
    "<p style=\"color: #15803d; font-size: 14px; margin: 0; line-height: 1.6;\">" #
    "All your bookings, clients, invoices, and earnings history are fully preserved and waiting for you." #
    "</p>" #
    "</div>" #
    infoTable(
      infoRow("Account status:", "Paused") #
      infoRow("To reactivate:", "$15/month") #
      infoRow("Your data:", "Safe &amp; preserved")
    ) #
    divider() #
    amberCtaButton("Activate Subscription &#8212; $15/mo", appUrl # "/#/sitter-dashboard") #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;\">" #
    "Need to export your data instead? Visit your <strong>Account</strong> tab at any time to request a GDPR export &#8212; no subscription required." #
    "</p>" #
    subscriptionFooter()
  };

  // ============================================================
  // Template: Account Frozen Email (admin freezes account)
  // ============================================================
  public func accountFrozen(
    sitterName : Text,
    appUrl : Text,
  ) : Text {
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Your account has been paused</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 20px;\">" #
    "Hi " # sitterName # ", your Pawspect account has been temporarily paused. " #
    "This is usually due to a lapsed subscription. Your data is completely safe and preserved." #
    "</p>" #
    "<div style=\"background: #fef3c7; border: 1px solid #fbbf24; border-radius: 10px; padding: 20px 24px; margin: 0 0 24px;\">" #
    "<p style=\"color: #92400e; font-size: 14px; font-weight: 600; margin: 0 0 8px;\">Pick up right where you left off</p>" #
    "<p style=\"color: #78350f; font-size: 14px; margin: 0; line-height: 1.6;\">" #
    "Reactivate for $15/month and your bookings, clients, and invoices will all be right here waiting." #
    "</p>" #
    "</div>" #
    infoTable(
      infoRow("Account status:", "Paused") #
      infoRow("To reactivate:", "$15/month") #
      infoRow("Your data:", "Safe &amp; preserved")
    ) #
    divider() #
    amberCtaButton("Reactivate Account", appUrl # "/#/sitter-dashboard") #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;\">" #
    "Questions? You can also request a full export of your data at any time from the <strong>Account</strong> tab." #
    "</p>" #
    subscriptionFooter()
  };

  // ============================================================
  // Template: Account Reactivated Email (account unfrozen)
  // ============================================================
  public func accountReactivated(
    sitterName : Text,
    appUrl : Text,
  ) : Text {
    header() #
    amberBadge("&#10003;", "Welcome back!") #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Your account is active again!</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 20px;\">" #
    "Hi " # sitterName # ", great news &#8212; your Pawspect account has been reactivated. " #
    "Everything is right where you left it." #
    "</p>" #
    "<div style=\"background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 20px 24px; margin: 0 0 24px;\">" #
    "<p style=\"color: #1e40af; font-size: 14px; font-weight: 600; margin: 0 0 4px;\">What&#8217;s waiting for you:</p>" #
    "<p style=\"color: #1d4ed8; font-size: 14px; margin: 0; line-height: 1.6;\">" #
    "Your bookings, clients, invoices, and full earnings history are all intact and ready to go." #
    "</p>" #
    "</div>" #
    divider() #
    ctaButton("Open Your Sitter Portal", appUrl # "/#/sitter-dashboard") #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;\">" #
    "Thanks for being part of Pawspect. We&#8217;re glad to have you back!" #
    "</p>" #
    subscriptionFooter()
  };

  // ============================================================
  // Template: Subscription Confirmed Email (payment succeeds)
  // ============================================================
  public func subscriptionConfirmed(
    sitterName : Text,
    appUrl : Text,
  ) : Text {
    header() #
    amberBadge("&#10003;", "Subscription Active!") #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">You&#8217;re all set!</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 20px;\">" #
    "Hi " # sitterName # ", your Pawspect subscription is confirmed and active. " #
    "You have full access to every feature with no interruption." #
    "</p>" #
    infoTable(
      infoRow("Subscription:", "Active &#10003;") #
      infoRow("Price:", "$15/month") #
      infoRow("Platform fees:", "None, ever") #
      infoRow("Cancellation:", "Anytime, no questions asked")
    ) #
    divider() #
    ctaButton("Open Your Sitter Portal", appUrl # "/#/sitter-dashboard") #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;\">" #
    "Manage your subscription, view receipts, or cancel at any time from the <strong>Billing</strong> tab in your portal." #
    "</p>" #
    subscriptionFooter()
  };

  // ============================================================
  // Template: Application Approved (to SITTER when admin approves)
  // ============================================================
  public func applicationApproved(
    sitterName : Text,
    trialEndDate : Text,
    dashboardUrl : Text,
  ) : Text {
    header() #
    amberBadge("&#127881;", "You&apos;re approved!") #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Congratulations, " # sitterName # "!</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 20px;\">" #
    "Your Pawspect application has been approved and your <strong>30-day free trial begins today</strong>. " #
    "You now have full access to everything &#8212; no credit card required." #
    "</p>" #
    "<div style=\"background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 20px 24px; margin: 0 0 24px;\">" #
    "<p style=\"color: #1e40af; font-size: 14px; font-weight: 600; margin: 0 0 12px;\">Get started in minutes:</p>" #
    featureList([
      "Complete your sitter profile with a photo and bio",
      "Set your services and pricing",
      "Copy your unique booking link and share it with clients",
      "Manage bookings, invoices, and clients from your dashboard",
    ]) #
    "</div>" #
    infoTable(
      infoRow("Trial ends:", trialEndDate) #
      infoRow("After trial:", "$15/month &#8212; cancel anytime") #
      infoRow("Platform fees:", "None, ever")
    ) #
    divider() #
    "<div style=\"background: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #713f12; font-size: 14px; margin: 0; font-weight: 600;\">&#128274; Important reminders</p>" #
    "<p style=\"color: #854d0e; font-size: 13px; margin: 8px 0 0; line-height: 1.6;\">" #
    "You must maintain adequate insurance for all pet sitting services. Ensure client interactions are safe and professional. " #
    "Pawspect is a technology platform only &#8212; all services are exclusively between you and your clients." #
    "</p>" #
    "</div>" #
    amberCtaButton("Open Your Sitter Portal", dashboardUrl) #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;\">" #
    "Welcome to Pawspect. We&apos;re rooting for your success!" #
    "</p>" #
    subscriptionFooter()
  };

  // ============================================================
  // Template: Application Rejected (to SITTER when admin declines)
  // ============================================================
  public func applicationRejected(
    sitterName : Text,
  ) : Text {
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">An update on your Pawspect application</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 20px;\">" #
    "Hi " # sitterName # ", thank you for your interest in joining Pawspect and for taking the time to apply. " #
    "After careful review, we&apos;re unable to approve your application at this time." #
    "</p>" #
    "<div style=\"background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px 24px; margin: 0 0 24px;\">" #
    "<p style=\"color: #374151; font-size: 14px; margin: 0; line-height: 1.7;\">" #
    "This decision is not a permanent one. We encourage you to reapply in the future as our platform continues to grow and evolve. " #
    "If you believe there has been an error or would like additional information, please don&apos;t hesitate to reach out to us." #
    "</p>" #
    "</div>" #
    divider() #
    "<p style=\"color: #4b5563; font-size: 14px; line-height: 1.7; margin: 0 0 16px;\">" #
    "Have questions? We&apos;re happy to help. Visit <a href=\"https://pawspect.co\" style=\"color: #4f46e5; text-decoration: none; font-weight: 600;\">pawspect.co</a> for support." #
    "</p>" #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;\">" #
    "Thank you again for your interest in Pawspect &#8212; we wish you all the best." #
    "</p>" #
    footer()
  };

  // ============================================================
  // Template: Freeze Notice (account paused due to non-payment)
  // ============================================================
  public func freezeNotice(
    sitterName : Text,
    appUrl : Text,
  ) : Text {
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Your Pawspect account has been paused</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 20px;\">" #
    "Hi " # sitterName # ", your account has been temporarily paused due to a non-payment or expired subscription. " #
    "Your data is completely safe &#8212; nothing has been deleted." #
    "</p>" #
    "<div style=\"background: #fef3c7; border: 1px solid #fbbf24; border-radius: 10px; padding: 20px 24px; margin: 0 0 24px;\">" #
    "<p style=\"color: #92400e; font-size: 14px; font-weight: 700; margin: 0 0 8px;\">Reactivate in minutes</p>" #
    "<p style=\"color: #78350f; font-size: 14px; margin: 0; line-height: 1.6;\">" #
    "Subscribe for $15/month and your bookings, clients, invoices, and earnings history will all be right here waiting for you." #
    "</p>" #
    "</div>" #
    infoTable(
      infoRow("Account status:", "Paused") #
      infoRow("Reactivation price:", "$15/month") #
      infoRow("Your data:", "Safe &amp; preserved") #
      infoRow("Need your data?", "Use the GDPR export in your Account tab")
    ) #
    divider() #
    amberCtaButton("Reactivate My Account &#8212; $15/mo", appUrl # "/#/sitter-dashboard") #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;\">" #
    "To export your data without reactivating, visit the <strong>Account</strong> tab in your portal and click &ldquo;Download My Data.&rdquo;" #
    "</p>" #
    subscriptionFooter()
  };

  // ============================================================
  // Template: Reactivation Confirmation (subscription payment succeeds / account unfrozen)
  // ============================================================
  public func reactivationConfirmation(
    sitterName : Text,
    dashboardUrl : Text,
  ) : Text {
    header() #
    amberBadge("&#10003;", "Welcome back!") #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Your subscription is active!</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 20px;\">" #
    "Hi " # sitterName # ", great news &#8212; your Pawspect subscription is confirmed at <strong>$15/month</strong>. " #
    "All features are fully unlocked and your account is active." #
    "</p>" #
    "<div style=\"background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 20px 24px; margin: 0 0 24px;\">" #
    "<p style=\"color: #1e40af; font-size: 14px; font-weight: 600; margin: 0 0 4px;\">Everything is waiting for you:</p>" #
    "<p style=\"color: #1d4ed8; font-size: 14px; margin: 0; line-height: 1.6;\">" #
    "Your bookings, clients, invoices, and full earnings history are all intact and ready to go." #
    "</p>" #
    "</div>" #
    infoTable(
      infoRow("Subscription:", "Active &#10003;") #
      infoRow("Price:", "$15/month") #
      infoRow("Platform fees:", "None, ever") #
      infoRow("Cancellation:", "Anytime, no questions asked")
    ) #
    divider() #
    ctaButton("Open Your Sitter Portal", dashboardUrl) #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;\">" #
    "Manage your subscription, view receipts, or cancel at any time from the <strong>Billing</strong> tab in your portal." #
    "</p>" #
    subscriptionFooter()
  };

  // ============================================================
  // Template: Invoice Paid Confirmation (to CLIENT when sitter marks paid)
  // Shows a prominent green PAID badge and two CTAs: Rate Sitter and Book Again.
  // ============================================================
  public func invoicePaidConfirmation(
    clientName : Text,
    bookingId : Text,
    sitterName : Text,
    sitterNames : Text,
    petNames : Text,
    startDate : Text,
    endDate : Text,
    lineItems : Text,        // pre-rendered <tr> rows for the service table
    adHocItems : Text,       // pre-rendered <tr> rows for ad hoc items (may be empty)
    totalPaid : Text,
    paymentMethodUsed : Text, // human-readable description of how they paid
    rateUrl : Text,
    bookAgainUrl : Text,
  ) : Text {
    header() #
    "<div style=\"text-align: center; margin: 0 0 28px;\">" #
    "<div style=\"display: inline-block; background: #16a34a; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 2px; padding: 10px 32px; border-radius: 8px; text-transform: uppercase;\">&#10003; PAID</div>" #
    "</div>" #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Payment confirmed &#127881;</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">" #
    "Hi " # clientName # ", this invoice has been marked as paid. Thank you so much &#8212; it&#8217;s a pleasure caring for your pets!" #
    "</p>" #
    infoTable(
      infoRow("Invoice #:", "INV-" # bookingId) #
      infoRow("Sitter(s):", sitterNames) #
      infoRow("Pet(s):", petNames) #
      infoRow("Start Date:", startDate) #
      infoRow("End Date:", endDate) #
      infoRow("Payment Method:", paymentMethodUsed)
    ) #
    divider() #
    "<h3 style=\"color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 12px;\">Invoice Summary</h3>" #
    "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 0 0 8px;\">" #
    "<tr style=\"background: #f9fafb;\"><th style=\"padding: 10px 16px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600;\">Service</th><th style=\"padding: 10px 16px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600; white-space: nowrap;\">Amount</th></tr>" #
    lineItems #
    adHocItems #
    "</table>" #
    "<div style=\"background: linear-gradient(135deg, #14532d, #16a34a); border-radius: 8px; padding: 16px 20px; margin: 12px 0 20px;\">" #
    "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width: 100%;\"><tr>" #
    "<td style=\"color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 600;\">Total Paid</td>" #
    "<td style=\"color: #ffffff; font-size: 20px; font-weight: 700; text-align: right;\">" # totalPaid # "</td>" #
    "</tr></table></div>" #
    divider() #
    "<div style=\"background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;\">" #
    "<p style=\"color: #166534; font-size: 15px; margin: 0; font-weight: 600;\">We&#8217;d love your feedback!</p>" #
    "<p style=\"color: #15803d; font-size: 14px; margin: 8px 0 0; line-height: 1.6;\">" #
    "Your rating helps " # sitterName # " grow their business and helps other pet owners make great choices. " #
    "It only takes 30 seconds &#8212; thank you!" #
    "</p>" #
    "</div>" #
    "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width: 100%; margin: 24px 0;\">" #
    "<tr>" #
    "<td style=\"padding-right: 8px;\">" #
    "<a href=\"" # rateUrl # "\" style=\"display: block; background: linear-gradient(135deg, #3730a3, #4f46e5); color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; text-align: center;\">&#9733; Rate " # sitterName # "</a>" #
    "</td>" #
    "<td style=\"padding-left: 8px;\">" #
    "<a href=\"" # bookAgainUrl # "\" style=\"display: block; background: linear-gradient(135deg, #92400e, #f59e0b); color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; text-align: center;\">&#128279; Book Again</a>" #
    "</td>" #
    "</tr></table>" #
    footer()
  };

  // ============================================================
  // Template: Support Ticket Received (to SITTER — confirmation)
  // ============================================================
  public func supportTicketReceivedSitter(
    sitterName : Text,
    ticketId   : Text,
    issue      : Text,
  ) : Text {
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Support request received &#128515;</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">Hi " # sitterName # ", we have received your support request. Our team will review it shortly. No admin has been given access to your account yet — access is only granted after explicit approval and you will be notified immediately when that happens.</p>" #
    infoTable(
      infoRow("Ticket ID:", ticketId) #
      infoRow("Your issue:", issue)
    ) #
    divider() #
    "<p style=\"color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;\">Your data remains private. If an admin is granted limited access to help resolve your issue, you will receive an email notification immediately. Access is automatically revoked when your ticket is resolved.</p>" #
    footer()
  };

  // ============================================================
  // Template: New Support Ticket (to ADMIN — alert)
  // ============================================================
  public func supportTicketNotifyAdmin(
    sitterName : Text,
    ticketId   : Text,
    issue      : Text,
    adminUrl   : Text,
  ) : Text {
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">New support ticket opened &#128276;</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">A sitter has opened a support request. Review the details below and grant access if needed.</p>" #
    infoTable(
      infoRow("Ticket ID:", ticketId) #
      infoRow("Sitter:", sitterName) #
      infoRow("Issue:", issue)
    ) #
    divider() #
    "<div style=\"background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #92400e; font-size: 14px; margin: 0; font-weight: 600;\">&#128274; Admin access is NOT granted automatically</p>" #
    "<p style=\"color: #78350f; font-size: 13px; margin: 8px 0 0; line-height: 1.6;\">You must explicitly grant scoped access from the admin panel. The sitter will be notified when access is granted and when it is revoked.</p>" #
    "</div>" #
    ctaButton("Open Admin Panel", adminUrl) #
    footer()
  };

  // ============================================================
  // Template: Admin Access Granted (to SITTER — notification)
  // ============================================================
  public func supportAccessGrantedSitter(
    sitterName : Text,
    ticketId   : Text,
  ) : Text {
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Admin access granted for your support ticket</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">Hi " # sitterName # ", an admin has been given limited, scoped access to your account to help resolve your support ticket. This access is temporary and will be automatically revoked when your ticket is closed.</p>" #
    infoTable(
      infoRow("Ticket ID:", ticketId) #
      infoRow("Access scope:", "Limited — only the minimum needed to resolve your issue") #
      infoRow("Duration:", "Until ticket is resolved")
    ) #
    divider() #
    "<div style=\"background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #1e40af; font-size: 14px; margin: 0; font-weight: 600;\">&#128274; Your data security</p>" #
    "<p style=\"color: #1d4ed8; font-size: 13px; margin: 8px 0 0; line-height: 1.6;\">All admin access events are logged in our audit trail. You will receive another email when the ticket is resolved and access is revoked. Questions? Visit <a href=\"https://pawspect.co\" style=\"color: #4f46e5;\">pawspect.co</a>.</p>" #
    "</div>" #
    footer()
  };

  // ============================================================
  // Template: Support Ticket Resolved (to SITTER — confirmation + access revoked)
  // ============================================================
  public func supportTicketResolvedSitter(
    sitterName : Text,
    ticketId   : Text,
    adminNotes : Text,
  ) : Text {
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Your support ticket has been resolved &#10003;</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">Hi " # sitterName # ", your support request has been resolved and any admin access to your account has been immediately revoked. Your data is private again.</p>" #
    infoTable(
      infoRow("Ticket ID:", ticketId) #
      (if (adminNotes != "") { infoRow("Resolution notes:", adminNotes) } else { "" })
    ) #
    divider() #
    "<div style=\"background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #166534; font-size: 14px; margin: 0; font-weight: 600;\">&#128274; Admin access has been revoked</p>" #
    "<p style=\"color: #15803d; font-size: 13px; margin: 8px 0 0; line-height: 1.6;\">No admin has access to your account data. All access events are permanently logged in our audit trail. If you need further help, please open a new support ticket from your dashboard.</p>" #
    "</div>" #
    footer()
  };

  // ============================================================
  // Template: Deal Offer / Coupon Email (to CLIENT from sitter)
  // ============================================================
  public func dealOfferEmail(
    clientName    : Text,
    sitterName    : Text,
    description   : Text,
    discountText  : Text,
    couponCode    : Text,
    expirationText : Text,
    bookingUrl    : Text,
  ) : Text {
    header() #
    "<div style=\"text-align: center; margin: 0 0 32px;\">" #
    "<div style=\"display: inline-block; background: linear-gradient(135deg, #92400e, #f59e0b); color: #ffffff; font-size: 28px; font-weight: 900; padding: 14px 40px; border-radius: 50px; letter-spacing: -0.5px;\">" # discountText # "</div>" #
    "</div>" #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">A special offer, just for you &#127775;</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">" #
    "Hi " # clientName # ", <strong>" # sitterName # "</strong> has sent you an exclusive deal as a thank-you for being a valued client. Use the code below when booking:" #
    "</p>" #
    (if (description != "") {
      "<div style=\"background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 18px 22px; margin: 0 0 24px;\">" #
      "<p style=\"color: #1e40af; font-size: 14px; margin: 0; font-weight: 600; margin-bottom: 6px;\">Message from " # sitterName # ":</p>" #
      "<p style=\"color: #1d4ed8; font-size: 15px; margin: 0; line-height: 1.7; font-style: italic;\">&ldquo;" # description # "&rdquo;</p>" #
      "</div>"
    } else { "" }) #
    "<div style=\"background: #1e1b4b; border-radius: 12px; padding: 28px 24px; margin: 0 0 24px; text-align: center;\">" #
    "<p style=\"color: rgba(255,255,255,0.6); font-size: 13px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 10px;\">Your Coupon Code</p>" #
    "<div style=\"background: rgba(255,255,255,0.08); border: 2px dashed rgba(245,158,11,0.7); border-radius: 8px; padding: 14px 24px; display: inline-block;\">" #
    "<span style=\"color: #fbbf24; font-size: 32px; font-weight: 900; letter-spacing: 4px; font-family: 'Courier New', monospace;\">" # couponCode # "</span>" #
    "</div>" #
    "<p style=\"color: rgba(255,255,255,0.5); font-size: 12px; margin: 12px 0 0;\">Copy this code and enter it at checkout</p>" #
    "</div>" #
    infoTable(
      infoRow("Discount:", discountText) #
      infoRow("Expires:", expirationText) #
      infoRow("Sitter:", sitterName)
    ) #
    divider() #
    "<div style=\"background: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #713f12; font-size: 13px; margin: 0; line-height: 1.6;\">" #
    "&#9201; This offer expires on <strong>" # expirationText # "</strong>. Book now to take advantage!" #
    "</p>" #
    "</div>" #
    "<div style=\"margin: 28px 0;\">" #
    "<a href=\"" # bookingUrl # "\" style=\"background: linear-gradient(135deg, #92400e, #f59e0b); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 700; display: inline-block;\">&rarr; Book Now &amp; Use Code</a>" #
    "</div>" #
    divider() #
    "<p style=\"color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.6;\">" #
    "This offer was sent by " # sitterName # " through Pawspect. Pawspect is a software platform only &#8212; all services are between you and your independent sitter. " #
    "Data Driven Design Group, LLC is not a party to any service agreements. &bull; <a href=\"https://pawspect.co\" style=\"color: #4f46e5; text-decoration: none;\">pawspect.co</a>" #
    "</p>" #
    footer()
  };

  // ============================================================
  // Template: Booking Declined with Alternative Windows (to CLIENT)
  // ============================================================
  public type AlternativeWindow = {
    date : Text;
    time : Text;
    duration : Text;
  };

  public func bookingDeclined(
    sitterName         : Text,
    clientName         : Text,
    bookingDate        : Text,
    bookingTime        : Text,
    services           : Text,
    petNames           : Text,
    declineReason      : Text,
    alternativeWindows : [AlternativeWindow],
    _sitterId          : Text,
    appUrl             : Text,
  ) : { subject : Text; html : Text } {

    let subject = sitterName # " sent you new booking times \u{2014} act fast before they fill up!";

    // Build alternative window cards
    let windowCards = if (alternativeWindows.size() == 0) {
      "<div style=\"background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px 24px; margin: 0 0 20px; text-align: center;\">" #
      "<p style=\"color: #6b7280; font-size: 15px; margin: 0; line-height: 1.7;\">" #
      "We hope you find a great sitter soon. You can search for available sitters on " #
      "<a href=\"" # appUrl # "\" style=\"color: #4f46e5; font-weight: 600; text-decoration: none;\">Pawspect</a>." #
      "</p>" #
      "</div>"
    } else {
      let cards = alternativeWindows.foldLeft(
        "",
        func(acc : Text, w : AlternativeWindow) : Text {
          let deepLink = appUrl # "/#/find-sitters";
          acc #
          "<div style=\"background: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px; padding: 18px 22px; margin: 0 0 14px; display: flex; align-items: center; justify-content: space-between;\">" #
          "<div>" #
          "<p style=\"color: #92400e; font-size: 16px; font-weight: 700; margin: 0 0 4px;\">&#128197; " # w.date # "</p>" #
          "<p style=\"color: #b45309; font-size: 14px; margin: 0;\">" #
          "&#128336; " # w.time #
          (if (w.duration != "") { " &bull; " # w.duration } else { "" }) #
          "</p>" #
          "</div>" #
          "<a href=\"" # deepLink # "\" style=\"background: linear-gradient(135deg, #92400e, #f59e0b); color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-size: 14px; font-weight: 700; white-space: nowrap; display: inline-block;\">&rarr; Book This Time</a>" #
          "</div>"
        }
      );
      cards
    };

    let urgencySection = if (alternativeWindows.size() > 0) {
      "<div style=\"background: linear-gradient(135deg, #7f1d1d, #dc2626); border-radius: 10px; padding: 18px 22px; margin: 0 0 24px;\">" #
      "<p style=\"color: #ffffff; font-size: 16px; font-weight: 800; margin: 0 0 6px;\">&#9889; These windows are available NOW</p>" #
      "<p style=\"color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; line-height: 1.6;\">" #
      "Book before they fill up. Other clients may take these spots at any time. " #
      "Tap a <strong>Book This Time</strong> button above to lock in your date and time instantly." #
      "</p>" #
      "</div>"
    } else { "" };

    let html = header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">An update on your booking with " # sitterName # "</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">" #
    "Hi " # clientName # ", " # sitterName # " wasn't able to take your booking at the original time, " #
    "but wants to help you find a time that works. Here are the original booking details:" #
    "</p>" #
    infoTable(
      infoRow("Service(s):", services) #
      infoRow("Pet(s):", petNames) #
      infoRow("Requested Date:", bookingDate) #
      infoRow("Requested Time:", bookingTime)
    ) #
    divider() #
    "<h3 style=\"color: #374151; font-size: 16px; font-weight: 700; margin: 0 0 12px;\">Message from " # sitterName # ":</h3>" #
    "<div style=\"border-left: 4px solid #f59e0b; background: #fffbeb; border-radius: 0 10px 10px 0; padding: 16px 20px; margin: 0 0 28px;\">" #
    "<p style=\"color: #78350f; font-size: 15px; font-style: italic; margin: 0; line-height: 1.7;\">&ldquo;" # declineReason # "&rdquo;</p>" #
    "</div>" #
    (if (alternativeWindows.size() > 0) {
      "<h3 style=\"color: #111827; font-size: 17px; font-weight: 700; margin: 0 0 14px;\">&#127775; Available Times Just for You:</h3>"
    } else { "" }) #
    windowCards #
    urgencySection #
    divider() #
    "<p style=\"color: #4b5563; font-size: 14px; line-height: 1.7; margin: 0 0 8px;\">" #
    "Questions or need a different time? Visit " #
    "<a href=\"" # appUrl # "\" style=\"color: #4f46e5; text-decoration: none; font-weight: 600;\">Pawspect</a> " #
    "to find available sitters, or reply to this email." #
    "</p>" #
    "<p style=\"color: #9ca3af; font-size: 12px; margin: 16px 0 0; line-height: 1.6;\">" #
    "Pawspect is a software platform only. All service arrangements are between sitter and client. " #
    "Data Driven Design Group, LLC is not a party to any service agreements. &bull; <a href=\"https://pawspect.co\" style=\"color: #9ca3af; text-decoration: none;\">Data Driven Design Group, LLC | pawspect.co</a>" #
    "</p>" #
    footer();

    { subject; html };
  };

  // ============================================================
  // Template: Booking Cancelled (to CLIENT)
  // ============================================================
  public func bookingCancelledClient(
    clientName     : Text,
    bookingId      : Text,
    sitterName     : Text,
    sitterEmail    : Text,
    petNames       : Text,
    startDate      : Text,
    cancelReason   : Text,
    within24Hours  : Bool,
    appUrl         : Text,
  ) : Text {
    let chargeWarning = if (within24Hours) {
      "<div style=\"background: #fef3c7; border: 2px solid #f59e0b; border-radius: 10px; padding: 18px 22px; margin: 0 0 24px;\">" #
      "<p style=\"color: #92400e; font-size: 15px; font-weight: 700; margin: 0 0 6px;\">&#9888;&#65039; Cancellation within 24 hours — potential full charge</p>" #
      "<p style=\"color: #78350f; font-size: 14px; margin: 0; line-height: 1.7;\">" #
      "You have cancelled within 24 hours of your scheduled service. Per Pawspect&#8217;s cancellation policy, " #
      "<strong>" # sitterName # " may charge the full invoice amount</strong> at their discretion. " #
      "Any resolution is between you and your sitter. Pawspect is a software platform only and is not a party to payment disputes." #
      "</p>" #
      "</div>"
    } else { "" };
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Booking cancelled</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">" #
    "Hi " # clientName # ", your booking has been cancelled. Here&#8217;s a summary for your records:" #
    "</p>" #
    infoTable(
      infoRow("Booking ID:", "#" # bookingId) #
      infoRow("Sitter:", sitterName) #
      infoRow("Pet(s):", petNames) #
      infoRow("Scheduled Date:", startDate) #
      infoRow("Cancelled by:", "You") #
      infoRow("Reason:", cancelReason) #
      infoRow("Status:", "Cancelled")
    ) #
    divider() #
    chargeWarning #
    "<div style=\"background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #374151; font-size: 14px; margin: 0; line-height: 1.7;\">" #
    "Need pet care? You can search for available sitters and book again anytime on Pawspect." #
    "</p>" #
    "</div>" #
    ctaButton("Find a Sitter on Pawspect", appUrl) #
    clientFooter(sitterEmail, sitterName)
  };

  // ============================================================
  // Template: Booking Cancelled by Client (to SITTER — notification)
  // ============================================================
  public func bookingCancelledSitter(
    sitterName     : Text,
    clientName     : Text,
    clientPhone    : Text,
    bookingId      : Text,
    petNames       : Text,
    startDate      : Text,
    cancelReason   : Text,
    within24Hours  : Bool,
    appUrl         : Text,
  ) : Text {
    let charge24HourAlert = if (within24Hours) {
      "<div style=\"background: #fef3c7; border: 2px solid #f59e0b; border-radius: 10px; padding: 18px 22px; margin: 0 0 24px;\">" #
      "<p style=\"color: #92400e; font-size: 15px; font-weight: 700; margin: 0 0 6px;\">&#128176; Cancellation within 24 hours &#8212; you may charge the full amount</p>" #
      "<p style=\"color: #78350f; font-size: 14px; margin: 0; line-height: 1.7;\">" #
      "This cancellation occurred within 24 hours of the scheduled service. " #
      "<strong>You are entitled to charge the full invoice amount</strong> per Pawspect&#8217;s cancellation policy. " #
      "This is entirely at your discretion. If you choose to charge, update the invoice in your portal. " #
      "If you choose not to charge, no action is needed." #
      "</p>" #
      "</div>"
    } else { "" };
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;\">Booking cancelled by client</h2>" #
    "<p style=\"color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;\">" #
    "Hi " # sitterName # ", <strong>" # clientName # "</strong> has cancelled the following booking. Details below:" #
    "</p>" #
    charge24HourAlert #
    infoTable(
      infoRow("Booking ID:", "#" # bookingId) #
      infoRow("Client:", clientName) #
      infoRow("Client Phone:", clientPhone) #
      infoRow("Pet(s):", petNames) #
      infoRow("Scheduled Date:", startDate) #
      infoRow("Cancellation Reason:", cancelReason) #
      infoRow("Status:", "Cancelled")
    ) #
    divider() #
    "<div style=\"background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #1e40af; font-size: 14px; margin: 0; font-weight: 600;\">Next steps</p>" #
    "<p style=\"color: #1d4ed8; font-size: 13px; margin: 8px 0 0; line-height: 1.6;\">" #
    "Log in to your Pawspect dashboard to update the invoice if applicable. " #
    "The time slot is now available for new bookings." #
    "</p>" #
    "</div>" #
    ctaButton("View in Your Dashboard", appUrl) #
    "<p style=\"color: #9ca3af; font-size: 12px; margin: 16px 0 0; line-height: 1.6;\">" #
    "Pawspect is a software platform only. All payment arrangements are between you and your client." #
    "</p>" #
    footer()
  };

  // ---------------------------------------------------------------------------
  // GDPR Export Confirmation
  // ---------------------------------------------------------------------------
  public func gdprExportConfirmation(sitterName : Text) : Text {
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 16px;\">Your data export is ready, " # sitterName # "</h2>" #
    "<p style=\"color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px;\">" #
    "You requested a copy of your Pawspect data. Your export has been generated and delivered to you." #
    "</p>" #
    "<div style=\"background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;\">" #
    "<strong>What's included:</strong> Your profile, booking history, payment records, and account data." #
    "</p>" #
    "</div>" #
    divider() #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;\">" #
    "If you did not request this export, please contact us immediately via <a href=\"https://pawspect.co\" style=\"color: #4f46e5;\">pawspect.co</a>. " #
    "Pawspect is a software platform only. Data Driven Design Group, LLC is not a party to any service agreements." #
    "</p>" #
    footer()
  };

  // ---------------------------------------------------------------------------
  // Ad Hoc Job Assignment (to CO-SITTER when assigned to an off-app job)
  // ---------------------------------------------------------------------------
  public func adHocJobAssignmentEmail(
    coSitterName  : Text,
    assigningName : Text,
    service       : Text,
    jobDate       : Text,
    startTime     : Text,
    endTime       : Text,
    earningShare  : Text,
    portalUrl     : Text,
  ) : Text {
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 16px;\">Off-app job assigned to you, " # coSitterName # "</h2>" #
    "<p style=\"color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px;\">" #
    assigningName # " has assigned you to an off-app client job. Here are the details:" #
    "</p>" #
    infoTable(
      infoRow("Service",    service) #
      infoRow("Date",       jobDate) #
      infoRow("Time",       startTime # " \u{2013} " # endTime) #
      (if (earningShare != "") { infoRow("Your share", earningShare) } else { "" })
    ) #
    "<div style=\"background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;\">" #
    "<strong>Off-app job:</strong> This job was booked outside the Pawspect app. " #
    "The client is managed directly by " # assigningName # " and is not visible in the app." #
    "</p>" #
    "</div>" #
    ctaButton("View in Sitter Portal", portalUrl) #
    divider() #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;\">" #
    "Pawspect is a software platform only. All arrangements are between sitters directly." #
    "</p>" #
    footer()
  };

  // ---------------------------------------------------------------------------
  // GDPR Anonymize Confirmation
  // ---------------------------------------------------------------------------
  public func gdprAnonymizeConfirmation(sitterName : Text) : Text {
    header() #
    "<h2 style=\"color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 16px;\">Account anonymized, " # sitterName # "</h2>" #
    "<p style=\"color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px;\">" #
    "Your Pawspect account has been anonymized as requested. Your personal information has been replaced with placeholder data." #
    "</p>" #
    "<div style=\"background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px 20px; margin: 20px 0;\">" #
    "<p style=\"color: #166534; font-size: 14px; margin: 0; line-height: 1.6;\">" #
    "<strong>What happened:</strong> Your name, phone, photo, bio, and location have been replaced. " #
    "Your booking history is retained in anonymized form for platform records as permitted by our Terms." #
    "</p>" #
    "</div>" #
    "<p style=\"color: #374151; font-size: 14px; line-height: 1.7;\">" #
    "Your account has also been deactivated. If you have any questions, please visit <a href=\"https://pawspect.co\" style=\"color: #4f46e5;\">pawspect.co</a>." #
    "</p>" #
    divider() #
    "<p style=\"color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;\">" #
    "Pawspect is a software platform only. Data Driven Design Group, LLC is not a party to any service agreements." #
    "</p>" #
    footer()
  };

};
