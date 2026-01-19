# GNU Unifont Character Categorizer

An interactive web application for browsing, categorizing, and organizing Unicode characters from the GNU Unifont character set.

## Features

### 🔤 Interactive Character Grid (Canvas-Based)
- **High-performance HTML5 Canvas rendering**
- **Infinite zoom** (0.1x to 10x) with smooth scaling
- **Pan and drag** navigation with mouse or touch
- **Scroll wheel zoom** centered on cursor position
- Browse up to 10,000 characters per range (increased capacity)
- Pre-configured ranges for common scripts (Latin, Greek, Cyrillic, CJK, etc.)
- Custom range selector for specific Unicode blocks
- HiDPI/Retina display support for crisp rendering
- Hover tooltips showing character info and category
- Viewport culling for optimal performance

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

3. **Navigate and Zoom**
   - **Drag to pan**: Click and drag anywhere on the grid to move around
   - **Scroll to zoom**: Use mouse wheel to zoom in/out (zooms toward cursor)
   - **Zoom buttons**: Use +/- buttons in bottom-right corner
   - **Reset view**: Click the home (⌂) button to reset zoom and position
   - **Hover for info**: Hover over any character to see its details
   - Supports both mouse and touch gestures for mobile devices

4. **Create Groups**
   - Enable "Multi-Select Mode"
   - Click multiple characters to select them
   - Click "Create Group from Selection"
   - Name your group and add notes

5. **Export Your Work**
   - Click "Export State" to download a JSON file
   - The export includes all categories, character data, and groups
   - Includes metadata like character counts and creation dates

6. **Import Previous Work**
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
- `<unicode-grid>` - Canvas-based character grid with zoom and pan
- `<categorization-menu>` - Modal dialog for categorization

### Canvas Rendering
The grid uses HTML5 Canvas for high-performance rendering:
- Viewport culling: Only visible characters are drawn
- DPI scaling: Automatic adjustment for Retina/HiDPI displays
- Event handling: Precise click detection with coordinate transformation
- Efficient redraws: Only updates when state changes
- Smooth animations: 60fps panning and zooming

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

## Navigation Controls

- **Mouse Drag** - Pan the grid in any direction
- **Mouse Wheel** - Zoom in/out (centered on cursor)
- **Click + or −** - Zoom buttons in bottom-right corner
- **Click ⌂** - Reset zoom and position
- **Hover** - See character info in tooltip
- **Touch Drag** - Pan on mobile devices

## Keyboard Shortcuts

- `Esc` - Close categorization modal
- Click outside modal - Close modal

## Tips

1. **Performance**: Canvas rendering now supports up to 10,000 characters with smooth 60fps scrolling
2. **Zooming**: Zoom in close to see character details, or zoom out for an overview
3. **Organization**: Use categories for broad classifications and groups for related character sequences
4. **Navigation**: Drag to explore large Unicode ranges easily
5. **Backup**: Regularly export your state to preserve your work
6. **Colors**: Use distinct colors for categories to easily identify them in the grid
7. **Notes**: Add detailed notes to remember why you categorized specific characters
8. **Mobile**: Touch gestures work great on tablets and phones

## Future Enhancements

Possible additions:
- Search and filter functionality
- Category hierarchies
- Character comparison view
- Multiple grid views side-by-side
- Collaborative categorization (cloud sync)
- Advanced Unicode property filters
- Pinch-to-zoom gesture support
- Minimap navigator for large ranges

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
