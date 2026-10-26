# Unique Automation CCTV — Website

Static website built with HTML, CSS, Bootstrap 5 and plain JavaScript. No Node.js or build step.

## Run locally

1. Start Apache in XAMPP.
2. Open `http://localhost/ccctv/`.

## Structure

| Path | Purpose |
| --- | --- |
| `index.html`, `services.html`, `packages.html`, `gallery.html`, `about.html`, `contact.html`, `404.html` | Pages |
| `assets/css/style.css` | Theme and styles (on top of Bootstrap) |
| `assets/js/main.js` | Navbar, scroll reveal, camera-wall clock, cost estimator, contact form |
| `assets/images/` | Photos, logo and favicons |
| `contact.php` | Saves contact form enquiries to `data/enquiries.csv` (needs PHP) |

Bootstrap, Bootstrap Icons and the Geist font load from CDNs.

## Editing notes

- The header and footer are repeated in every page — update phone numbers or menu links in all 7 HTML files.
- Estimator prices are at the top of `initEstimator()` in `assets/js/main.js`.
