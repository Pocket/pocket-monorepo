resource "aws_route53_zone" "hosted_zone" {
  name = local.workspace.domain
  tags = local.tags
}

data "aws_route53_zone" "main_zone" {
  name = local.workspace.root_domain
}

resource "aws_route53_record" "hosted_zone_ns" {
  zone_id = data.aws_route53_zone.main_zone.zone_id
  name    = aws_route53_zone.hosted_zone.name
  type    = "NS"
  ttl     = "30"
  records = aws_route53_zone.hosted_zone.name_servers
}

# root cert and domain
resource "aws_acm_certificate" "root_cert" {
  domain_name       = local.workspace.domain
  validation_method = "DNS"

  tags = local.tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "root_route53_record" {
  name    = tolist(aws_acm_certificate.root_cert.domain_validation_options).0.resource_record_name
  type    = tolist(aws_acm_certificate.root_cert.domain_validation_options).0.resource_record_type
  zone_id = aws_route53_zone.hosted_zone.zone_id
  records = [tolist(aws_acm_certificate.root_cert.domain_validation_options).0.resource_record_value]
  ttl     = 60

  depends_on = [aws_acm_certificate.root_cert]
}

resource "aws_acm_certificate_validation" "root_cert_validation" {
  certificate_arn         = aws_acm_certificate.root_cert.arn
  validation_record_fqdns = [aws_route53_record.root_route53_record.fqdn]

  depends_on = [aws_route53_record.root_route53_record, aws_acm_certificate.root_cert]
}

resource "aws_route53_record" "root_A_record" {
  zone_id = aws_route53_zone.hosted_zone.zone_id
  name    = ""
  type    = "A"

  weighted_routing_policy {
    weight = 1
  }

  lifecycle {
    ignore_changes = [
      weighted_routing_policy[0].weight
    ]
  }

  alias {
    name                   = aws_alb.alb.dns_name
    zone_id                = aws_alb.alb.zone_id
    evaluate_target_health = true
  }

  set_identifier = local.prefix

  depends_on = [aws_alb.alb]
}
