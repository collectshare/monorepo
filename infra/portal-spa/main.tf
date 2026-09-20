# Bucket S3 + distribuição CloudFront + registros Route53 do portal já
# existem (criados manualmente); os module blocks abaixo importam esses
# recursos para o Terraform em vez de recriá-los. comment é setado igual ao
# valor atual (evita diff em toda plan); os registros Route53 são novos —
# hoje o domínio não resolve.

module "portal_dev" {
  source = "git::https://github.com/leividduan/terraform-aws-spa-static-site.git?ref=b5dc3b0fe7863b2a688208027fd1a42c777c0a50"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name              = "portal-dev.collectshare.com.br"
  hosted_zone_id           = var.hosted_zone_id
  existing_certificate_arn = var.existing_certificate_arn
  comment                  = "portal-dev"

  tags = {
    Name = "portal-dev"
  }
}

module "portal_prod" {
  source = "git::https://github.com/leividduan/terraform-aws-spa-static-site.git?ref=b5dc3b0fe7863b2a688208027fd1a42c777c0a50"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name              = "portal.collectshare.com.br"
  hosted_zone_id           = var.hosted_zone_id
  existing_certificate_arn = var.existing_certificate_arn
  comment                  = "portal-prod"

  tags = {
    Name = "portal-prod"
  }
}
