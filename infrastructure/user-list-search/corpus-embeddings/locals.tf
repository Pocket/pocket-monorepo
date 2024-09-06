locals {
  name   = "CorpusEmbeddings"
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

  aws_path_prefix = "${local.name}/${local.env}/"
  # container_port       = 4000
  # container_name       = "node"
  container_credential = "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:Shared/DockerHub"
  corpus_index_en      = "corpus_en"
  corpus_index_fr      = "corpus_fr"
  corpus_index_es      = "corpus_es"
  corpus_index_it      = "corpus_it"
  corpus_index_de      = "corpus_de"
  opensearch = {
    endpoint    = local.workspace.os_cluster_enable ? aws_opensearch_domain.corpus_search[0].endpoint : null
    domain_name = local.workspace.os_cluster_enable ? aws_opensearch_domain.corpus_search[0].domain_name : null
  }
  sagemaker = {
    transformers_version = "4.12.3"
    pytorch_version = "1.9.1"
  }
  private_subnet_ids = split(",", data.aws_ssm_parameter.private_subnets.value)
  secret_path        = "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:${local.name}/${local.env}/"
  ssm_path           = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${local.name}/${local.env}/"
  ssm_path_shared    = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/Shared/${local.env}/"

  # environment or workspace-specific local variables go here.
  # this will response without using tfvars files with the workspace-specific value (if relevant)
  # references to these values are made via local.workspace.{environment-specific key}.
  # if a key will exist in one environment but not the other, ensure you add it as a (possibly empty) default.
  envs = {
    defaults = {
      region = "us-east-1"
    }

    CorpusEmbeddings-Dev = {
      environment               = "Dev"
      os_cluster_enable         = true
      os_instance_count         = 3
      os_instance_type          = "t2.small.search"
      os_master_instance_type   = "t2.small.search"
      os_dedicated_master_count = 3
      nodeEnv                   = "development"
      os_ebs_volume_size        = 10
      hf_task = "feature-extraction"
      hf_model_id = "sentence-transformers/msmarco-distilbert-base-tas-b"
    }

    CorpusEmbeddings-Prod = {
      environment               = "Prod"
      os_cluster_enable         = true
      os_instance_count         = 4
      os_instance_type          = "m5.large.search"
      os_dedicated_master_count = 3
      os_master_instance_type   = "c5.large.search"
      nodeEnv                   = "production"
      os_ebs_volume_size        = 10
      hf_task = "feature-extraction"
      hf_model_id = "sentence-transformers/msmarco-distilbert-base-tas-b"
    }
  }

  workspace = merge(local.envs["defaults"], local.envs[local.old_workspace])
}

output "workspace" {
  value = local.old_workspace
}
