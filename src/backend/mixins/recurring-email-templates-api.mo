// Mixin: recurring email template API.
// Exposes no actor-level public methods — these are pure template functions
// called internally from main.mo when dispatching recurring booking emails.
// The develop agent will wire callers in main.mo to EmailTemplates.mo
// (which is where the implementations will ultimately live per user instructions).
import RecurringEmailLib "../lib/recurring-email-templates";
import RecurringTypes "../types/recurring-bookings";

module {

  // Re-export OccurrenceRow so main.mo can construct occurrence rows
  // without importing the lib directly.
  public type OccurrenceRow = RecurringEmailLib.OccurrenceRow;

  // Delegate to lib — all 4 template functions forwarded unchanged.
  public func clientRecurringBookingReceived(
    group         : RecurringTypes.BookingGroup,
    occurrences   : [OccurrenceRow],
    sitterName    : Text,
    sitterEmail   : Text,
    totalCostText : Text,
    appUrl        : Text,
  ) : Text {
    RecurringEmailLib.clientRecurringBookingReceived(group, occurrences, sitterName, sitterEmail, totalCostText, appUrl)
  };

  public func sitterRecurringBookingAlert(
    group         : RecurringTypes.BookingGroup,
    occurrences   : [OccurrenceRow],
    sitterName    : Text,
    totalCostText : Text,
    appUrl        : Text,
  ) : Text {
    RecurringEmailLib.sitterRecurringBookingAlert(group, occurrences, sitterName, totalCostText, appUrl)
  };

  public func clientRecurringOccurrenceConfirmed(
    confirmedOccurrence : OccurrenceRow,
    allOccurrences      : [OccurrenceRow],
    group               : RecurringTypes.BookingGroup,
    sitterName          : Text,
    sitterEmail         : Text,
    clientName          : Text,
    appUrl              : Text,
  ) : Text {
    RecurringEmailLib.clientRecurringOccurrenceConfirmed(confirmedOccurrence, allOccurrences, group, sitterName, sitterEmail, clientName, appUrl)
  };

  public func clientRecurringGroupConfirmed(
    group         : RecurringTypes.BookingGroup,
    occurrences   : [OccurrenceRow],
    sitterName    : Text,
    sitterEmail   : Text,
    clientName    : Text,
    totalCostText : Text,
    appUrl        : Text,
  ) : Text {
    RecurringEmailLib.clientRecurringGroupConfirmed(group, occurrences, sitterName, sitterEmail, clientName, totalCostText, appUrl)
  };

};
