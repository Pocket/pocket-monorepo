locals {
  name   = "UserListSearch"
  env    = local.workspace.environment
  prefix = "${local.name}-${local.env}"
  tags = {
    service        = local.name
    environment    = local.env
    owner          = "Pocket"
    costCenter     = "Pocket"
    app_code       = "pocket"
    component_code = "pocket-${lower(local.name)}",
    env_code       = local.env == "Dev" ? "dev" : "prod"
  }

  aws_path_prefix      = "${local.name}/${local.env}/"
  container_port       = 4000
  container_name       = "node"
  container_credential = "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:Shared/DockerHub"
  elastic_index        = "list"
  event_bus_name       = "PocketEventBridge-${local.env}-Shared-Event-Bus"
  corpus_index_en      = "corpus_en_luc"
  corpus_index_fr      = "corpus_fr"
  corpus_index_es      = "corpus_es"
  corpus_index_it      = "corpus_it"
  corpus_index_de      = "corpus_de"
  elastic = {
    endpoint    = local.workspace.es_cluster_enable ? aws_elasticsearch_domain.user_search[0].endpoint : null
    domain_name = local.workspace.es_cluster_enable ? aws_elasticsearch_domain.user_search[0].domain_name : null
  }
  private_subnet_ids = split(",", data.aws_ssm_parameter.private_subnets.value)
  secret_path        = "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:${local.name}/${local.env}/"
  secret_path_shared = "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:Shared/"
  ssm_path           = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${local.name}/${local.env}/"
  ssm_path_shared    = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/Shared/${local.env}/"

  lambda_env = {
    NODE_ENV                  = local.workspace.nodeEnv
    SENTRY_DSN                = data.aws_ssm_parameter.sentry_dsn.value
    CORPUS_SEARCH_SENTRY_DSN  = data.aws_ssm_parameter.corpus_sentry_dsn.value
    USER_LIST_SEARCH_URI      = local.workspace.userApiUri
    SQS_USER_ITEMS_UPDATE_URL = aws_sqs_queue.user_items_update.id
    SQS_USER_LIST_IMPORT_URL  = aws_sqs_queue.user_list_import.id
    SQS_USER_ITEMS_UPDATE_URL = aws_sqs_queue.user_items_update.id
    SQS_USER_ITEMS_DELETE_URL = aws_sqs_queue.user_items_delete.id
    # The endpoint doesn't include protocol
    ELASTICSEARCH_HOST                  = "https://${local.elastic.endpoint}"
    CORPUS_SEARCH_HOST                  = "https://${module.corpus_embeddings.opensearch_endpoint}"
    PARSER_ENDPOINT                     = data.aws_ssm_parameter.parser_endpoint.value
    PARSER_PRIVILEGED_SERVICE_ID        = data.aws_ssm_parameter.parser_privileged_service_id.value
    EMBEDDINGS_ENDPOINT                 = module.corpus_embeddings.sagemaker_endpoint_name
    CORPUS_SEARCH_SERVICES_CONSUMER_KEY = data.aws_ssm_parameter.corpus_search_services_consumer_key.value
    CORPUS_SEARCH_SERVICES_APP_NAME     = "Corpus Search Services"
  }
  sqsEndpoint = "https://sqs.us-east-1.amazonaws.com"
  snsTopicName = {
    userEvents       = local.workspace.sns_topic_user_events
    corpusEvents     = local.workspace.sns_topic_corpus_events
    collectionEvents = local.workspace.sns_topic_collection_events
    listEvents       = local.workspace.sns_topic_list_events
  }

  # environment or workspace-specific local variables go here.
  # this will response without using tfvars files with the workspace-specific value (if relevant)
  # references to these values are made via local.workspace.{environment-specific key}.
  # if a key will exist in one environment but not the other, ensure you add it as a (possibly empty) default.
  envs = {
    defaults = {
      region = "us-east-1"
    }

    UserListSearch-Dev = {
      domain                      = "user-list-search.getpocket.dev"
      environment                 = "Dev"
      es_cluster_enable           = true
      es_instance_count           = 3
      es_instance_type            = "t3.medium.elasticsearch"
      es_master_instance_type     = "t3.small.elasticsearch"
      es_ebs_volume_size          = 35
      nodeEnv                     = "development"
      root_domain                 = "getpocket.dev"
      sns_topic_user_events       = "PocketEventBridge-Dev-UserEvents"
      sns_topic_corpus_events     = "PocketEventBridge-Dev-CorpusEvents"
      sns_topic_collection_events = "PocketEventBridge-Dev-CollectionEvents"
      sns_topic_list_events       = "PocketEventBridge-Dev-ListEvents"
      userApiUri                  = "https://user-list-search.getpocket.dev"
      otlpCollectorUrl            = "https://otel-collector.getpocket.dev:443"
    }

    UserListSearch-Prod = {
      domain                      = "user-list-search.readitlater.com"
      environment                 = "Prod"
      es_cluster_enable           = true
      es_instance_count           = 11
      es_instance_type            = "m5.xlarge.elasticsearch"
      es_master_instance_type     = "c5.large.elasticsearch"
      es_ebs_volume_size          = 1500
      nodeEnv                     = "production"
      root_domain                 = "readitlater.com"
      sns_topic_user_events       = "PocketEventBridge-Prod-UserEvents"
      sns_topic_corpus_events     = "PocketEventBridge-Prod-CorpusEvents"
      sns_topic_collection_events = "PocketEventBridge-Prod-CollectionEvents"
      sns_topic_list_events       = "PocketEventBridge-Prod-ListEvents"
      userApiUri                  = "https://user-list-search.readitlater.com"
      otlpCollectorUrl            = "https://otel-collector.readitlater.com:443"
    }
  }

  workspace = merge(local.envs["defaults"], local.envs[local.old_workspace])
}

output "workspace" {
  value = local.old_workspace
}
