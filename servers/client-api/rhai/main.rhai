import "claims_forwarding" as claims_forwarding;
import "header_extraction" as header_extraction;

fn process_request(request) {
  header_extraction::process_request(request);
  claims_forwarding::process_request(request);
}

// Additional header forwarding logic to the subgraphs
fn subgraph_service(service, subgraph) {
  let request_callback = Fn("process_request");  
  service.map_request(request_callback);
}