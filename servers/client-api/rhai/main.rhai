import "claims_forwarding" as claims_forwarding;
import "header_extraction" as header_extraction;
import "format_scopes" as format_scopes;
import "format_policies" as format_policies;

fn process_request(request) {
  header_extraction::process_request(request);
  claims_forwarding::process_request(request); 
}

fn extract_jwt_scopes(request) {
  format_scopes::process_request(request);
}

fn format_policies(request) {
  format_policies::process_request(request);
}

// Extract roles array into space-separated scope field
fn router_service(service) {
  let request_callback = Fn("extract_jwt_scopes");
  service.map_request(request_callback);
}

// Additional header forwarding logic to the subgraphs
fn subgraph_service(service, subgraph) {
  let request_callback = Fn("process_request");  
  service.map_request(request_callback);
}

// Support policies directives
fn supergraph_service(service) {
  let request_callback = Fn("format_policies");
  service.map_request(request_callback);
}