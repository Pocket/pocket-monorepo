fn process_request(request) {
  let claims = request.context["apollo_authentication::JWT::claims"];
  let policies = request.context["apollo_authorization::policies::required"];
  if claims != () {
    if policies != () {
      for key in policies.keys() {
        let array = key.split(":");
        if array.len == 2 {
          switch array[0] {
            _ => {
              // Check if key-value pair is present in JWT claims
              // Example policy: 'is_application_native:true'
              // checks for 'is_application_native' key in JWT claims
              // then checks if the value serializes to 'true'
              if array[0] in claims {
                policies[key] = claims[array[0]].to_string() == array[1];
              }
            }
          }
        }
      }
    }
    request.context["apollo_authorization::policies::required"] = policies; 
  }
}
