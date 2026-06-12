// Public API mixin for in-app notifications (polling-based, no WebSockets on IC).
// Ad hoc job creation logic lives in main.mo because it needs access to actor-local
// Booking.Public type directly.
import Map "mo:core/Map";
import Int "mo:core/Int";
import NotifTypes "../types/notifications";
import NotifLib "../lib/notifications";

mixin (
  notificationsStore : Map.Map<Nat, NotifTypes.NotificationRecord>,
  notifCounterBox    : { var value : Nat },
) {

  /// Create a new in-app notification for a sitter.
  public shared ({ caller }) func createNotification(
    recipientSitterId : Nat,
    title             : Text,
    body              : Text,
    notificationType  : Text,
  ) : async NotifTypes.NotificationRecord {
    ignore caller;
    let notif = NotifLib.build(
      notifCounterBox.value,
      recipientSitterId,
      title,
      body,
      notificationType,
    );
    notificationsStore.add(notifCounterBox.value, notif);
    notifCounterBox.value += 1;
    notif;
  };

  /// Return the most recent 50 notifications for a sitter, newest-first.
  public query func getNotificationsBySitter(sitterId : Nat) : async [NotifTypes.NotificationRecord] {
    let all = notificationsStore.values()
      .filter(func(n : NotifTypes.NotificationRecord) : Bool { n.recipientSitterId == sitterId })
      .toArray();
    let sorted = all.sort(
      func(a : NotifTypes.NotificationRecord, b : NotifTypes.NotificationRecord) : { #less; #equal; #greater } {
        Int.compare(b.createdAt, a.createdAt)
      }
    );
    if (sorted.size() <= 50) { sorted } else { sorted.sliceToArray(0, 50) };
  };

  /// Mark a notification as read.
  public shared ({ caller }) func markNotificationRead(
    notificationId : Nat,
  ) : async { #ok; #err : Text } {
    ignore caller;
    switch (notificationsStore.get(notificationId)) {
      case (null) { #err("Notification not found: " # notificationId.toText()) };
      case (?n) {
        notificationsStore.add(notificationId, { n with isRead = true });
        #ok;
      };
    };
  };

  /// Return the count of unread notifications for a sitter.
  public query func getUnreadNotificationCount(sitterId : Nat) : async Nat {
    notificationsStore.values()
      .filter(func(n : NotifTypes.NotificationRecord) : Bool {
        n.recipientSitterId == sitterId and not n.isRead
      })
      .size();
  };

};
