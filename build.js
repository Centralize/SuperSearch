#!/usr/bin/env node

/**
 * Simple Build Script for SuperSearch
 * 
 * This script performs basic optimizations for production:
 * - Minifies CSS and JavaScript
 * - Optimizes images
 * - Creates production build directory
 * 
 * Usage: node build.js
 */

const fs = require('fs');
const path = require('path');

class SuperSearchBuilder {
    constructor() {
        this.sourceDir = __dirname;
        this.buildDir = path.join(__dirname, 'dist');
        this.version = '1.0.0';
    }

    /**
     * Main build process
     */
    async build() {
        console.log('🚀 Starting SuperSearch build process...');
        
        try {
            // Clean and create build directory
            this.cleanBuildDir();
            this.createBuildDir();
            
            // Copy and process files
            await this.copyStaticFiles();
            await this.processHTML();
            await this.processCSS();
            await this.processJavaScript();
            await this.copyAssets();
            
            // Generate build info
            this.generateBuildInfo();
            
            console.log('✅ Build completed successfully!');
            console.log(`📦 Production files available in: ${this.buildDir}`);
            
        } catch (error) {
            console.error('❌ Build failed:', error);
            process.exit(1);
        }
    }

    /**
     * Clean build directory
     */
    cleanBuildDir() {
        if (fs.existsSync(this.buildDir)) {
            fs.rmSync(this.buildDir, { recursive: true, force: true });
        }
    }

    /**
     * Create build directory structure
     */
    createBuildDir() {
        fs.mkdirSync(this.buildDir, { recursive: true });
        fs.mkdirSync(path.join(this.buildDir, 'css'), { recursive: true });
        fs.mkdirSync(path.join(this.buildDir, 'js'), { recursive: true });
        fs.mkdirSync(path.join(this.buildDir, 'assets'), { recursive: true });
    }

    /**
     * Copy static files
     */
    async copyStaticFiles() {
        console.log('📄 Copying static files...');
        
        // Copy README and other docs
        const staticFiles = ['README.md', 'LICENSE'];
        
        staticFiles.forEach(file => {
            const sourcePath = path.join(this.sourceDir, file);
            const destPath = path.join(this.buildDir, file);
            
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath);
            }
        });
    }

    /**
     * Process HTML files
     */
    async processHTML() {
        console.log('🌐 Processing HTML files...');
        
        const htmlPath = path.join(this.sourceDir, 'index.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        // Update file references for production
        htmlContent = htmlContent
            .replace('css/style.css', 'css/style.min.css')
            .replace('js/app.js', 'js/app.min.js');
        
        // Add cache busting
        const timestamp = Date.now();
        htmlContent = htmlContent
            .replace('css/style.min.css', `css/style.min.css?v=${timestamp}`)
            .replace('js/app.min.js', `js/app.min.js?v=${timestamp}`);
        
        // Add production meta tags
        htmlContent = htmlContent.replace(
            '<meta name="viewport"',
            `<meta name="build-version" content="${this.version}">\n    <meta name="build-date" content="${new Date().toISOString()}">\n    <meta name="viewport"`
        );
        
        fs.writeFileSync(path.join(this.buildDir, 'index.html'), htmlContent);
    }

    /**
     * Process CSS files
     */
    async processCSS() {
        console.log('🎨 Processing CSS files...');
        
        const cssPath = path.join(this.sourceDir, 'css', 'style.css');
        let cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Basic CSS minification
        cssContent = this.minifyCSS(cssContent);
        
        fs.writeFileSync(path.join(this.buildDir, 'css', 'style.min.css'), cssContent);
    }

    /**
     * Process JavaScript files
     */
    async processJavaScript() {
        console.log('⚡ Processing JavaScript files...');
        
        // Copy modules directory
        const modulesDir = path.join(this.sourceDir, 'js', 'modules');
        const buildModulesDir = path.join(this.buildDir, 'js', 'modules');
        fs.mkdirSync(buildModulesDir, { recursive: true });
        
        // Copy and minify each module
        const moduleFiles = fs.readdirSync(modulesDir);
        moduleFiles.forEach(file => {
            if (file.endsWith('.js')) {
                const sourcePath = path.join(modulesDir, file);
                const destPath = path.join(buildModulesDir, file);
                
                let jsContent = fs.readFileSync(sourcePath, 'utf8');
                jsContent = this.minifyJS(jsContent);
                
                fs.writeFileSync(destPath, jsContent);
            }
        });
        
        // Process main app.js
        const appPath = path.join(this.sourceDir, 'js', 'app.js');
        let appContent = fs.readFileSync(appPath, 'utf8');
        appContent = this.minifyJS(appContent);
        
        fs.writeFileSync(path.join(this.buildDir, 'js', 'app.min.js'), appContent);
    }

    /**
     * Copy assets
     */
    async copyAssets() {
        console.log('📁 Copying assets...');
        
        const assetsDir = path.join(this.sourceDir, 'assets');
        const buildAssetsDir = path.join(this.buildDir, 'assets');
        
        this.copyDirectory(assetsDir, buildAssetsDir);
    }

    /**
     * Basic CSS minification
     */
    minifyCSS(css) {
        return css
            // Remove comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            // Remove whitespace around certain characters
            .replace(/\s*{\s*/g, '{')
            .replace(/;\s*/g, ';')
            .replace(/\s*}\s*/g, '}')
            .replace(/:\s*/g, ':')
            .replace(/,\s*/g, ',')
            // Remove trailing semicolons
            .replace(/;}/g, '}')
            .trim();
    }

    /**
     * Basic JavaScript minification
     */
    minifyJS(js) {
        return js
            // Remove single-line comments (but preserve URLs)
            .replace(/\/\/(?![^\n]*https?:)[^\n]*/g, '')
            // Remove multi-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            // Remove whitespace around operators
            .replace(/\s*([{}();,=+\-*/<>!&|])\s*/g, '$1')
            .trim();
    }

    /**
     * Copy directory recursively
     */
    copyDirectory(source, destination) {
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, { recursive: true });
        }
        
        const items = fs.readdirSync(source);
        
        items.forEach(item => {
            const sourcePath = path.join(source, item);
            const destPath = path.join(destination, item);
            
            if (fs.statSync(sourcePath).isDirectory()) {
                this.copyDirectory(sourcePath, destPath);
            } else {
                fs.copyFileSync(sourcePath, destPath);
            }
        });
    }

    /**
     * Generate build information
     */
    generateBuildInfo() {
        const buildInfo = {
            version: this.version,
            buildDate: new Date().toISOString(),
            buildTool: 'SuperSearch Builder',
            files: this.getBuildFileList()
        };
        
        fs.writeFileSync(
            path.join(this.buildDir, 'build-info.json'),
            JSON.stringify(buildInfo, null, 2)
        );
    }

    /**
     * Get list of build files
     */
    getBuildFileList() {
        const files = [];
        
        const scanDirectory = (dir, relativePath = '') => {
            const items = fs.readdirSync(dir);
            
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const relPath = path.join(relativePath, item);
                
                if (fs.statSync(fullPath).isDirectory()) {
                    scanDirectory(fullPath, relPath);
                } else {
                    const stats = fs.statSync(fullPath);
                    files.push({
                        path: relPath.replace(/\\/g, '/'),
                        size: stats.size,
                        modified: stats.mtime.toISOString()
                    });
                }
            });
        };
        
        scanDirectory(this.buildDir);
        return files;
    }
}

// Run build if called directly
if (require.main === module) {
    const builder = new SuperSearchBuilder();
    builder.build();
}

module.exports = SuperSearchBuilder;
