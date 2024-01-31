output "sns_topic_arns" {
  value = { for key, sns in aws_sns_topic.topics :
    key => sns.arn
  }
}
