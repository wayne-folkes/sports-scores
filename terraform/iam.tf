data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "app" {
  statement {
    sid = "InvokeSummaryModels"
    actions = [
      "bedrock:InvokeModel",
      "bedrock:InvokeModelWithResponseStream",
    ]
    resources = concat(
      [for m in var.bedrock_model_ids : "arn:aws:bedrock:*::foundation-model/${m}"],
      # Cross-region inference profiles (e.g. us.anthropic.claude-*) resolve to
      # profile ARNs in this account rather than bare foundation-model ARNs.
      ["arn:aws:bedrock:*:${data.aws_caller_identity.current.account_id}:inference-profile/*.anthropic.claude-*"],
    )
  }

  statement {
    sid = "SummaryCache"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
    ]
    resources = [aws_dynamodb_table.summaries.arn]
  }
}

resource "aws_iam_policy" "app" {
  name        = "sports-scores-app"
  description = "Bedrock summary generation + DynamoDB summary cache for sports-scores"
  policy      = data.aws_iam_policy_document.app.json
}
