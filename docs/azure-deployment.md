# Azure Deployment (App Service Linux B1)

## Provision resources

```bash
az group create --name <rg-name> --location <region>
az appservice plan create --name <plan-name> --resource-group <rg-name> --sku B1 --is-linux
az webapp create --resource-group <rg-name> --plan <plan-name> --name <app-name> --runtime "NODE|20-lts"
```

## Configure settings

```bash
az webapp config appsettings set --resource-group <rg-name> --name <app-name> --settings NODE_ENV=production OUTPUT_ROOT=/home/site/wwwroot/output ENABLE_UNSUPPORTED_AUTOMATION=false
```

## CI/CD auth

Prefer OIDC federated credentials. If unavailable, use publish profile secret.
