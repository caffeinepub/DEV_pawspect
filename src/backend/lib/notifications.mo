// Stateless helpers for building notification records.
import Types "../types/notifications";
import Time "mo:core/Time";

module {

  public type NotificationRecord = Types.NotificationRecord;

  /// Build a new notification record (not yet persisted — caller must store it).
  public func build(
    id                : Nat,
    recipientSitterId : Nat,
    title             : Text,
    body              : Text,
    notificationType  : Text,
  ) : NotificationRecord {
    {
      id;
      recipientSitterId;
      title;
      body;
      createdAt        = Time.now();
      isRead           = false;
      notificationType;
    };
  };

};
