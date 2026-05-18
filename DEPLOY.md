# Deploy

The site auto-deploys to Cloudflare Pages from this repo via `.github/workflows/deploy.yml`:

- **Push to `main`** → production deploy at the configured custom domain.
- **Open a PR** → preview deploy at `https://<branch>.bergen-ship-agency.pages.dev/`. URL is posted as a sticky comment on the PR.

## One-time setup

1. **Push the repo to GitHub** (any repo name, but the deploy workflow assumes you're using GitHub Actions).
2. **Create the Cloudflare Pages project** — once, via `wrangler` or the dashboard:
   ```bash
   wrangler pages project create bergen-ship-agency --production-branch=main
   ```
   The project name `bergen-ship-agency` is referenced in `.github/workflows/deploy.yml` — change both if you want a different name.
3. **Create a scoped Cloudflare API token** at <https://dash.cloudflare.com/profile/api-tokens>:
   - Template: "Edit Cloudflare Workers" (covers Pages too), OR custom with:
     - Account → Cloudflare Pages → Edit
     - Account → Account Settings → Read
4. **Add GitHub repository secrets** (Settings → Secrets and variables → Actions):
   - `CLOUDFLARE_API_TOKEN` — the token from step 3
   - `CLOUDFLARE_ACCOUNT_ID` — found at <https://dash.cloudflare.com> → right sidebar
5. **Bind the custom domain** in the Pages dashboard once the first deploy succeeds: Project → Custom domains → Set up `bergenshipagency.no`.

## Verifying

After pushing to `main`, watch the run at <https://github.com/YOUR_ORG/YOUR_REPO/actions>. Successful runs publish to `https://bergen-ship-agency.pages.dev/` and the custom domain.

## Rollback

In the Cloudflare Pages dashboard → Project → Deployments → "..." on a previous deploy → **Rollback to this deployment**. Or revert the commit on `main` and push; the next run redeploys the prior content.
