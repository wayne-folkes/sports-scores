locals {
  github_repo = "wayne-folkes/sports-scores"
}

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

data "aws_iam_policy_document" "github_actions_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${local.github_repo}:ref:refs/heads/main",
        "repo:${local.github_repo}:pull_request",
        "repo:${local.github_repo}:environment:Production",
      ]
    }
  }
}

resource "aws_iam_role" "github_actions_terraform" {
  name                 = "sports-scores-github-actions-terraform"
  description          = "Assumed by GitHub Actions in ${local.github_repo} to plan/apply Terraform"
  assume_role_policy   = data.aws_iam_policy_document.github_actions_assume.json
  max_session_duration = 3600
}

# Scoped to manage exactly the resources this Terraform config declares, plus
# the S3 state bucket. Keep this in sync when new resource types are added.
data "aws_iam_policy_document" "github_actions_terraform" {
  statement {
    sid = "StateBucket"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket",
    ]
    resources = [
      "arn:aws:s3:::sports-scores-tfstate-228897118541",
      "arn:aws:s3:::sports-scores-tfstate-228897118541/*",
    ]
  }

  statement {
    sid       = "AccountLookup"
    actions   = ["sts:GetCallerIdentity"]
    resources = ["*"]
  }

  statement {
    sid = "ManageDynamoTable"
    actions = [
      "dynamodb:CreateTable",
      "dynamodb:DeleteTable",
      "dynamodb:DescribeTable",
      "dynamodb:UpdateTable",
      "dynamodb:TagResource",
      "dynamodb:UntagResource",
      "dynamodb:ListTagsOfResource",
      "dynamodb:UpdateTimeToLive",
      "dynamodb:DescribeTimeToLive",
      "dynamodb:UpdateContinuousBackups",
      "dynamodb:DescribeContinuousBackups",
    ]
    resources = ["arn:aws:dynamodb:*:${data.aws_caller_identity.current.account_id}:table/sports-scores-*"]
  }

  statement {
    sid = "ManageIamRolesAndPolicies"
    actions = [
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:GetRole",
      "iam:UpdateRole",
      "iam:UpdateAssumeRolePolicy",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:CreatePolicy",
      "iam:DeletePolicy",
      "iam:GetPolicy",
      "iam:GetPolicyVersion",
      "iam:ListPolicyVersions",
      "iam:CreatePolicyVersion",
      "iam:DeletePolicyVersion",
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
      "iam:ListAttachedRolePolicies",
      "iam:PutRolePolicy",
      "iam:GetRolePolicy",
      "iam:DeleteRolePolicy",
      "iam:ListRolePolicies",
      "iam:PassRole",
    ]
    resources = [
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/sports-scores-*",
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/sports-scores-*",
    ]
  }

  statement {
    sid = "ReadOidcProviders"
    actions = [
      "iam:GetOpenIDConnectProvider",
      "iam:ListOpenIDConnectProviders",
    ]
    resources = ["*"]
  }

  statement {
    sid = "ManageBudget"
    actions = [
      "budgets:ViewBudget",
      "budgets:ModifyBudget",
      "budgets:CreateBudgetAction",
      "budgets:DescribeBudgetAction",
      "budgets:DescribeBudgetActionsForBudget",
      "budgets:UpdateBudgetAction",
      "budgets:DeleteBudgetAction",
      "budgets:ExecuteBudgetAction",
    ]
    resources = [
      "arn:aws:budgets::${data.aws_caller_identity.current.account_id}:budget/sports-scores-*",
    ]
  }
}

resource "aws_iam_policy" "github_actions_terraform" {
  name        = "sports-scores-github-actions-terraform"
  description = "Permissions for GitHub Actions to plan/apply the sports-scores Terraform config"
  policy      = data.aws_iam_policy_document.github_actions_terraform.json
}

resource "aws_iam_role_policy_attachment" "github_actions_terraform" {
  role       = aws_iam_role.github_actions_terraform.name
  policy_arn = aws_iam_policy.github_actions_terraform.arn
}
