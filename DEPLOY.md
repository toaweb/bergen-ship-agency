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

## Contact form (Resend)

The contact form at `/contact/` posts to `/api/contact`, handled by `functions/api/contact.js` (a Cloudflare Pages Function).

**One-time Resend setup:**

1. Sign up at <https://resend.com> and verify the `bergenshipagency.no` sender domain by adding the SPF/DKIM/DMARC records Resend gives you to Cloudflare DNS.
2. Create an API key (Send-only scope is sufficient).
3. In the Cloudflare Pages dashboard → Project → Settings → Environment variables, add:
   - `RESEND_API_KEY` — the key from step 2. **Mark as encrypted.**
   - `CONTACT_FROM` (optional) — defaults to `Bergen Ship Agency <noreply@bergenshipagency.no>`. Must use a Resend-verified domain.
   - `CONTACT_TO` (optional) — defaults to `post@bergenshipagency.no`.
4. Apply the variables to both **Production** and **Preview** environments if you want PR previews to be able to send mail (otherwise leave Preview unset and the form will return a 500 in preview, which is fine for testing the UI).

**Local form testing:**

Hugo's dev server (`hugo server`) does **not** run Pages Functions — the form will 404 in `hugo server` mode. To test the function locally:

```bash
hugo --minify
npx wrangler pages dev public --binding RESEND_API_KEY=re_your_dev_key
```

**Spam protection:** a honeypot field (`website`) is the only built-in defense. If submissions get noisy, add Cloudflare Turnstile or rate-limit the route via a Cloudflare WAF rule on `/api/contact`.

## Verifying

After pushing to `main`, watch the run at <https://github.com/YOUR_ORG/YOUR_REPO/actions>. Successful runs publish to `https://bergen-ship-agency.pages.dev/` and the custom domain.

## Rollback

In the Cloudflare Pages dashboard → Project → Deployments → "..." on a previous deploy → **Rollback to this deployment**. Or revert the commit on `main` and push; the next run redeploys the prior content.
