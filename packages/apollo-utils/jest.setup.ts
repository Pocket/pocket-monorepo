// Unset apollo_graph_ref -- if you've set it locally to connect
// to apollo studio for development, it will cause errors with
// our test setup which also specifies the variant
process.env.APOLLO_GRAPH_REF = '';
