terraform {
  backend "s3" {
    bucket       = "sports-scores-tfstate-228897118541"
    key          = "sports-scores/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
    encrypt      = true
  }
}
