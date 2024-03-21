interface EnvironmentVariable {
  name: string;
  value: string;
}

interface SecretEnvironmentVariable {
  name: string;
  valueFrom: string;
}

interface HealthcheckVariable {
  command: string[];
  interval: number;
  retries: number;
  startPeriod: number;
  timeout: number;
}

interface PortMapping {
  containerPort: number;
  hostPort: number;
  protocol?: string;
}

interface MountPoint {
  containerPath: string;
  readOnly?: boolean;
  sourceVolume: string;
}

interface DependsOn {
  containerName: string;
  condition: 'START' | 'COMPLETE' | 'SUCCESS' | 'HEALTHY';
}

interface Ulimit {
  name: string;
  softLimit: number;
  hardLimit: number;
}

export interface ApplicationECSContainerDefinitionProps {
  containerImage?: string;
  imageSha?: string;
  logDatetimeFormat?: string;
  logGroup?: string;
  logGroupRegion?: string;
  logMultilinePattern?: string;
  logStreamPrefix?: string;
  portMappings?: PortMapping[];
  envVars?: EnvironmentVariable[];
  secretEnvVars?: SecretEnvironmentVariable[];
  command?: string[];
  name: string;
  repositoryCredentialsParam?: string;
  memoryReservation?: number;
  cpu?: number;
  healthCheck?: HealthcheckVariable;
  mountPoints?: MountPoint[];
  dependsOn?: DependsOn[];
  entryPoint?: string[];
  essential?: boolean;
  ulimits?: Ulimit[];
  stopTimeout?: number;
}

export function buildDefinitionJSON(
  config: ApplicationECSContainerDefinitionProps,
): string {
  // logGroup is optional in PocketALBApplicationProps, and provides a default log group if unset.
  if (!config.logGroup) {
    throw new Error('logGroup is required in buildDefinitionJSON');
  }

  if (config.portMappings) {
    config.portMappings = config.portMappings.map(
      (portMapping: PortMapping) => {
        if (!portMapping.protocol) {
          portMapping.protocol = 'tcp';
        }

        return portMapping;
      },
    );
  }

  const containerDefinition = {
    dnsSearchDomains: null,
    environmentFiles: null,
    logConfiguration: {
      logDriver: 'awslogs',
      secretOptions: [],
      options: {
        'awslogs-group': config.logGroup,
        'awslogs-region': config.logGroupRegion ?? 'us-east-1',
        'awslogs-stream-prefix': config.logStreamPrefix ?? 'ecs',
        // datetime takes precedence if datetime and multiline defined
        ...(config.logDatetimeFormat && {
          'awslogs-datetime-format': config.logDatetimeFormat,
        }),
        // regex parsing - may have negative impact on logging performance
        ...(config.logMultilinePattern && {
          'awslogs-multiline-pattern': config.logMultilinePattern,
        }),
      },
    },
    entryPoint: config.entryPoint ?? null,
    portMappings: config.portMappings ?? [],
    linuxParameters: null,
    cpu: config.cpu ?? 0,
    environment: config.envVars ?? [],
    resourceRequirements: null,
    ulimits: config.ulimits ?? null,
    repositoryCredentials: config.repositoryCredentialsParam
      ? { credentialsParameter: config.repositoryCredentialsParam }
      : null,
    dnsServers: null,
    mountPoints: config.mountPoints ?? [],
    workingDirectory: null,
    secrets: config.secretEnvVars ?? null, // env vars default is [], whereas secrets default is null. makes sense.
    dockerSecurityOptions: null,
    memory: null,
    memoryReservation: config.memoryReservation ?? null,
    volumesFrom: [],
    stopTimeout: config.stopTimeout ?? null,
    image: config.containerImage,
    startTimeout: null,
    firelensConfiguration: null,
    dependsOn: config.dependsOn ?? null,
    disableNetworking: null,
    interactive: null,
    healthCheck: config.healthCheck ?? null,
    essential: config.essential ?? true,
    links: null,
    hostname: null,
    extraHosts: null,
    pseudoTerminal: null,
    user: null,
    readonlyRootFilesystem: false,
    dockerLabels: null,
    systemControls: [],
    privileged: null,
    name: config.name,
  };

  if (config.command) {
    containerDefinition['command'] = config.command;
  }

  return JSON.stringify(containerDefinition);
}
