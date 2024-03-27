declare module 'apollo-server-core' {
  interface PluginDefinition {
    _: unknown;
  }
}

// This is for the graphql constraint directive and a bug in their dependencies.
// https://github.com/confuser/graphql-constraint-directive/issues/156#issuecomment-1489920089
