// Private data record for a sitter (earningsGoal, emergencyContact).
// Stored separately from SitterProfile.Public to avoid breaking the existing stable schema.
module {
  public type SitterPrivateData = {
    earningsGoal     : ?Nat;
    emergencyContact : ?Text;
  };

  /// Token used for GDPR export and account anonymization confirmation flows.
  /// Sent to the sitter's email; one-time use.
  public type GdprToken = {
    id        : Text;        // unique token string
    sitterId  : Principal;   // the principal who requested the operation
    action    : Text;        // "export" or "anonymize"
    createdAt : Int;         // nanoseconds since epoch
    used      : Bool;        // true once consumed
  };
};
