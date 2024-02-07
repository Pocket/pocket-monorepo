fn process_request(request) {
    let claims = request.context[Router.APOLLO_AUTHENTICATION_JWT_CLAIMS];
    if claims ==() {
      return;
    }
    // Add claims from JWT, renaming to appropriate header value per contract
    // These end up being case-insensitive but are camelCased for readability
    let claim_names_map = #{
      api_id: "apiId",
      application_is_native: "applicationIsNative",
      application_is_trusted: "applicationIsTrusted",
      application_name: "applicationName",
      consumer_key: "consumerKey",
      email: "email",
      encoded_guid: "encodedGuid",
      encoded_id: "encodedId",
      guid: "guid",
      premium: "premium",
      roles: "roles",
    };
    for claim_name in claim_names_map.keys() {
      let claim = claims[claim_name];
      // Concatenate array headers into a comma-separated string
      if (type_of(claim) == "array") {
        claim = claim.reduce(|concat, v|
          if concat == () { v.to_string() } else { concat + `,${v}`});
      }
      if (claim != ()) { 
        request.subgraph.headers[claim_names_map[claim_name]] = claim.to_string() 
      };
    }
    // Do not forward the 'sub' claim as userId if it's 'anonymous'
    let sub_claim = claims["sub"];
    if (sub_claim != () && sub_claim != "anonymous") {
      request.subgraph.headers["userId"] = sub_claim;
    }
    // Indicate if the subject is a Mozilla account ID (formerly Firefox Account)
    if (claims["iss"] == "fxa-webhook-proxy") {
      request.subgraph.headers["fxaUserId"] = claims["sub"].to_string();
    }
}
