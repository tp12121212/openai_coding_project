# Azure Deployment (App Service Linux B1)

## Provision resources

```bash
az group create --name <rg-name> --location <region>
az appservice plan create --name <plan-name> --resource-group <rg-name> --sku B1 --is-linux
az webapp create --resource-group <rg-name> --plan <plan-name> --name <app-name> --runtime "NODE|20-lts"
```

## Configure settings

```bash
az webapp config appsettings set --resource-group <rg-name> --name <app-name> --settings NODE_ENV=production OUTPUT_ROOT=/home/site/wwwroot/output ENABLE_UNSUPPORTED_AUTOMATION=false NEXTAUTH_URL=https://codex.killercloud.com.au NEXTAUTH_SECRET=<strong-random-secret> GITHUB_CLIENT_ID=<github-oauth-client-id> GITHUB_CLIENT_SECRET=<github-oauth-client-secret>
```

## CI/CD auth

Prefer OIDC federated credentials. If unavailable, use publish profile secret.


## Custom hostname + TLS

Certificates are already provisioned in Azure. Ensure the custom domain `codex.killercloud.com.au` is bound to the App Service and HTTPS-only is enabled:

```bash
az webapp config hostname add --resource-group <rg-name> --webapp-name <app-name> --hostname codex.killercloud.com.au
az webapp update --resource-group <rg-name> --name <app-name> --https-only true
```

If DNS and certificate binding already exist, no application code changes are required beyond setting `NEXTAUTH_URL` to the production HTTPS hostname.
