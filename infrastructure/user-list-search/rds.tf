resource "aws_security_group" "mysql" {
  count       = local.env == "Dev" ? 1 : 0
  name        = "${local.prefix}-mysql"
  description = "Managed by Terraform"
  vpc_id      = data.aws_vpc.vpc.id

  ingress {
    from_port = 3306
    to_port   = 3306
    protocol  = "tcp"

    cidr_blocks = [
      data.aws_vpc.vpc.cidr_block
    ]
  }
}

resource "aws_db_subnet_group" "mysql_subnet" {
  count      = local.env == "Dev" ? 1 : 0
  name       = "${lower(local.prefix)}-mysql-subnet"
  subnet_ids = local.private_subnet_ids
}

resource "aws_rds_cluster" "mysql" {
  count                   = local.env == "Dev" ? 1 : 0
  cluster_identifier      = "${lower(local.prefix)}-mysql"
  database_name           = "readitlater"
  preferred_backup_window = "07:00-09:00"

  # since the dev cluster is protected and only ECS will connect to this,
  # AND since this stack will be torn down after production deploy,
  # AND we're only loading test data, we will not worry about password rotation
  master_username = "foo"
  master_password = "bar-bar-123"

  vpc_security_group_ids      = [aws_security_group.mysql[0].id]
  db_subnet_group_name        = aws_db_subnet_group.mysql_subnet[0].name
  engine                      = "aurora-mysql"
  engine_mode                 = "provisioned"
  engine_version              = "8.0.mysql_aurora.3.07.1"
  allow_major_version_upgrade = true
  apply_immediately           = true
  storage_encrypted           = true

  serverlessv2_scaling_configuration {
    max_capacity = 1.0
    min_capacity = 0.5
  }
}

resource "aws_rds_cluster_instance" "mysql_instance" {
  count                   = local.env == "Dev" ? 1 : 0
  cluster_identifier = aws_rds_cluster.mysql[0].id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.mysql[0].engine
  engine_version     = aws_rds_cluster.mysql[0].engine_version
}
