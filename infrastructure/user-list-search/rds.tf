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
  engine_mode                 = "serverless"
  engine_version              = "5.7.mysql_aurora.2.08.3"
  allow_major_version_upgrade = true
  apply_immediately           = true
}
