variable "aws_region" {
  description = "AWS region for Bedrock and DynamoDB"
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "Local AWS CLI profile used to run Terraform"
  type        = string
  default     = "default_wayne"
}

variable "table_name" {
  description = "DynamoDB table holding cached game summaries"
  type        = string
  default     = "sports-scores-summaries"
}

variable "vercel_team_slug" {
  description = "Vercel team slug (issuer/audience/subject of the OIDC token)"
  type        = string
  default     = "waynefolkes-projects"
}

variable "vercel_project_name" {
  description = "Vercel project allowed to assume the app role"
  type        = string
  default     = "sports-scores"
}

variable "bedrock_model_ids" {
  description = "Bedrock model IDs the app may invoke"
  type        = list(string)
  default = [
    "zai.glm-5",
    "zai.glm-4.7*",
    "google.gemma-3*",
    "anthropic.claude-opus-5",
    "anthropic.claude-haiku-4-5*",
  ]
}
