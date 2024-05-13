resource "aws_codedeploy_deployment_group" "apollo_codedeploy_group" {
  app_name               = aws_codedeploy_app.ecs_codedeploy_app.name
  deployment_config_name = "CodeDeployDefault.ECSAllAtOnce"
  deployment_group_name  = "${local.prefix}-Apollo"
  service_role_arn       = aws_iam_role.ecs_codedeploy_role.arn

  auto_rollback_configuration {
    enabled = true
    events = [
      "DEPLOYMENT_FAILURE"
    ]
  }

  blue_green_deployment_config {
    deployment_ready_option {
      action_on_timeout = "CONTINUE_DEPLOYMENT"
    }

    terminate_blue_instances_on_deployment_success {
      action                           = "TERMINATE"
      termination_wait_time_in_minutes = 5
    }
  }

  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }

  ecs_service {
    cluster_name = aws_ecs_cluster.ecs_cluster.name
    service_name = aws_ecs_service.apollo.name
  }

  load_balancer_info {
    target_group_pair_info {
      prod_traffic_route {
        listener_arns = [
          aws_alb_listener.listener_https.arn
        ]
      }

      target_group {
        name = aws_alb_target_group.alb_target.name
      }

      target_group {
        name = aws_alb_target_group.alb_target_green.name
      }
    }
  }
}

resource "aws_codestarnotifications_notification_rule" "apollo_notifications" {
  detail_type = "BASIC"
  event_type_ids = [
    "codedeploy-application-deployment-failed",
  ]

  name     = "${aws_codedeploy_app.ecs_codedeploy_app.name}-Apollo"
  resource = "arn:aws:codedeploy:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:application:${aws_codedeploy_app.ecs_codedeploy_app.name}"

  target {
    address = data.aws_sns_topic.backend-deploy-topic.arn
  }
}

output "ecs-codedeploy-app" {
  description = "Code deploy app"
  value       = aws_codedeploy_app.ecs_codedeploy_app.name
}

output "ecs-codedeploy-group" {
  description = "Code deploy group"
  value       = aws_codedeploy_deployment_group.apollo_codedeploy_group.deployment_group_name
}