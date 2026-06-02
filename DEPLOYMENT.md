# Deploying **daily-ideas** to Vercel via GitHub Actions

This repository is set up to automatically deploy the Next.js app to Vercel whenever you push to the `main` branch.

## 1. Add the remote (if you haven’t already)

```bash
git remote add origin https://github.com/srivedanthtek/daily-ideas.git
```

## 2. Push the code

```bash
git add .
git commit -m "Initial commit – add .gitignore and GitHub Actions workflow"
git push -u origin main
```

> **Note:** If you prefer to use SSH, replace the URL with `git@github.com:srivedanthtek/daily-ideas.git`.

## 3. Configure Vercel

1. Log in to the **Vercel** dashboard.
2. Click **New Project** → **Import Git Repository** → select `srivedanthtek/daily-ideas`.
3. After the project is created, go to **Settings → Domains** and add the custom domain `spark.srivedanthtek.com`.  
   Vercel will show a **CNAME** record (e.g., `cname.vercel-dns.com`). Keep this value handy.

## 4. Add required secrets to GitHub

In the GitHub repository:

1. Go to **Settings → Secrets and variables → Actions → New repository secret**.
2. Add the following secrets (replace the placeholder values with the ones from Vercel):

| Secret name          | Value (from Vercel) |
|----------------------|---------------------|
| `VERCEL_ORG_ID`      | *Your Vercel organization ID* |
| `VERCEL_PROJECT_ID`  | *Your Vercel project ID* |
| `VERCEL_TOKEN`       | *A Vercel personal token with write access* |

## 5. Verify the deployment

Push a new commit (or the initial push above) and watch the **Actions** tab. After the workflow finishes, open:

```
https://spark.srivedanthtek.com/ideas/<id>
```

You should see the live app with a valid SSL certificate.

---

### Troubleshooting

- **Workflow fails** – Check the **Actions** logs for missing secrets or build errors.
- **Domain not verified** – Ensure the CNAME record is added in Cloudflare (DNS‑only) and that it has propagated (usually a few minutes). After verification you can enable the Cloudflare proxy (orange cloud) if desired.

---

That’s it! Your Next.js project will now be continuously deployed to Vercel whenever you push to `main`.