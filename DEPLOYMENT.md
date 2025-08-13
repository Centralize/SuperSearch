# SuperSearch Deployment Guide

This guide covers how to deploy SuperSearch to various hosting platforms.

## 📋 Prerequisites

- Node.js (for build process)
- Git (for version control)
- Web server or hosting platform

## 🚀 Quick Deployment

### Option 1: Direct Deployment (No Build)

For simple deployments, you can deploy the source files directly:

1. **Upload Files**
   ```bash
   # Upload these files to your web server:
   index.html
   css/
   js/
   assets/
   ```

2. **Configure Web Server**
   - Ensure your web server serves static files
   - Set `index.html` as the default document
   - Enable HTTPS (recommended)

### Option 2: Production Build

For optimized deployments:

1. **Build the Project**
   ```bash
   node build.js
   ```

2. **Deploy Build Files**
   ```bash
   # Upload the dist/ directory contents to your web server
   dist/index.html
   dist/css/
   dist/js/
   dist/assets/
   ```

## 🌐 Platform-Specific Deployments

### GitHub Pages

1. **Prepare Repository**
   ```bash
   git checkout -b gh-pages
   node build.js
   cp -r dist/* .
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin gh-pages
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings
   - Scroll to Pages section
   - Select `gh-pages` branch
   - Your site will be available at `https://username.github.io/repository-name`

### Netlify

1. **Connect Repository**
   - Sign up at [netlify.com](https://netlify.com)
   - Connect your GitHub repository
   - Set build command: `node build.js`
   - Set publish directory: `dist`

2. **Deploy**
   - Netlify will automatically build and deploy on every push
   - Custom domain and HTTPS are included

### Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configuration** (vercel.json)
   ```json
   {
     "buildCommand": "node build.js",
     "outputDirectory": "dist",
     "routes": [
       { "src": "/(.*)", "dest": "/index.html" }
     ]
   }
   ```

### Apache Web Server

1. **Upload Files**
   ```bash
   # Upload to your web root directory
   /var/www/html/supersearch/
   ```

2. **Configure .htaccess**
   ```apache
   # Enable compression
   <IfModule mod_deflate.c>
       AddOutputFilterByType DEFLATE text/plain
       AddOutputFilterByType DEFLATE text/html
       AddOutputFilterByType DEFLATE text/xml
       AddOutputFilterByType DEFLATE text/css
       AddOutputFilterByType DEFLATE application/xml
       AddOutputFilterByType DEFLATE application/xhtml+xml
       AddOutputFilterByType DEFLATE application/rss+xml
       AddOutputFilterByType DEFLATE application/javascript
       AddOutputFilterByType DEFLATE application/x-javascript
   </IfModule>

   # Set cache headers
   <IfModule mod_expires.c>
       ExpiresActive on
       ExpiresByType text/css "access plus 1 year"
       ExpiresByType application/javascript "access plus 1 year"
       ExpiresByType image/png "access plus 1 year"
       ExpiresByType image/svg+xml "access plus 1 year"
   </IfModule>

   # Security headers
   <IfModule mod_headers.c>
       Header always set X-Content-Type-Options nosniff
       Header always set X-Frame-Options DENY
       Header always set X-XSS-Protection "1; mode=block"
   </IfModule>
   ```

### Nginx

1. **Server Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/supersearch;
       index index.html;

       # Gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

       # Cache static assets
       location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       # Security headers
       add_header X-Content-Type-Options nosniff;
       add_header X-Frame-Options DENY;
       add_header X-XSS-Protection "1; mode=block";

       # Fallback to index.html for SPA
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## 🔧 Environment Configuration

### Production Optimizations

1. **Enable Service Worker** (Optional)
   ```javascript
   // Add to index.html for offline support
   if ('serviceWorker' in navigator) {
       navigator.serviceWorker.register('/sw.js');
   }
   ```

2. **Content Security Policy**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data:;">
   ```

3. **Analytics** (Optional)
   ```html
   <!-- Add before closing </head> tag -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   <script>
       window.dataLayer = window.dataLayer || [];
       function gtag(){dataLayer.push(arguments);}
       gtag('js', new Date());
       gtag('config', 'GA_MEASUREMENT_ID');
   </script>
   ```

## 🔒 Security Considerations

### HTTPS Configuration

Always serve SuperSearch over HTTPS:

1. **Let's Encrypt** (Free SSL)
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

2. **Cloudflare** (Free SSL + CDN)
   - Sign up at cloudflare.com
   - Add your domain
   - Update nameservers
   - Enable "Always Use HTTPS"

### Security Headers

Implement these security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
```

## 📊 Monitoring

### Performance Monitoring

1. **Google PageSpeed Insights**
   - Test your deployed site
   - Aim for 90+ scores

2. **Lighthouse Audit**
   - Run in Chrome DevTools
   - Check Performance, Accessibility, Best Practices, SEO

### Error Monitoring

1. **Browser Console**
   - Monitor for JavaScript errors
   - Check network requests

2. **Server Logs**
   - Monitor access logs
   - Check for 404 errors

## 🔄 Updates and Maintenance

### Automated Deployments

1. **GitHub Actions** (.github/workflows/deploy.yml)
   ```yaml
   name: Deploy
   on:
     push:
       branches: [ main ]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Setup Node.js
           uses: actions/setup-node@v2
           with:
             node-version: '16'
         - name: Build
           run: node build.js
         - name: Deploy
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

### Version Management

1. **Tag Releases**
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

2. **Update Version Numbers**
   - Update version in build.js
   - Update version in package.json (if using)

## 🆘 Troubleshooting

### Common Issues

1. **Files Not Loading**
   - Check file paths are correct
   - Verify web server configuration
   - Check browser console for errors

2. **Database Not Working**
   - Ensure HTTPS is enabled (required for IndexedDB)
   - Check browser compatibility
   - Verify no browser extensions blocking storage

3. **Search Not Working**
   - Check if search engines are accessible
   - Verify URL templates are correct
   - Test with different browsers

### Support

For deployment issues:
1. Check browser console for errors
2. Verify all files are uploaded correctly
3. Test with a simple HTTP server locally first
4. Check web server error logs

---

**Note**: SuperSearch is a client-side application that stores all data locally in the browser. No server-side database or backend is required.
