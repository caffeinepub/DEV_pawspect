import AccessControl "./access-control";
import Prim "mo:prim";

mixin (accessControlState : AccessControl.AccessControlState) {
  // Initialize auth (first caller becomes admin, others become users)
  public shared ({ caller }) func _initializeAccessControlWithSecret(userSecret : Text) : async () {
    try {
      switch (Prim.envVar<system>("CAFFEINE_ADMIN_TOKEN")) {
        case (null) {
          // Token not set — silently skip rather than trapping the canister
        };
        case (?adminToken) {
          AccessControl.initialize(accessControlState, caller, adminToken, userSecret);
        };
      };
    } catch (_) {
      // Never let initialization failures trap — canister must stay alive
    };
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    // Admin-only check happens inside
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    // Never trap — return false on any error
    AccessControl.isAdmin(accessControlState, caller);
  };
};
