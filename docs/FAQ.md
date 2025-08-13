# SuperSearch Frequently Asked Questions (FAQ)

## General Questions

### What is SuperSearch?
SuperSearch is a web-based search engine aggregator that allows you to search multiple search engines simultaneously. Instead of visiting Google, DuckDuckGo, and Bing separately, you can search all of them at once from a single interface.

### Is SuperSearch free to use?
Yes, SuperSearch is completely free to use. There are no subscription fees, premium features, or hidden costs.

### Do I need to create an account?
No, SuperSearch works entirely in your browser without requiring any account creation or personal information.

### How does SuperSearch protect my privacy?
- All data is stored locally in your browser
- No search queries are sent to our servers
- You can disable search history tracking
- No personal information is collected
- You control all your data

## Getting Started

### How do I start using SuperSearch?
Simply open the application in your web browser and start searching. The default search engines (Google, DuckDuckGo, Bing) are ready to use immediately.

### What browsers are supported?
SuperSearch works on all modern browsers:
- Chrome 80+ (Recommended)
- Firefox 75+
- Safari 13+
- Edge 80+

### Can I use SuperSearch on mobile devices?
Yes! SuperSearch is fully responsive and optimized for mobile devices with touch-friendly controls and mobile navigation.

## Search Functionality

### How do I search multiple engines at once?
1. Enter your search query in the main search box
2. Select the search engines you want to use (checkboxes)
3. Click "Search" or press Enter
4. Results will open in separate tabs for each engine

### Can I add my own search engines?
Yes! You can add unlimited custom search engines:
1. Go to Settings > Search Engines
2. Click "Add New Engine"
3. Enter the engine name and search URL template
4. Use {query} as a placeholder for search terms

### What is a URL template?
A URL template is the search URL with {query} as a placeholder. For example:
- Google: `https://www.google.com/search?q={query}`
- Wikipedia: `https://en.wikipedia.org/wiki/Special:Search?search={query}`

### How do I set a default search engine?
1. Go to Settings > Search Engines
2. Click "Set as Default" next to your preferred engine
3. The default engine will be marked with a star icon

## Search History

### Is my search history saved?
Yes, by default all searches are saved locally in your browser. You can disable this in Settings > Privacy.

### How do I view my search history?
Click the "History" button in the navigation bar to view all your past searches in chronological order.

### Can I delete my search history?
Yes, you can:
- Delete individual search entries
- Clear all history at once
- Set automatic cleanup in privacy settings

### How long is search history kept?
By default, up to 1000 search entries are kept. You can change this limit in Settings > Privacy.

## Settings and Customization

### How do I change the theme?
Go to Settings > Appearance and select your preferred theme (Light or Dark).

### Can I customize the colors?
Yes, you can set custom colors for each search engine when adding or editing them.

### How do I backup my settings?
Use the Export Configuration feature in Settings > Advanced to download a backup file containing all your settings and search engines.

### How do I restore my settings?
Use the Import Configuration feature in Settings > Advanced to restore from a previously exported backup file.

## Technical Questions

### Where is my data stored?
All data is stored locally in your browser using IndexedDB. Nothing is sent to external servers except when you perform searches.

### What happens if I clear my browser data?
Clearing browser data will remove all your SuperSearch settings, search engines, and history. Make sure to export your configuration first.

### Can I use SuperSearch offline?
The application interface works offline, but you need an internet connection to perform actual searches.

### How much storage does SuperSearch use?
SuperSearch typically uses less than 5MB of storage, depending on your search history and number of custom engines.

## Troubleshooting

### SuperSearch won't load
1. Check that JavaScript is enabled
2. Try refreshing the page
3. Clear browser cache
4. Try a different browser
5. Check browser console for errors

### Search engines not working
1. Verify the search URL template is correct
2. Check that {query} placeholder is included
3. Test the URL manually in a browser
4. Ensure the website is accessible

### Settings not saving
1. Check that local storage is enabled
2. Verify browser privacy settings
3. Try incognito/private mode
4. Clear browser cache and reload

### Import/Export not working
1. Verify file format is valid JSON
2. Check file size (should be < 10MB)
3. Ensure file is not corrupted
4. Try a different browser

### Mobile issues
1. Enable JavaScript in mobile browser
2. Check viewport meta tag
3. Try landscape orientation
4. Clear mobile browser cache

## Performance

### How can I make SuperSearch faster?
1. Limit active search engines to 5-7
2. Clear search history regularly
3. Disable animations in settings
4. Enable performance mode
5. Use a modern browser

### Why are some searches slow?
- Network connection speed
- Search engine response time
- Number of engines selected
- Browser performance
- Device capabilities

### How do I optimize for mobile?
1. Enable touch-friendly mode
2. Use fewer search engines
3. Clear cache regularly
4. Enable performance optimizations
5. Use landscape orientation

## Security and Privacy

### Is SuperSearch secure?
Yes, SuperSearch includes comprehensive security measures:
- Input sanitization
- XSS prevention
- Secure URL validation
- Content Security Policy
- No external data transmission

### What data does SuperSearch collect?
SuperSearch collects no personal data. All information (searches, settings, history) is stored locally in your browser.

### Can I disable search history?
Yes, go to Settings > Privacy and disable "Enable History" to stop tracking searches.

### How do I completely remove my data?
1. Clear all history in the application
2. Clear browser data for the site
3. Or simply delete the browser storage

## Advanced Usage

### Can I automate SuperSearch?
Yes, SuperSearch exposes JavaScript APIs for automation:
- `app.performSearch(query, engines)`
- `app.addEngine(config)`
- `app.exportConfiguration()`

### How do I add specialized search engines?
Examples of custom engines you can add:
- Academic: Google Scholar, PubMed, arXiv
- Shopping: Amazon, eBay, Etsy
- Social: Twitter, Reddit, Stack Overflow
- Media: YouTube, Flickr, Unsplash

### Can I integrate with browser extensions?
SuperSearch is designed to work with browser extensions and can be extended with custom functionality.

## Updates and Maintenance

### How do I update SuperSearch?
SuperSearch is a web application that updates automatically. Simply refresh the page to get the latest version.

### How often is SuperSearch updated?
Updates are released regularly with new features, bug fixes, and security improvements.

### What's new in the latest version?
Check the application's help section for the latest release notes and feature announcements.

## Support

### Where can I get help?
1. Check this FAQ first
2. Use the in-app help system (? icon)
3. Review the user guide
4. Check browser console for errors

### How do I report bugs?
If you encounter issues:
1. Note the browser and version
2. Describe the steps to reproduce
3. Check browser console for errors
4. Try in incognito/private mode

### Can I suggest new features?
Yes! Feature suggestions are welcome. Consider:
- How it would benefit users
- Technical feasibility
- Impact on performance
- Compatibility requirements

---

*This FAQ covers the most common questions about SuperSearch. For additional help, use the in-app help system or refer to the user guide.*
