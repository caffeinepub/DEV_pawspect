// Domain types for the in-app notification system.
// Notifications are delivered inside the app (polling-based, no WebSockets on IC).
// They are never sent to non-app (ad hoc) clients.
module {

  /// A single in-app notification delivered to a sitter.
  public type NotificationRecord = {
    id                : Nat;
    recipientSitterId : Nat;
    title             : Text;
    body              : Text;
    createdAt         : Int;   // nanosecond timestamp
    isRead            : Bool;
    notificationType  : Text;  // e.g. "adhoc_assignment", "booking", "team"
  };

};
