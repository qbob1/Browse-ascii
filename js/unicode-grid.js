/**
 * Unicode Grid Web Component
 * Displays a grid of Unicode characters
 */

import stateManager from './state-manager.js';

class UnicodeGrid extends HTMLElement {
    constructor() {
        super();
        this.currentRange = { start: 0x0000, end: 0x007F };
        this.unsubscribe = null;
    }

    connectedCallback() {
        this.render();

        // Subscribe to state changes
        this.unsubscribe = stateManager.subscribe((state) => {
            this.handleStateChange(state);
        });

        // Initial render with current range
        this.updateRange(stateManager.state.currentRange.start, stateManager.state.currentRange.end);
    }

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    handleStateChange(state) {
        // Re-render if selection changes or categorization changes
        this.renderGrid();
    }

    updateRange(start, end) {
        this.currentRange = { start, end };
        this.renderGrid();
    }

    render() {
        this.innerHTML = `
            <div class="unicode-grid-container">
                <div class="unicode-grid"></div>
            </div>
        `;
        this.renderGrid();
    }

    renderGrid() {
        const gridContainer = this.querySelector('.unicode-grid');
        if (!gridContainer) return;

        gridContainer.innerHTML = '';

        const { start, end } = this.currentRange;
        const maxChars = 1024; // Limit for performance
        const actualEnd = Math.min(end, start + maxChars);

        for (let codepoint = start; codepoint <= actualEnd; codepoint++) {
            const cell = this.createCharCell(codepoint);
            gridContainer.appendChild(cell);
        }

        if (actualEnd < end) {
            const notice = document.createElement('div');
            notice.className = 'empty-state';
            notice.textContent = `Showing ${actualEnd - start + 1} of ${end - start + 1} characters. Adjust range for more.`;
            gridContainer.appendChild(notice);
        }
    }

    createCharCell(codepoint) {
        const cell = document.createElement('div');
        cell.className = 'char-cell';
        cell.dataset.codepoint = codepoint;

        // Get character data
        const charData = stateManager.getCharacterData(codepoint);
        const isSelected = stateManager.state.selectedCharacters.has(codepoint);

        // Get character string
        const char = String.fromCodePoint(codepoint);
        cell.textContent = char;

        // Apply categorization styling
        if (charData) {
            cell.classList.add('categorized');

            if (charData.bgColor) {
                cell.style.backgroundColor = charData.bgColor;
            }
            if (charData.textColor) {
                cell.style.color = charData.textColor;
            }

            if (charData.groupId) {
                cell.classList.add('in-group');
            }

            // Add tooltip
            const category = stateManager.getCategory(charData.category);
            if (category) {
                cell.title = `Category: ${category.name}\nU+${codepoint.toString(16).toUpperCase().padStart(4, '0')}`;
            }
        } else {
            cell.title = `U+${codepoint.toString(16).toUpperCase().padStart(4, '0')}`;
        }

        // Apply selection styling
        if (isSelected) {
            cell.classList.add('selected');
        }

        // Add click handler
        cell.addEventListener('click', (e) => {
            this.handleCellClick(codepoint, e);
        });

        return cell;
    }

    handleCellClick(codepoint, event) {
        if (stateManager.state.multiSelectMode) {
            // Multi-select mode: toggle selection
            stateManager.toggleCharacterSelection(codepoint);
        } else {
            // Single select mode: open categorization menu
            stateManager.toggleCharacterSelection(codepoint);
            this.dispatchEvent(new CustomEvent('character-selected', {
                detail: { codepoint },
                bubbles: true
            }));
        }
    }

    /**
     * Highlight characters in a group
     */
    highlightGroup(groupId) {
        const group = stateManager.getGroup(groupId);
        if (!group) return;

        // Clear previous highlights
        this.querySelectorAll('.char-cell').forEach(cell => {
            cell.classList.remove('group-highlight');
        });

        // Highlight group characters
        group.characters.forEach(codepoint => {
            const cell = this.querySelector(`[data-codepoint="${codepoint}"]`);
            if (cell) {
                cell.classList.add('group-highlight');
            }
        });
    }

    /**
     * Clear group highlights
     */
    clearGroupHighlight() {
        this.querySelectorAll('.char-cell').forEach(cell => {
            cell.classList.remove('group-highlight');
        });
    }
}

// Define custom element
customElements.define('unicode-grid', UnicodeGrid);

export default UnicodeGrid;
