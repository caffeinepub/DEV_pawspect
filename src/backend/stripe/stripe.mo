import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Error "mo:core/Error";
import List "mo:core/List";
import OutCall "../http-outcalls/outcall";

module {
  public type StripeConfiguration = {
    secretKey : Text;
    allowedCountries : [Text];
  };

  public type ShoppingItem = {
    currency : Text;
    productName : Text;
    productDescription : Text;
    priceInCents : Nat;
    quantity : Nat;
  };

  public func createCheckoutSession(configuration : StripeConfiguration, caller : Principal, items : [ShoppingItem], successUrl : Text, cancelUrl : Text, transform : OutCall.Transform) : async Text {
    let requestBody = buildCheckoutSessionBody(items, configuration.allowedCountries, successUrl, cancelUrl, ?caller.toText());
    try {
      await callStripe(configuration, "v1/checkout/sessions", #post, ?requestBody, transform);
    } catch (error) {
      Runtime.trap("Failed to create checkout session: " # error.message());
    };
  };

  /// Create a subscription checkout session using an existing Stripe Price ID.
  /// This is the correct method for recurring subscriptions — the priceId must
  /// already exist in the Stripe dashboard (e.g. price_1TOPXqGwjvHG37QCJ9jRWoSM).
  public func createSubscriptionCheckoutSession(
    configuration : StripeConfiguration,
    caller : Principal,
    priceId : Text,
    successUrl : Text,
    cancelUrl : Text,
    transform : OutCall.Transform,
  ) : async Text {
    let requestBody = buildSubscriptionSessionBody(priceId, successUrl, cancelUrl, ?caller.toText());
    try {
      await callStripe(configuration, "v1/checkout/sessions", #post, ?requestBody, transform);
    } catch (error) {
      Runtime.trap("Failed to create subscription checkout session: " # error.message());
    };
  };

  public type StripeSessionStatus = {
    #failed : { error : Text };
    #completed : { response : Text; userPrincipal : ?Text };
  };

  public func getSessionStatus(configuration : StripeConfiguration, sessionId : Text, transform : OutCall.Transform) : async StripeSessionStatus {
    try {
      let reply = await callStripe(configuration, "v1/checkout/sessions/" # sessionId, #get, null, transform);
      if (reply.contains(#text "\"error\"")) {
        #failed({ error = "Stripe API error" });
      } else {
        let extractedPrincipal = extractClientReferenceId(reply);
        #completed({ response = reply; userPrincipal = extractedPrincipal });
      };
    } catch (error) {
      #failed({ error = error.message() });
    };
  };

  /// Extract the Stripe customer ID from a session JSON response.
  public func extractCustomerId(jsonText : Text) : ?Text {
    let patterns = ["\"customer\":\"", "\"customer\": \""];
    for (pattern in patterns.values()) {
      if (jsonText.contains(#text pattern)) {
        let parts = jsonText.split(#text pattern);
        switch (parts.next()) {
          case (null) {};
          case (?_) {
            switch (parts.next()) {
              case (?afterPattern) {
                switch (afterPattern.split(#text "\"").next()) {
                  case (?value) {
                    if (value.size() > 0) { return ?value };
                  };
                  case (_) {};
                };
              };
              case (null) {};
            };
          };
        };
      };
    };
    null;
  };

  /// Extract the Stripe subscription ID from a session JSON response.
  public func extractSubscriptionId(jsonText : Text) : ?Text {
    let patterns = ["\"subscription\":\"", "\"subscription\": \""];
    for (pattern in patterns.values()) {
      if (jsonText.contains(#text pattern)) {
        let parts = jsonText.split(#text pattern);
        switch (parts.next()) {
          case (null) {};
          case (?_) {
            switch (parts.next()) {
              case (?afterPattern) {
                switch (afterPattern.split(#text "\"").next()) {
                  case (?value) {
                    if (value.size() > 0) { return ?value };
                  };
                  case (_) {};
                };
              };
              case (null) {};
            };
          };
        };
      };
    };
    null;
  };

  func callStripe(configuration : StripeConfiguration, endpoint : Text, method : { #get; #post }, body : ?Text, transform : OutCall.Transform) : async Text {
    let headers = [
      {
        name = "authorization";
        value = "Bearer " # configuration.secretKey;
      },
      {
        name = "content-type";
        value = if (method == #get) { "application/json" } else {
          "application/x-www-form-urlencoded";
        };
      },
    ];
    let url = "https://api.stripe.com/" # endpoint;
    switch (method) {
      case (#get) {
        switch (body) {
          case (?_) { Runtime.trap("HTTP GET does not support a HTTP body") };
          case (null) {};
        };
        await OutCall.httpGetRequest(url, headers, transform);
      };
      case (#post) {
        let postBody = switch (body) {
          case (?rawBody) { rawBody };
          case (null) { Runtime.trap("HTTP POST requires a HTTP body") };
        };
        await OutCall.httpPostRequest(url, headers, postBody, transform);
      };
    };
  };

  func urlEncode(text : Text) : Text {
    text.replace(#char ' ', "%20").replace(#char '&', "%26").replace(#char '=', "%3D");
  };

  /// Build a subscription checkout body using an existing Stripe Price ID.
  /// Subscription mode requires `line_items[][price]` (an existing price ID),
  /// not inline `price_data`. No shipping address collection for subscriptions.
  func buildSubscriptionSessionBody(priceId : Text, successUrl : Text, cancelUrl : Text, clientReferenceId : ?Text) : Text {
    let params = List.empty<Text>();
    params.add("line_items[0][price]=" # urlEncode(priceId));
    params.add("line_items[0][quantity]=1");
    params.add("mode=subscription");
    params.add("success_url=" # urlEncode(successUrl));
    params.add("cancel_url=" # urlEncode(cancelUrl));
    switch (clientReferenceId) {
      case (?id) { params.add("client_reference_id=" # urlEncode(id)) };
      case (null) {};
    };
    params.values().join("&");
  };

  /// Build a one-time payment checkout body using inline price_data.
  /// Kept for backward compatibility with non-subscription payment flows.
  func buildCheckoutSessionBody(items : [ShoppingItem], allowedCountries : [Text], successUrl : Text, cancelUrl : Text, clientReferenceId : ?Text) : Text {
    let params = List.empty<Text>();
    var index = 0;
    for (item in items.vals()) {
      let indexText = index.toText();
      params.add("line_items[" # indexText # "][price_data][currency]=" # urlEncode(item.currency));
      params.add("line_items[" # indexText # "][price_data][product_data][name]=" # urlEncode(item.productName));
      params.add("line_items[" # indexText # "][price_data][product_data][description]=" # urlEncode(item.productDescription));
      params.add("line_items[" # indexText # "][price_data][unit_amount]=" # item.priceInCents.toText());
      params.add("line_items[" # indexText # "][quantity]=" # item.quantity.toText());
      index += 1;
    };
    params.add("mode=payment");
    params.add("success_url=" # urlEncode(successUrl));
    params.add("cancel_url=" # urlEncode(cancelUrl));
    for (country in allowedCountries.vals()) {
      params.add("shipping_address_collection[allowed_countries][0]=" # urlEncode(country));
    };
    switch (clientReferenceId) {
      case (?id) { params.add("client_reference_id=" # urlEncode(id)) };
      case (null) {};
    };
    params.values().join("&");
  };

  func extractClientReferenceId(jsonText : Text) : ?Text {
    let patterns = ["\"client_reference_id\":\"", "\"client_reference_id\": \""];
    for (pattern in patterns.values()) {
      if (jsonText.contains(#text pattern)) {
        let parts = jsonText.split(#text pattern);
        switch (parts.next()) {
          case (null) {};
          case (?_) {
            switch (parts.next()) {
              case (?afterPattern) {
                switch (afterPattern.split(#text "\"").next()) {
                  case (?value) {
                    if (value.size() > 0) {
                      return ?value;
                    };
                  };
                  case (_) {};
                };
              };
              case (null) {};
            };
          };
        };
      };
    };
    null;
  };
};
