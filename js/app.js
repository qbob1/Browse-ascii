/**
 * Main Application Controller
 * Handles UI interactions and coordinates components
 */

import stateManager from './state-manager.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    const unicodeGrid = document.querySelector('unicode-grid');
    const categorizationMenu = document.querySelector('categorization-menu');
    const rangeSelector = document.getElementById('unicode-range');
    const customRangeDiv = document.querySelector('.custom-range');
    const selectModeBtn = document.getElementById('select-mode');
    const clearSelectionBtn = document.getElementById('clear-selection');
    const categorizeSelectionBtn = document.getElementById('categorize-selection');
    const newCategoryBtn = document.getElementById('new-category');
    const newGroupBtn = document.getElementById('new-group');
    const exportBtn = document.getElementById('export-state');
    const importBtn = document.getElementById('import-state');
    const importFile = document.getElementById('import-file');

    // Subscribe to state changes
    stateManager.subscribe((state) => {
        updateUI(state);
    });

    // Initial UI update
    updateUI(stateManager.state);

    // Unicode range selector
    rangeSelector.addEventListener('change', (e) => {
        const value = e.target.value;

        if (value === 'custom') {
            customRangeDiv.style.display = 'flex';
        } else {
            customRangeDiv.style.display = 'none';
            const [startHex, endHex] = value.split('-');
            const start = parseInt(startHex, 16);
            const end = parseInt(endHex, 16);
            updateRange(start, end);
        }
    });

    // Custom range application
    document.getElementById('apply-custom').addEventListener('click', () => {
        const startHex = document.getElementById('custom-start').value;
        const endHex = document.getElementById('custom-end').value;

        if (!startHex || !endHex) {
            alert('Please enter both start and end values');
            return;
        }

        const start = parseInt(startHex, 16);
        const end = parseInt(endHex, 16);

        if (isNaN(start) || isNaN(end)) {
            alert('Invalid hexadecimal values');
            return;
        }

        if (start > end) {
            alert('Start value must be less than or equal to end value');
            return;
        }

        updateRange(start, end);
    });

    // Multi-select mode toggle
    selectModeBtn.addEventListener('click', () => {
        stateManager.toggleMultiSelectMode();
    });

    // Clear selection
    clearSelectionBtn.addEventListener('click', () => {
        stateManager.clearSelection();
    });

    // Categorize selection
    categorizeSelectionBtn.addEventListener('click', () => {
        const selectedChars = stateManager.getSelectedCharacters();
        if (selectedChars.length > 0) {
            categorizationMenu.open(selectedChars);
        }
    });

    // Character selection from grid
    unicodeGrid.addEventListener('character-selected', (e) => {
        const codepoint = e.detail.codepoint;
        if (!stateManager.state.multiSelectMode) {
            categorizationMenu.open(codepoint);
        }
    });

    // New category button (in sidebar)
    newCategoryBtn.addEventListener('click', () => {
        createNewCategoryDialog();
    });

    // New group button
    newGroupBtn.addEventListener('click', () => {
        createNewGroup();
    });

    // Export state
    exportBtn.addEventListener('click', () => {
        exportState();
    });

    // Import state
    importBtn.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importState(file);
        }
    });
}

function updateRange(start, end) {
    stateManager.setUnicodeRange(start, end);
    const unicodeGrid = document.querySelector('unicode-grid');
    if (unicodeGrid) {
        unicodeGrid.updateRange(start, end);
    }
}

function updateUI(state) {
    updateCategoriesList(state);
    updateGroupsList(state);
    updateSelectionInfo(state);
    updateSelectModeButton(state);
}

function updateCategoriesList(state) {
    const categoriesList = document.getElementById('categories-list');
    categoriesList.innerHTML = '';

    const categories = Array.from(state.categories.values());

    if (categories.length === 0) {
        categoriesList.innerHTML = '<div class="empty-state">No categories yet</div>';
        return;
    }

    categories.forEach(category => {
        const charCount = stateManager.getCategoryCharCount(category.id);
        const item = document.createElement('div');
        item.className = 'category-item';
        item.innerHTML = `
            <div class="category-info">
                <div class="category-preview" style="background-color: ${category.bgColor}; color: ${category.textColor};">
                    ABC
                </div>
                <div class="category-name">${category.name}</div>
                <div class="category-count">${charCount} character${charCount !== 1 ? 's' : ''}</div>
            </div>
            <div class="category-actions">
                <button class="icon-btn edit" title="Edit">✏️</button>
                <button class="icon-btn delete" title="Delete">🗑️</button>
            </div>
        `;

        // Edit category
        item.querySelector('.edit').addEventListener('click', (e) => {
            e.stopPropagation();
            editCategory(category.id);
        });

        // Delete category
        item.querySelector('.delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCategory(category.id);
        });

        categoriesList.appendChild(item);
    });
}

function updateGroupsList(state) {
    const groupsList = document.getElementById('groups-list');
    groupsList.innerHTML = '';

    const groups = Array.from(state.groups.values());

    if (groups.length === 0) {
        groupsList.innerHTML = '<div class="empty-state">No groups yet</div>';
        return;
    }

    groups.forEach(group => {
        const item = document.createElement('div');
        item.className = 'group-item';

        const charsPreview = group.characters
            .slice(0, 5)
            .map(cp => String.fromCodePoint(cp))
            .join('');
        const moreChars = group.characters.length > 5 ? '...' : '';

        item.innerHTML = `
            <div class="category-info">
                <div class="category-name">${group.name}</div>
                <div class="group-characters" style="font-size: 0.9rem;">${charsPreview}${moreChars}</div>
                <div class="category-count">${group.characters.length} character${group.characters.length !== 1 ? 's' : ''}</div>
            </div>
            <div class="group-actions">
                <button class="icon-btn edit" title="Edit">✏️</button>
                <button class="icon-btn delete" title="Delete">🗑️</button>
            </div>
        `;

        // Hover to highlight
        item.addEventListener('mouseenter', () => {
            const unicodeGrid = document.querySelector('unicode-grid');
            if (unicodeGrid) {
                unicodeGrid.highlightGroup(group.id);
            }
        });

        item.addEventListener('mouseleave', () => {
            const unicodeGrid = document.querySelector('unicode-grid');
            if (unicodeGrid) {
                unicodeGrid.clearGroupHighlight();
            }
        });

        // Edit group
        item.querySelector('.edit').addEventListener('click', (e) => {
            e.stopPropagation();
            editGroup(group.id);
        });

        // Delete group
        item.querySelector('.delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteGroup(group.id);
        });

        groupsList.appendChild(item);
    });
}

function updateSelectionInfo(state) {
    const selectionDetails = document.getElementById('selection-details');
    const categorizeSelectionBtn = document.getElementById('categorize-selection');
    const selectedChars = Array.from(state.selectedCharacters);

    if (selectedChars.length === 0) {
        selectionDetails.innerHTML = '<p>No characters selected</p>';
        if (categorizeSelectionBtn) {
            categorizeSelectionBtn.style.display = 'none';
        }
        return;
    }

    // Show categorize button if characters are selected
    if (categorizeSelectionBtn && selectedChars.length > 0) {
        categorizeSelectionBtn.style.display = 'inline-block';
    }

    const charsString = selectedChars.map(cp => String.fromCodePoint(cp)).join('');
    const codesString = selectedChars
        .map(cp => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`)
        .join(', ');

    selectionDetails.innerHTML = `
        <p><strong>${selectedChars.length}</strong> character${selectedChars.length !== 1 ? 's' : ''} selected</p>
        <div class="selection-chars">${charsString}</div>
        <p style="font-size: 0.8rem; margin-top: 0.5rem; color: #999;">${codesString}</p>
    `;
}

function updateSelectModeButton(state) {
    const selectModeBtn = document.getElementById('select-mode');
    if (state.multiSelectMode) {
        selectModeBtn.textContent = 'Multi-Select Mode: ON';
        selectModeBtn.classList.add('active');
    } else {
        selectModeBtn.textContent = 'Multi-Select Mode: OFF';
        selectModeBtn.classList.remove('active');
    }
}

function createNewCategoryDialog() {
    const name = prompt('Enter category name:');
    if (!name) return;

    const bgColor = prompt('Enter background color (hex):', '#2d2d2d') || '#2d2d2d';
    const textColor = prompt('Enter text color (hex):', '#e0e0e0') || '#e0e0e0';

    stateManager.addCategory(null, {
        name,
        bgColor,
        textColor
    });
}

function editCategory(categoryId) {
    const category = stateManager.getCategory(categoryId);
    if (!category) return;

    const name = prompt('Enter category name:', category.name);
    if (!name) return;

    const bgColor = prompt('Enter background color (hex):', category.bgColor) || category.bgColor;
    const textColor = prompt('Enter text color (hex):', category.textColor) || category.textColor;

    stateManager.updateCategory(categoryId, {
        name,
        bgColor,
        textColor
    });
}

function deleteCategory(categoryId) {
    const category = stateManager.getCategory(categoryId);
    const charCount = stateManager.getCategoryCharCount(categoryId);

    if (confirm(`Delete category "${category.name}"? This will remove categorization from ${charCount} character${charCount !== 1 ? 's' : ''}.`)) {
        stateManager.deleteCategory(categoryId);
    }
}

function createNewGroup() {
    const selectedChars = stateManager.getSelectedCharacters();

    if (selectedChars.length === 0) {
        alert('Please select characters first using multi-select mode');
        return;
    }

    const name = prompt('Enter group name:');
    if (!name) return;

    const notes = prompt('Enter notes (optional):') || '';

    stateManager.createGroup(name, selectedChars, null, notes);
    stateManager.clearSelection();
}

function editGroup(groupId) {
    const group = stateManager.getGroup(groupId);
    if (!group) return;

    const name = prompt('Enter group name:', group.name);
    if (!name) return;

    const notes = prompt('Enter notes:', group.notes) || '';

    stateManager.updateGroup(groupId, { name, notes });
}

function deleteGroup(groupId) {
    const group = stateManager.getGroup(groupId);
    if (confirm(`Delete group "${group.name}"?`)) {
        stateManager.deleteGroup(groupId);
    }
}

function exportState() {
    const jsonData = stateManager.exportState();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `unifont-categorizer-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importState(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const jsonString = e.target.result;
        const success = stateManager.importState(jsonString);

        if (success) {
            alert('State imported successfully!');
        } else {
            alert('Failed to import state. Please check the file format.');
        }
    };
    reader.readAsText(file);
}

// Add CSS for group highlight
const style = document.createElement('style');
style.textContent = `
    .char-cell.group-highlight {
        border-color: var(--secondary-color) !important;
        box-shadow: 0 0 0 2px rgba(123, 104, 238, 0.5) !important;
    }
`;
document.head.appendChild(style);
