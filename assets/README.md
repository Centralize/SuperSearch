# SuperSearch Assets Directory

This directory contains all static assets for the SuperSearch application.

## Directory Structure

```
assets/
├── icons/              # Search engine icons and application icons
│   ├── engines/        # Individual search engine icons
│   ├── app/           # Application icons (favicon, etc.)
│   └── ui/            # UI icons and symbols
├── images/            # Images and graphics
│   ├── logos/         # Logos and branding
│   ├── screenshots/   # Application screenshots
│   └── backgrounds/   # Background images
├── fonts/             # Custom fonts (if any)
└── data/              # Static data files
    ├── default-engines.json  # Default search engines configuration
    └── help-content.json     # Help and documentation content
```

## Icon Guidelines

- **Format**: SVG preferred, PNG as fallback
- **Size**: 24x24px for UI icons, 32x32px for engine icons
- **Style**: Consistent with UIKit design system
- **Naming**: kebab-case (e.g., `search-engine-google.svg`)

## Image Guidelines

- **Format**: WebP preferred, PNG/JPG as fallback
- **Optimization**: All images should be optimized for web
- **Responsive**: Provide multiple sizes where needed
- **Alt Text**: Always include descriptive alt text in HTML

## Search Engine Icons

Each search engine should have:
- Icon file: `engines/[engine-name].svg`
- Fallback: `engines/[engine-name].png`
- Size: 32x32px
- Background: Transparent or white

## Application Icons

- `favicon.ico` - Browser favicon
- `app-icon-192.png` - PWA icon (192x192)
- `app-icon-512.png` - PWA icon (512x512)
- `logo.svg` - Main application logo

## Usage in Code

```javascript
// Example: Loading search engine icon
const iconPath = `assets/icons/engines/${engineName}.svg`;

// Example: Loading application logo
const logoPath = 'assets/images/logos/logo.svg';
```

## Optimization

All assets should be optimized before deployment:
- SVG: Remove unnecessary metadata
- PNG/JPG: Compress with tools like TinyPNG
- WebP: Convert from PNG/JPG for better compression

## Attribution

If using third-party assets, ensure proper attribution is included in the main README.md file.
