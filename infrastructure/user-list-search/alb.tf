resource "aws_alb" "alb" {
  # name cannot be more than 6 characters
  name_prefix = "ULS" #User List Search
  security_groups = [
    aws_security_group.alb_security_group.id
  ]

  internal = true

  subnets = split(",", data.aws_ssm_parameter.private_subnets.value)

  //  access_logs {
  //	bucket  = aws_s3_bucket.alb_logs.bucket
  //	prefix  = local.alb_s3_bucket_prefix
  //	enabled = true
  //  }

  tags = local.tags

  depends_on = [aws_security_group.alb_security_group] # , aws_s3_bucket.alb_logs
}

# data "aws_security_groups" "default" {
#   filter {
#     name = "group-name"
#     values = [
#       "default"
#     ]
#   }

#   filter {
#     name = "vpc-id"
#     values = [
#       data.aws_vpc.vpc.id
#     ]
#   }
# }

resource "aws_security_group" "alb_security_group" {
  name        = "${local.prefix}-HTTP/S Security Group"
  description = "Internal security group"
  vpc_id      = data.aws_vpc.vpc.id

  ingress {
    from_port = 443
    to_port   = 443
    protocol  = "TCP"
    // TODO: Limit access to only what needs it.
    // For now lets only do the default security groups
    # security_groups = data.aws_security_groups.default.ids
    cidr_blocks = [
      "0.0.0.0/0"
    ]
  }

  ingress {
    from_port = 80
    to_port   = 80
    protocol  = "TCP"
    # security_groups = data.aws_security_groups.default.ids
    cidr_blocks = [
      "0.0.0.0/0"
    ]
  }

  egress {
    from_port = 0
    to_port   = 0
    protocol  = -1
    cidr_blocks = [
      "0.0.0.0/0"
    ]
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-HTTP/S Security Group"
  })
}

# Create 2 of the same target groups so we can alternate with blue green deploys.
resource "aws_alb_target_group" "alb_target" {
  health_check {
    interval            = 15
    path                = "/.well-known/apollo/server-health"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 9
  }

  vpc_id               = data.aws_vpc.vpc.id
  protocol             = "HTTP"
  port                 = 80
  name                 = "${local.prefix}-Blue"
  target_type          = "ip"
  deregistration_delay = 120

  tags = local.tags

  depends_on = [
    aws_alb.alb
  ]
}

resource "aws_alb_target_group" "alb_target_green" {
  health_check {
    interval            = 15
    path                = "/.well-known/apollo/server-health"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 9
  }

  vpc_id               = data.aws_vpc.vpc.id
  protocol             = "HTTP"
  port                 = 80
  name                 = "${local.prefix}-Green"
  target_type          = "ip"
  deregistration_delay = 120

  tags = local.tags

  depends_on = [
    aws_alb.alb
  ]
}

resource "aws_alb_listener" "listener_http" {
  load_balancer_arn = aws_alb.alb.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  depends_on = [aws_alb.alb]
}

resource "aws_alb_listener" "listener_https" {
  load_balancer_arn = aws_alb.alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-1-2017-01"

  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.alb_target.arn
  }

  ###
  # We ignore changes because code deploy will change the default action and expects to be in control of it.
  ###
  lifecycle {
    ignore_changes = [
      default_action
    ]
  }

  certificate_arn = aws_acm_certificate.root_cert.arn

  depends_on = [aws_alb.alb, aws_alb_target_group.alb_target, aws_alb_target_group.alb_target_green]
}
