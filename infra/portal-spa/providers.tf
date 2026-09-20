provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

# CloudFront exige que o certificado ACM exista em us-east-1, independente da
# região acima — o módulo declara essa dependência de provider estaticamente,
# mesmo quando existing_certificate_arn é passado.
provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = var.aws_profile
}
