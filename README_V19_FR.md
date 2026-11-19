# KALY Website — V19

## Modifications
- Added a six-step Tracker overview to the website.
- Reworked the contact form to show its fields progressively on the same page after the visitor selects a request type.
- Added request categories: general question, healthcare professional/partnership, testing/development participation, and other.
- Added organisation/function fields for professional enquiries and a participation choice for test/development enquiries.
- Preserved direct form submission through `/api/contact`, Cloudflare Pages Functions and Resend. No `mailto:` submission.
- Added French, Spanish and English translations.
- Kept the hidden anti-spam honeypot.

## Deployment
Copy the contents of this folder into the root of the GitHub repository, preserving the `css`, `js`, `functions/api` and `assets` folders. Commit to the branch connected to Cloudflare Pages.

The Cloudflare Pages environment must retain the `RESEND_API_KEY` secret and, optionally, `RESEND_FROM`.

## Important
The six Tracker step labels and descriptions are a presentation proposal based on the current project description. Check that they match the exact six screens in the app before publishing.

## Assets not included in this package
- `assets/bandeauKALY%20ok%20fr.png`
