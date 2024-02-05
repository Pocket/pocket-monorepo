data "aws_sns_topic" "backend-deploy-topic" {
  name = "Backend-${local.workspace.environment}-ChatBot"
}
