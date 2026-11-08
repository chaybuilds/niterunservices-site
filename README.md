# NiteRun Services

One website for NiteClean, NiteDetail, NiteWash and NiteHolidays.

**Public preview:** https://chaybuilds.github.io/niterunservices-site/

**Custom domain:** https://niterunservices.com/ (GitHub Pages configured; Namecheap DNS cutover made on November 8, 2026; HTTPS certificate and public activation must still be independently verified).

## Architecture
- Static, dependency-free, mobile-first source; generated into `dist/` for GitHub Pages.
- 4 service overview pages; 12 service + city landing pages; private-quote requests are NOT confirmed bookings.
- Protected lead collection: Supabase Edge Function `services-intake`; locked-down RLS database table.
- Static code and build rules sync through GitHub across Windows and macOS.
- User/customer data is NOT committed to GitHub. Sensitive backend credentials NEVER belong in this repo.
- No invented reviews, business locations, available technicians, guarantees, or payment claims.

## Develop
```sh
npm test
npm run build
python -m http.server 8778 --directory dist
```

## Cross-device
```sh
# On your Mac, after GitHub authentication:
git clone https://github.com/chaybuilds/niterunservices-site.git ~/NiteRun/niterunservices-site
cd ~/NiteRun/niterunservices-site
npm run check
```
For an existing checkout, use `git pull --ff-only`. Never force-reset work or sync production secrets to Git.

## Data flow
Google Business Profile (only if genuinely eligible) -> exact service/city landing page -> consented quote request -> Edge Function -> RLS-protected CRM lead. The receipt confirms inquiry submission, not a contractor booking.

## Publish custom domain
GitHub Pages domain should be configured *before* DNS is changed. See `DOMAIN_SETUP.md`. No guaranteed availability in any market; site accepts requests for review.
