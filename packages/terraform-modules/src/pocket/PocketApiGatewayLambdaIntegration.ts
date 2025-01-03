import { Construct } from 'constructs';

import {
  PocketVersionedLambda,
  PocketVersionedLambdaProps,
  ApplicationBaseDNS,
  ApplicationCertificate,
} from '../index.ts';
import { Fn, TerraformMetaArguments } from 'cdktf';
import {
  lambdaPermission,
  route53Record,
  apiGatewayStage,
  apiGatewayRestApi,
  apiGatewayResource,
  apiGatewayMethod,
  apiGatewayIntegration,
  apiGatewayDomainName,
  apiGatewayDeployment,
  apiGatewayBasePathMapping,
} from '@cdktf/provider-aws';

export interface ApiGatewayLambdaRoute {
  path: string;
  // The HTTP method clients use to call this method (GET, POST, etc.)
  method: string;
  // Currently not supporting authorizer
  // authorizationType: string;
  eventHandler: PocketVersionedLambdaProps;
  // TODO
  // requestParams: Map<string, any>;
}

export interface PocketApiGatewayProps extends TerraformMetaArguments {
  name: string;
  stage: string; // https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/api_gateway_stage#stage_name
  routes: ApiGatewayLambdaRoute[];
  tags?: { [key: string]: string };
  // Should not contain lists/arrays, should only contain objects
  triggers?: apiGatewayDeployment.ApiGatewayDeploymentConfig['triggers'];
  domain?: string;
  basePath?: string;
}

interface InitializedGatewayRoute {
  lambda: PocketVersionedLambda;
  resource: apiGatewayResource.ApiGatewayResource;
  method: apiGatewayMethod.ApiGatewayMethod;
  integration: apiGatewayIntegration.ApiGatewayIntegration;
}

/**
 * Create an API Gateway with lambda handlers, optionally assigned
 * to a custom domain owned by the account.
 */
export class PocketApiGateway extends Construct {
  private apiGatewayRestApi: apiGatewayRestApi.ApiGatewayRestApi;
  private routes: InitializedGatewayRoute[];
  private apiGatewayDeployment: apiGatewayDeployment.ApiGatewayDeployment;
  private apiGatewayStage: apiGatewayStage.ApiGatewayStage;

  constructor(
    scope: Construct,
    name: string,
    private readonly config: PocketApiGatewayProps,
  ) {
    super(scope, name);
    this.apiGatewayRestApi = new apiGatewayRestApi.ApiGatewayRestApi(
      scope,
      `api-gateway-rest`,
      {
        name: config.name,
        tags: config.tags,
        provider: config.provider,
      },
    );

    // https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/api_gateway_deployment
    this.routes = this.createLambdaIntegrations(config);
    const routeDependencies = this.routes.flatMap((route) => [
      route.integration,
      route.method,
      route.resource,
      route.lambda.lambda.versionedLambda,
    ]);

    // If no triggers are provided, this resource will be redeployed only if something changes to cause it.
    const triggers = config.triggers ?? {};

    // Deployment before adding permissions, so we can restrict to the stage
    this.apiGatewayDeployment = new apiGatewayDeployment.ApiGatewayDeployment(
      scope,
      'api-gateway-deployment',
      {
        restApiId: this.apiGatewayRestApi.id,
        triggers: {
          redeployment: Fn.sha1(
            Fn.jsonencode({
              resources: routeDependencies.map((d) => d.id),
            }),
          ),
          ...triggers,
        },
        lifecycle: { createBeforeDestroy: true },
        dependsOn: routeDependencies,
        provider: config.provider,
      },
    );
    this.apiGatewayStage = new apiGatewayStage.ApiGatewayStage(
      scope,
      'api-gateway-stage',
      {
        deploymentId: this.apiGatewayDeployment.id,
        restApiId: this.apiGatewayRestApi.id,
        stageName: config.stage,
        provider: config.provider,
        tags: config.tags,
      },
    );
    if (config.domain != null) {
      this.createRoute53Record(config);
    }
    this.addInvokePermissions();
  }

  /**
   * Sets up a custom domain name for the API gateway;
   * adds ACM Certificate and configures Route 53 Record
   * @param config
   */
  private createRoute53Record(config: PocketApiGatewayProps) {
    //Set up the Base DNS stack for our application which includes a hosted SubZone
    const baseDNS = new ApplicationBaseDNS(this, `base-dns`, {
      domain: config.domain,
      tags: config.tags,
      provider: config.provider,
    });

    //Creates the Certificate for API gateway
    const apiGatewayCertificate = new ApplicationCertificate(
      this,
      `api-gateway-certificate`,
      {
        zoneId: baseDNS.zoneId,
        domain: config.domain,
        tags: this.config.tags,
        provider: config.provider,
      },
    );

    //setup custom domain name for API gateway
    const customDomainName = new apiGatewayDomainName.ApiGatewayDomainName(
      this,
      `api-gateway-domain-name`,
      {
        domainName: config.domain,
        certificateArn: apiGatewayCertificate.arn,
        dependsOn: [apiGatewayCertificate.certificateValidation],
        provider: config.provider,
        tags: config.tags,
      },
    );

    new route53Record.Route53Record(this, `apigateway-route53-domain-record`, {
      name: customDomainName.domainName,
      type: 'A',
      zoneId: baseDNS.zoneId,
      alias: {
        evaluateTargetHealth: true,
        name: customDomainName.cloudfrontDomainName,
        zoneId: customDomainName.cloudfrontZoneId,
      },
      dependsOn: [apiGatewayCertificate.certificateValidation],
      provider: config.provider,
    });

    new apiGatewayBasePathMapping.ApiGatewayBasePathMapping(
      this,
      `api-gateway-base-path-mapping`,
      {
        apiId: this.apiGatewayRestApi.id,
        stageName: this.apiGatewayStage.stageName,
        domainName: customDomainName.domainName,
        basePath: config.basePath ?? '',
        provider: config.provider,
      },
    );
  }

  /**
   * Add permissions for gateway to invoke lambda functions
   */
  private addInvokePermissions() {
    this.routes.map(({ lambda, resource, method }) => {
      const friendlyUniqueId = lambda.lambda.versionedLambda.friendlyUniqueId;
      new lambdaPermission.LambdaPermission(
        this,
        `${friendlyUniqueId}-allow-gateway-lambda-invoke`,
        {
          functionName: lambda.lambda.versionedLambda.functionName,
          action: 'lambda:InvokeFunction',
          principal: 'apigateway.amazonaws.com',
          // Grants access to invoke lambda on specified stage, method, resource path
          // note the resource path has a leading `/`
          sourceArn: `${this.apiGatewayRestApi.executionArn}/${this.apiGatewayStage.stageName}/${method.httpMethod}${resource.path}`,
          qualifier: lambda.lambda.versionedLambda.name,
          provider: this.config.provider,
        },
      );
    });
  }

  /**
   * Generate aws proxy routes handled by aws lambda
   * loops over routes and generate methods
   * @param config
   */
  private createLambdaIntegrations(config: PocketApiGatewayProps) {
    return config.routes.map((route: ApiGatewayLambdaRoute) => {
      const lambda = new PocketVersionedLambda(
        this,
        `${route.path}-lambda`,
        route.eventHandler,
      );
      const resource = new apiGatewayResource.ApiGatewayResource(
        this,
        route.path,
        {
          parentId: this.apiGatewayRestApi.rootResourceId,
          pathPart: route.path,
          restApiId: this.apiGatewayRestApi.id,
          provider: config.provider,
        },
      );
      const method = new apiGatewayMethod.ApiGatewayMethod(
        this,
        `${route.path}-method`,
        {
          restApiId: this.apiGatewayRestApi.id,
          resourceId: resource.id,
          // authorization: route.authorizationType,
          authorization: 'NONE',
          httpMethod: route.method,
          provider: config.provider,
        },
      );
      const integration = new apiGatewayIntegration.ApiGatewayIntegration(
        this,
        `${route.path}-integration`,
        {
          httpMethod: route.method,
          integrationHttpMethod: 'POST', // lambda has to be post
          resourceId: resource.id,
          restApiId: this.apiGatewayRestApi.id,
          type: 'AWS_PROXY',
          uri: lambda.lambda.versionedLambda.invokeArn,
          provider: config.provider,
        },
      );
      return { lambda, resource, method, integration };
    });
  }
}
