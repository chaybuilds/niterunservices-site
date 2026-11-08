# Namecheap domain activation

Domain purchased by the owner: `niterunservices.com`. On November 8, 2026 the GitHub Pages custom-domain setting was configured, four apex A records and the `www` CNAME were saved in Namecheap. DNS convergence and the Pages HTTPS certificate still require successful verification.

GitHub Pages: https://github.com/chaybuilds/niterunservices-site/settings/pages

To use the custom domain without losing existing email records:
1. Set the custom domain on the repository's **Pages** settings to `niterunservices.com`, then confirm/save.
2. In Namecheap > Domain List > `niterunservices.com` > Manage > Advanced DNS, inspect existing records first. Preserve any MX/TXT/CNAME records used for email and verification.
3. Replace Namecheap **parking/URL redirect** host records at `@` with the GitHub Pages A records:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
4. Set a single `www` CNAME to `chaybuilds.github.io` (remove conflicting parking CNAME for **www**).
5. Confirm DNS propagation using public resolvers; then GitHub Pages **Enforce HTTPS** once available.

Never overwrite MX/SPF/DKIM/DMARC or add wildcard CNAMEs.

Custom domain cutover requires the owner's authenticated Namecheap session; DNS changes are not equivalent to ownership verification. Before DNS is changed the working link is https://chaybuilds.github.io/niterunservices-site/.
