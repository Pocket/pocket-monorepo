// Extract roles array into space-separated scope field
fn process_request(request) {
  let claims = request.context["apollo_authentication::JWT::claims"];
  let roles = claims["roles"];
  let scope = "";
  if roles.len() > 1 {
    scope = roles[0];
  }
  if roles.len() > 2 {
    for i in 1..roles.len() {
      scope += ' ';
      scope += roles[i];
    }
  }
  claims["scope"] = scope;
  request.context["apollo_authentication::JWT::claims"] = claims;
};
