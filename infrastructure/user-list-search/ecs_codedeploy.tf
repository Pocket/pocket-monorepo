resource "aws_iam_role" "ecs_codedeploy_role" {
  name = "${local.prefix}-ECSCodeDeployRole"

  assume_role_policy = data.aws_iam_policy_document.codedeploy_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ecs_codedeploy_role" {
  policy_arn = "arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS"
  #Depending on the service there are different types.
  role = aws_iam_role.ecs_codedeploy_role.name
}

resource "aws_codedeploy_app" "ecs_codedeploy_app" {
  compute_platform = "ECS"
  name             = local.prefix
}
