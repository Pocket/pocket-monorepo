import {
  ApolloGateway,
  GatewayConfig,
  RemoteGraphQLDataSource,
} from '@apollo/gateway';
import { IContext } from './context';
import {
  buildRequestHeadersFromPocketUser,
  buildRequestHeadersFromWebRequest,
  addRecordToRequestHeader,
} from './requestHelpers';
import config from '../config';
import { readFileSync } from 'fs';
import { serverLogger } from './express';

let options: GatewayConfig = {
  buildService({ url }) {
    return new RemoteGraphQLDataSource<IContext>({
      url,
      async willSendRequest({ request, context }) {
        // add a request id for downstream correlation of errors and logs
        request.http.headers.set('x-graph-request-id', context.requestId);
        // Pass along any headers that should be forwarded to the subgraphs
        const { token, pocketUser, webRequest, forwardHeaders } = context;
        addRecordToRequestHeader(forwardHeaders, request);

        // Pass through the jwt token if a token exists to each subgraph
        if (token) {
          request.http.headers.set('jwt', token);
        }

        if (pocketUser) {
          // We have a decoded JWT at context.pocketUser.. Let's pass down the individual properties as headers.
          // OPEN_QUESTION: is this secure? should downstream have to verify their JWT?
          // All subgraph are currently in a VPC so we can trust the headers that are sent down by the gateway
          buildRequestHeadersFromPocketUser(request, pocketUser);
        }

        if (webRequest) {
          buildRequestHeadersFromWebRequest(request, webRequest);
        }
      },
    });
  },
};

if (config.isLocal) {
  // When running locally expect a supergraph spec at ./local-supergraph.graphql
  // This can be built from a yaml file using `rover supergraph compose --config file.yaml`
  // See https://www.apollographql.com/docs/federation/quickstart/local-composition/
  // for details and file spec.
  serverLogger.info({
    message:
      'Client API (local mode) defining graph from local-supergraph.graphql',
  });
  options = {
    ...options,
    supergraphSdl: readFileSync('./local-supergraph.graphql').toString(),
  } as GatewayConfig;
}

// Initialize an ApolloGateway instance and pass it an array of
// your implementing service names and URLs
export const getAppGateway = (): ApolloGateway => new ApolloGateway(options);
