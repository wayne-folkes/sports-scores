locals {
  vercel_issuer   = "oidc.vercel.com/${var.vercel_team_slug}"
  vercel_audience = "https://vercel.com/${var.vercel_team_slug}"
}

data "tls_certificate" "vercel" {
  url = "https://${local.vercel_issuer}"
}

resource "aws_iam_openid_connect_provider" "vercel" {
  url             = "https://${local.vercel_issuer}"
  client_id_list  = [local.vercel_audience]
  thumbprint_list = [data.tls_certificate.vercel.certificates[0].sha1_fingerprint]
}

data "aws_iam_policy_document" "vercel_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.vercel.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.vercel_issuer}:aud"
      values   = [local.vercel_audience]
    }

    condition {
      test     = "StringLike"
      variable = "${local.vercel_issuer}:sub"
      values = [
        "owner:${var.vercel_team_slug}:project:${var.vercel_project_name}:environment:production",
        "owner:${var.vercel_team_slug}:project:${var.vercel_project_name}:environment:preview",
      ]
    }
  }
}

resource "aws_iam_role" "vercel_app" {
  name                 = "sports-scores-vercel"
  description          = "Assumed by the sports-scores Vercel project via OIDC"
  assume_role_policy   = data.aws_iam_policy_document.vercel_assume.json
  max_session_duration = 3600
}

resource "aws_iam_role_policy_attachment" "vercel_app" {
  role       = aws_iam_role.vercel_app.name
  policy_arn = aws_iam_policy.app.arn
}
