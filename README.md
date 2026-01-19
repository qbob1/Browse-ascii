# GNU Unifont Character Categorizer

An interactive web application for browsing, categorizing, and organizing Unicode characters from the GNU Unifont character set.

## Features

### 🔤 Interactive Character Grid
- Browse Unicode characters by range
- Pre-configured ranges for common scripts (Latin, Greek, Cyrillic, CJK, etc.)
- Custom range selector for specific Unicode blocks
- Visual grid display using GNU Unifont

### 🏷️ Character Categorization
- Create custom categories with names and descriptions
- Customize background and text colors for each category
- Apply categories to individual characters or batches
- **Batch categorization** with animated sequence preview
- Animated character display (0.25s intervals) with play/pause controls
- Add notes to categorized characters (applied to all in batch mode)
- Visual indicators for categorized characters

### 👥 Character Grouping
- Multi-select mode for selecting multiple characters
- Create groups from character sequences
- Name and annotate groups
- Visual indicators for grouped characters
- Hover over groups to highlight characters in the grid

### 💾 State Management
- Automatic save to browser localStorage
- Export state to JSON file with metadata and comments
- Import previously saved states
- Preserves all categories, character data, and groups

### 🎨 Customization
- Per-character color customization
- Category-level default colors
- Custom notes for characters and groups
- Dark mode interface

## Usage

### Getting Started

1. **Select a Unicode Range**
   - Use the dropdown to select a predefined Unicode range (e.g., Basic Latin, Emoji)
   - Or select "Custom Range" to specify your own start and end codepoints

2. **Categorize Characters**
   - **Single character**: Click on any character to open the categorization menu
   - **Multiple characters**:
     - Enable "Multi-Select Mode"
     - Click multiple characters to select them
     - Click "Categorize Selection" to open the batch categorization menu
     - Watch the animated sequence preview (0.25s intervals between characters)
     - Play/pause the animation as needed
   - Create a new category or select an existing one
   - Customize colors and add notes
   - Save your categorization (applies to all selected characters in batch mode)

3. **Create Groups**
   - Enable "Multi-Select Mode"
   - Click multiple characters to select them
   - Click "Create Group from Selection"
   - Name your group and add notes

4. **Export Your Work**
   - Click "Export State" to download a JSON file
   - The export includes all categories, character data, and groups
   - Includes metadata like character counts and creation dates

5. **Import Previous Work**
   - Click "Import State"
   - Select a previously exported JSON file
   - All your categories and data will be restored

## File Structure

```
Browse-ascii/
├── index.html              # Main HTML page
├── styles.css              # Application styles
├── js/
│   ├── app.js              # Main application controller
│   ├── state-manager.js    # State management and persistence
│   ├── unicode-grid.js     # Unicode grid web component
│   └── categorization-menu.js  # Categorization modal component
└── README.md               # This file
```

## Technical Details

### Web Components
The application uses native Web Components (Custom Elements) for modularity:
- `<unicode-grid>` - Renders the character grid
- `<categorization-menu>` - Modal dialog for categorization

### State Management
- Centralized state management using a singleton StateManager
- Observer pattern for reactive UI updates
- Automatic persistence to localStorage
- Export/import functionality for data portability

### Data Structure

#### Categories
```javascript
{
  id: "cat_...",
  name: "Category Name",
  bgColor: "#2d2d2d",
  textColor: "#e0e0e0",
  description: "Optional description",
  created: 1234567890
}
```

#### Character Data
```javascript
{
  category: "cat_...",
  notes: "Character notes",
  bgColor: "#custom",
  textColor: "#custom",
  groupId: "grp_...",
  modified: 1234567890
}
```

#### Groups
```javascript
{
  id: "grp_...",
  name: "Group Name",
  characters: [0x1F600, 0x1F601, ...],
  category: "cat_...",
  notes: "Group notes",
  created: 1234567890
}
```

### Export Format
The exported JSON includes:
- Version information
- Export timestamp
- All categories with character counts
- All character data with Unicode values and strings
- All groups with character sequences
- Metadata summary

## Browser Compatibility

- Modern browsers with ES6+ support
- Custom Elements v1 support
- LocalStorage support required
- Tested on Chrome, Firefox, Safari, and Edge

## GitHub Pages Deployment

This application is designed to work seamlessly with GitHub Pages:

1. Push this repository to GitHub
2. Enable GitHub Pages in repository settings
3. Select the main branch as the source
4. Access your application at `https://[username].github.io/[repository-name]/`

No build process required - it's pure HTML, CSS, and vanilla JavaScript!

## Keyboard Shortcuts

- `Esc` - Close categorization modal
- Click outside modal - Close modal

## Tips

1. **Performance**: The grid displays up to 1024 characters at once for optimal performance
2. **Organization**: Use categories for broad classifications and groups for related character sequences
3. **Backup**: Regularly export your state to preserve your work
4. **Colors**: Use distinct colors for categories to easily identify them in the grid
5. **Notes**: Add detailed notes to remember why you categorized specific characters

## Future Enhancements

Possible additions:
- Search and filter functionality
- Bulk categorization operations
- Category hierarchies
- Character comparison view
- Multiple grid views side-by-side
- Collaborative categorization (cloud sync)
- Advanced Unicode property filters

## Credits

- **GNU Unifont**: https://unifoundry.com/unifont/
- Built with vanilla JavaScript and Web Components
- No external dependencies

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## About GNU Unifont

GNU Unifont is a bitmap font that covers the Unicode Basic Multilingual Plane (BMP). It includes glyphs for most of the world's scripts and is particularly useful for displaying a wide range of Unicode characters consistently.
