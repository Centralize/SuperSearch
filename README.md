# SuperSearch

A modern, multi-engine search application that allows you to search across multiple search engines simultaneously. Built with HTML5, JavaScript, and Bootstrap 5 for a fast, responsive, and privacy-focused experience.

## 🚀 Features

### Core Functionality
- **Multi-Engine Search**: Search across Google, DuckDuckGo, Bing, and custom engines simultaneously
- **Custom Search Engines**: Add, edit, and manage your own search engines
- **Search History**: Track and revisit your previous searches
- **Local Storage**: All data stored locally in your browser using IndexedDB
- **Privacy-Focused**: No data sent to external servers

### User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Bootstrap 5**: Modern, clean interface with professional styling
- **Keyboard Shortcuts**: Navigate efficiently with keyboard shortcuts
- **Accessibility**: Screen reader friendly with proper ARIA labels

### Advanced Features
- **Configuration Import/Export**: Backup and share your settings
- **Search Engine Categories**: Organize engines by type (General, Academic, Privacy, etc.)
- **Default Engine Management**: Set preferred default search engines
- **Form Validation**: Real-time validation for search engine configuration
- **Performance Optimization**: Debounced search, lazy loading, and caching

## 🎯 Quick Start

### Option 1: Direct Use
1. Download or clone this repository
2. Open `index.html` in any modern web browser
3. Start searching!

### Option 2: Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/supersearch.git
cd supersearch

# Open in browser
open index.html
# or
python -m http.server 8000  # Then visit http://localhost:8000
```

### Option 3: Production Build
```bash
# Build optimized version
node build.js

# Deploy the dist/ folder to your web server
```

## 📖 User Guide

### Basic Usage
1. **Enter Search Query**: Type your search terms in the search box
2. **Select Engines**: Click on search engines to select/deselect them
3. **Search**: Click "Search All Engines" or press Enter
4. **Results**: Search results open in new tabs for each selected engine

### Managing Search Engines
- **Add Engine**: Click "Manage Engines" → Fill out the form → Save
- **Edit Engine**: Click the pencil icon next to any engine
- **Delete Engine**: Click the trash icon next to any engine
- **Set Default**: Check "Set as default" when adding/editing an engine

### Keyboard Shortcuts
- `Ctrl+K` / `Cmd+K`: Focus search input
- `Enter`: Submit search
- `Escape`: Close modals/clear focus
- `Ctrl+A`: Select all engines
- `Ctrl+D`: Deselect all engines
- `1-9`: Quick select engines by number
- `Ctrl+Shift+A`: Add new engine
- `Ctrl+Shift+S`: Open settings
- `Ctrl+Shift+H`: Open history
- `F1`: Open help

### Settings & Preferences
Access settings via the gear icon to configure:
- **Search Behavior**: Default search mode, new tab preferences
- **History**: Enable/disable history, set maximum items
- **Privacy**: Control data retention and notifications
- **Import/Export**: Backup and restore your configuration

## 🛠️ Technical Details

### Architecture
```
supersearch/
├── index.html              # Main application file
├── css/
│   └── style.css          # Bootstrap 5 + custom styles
├── js/
│   ├── app.js             # Main application entry point
│   └── modules/           # ES6 modules
│       ├── dbManager.js   # IndexedDB wrapper
│       ├── searchEngine.js # Engine management
│       ├── searchHandler.js # Search operations
│       ├── uiManager.js   # UI interactions
│       ├── notificationManager.js # Toast notifications
│       ├── configManager.js # Configuration management
│       └── keyboardManager.js # Keyboard shortcuts
├── assets/
│   ├── data/              # Default configuration
│   ├── icons/             # Application and engine icons
│   └── images/            # Logos and graphics
└── build.js               # Production build script
```

### Technologies Used
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript ES6+**: Modules, async/await, classes
- **Bootstrap 5**: Responsive CSS framework
- **IndexedDB**: Client-side database for local storage
- **SVG Icons**: Scalable vector graphics for crisp icons

### Browser Compatibility
- **Chrome**: 60+ ✅
- **Firefox**: 55+ ✅
- **Safari**: 12+ ✅
- **Edge**: 79+ ✅
- **Mobile**: iOS Safari 12+, Chrome Mobile 60+ ✅

### Performance Features
- **Lazy Loading**: Engine icons loaded on demand
- **Debounced Search**: Prevents excessive API calls
- **Caching**: Database queries cached for 5 minutes
- **Minification**: Production build includes minified assets
- **Compression**: Gzip-ready for web server deployment

## 🔧 Development

### Prerequisites
- Modern web browser with ES6 module support
- Node.js (for build process)
- Git (for version control)

### Development Setup
```bash
# Clone repository
git clone https://github.com/yourusername/supersearch.git
cd supersearch

# Start development server (optional)
python -m http.server 8000
# or
npx serve .
```

### Building for Production
```bash
# Create optimized build
node build.js

# Output will be in dist/ directory
# Deploy dist/ contents to your web server
```

## 🚀 Deployment

Deploy to any static hosting service:
- **GitHub Pages**: Push to `gh-pages` branch
- **Netlify**: Connect repository with build command `node build.js`
- **Vercel**: Deploy with zero configuration
- **Apache/Nginx**: Upload files to web root

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 🔒 Privacy & Security

### Data Storage
- **Local Only**: All data stored in your browser's IndexedDB
- **No Tracking**: No analytics or tracking scripts
- **No External Calls**: Except to search engines when you search
- **Secure**: Input sanitization and XSS prevention

### Security Features
- Content Security Policy headers
- Input validation and sanitization
- URL validation for custom engines
- Secure default configurations

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check this README and [DEPLOYMENT.md](DEPLOYMENT.md)
- **Issues**: Report bugs on GitHub Issues

### Common Issues
1. **Search not working**: Ensure HTTPS is enabled (required for IndexedDB)
2. **Engines not loading**: Check browser console for errors
3. **Modals not opening**: Verify Bootstrap JavaScript is loaded

---

**SuperSearch** - Search smarter, not harder. 🔍

## Browser Compatibility

- Chrome 23+ (IndexedDB support)
- Firefox 16+ (IndexedDB support) 
- Safari 8+ (IndexedDB support)
- Edge 12+ (IndexedDB support)

## Project Structure

```
supersearch/
├── index.html              # Main application
├── css/
│   └── style.css          # Custom styles
├── js/
│   ├── app.js             # Main application logic
│   ├── searchEngine.js    # Search engine management
│   ├── searchHandler.js   # Search functionality
│   ├── configManager.js   # Import/export functionality
│   ├── dbManager.js       # IndexedDB operations
│   └── utils.js           # Utility functions
├── data/
│   └── default-engines.json # Default configurations
├── assets/
│   └── icons/             # Search engine icons
└── docs/                  # Documentation
```

## Development

### Local Development
For HTTPS testing (optional):
```bash
python -m http.server 8000
# or
php -S localhost:8000
```

### Adding Search Engines
1. Click "Manage Engines" 
2. Click "Add Engine"
3. Fill in engine details with {query} placeholder in URL
4. Save and enable the engine

### Configuration Management
- **Export**: Download your configuration as JSON
- **Import**: Upload and restore configurations
- **Settings**: Customize preferences and defaults

## SCRUM Development

This project follows SCRUM methodology. See `scrum.md` for:
- Epic breakdown
- Sprint planning
- User stories and tasks
- Definition of done

## Contributing

1. Fork the repository
2. Create feature branch
3. Implement using HTML5/CSS3/JavaScript/UIKit/IndexedDB only
4. Test across browsers
5. Submit pull request

## License

MIT License - see LICENSE file for details.