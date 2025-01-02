resource "aws_iam_role" "lambda_codedeploy_role" {
  name               = "${local.prefix}-LambdaCodeDeployRole"
  assume_role_policy = data.aws_iam_policy_document.codedeploy_assume_role.json
}


resource "aws_iam_role_policy_attachment" "lambda_codedeploy_role" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForLambda"
  #Depending on the service there are different types.
  role = aws_iam_role.lambda_codedeploy_role.name
}

resource "aws_iam_role" "lambda_role" {
  name               = "${local.prefix}-LambdaExecutionRole"
  tags               = local.tags
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "lambda_role_xray_write" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = data.aws_iam_policy.aws_xray_write_only_access.arn
}

data "aws_iam_policy_document" "lambda_assume" {
  version = "2012-10-17"

  statement {
    effect = "Allow"
    actions = [
      "sts:AssumeRole"
    ]

    principals {
      identifiers = [
        "lambda.amazonaws.com"
      ]

      type = "Service"
    }
  }
}
