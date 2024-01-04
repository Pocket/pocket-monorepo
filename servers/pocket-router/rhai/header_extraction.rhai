fn extract(header) {
    let header_arr = header.split(",");
    if (header_arr.is_empty) { "" } else { header_arr[0].to_string() }
};

// Extract the leftmost value from comma-separated array headers
fn process_request(request) {
    const header_map = #{
        "x-forwarded-for": "origin-client-ip",
        "X-Amzn-Trace-Id": "X-Amzn-Trace-Id",
        "transfersub": "transfersub",
    };
    // Reassign to local variable, as 'contains' can't modify the request
    let headers = request.headers;
    for key in header_map.keys() {
        if headers.contains(key) {
            let extracted = extract(headers[key]);
            request.subgraph.headers[header_map[key]] = extracted;
        }
    }
}