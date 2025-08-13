# SuperSearch User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Basic Search](#basic-search)
3. [Managing Search Engines](#managing-search-engines)
4. [Search History](#search-history)
5. [Settings & Preferences](#settings--preferences)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [Import/Export Configuration](#importexport-configuration)
8. [Mobile Usage](#mobile-usage)
9. [Troubleshooting](#troubleshooting)

## Getting Started

### What is SuperSearch?
SuperSearch is a powerful search engine aggregator that allows you to search multiple search engines simultaneously from a single interface. Instead of visiting different search engines individually, you can search Google, DuckDuckGo, Bing, and custom search engines all at once.

### First Time Setup
1. Open SuperSearch in your web browser
2. The application will initialize with default search engines (Google, DuckDuckGo, Bing)
3. You can immediately start searching or customize your search engines first

### System Requirements
- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- JavaScript enabled
- Local storage enabled for saving preferences

## Basic Search

### Performing a Search
1. Enter your search query in the main search box
2. Select which search engines to use (all are selected by default)
3. Click the "Search" button or press Enter
4. Results will open in new tabs for each selected search engine

### Search Features
- **Multi-Engine Search**: Search multiple engines simultaneously
- **Real-time Results**: Results open immediately in new tabs
- **Search History**: All searches are automatically saved
- **Quick Repeat**: Easily repeat previous searches

### Search Tips
- Use specific keywords for better results
- Try different search engines for varied perspectives
- Use quotes for exact phrase matching
- Combine multiple search terms with AND/OR

## Managing Search Engines

### Default Search Engines
SuperSearch comes with three pre-configured search engines:
- **Google**: General web search
- **DuckDuckGo**: Privacy-focused search
- **Bing**: Microsoft's search engine

### Adding Custom Search Engines
1. Click the "Settings" button in the navigation
2. Go to the "Search Engines" tab
3. Click "Add New Engine"
4. Fill in the required information:
   - **Name**: Display name for the engine
   - **Search URL**: URL template with {query} placeholder
   - **Icon URL**: Optional icon for the engine
   - **Color**: Theme color for the engine

### URL Template Format
The search URL must contain `{query}` which will be replaced with your search terms.

Examples:
- Google: `https://www.google.com/search?q={query}`
- DuckDuckGo: `https://duckduckgo.com/?q={query}`
- Wikipedia: `https://en.wikipedia.org/wiki/Special:Search?search={query}`

### Editing Search Engines
1. Go to Settings > Search Engines
2. Click the edit button (pencil icon) next to any engine
3. Modify the fields as needed
4. Click "Save Changes"

### Deleting Search Engines
1. Go to Settings > Search Engines
2. Click the delete button (trash icon) next to the engine
3. Confirm the deletion in the dialog
4. If deleting the default engine, choose a new default

### Setting Default Engine
1. Go to Settings > Search Engines
2. Click "Set as Default" next to your preferred engine
3. The default engine will be highlighted with a star icon

## Search History

### Viewing History
1. Click the "History" button in the navigation
2. Browse your search history in chronological order
3. Use the search box to find specific searches
4. Filter by date range or search engine

### Managing History
- **Repeat Search**: Click the refresh icon to repeat any search
- **Delete Entry**: Click the trash icon to remove individual entries
- **Clear All**: Use "Clear All History" to remove all entries
- **Export History**: Download your search history as a file

### Privacy Controls
1. Go to Settings > Privacy
2. Configure history settings:
   - **Enable/Disable History**: Turn history tracking on/off
   - **History Limit**: Set maximum number of entries to keep
   - **Auto-Clear**: Automatically clear old entries

## Settings & Preferences

### Appearance Settings
- **Theme**: Choose between light and dark themes
- **Results per Page**: Set how many results to display
- **Show Previews**: Enable/disable result previews

### Search Settings
- **Default Engine**: Set your preferred search engine
- **Open in New Tab**: Control whether results open in new tabs
- **Auto-complete**: Enable search suggestions

### Privacy Settings
- **Enable History**: Turn search history on/off
- **History Limit**: Maximum number of history entries
- **Clear on Exit**: Automatically clear history when closing

### Advanced Settings
- **Debug Mode**: Enable developer features
- **Performance Mode**: Optimize for slower devices
- **Keyboard Shortcuts**: Enable/disable keyboard navigation

## Keyboard Shortcuts

### Global Shortcuts
- **/** : Focus search input
- **Enter** : Perform search (when search input is focused)
- **Escape** : Close modals and dialogs
- **Ctrl/Cmd + H** : Open search history
- **Ctrl/Cmd + S** : Open settings
- **Shift + ?** : Open help

### Modal Navigation
- **Tab** : Navigate between form fields
- **Shift + Tab** : Navigate backwards
- **Enter** : Activate primary button
- **Escape** : Close modal

### Search Navigation
- **Arrow Up/Down** : Navigate search suggestions
- **Tab** : Auto-complete first suggestion

## Import/Export Configuration

### Exporting Configuration
1. Go to Settings > Advanced
2. Click "Export Configuration"
3. Choose export options:
   - Include search engines
   - Include preferences
   - Include search history
4. Click "Download" to save the file

### Importing Configuration
1. Go to Settings > Advanced
2. Click "Import Configuration"
3. Select a configuration file or drag and drop
4. Preview the changes
5. Choose to merge or replace existing configuration
6. Click "Import" to apply changes

### Configuration File Format
Configuration files are JSON format containing:
- Search engines with all settings
- User preferences
- Search history (optional)
- Metadata and version information

## Mobile Usage

### Mobile Navigation
- Tap the menu icon (☰) to open the mobile navigation
- Swipe down on modals to close them
- Use touch gestures for navigation

### Touch Interactions
- **Tap**: Select engines and perform actions
- **Long Press**: Access context menus
- **Swipe**: Navigate between tabs and close modals
- **Pull to Refresh**: Refresh search history

### Mobile Optimization
- Touch-friendly button sizes (minimum 44px)
- Optimized scrolling with momentum
- Responsive design for all screen sizes
- Fast loading on mobile networks

## Troubleshooting

### Common Issues

**Search not working**
- Check your internet connection
- Verify search engines are enabled
- Try refreshing the page

**Settings not saving**
- Ensure local storage is enabled
- Check browser privacy settings
- Try clearing browser cache

**Import/Export issues**
- Verify file format is correct JSON
- Check file size limits
- Ensure file is not corrupted

**Mobile issues**
- Enable JavaScript in mobile browser
- Check viewport settings
- Try landscape orientation

### Browser Compatibility
- **Chrome**: Fully supported (recommended)
- **Firefox**: Fully supported
- **Safari**: Supported with minor limitations
- **Edge**: Fully supported

### Performance Tips
- Limit number of active search engines
- Clear search history regularly
- Disable animations on slower devices
- Use performance mode in settings

### Getting Help
- Use the built-in help system (? icon)
- Check the FAQ section
- Review keyboard shortcuts
- Contact support if issues persist

## Advanced Features

### Developer Mode
Enable debug mode in settings to access:
- Console logging
- Performance metrics
- Testing functions
- Development tools

### Custom CSS
Advanced users can customize appearance by:
1. Enabling debug mode
2. Using browser developer tools
3. Modifying CSS variables
4. Creating custom themes

### API Integration
SuperSearch can be extended with:
- Custom search engines
- Third-party integrations
- Browser extensions
- Automation scripts

---

*SuperSearch v1.0 - Built with modern web technologies for fast, secure, and accessible search aggregation.*
