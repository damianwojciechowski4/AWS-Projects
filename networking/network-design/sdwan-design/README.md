## Catalog Tree
├───envs
│   ├───dev
│   └───prod
└───modules
    ├───velocloud
    └───vpc

## Files purpose
main.tf            <- calls modules, resources
versions.tf        <- Terraform + provider versions
provider.tf        <- provider settings (region, tags)
backend.tf         <- S3 backend (dev/prod specific)
variables.tf       <- variable definitions
terraform.tfvars   <- actual env values
outputs.tf         <- outputs

## Explanation of files purpose

### versions.tf
- global terraform + provider versions


### Terraform key for dev / prod
- terraform keys
`backend.tf`
-- dev:networking/network-design/sdwan-design/dev.tfstate
-- prod: networking/network-design/sdwan-design/prod.tfstate



