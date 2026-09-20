variable "aws_region" {
  description = "Região AWS onde o bucket S3 é criado (CloudFront/Route53 são globais)."
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "Profile do ~/.aws/credentials a usar."
  type        = string
  default     = "pessoal"
}

variable "hosted_zone_id" {
  description = "Hosted zone do collectshare.com.br no Route53 (a mesma usada pelo api/web)."
  type        = string
  default     = "Z0384292204BP3K5S0ZHF"
}

variable "existing_certificate_arn" {
  description = "Certificado wildcard *.collectshare.com.br já emitido em us-east-1, reusado pelas distribuições do app/dev/portal."
  type        = string
  default     = "arn:aws:acm:us-east-1:442609595975:certificate/e0205246-a470-4509-bb88-32bd8a7a1749"
}
