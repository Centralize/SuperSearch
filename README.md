# SuperSearch - Multi-Engine Search Platform

A modern web application that allows users to search across multiple search engines simultaneously with a clean, intuitive interface.

## Features

- **Multi-Engine Search**: Search Google, DuckDuckGo, Bing, and custom engines
- **Engine Management**: Add, edit, delete, and configure search engines
- **Data Persistence**: IndexedDB storage for settings and history
- **Import/Export**: Backup and share configurations
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support

## Tech Stack

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with custom properties
- **JavaScript**: Vanilla ES6+ modules
- **UIKit**: CSS framework for UI components
- **IndexedDB**: Client-side database storage

## Quick Start

1. Open `index.html` in a modern web browser
2. Enter your search query
3. Select search engines to use
4. Click "Search" or press Enter
5. View results in separate tabs

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