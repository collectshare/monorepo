variable "aws_region" {
  description = "Região AWS onde os projetos CodeBuild são criados."
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "Profile do ~/.aws/credentials a usar."
  type        = string
  default     = "pessoal"
}

variable "github_connection_arn" {
  description = "ARN da conexão GitHub (CodeConnections) já existente na conta, compartilhada com os projetos CodeBuild do web e do api (\"Deivid - collectshare\")."
  type        = string
  default     = "arn:aws:codeconnections:us-east-1:442609595975:connection/f16023fe-c145-48a3-afa8-4d9d380efa61"
}
