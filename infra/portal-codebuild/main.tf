# Espelha os projetos CodeBuild do web (dev-monorepo/prod-monorepo) e do api
# (api-dev-monorepo/api-prod-monorepo): dev builda em PRERELEASED, prod em
# RELEASED. O bucket S3 + distribuição CloudFront de destino já existem
# (portal-dev.collectshare.com.br / portal.collectshare.com.br) e não são
# provisionados por este módulo. Compute Lambda (default do módulo), igual
# ao web/api — ver apps/portal/vite.config.ts (maxParallelFileOps) pro
# tratamento do limite fixo de file descriptors desse compute (EMFILE).

locals {
  github_repo_url = "https://github.com/collectshare/monorepo"
}

module "portal_dev" {
  source = "git::https://github.com/leividduan/terraform-aws-codebuild-app.git?ref=038b034fbff6ab654806f53f453fe40223c3ebb1"

  name                  = "portal-dev-monorepo"
  github_repo_url       = local.github_repo_url
  github_connection_arn = var.github_connection_arn
  buildspec_path        = "apps/portal/buildspec.yml"
  webhook_event         = "PRERELEASED"

  deploy_bucket_arn                 = "arn:aws:s3:::portal-dev.collectshare.com.br"
  deploy_cloudfront_distribution_id = "EX156V5FRTSFI"

  environment_variables = {
    VITE_API_URL  = "https://dev-api.collectshare.com.br"
    DEPLOY_BUCKET = "portal-dev.collectshare.com.br"
    CF_ID         = "EX156V5FRTSFI"
  }
}

module "portal_prod" {
  source = "git::https://github.com/leividduan/terraform-aws-codebuild-app.git?ref=038b034fbff6ab654806f53f453fe40223c3ebb1"

  name                  = "portal-prod-monorepo"
  github_repo_url       = local.github_repo_url
  github_connection_arn = var.github_connection_arn
  buildspec_path        = "apps/portal/buildspec.yml"
  webhook_event         = "RELEASED"

  deploy_bucket_arn                 = "arn:aws:s3:::portal.collectshare.com.br"
  deploy_cloudfront_distribution_id = "ES3XHH1DCYY8T"

  environment_variables = {
    VITE_API_URL  = "https://api.collectshare.com.br"
    DEPLOY_BUCKET = "portal.collectshare.com.br"
    CF_ID         = "ES3XHH1DCYY8T"
  }
}
