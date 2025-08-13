/**
 * SuperSearch Production Build Script
 * Prepares the application for production deployment
 */

const fs = require('fs').promises;
const path = require('path');

class BuildManager {
    constructor() {
        this.buildDir = 'dist';
        this.sourceDir = '.';
        this.version = '1.0.0';
    }

    /**
     * Main build process
     */
    async build() {
        try {
            console.log('🚀 Starting SuperSearch production build...');
            
            // Clean build directory
            await this.cleanBuildDir();
            
            // Copy source files
            await this.copySourceFiles();
            
            // Optimize files
            await this.optimizeFiles();
            
            // Generate production config
            await this.generateProductionConfig();
            
            // Create build manifest
            await this.createBuildManifest();
            
            console.log('✅ Production build completed successfully!');
            console.log(`📦 Build output: ${this.buildDir}/`);
            
        } catch (error) {
            console.error('❌ Build failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Clean build directory
     */
    async cleanBuildDir() {
        try {
            await fs.rmdir(this.buildDir, { recursive: true });
        } catch (error) {
            // Directory doesn't exist, that's fine
        }
        
        await fs.mkdir(this.buildDir, { recursive: true });
        console.log('🧹 Cleaned build directory');
    }

    /**
     * Copy source files to build directory
     */
    async copySourceFiles() {
        const filesToCopy = [
            'index.html',
            'css/',
            'js/',
            'images/',
            'favicon.ico'
        ];

        for (const file of filesToCopy) {
            await this.copyRecursive(file, path.join(this.buildDir, file));
        }
        
        console.log('📁 Copied source files');
    }

    /**
     * Copy files recursively
     */
    async copyRecursive(src, dest) {
        const stat = await fs.stat(src);
        
        if (stat.isDirectory()) {
            await fs.mkdir(dest, { recursive: true });
            const files = await fs.readdir(src);
            
            for (const file of files) {
                await this.copyRecursive(
                    path.join(src, file),
                    path.join(dest, file)
                );
            }
        } else {
            await fs.copyFile(src, dest);
        }
    }

    /**
     * Optimize files for production
     */
    async optimizeFiles() {
        console.log('⚡ Optimizing files...');
        
        // Minify CSS
        await this.minifyCSS();
        
        // Minify JavaScript
        await this.minifyJavaScript();
        
        // Optimize HTML
        await this.optimizeHTML();
        
        // Remove development files
        await this.removeDevFiles();
    }

    /**
     * Minify CSS files
     */
    async minifyCSS() {
        const cssFile = path.join(this.buildDir, 'css/style.css');
        const content = await fs.readFile(cssFile, 'utf8');
        
        // Simple CSS minification
        const minified = content
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
            .replace(/\s*{\s*/g, '{') // Clean braces
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*;\s*/g, ';')
            .replace(/\s*,\s*/g, ',')
            .replace(/\s*:\s*/g, ':')
            .trim();
        
        await fs.writeFile(cssFile, minified);
        console.log('🎨 Minified CSS');
    }

    /**
     * Minify JavaScript files
     */
    async minifyJavaScript() {
        const jsDir = path.join(this.buildDir, 'js');
        const files = await fs.readdir(jsDir);
        
        for (const file of files) {
            if (file.endsWith('.js')) {
                const filePath = path.join(jsDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                
                // Simple JS minification (basic)
                const minified = content
                    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
                    .replace(/\/\/.*$/gm, '') // Remove line comments
                    .replace(/\s+/g, ' ') // Collapse whitespace
                    .replace(/;\s*}/g, '}') // Clean up
                    .trim();
                
                await fs.writeFile(filePath, minified);
            }
        }
        
        console.log('📜 Minified JavaScript');
    }

    /**
     * Optimize HTML
     */
    async optimizeHTML() {
        const htmlFile = path.join(this.buildDir, 'index.html');
        let content = await fs.readFile(htmlFile, 'utf8');
        
        // Remove development comments
        content = content.replace(/<!--[\s\S]*?-->/g, '');
        
        // Add production meta tags
        const productionMeta = `
    <!-- Production Build v${this.version} -->
    <meta name="robots" content="index, follow">
    <meta name="author" content="SuperSearch">
    <meta name="generator" content="SuperSearch Build System">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self' https:;">
        `;
        
        content = content.replace('</head>', productionMeta + '</head>');
        
        await fs.writeFile(htmlFile, content);
        console.log('📄 Optimized HTML');
    }

    /**
     * Remove development files
     */
    async removeDevFiles() {
        const devFiles = [
            'build.js',
            'package.json',
            'package-lock.json',
            '.gitignore',
            'README.md',
            'SCRUM.md'
        ];

        for (const file of devFiles) {
            try {
                const filePath = path.join(this.buildDir, file);
                await fs.unlink(filePath);
            } catch (error) {
                // File doesn't exist, that's fine
            }
        }
        
        console.log('🗑️ Removed development files');
    }

    /**
     * Generate production configuration
     */
    async generateProductionConfig() {
        const config = {
            version: this.version,
            buildDate: new Date().toISOString(),
            environment: 'production',
            features: {
                debugMode: false,
                performanceMonitoring: false,
                verboseLogging: false,
                cacheEnabled: true
            }
        };

        const configFile = path.join(this.buildDir, 'config.json');
        await fs.writeFile(configFile, JSON.stringify(config, null, 2));
        
        console.log('⚙️ Generated production configuration');
    }

    /**
     * Create build manifest
     */
    async createBuildManifest() {
        const manifest = {
            name: 'SuperSearch',
            version: this.version,
            buildDate: new Date().toISOString(),
            files: await this.getFileList(),
            checksums: await this.generateChecksums()
        };

        const manifestFile = path.join(this.buildDir, 'manifest.json');
        await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2));
        
        console.log('📋 Created build manifest');
    }

    /**
     * Get list of all files in build
     */
    async getFileList() {
        const files = [];
        
        const scanDirectory = async (dir, prefix = '') => {
            const items = await fs.readdir(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const relativePath = path.join(prefix, item);
                const stat = await fs.stat(fullPath);
                
                if (stat.isDirectory()) {
                    await scanDirectory(fullPath, relativePath);
                } else {
                    files.push({
                        path: relativePath.replace(/\\/g, '/'),
                        size: stat.size,
                        modified: stat.mtime.toISOString()
                    });
                }
            }
        };
        
        await scanDirectory(this.buildDir);
        return files;
    }

    /**
     * Generate file checksums
     */
    async generateChecksums() {
        const crypto = require('crypto');
        const checksums = {};
        
        const files = await this.getFileList();
        
        for (const file of files) {
            const filePath = path.join(this.buildDir, file.path);
            const content = await fs.readFile(filePath);
            const hash = crypto.createHash('sha256').update(content).digest('hex');
            checksums[file.path] = hash;
        }
        
        return checksums;
    }
}

// Run build if called directly
if (require.main === module) {
    const builder = new BuildManager();
    builder.build().catch(console.error);
}

module.exports = BuildManager;
