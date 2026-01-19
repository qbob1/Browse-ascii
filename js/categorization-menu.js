/**
 * Categorization Menu Web Component
 * Modal dialog for categorizing characters
 */

import stateManager from './state-manager.js';

class CategorizationMenu extends HTMLElement {
    constructor() {
        super();
        this.currentCodepoint = null;
        this.currentCodepoints = [];
        this.currentCharData = null;
        this.animationInterval = null;
        this.animationIndex = 0;
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.innerHTML = `
            <div class="modal-overlay" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="modal-title">Categorize Character</h2>
                        <button class="close-btn" id="close-modal">&times;</button>
                    </div>

                    <div class="character-display">
                        <div class="character-preview" id="char-preview"></div>
                        <div class="character-code" id="char-code"></div>
                        <div class="animation-controls" id="animation-controls" style="display: none;">
                            <button class="btn-secondary" id="toggle-animation">⏸ Pause</button>
                            <span id="animation-info"></span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Category</label>
                        <div class="category-selector">
                            <select id="category-select">
                                <option value="">-- Select Category --</option>
                            </select>
                            <button class="btn-primary" id="new-cat-btn">New</button>
                        </div>
                    </div>

                    <div id="new-category-form" style="display: none;">
                        <div class="form-group">
                            <label for="new-cat-name">New Category Name</label>
                            <input type="text" id="new-cat-name" placeholder="Enter category name">
                        </div>

                        <div class="form-group">
                            <label for="new-cat-desc">Description (optional)</label>
                            <input type="text" id="new-cat-desc" placeholder="Enter description">
                        </div>

                        <div class="form-group">
                            <label>Default Colors</label>
                            <div class="color-picker-group">
                                <div class="color-input">
                                    <label for="new-cat-bg">Background:</label>
                                    <input type="color" id="new-cat-bg" value="#2d2d2d">
                                </div>
                                <div class="color-input">
                                    <label for="new-cat-text">Text:</label>
                                    <input type="color" id="new-cat-text" value="#e0e0e0">
                                </div>
                            </div>
                        </div>

                        <button class="btn-success" id="create-cat-btn">Create Category</button>
                        <button class="btn-secondary" id="cancel-cat-btn">Cancel</button>
                    </div>

                    <div class="form-group">
                        <label>Custom Colors (Override category defaults)</label>
                        <div class="color-picker-group">
                            <div class="color-input">
                                <label for="char-bg">Background:</label>
                                <input type="color" id="char-bg">
                            </div>
                            <div class="color-input">
                                <label for="char-text">Text:</label>
                                <input type="color" id="char-text">
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="char-notes">Notes</label>
                        <textarea id="char-notes" placeholder="Add notes about this character..."></textarea>
                    </div>

                    <div class="modal-actions">
                        <button class="btn-danger" id="remove-cat-btn" style="margin-right: auto;">Remove Categorization</button>
                        <button class="btn-secondary" id="cancel-btn">Cancel</button>
                        <button class="btn-primary" id="save-btn">Save</button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Close modal
        this.querySelector('#close-modal').addEventListener('click', () => this.close());
        this.querySelector('#cancel-btn').addEventListener('click', () => this.close());

        // Click outside modal to close
        this.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.close();
            }
        });

        // New category button
        this.querySelector('#new-cat-btn').addEventListener('click', () => {
            this.toggleNewCategoryForm(true);
        });

        this.querySelector('#cancel-cat-btn').addEventListener('click', () => {
            this.toggleNewCategoryForm(false);
        });

        // Create category
        this.querySelector('#create-cat-btn').addEventListener('click', () => {
            this.createCategory();
        });

        // Save categorization
        this.querySelector('#save-btn').addEventListener('click', () => {
            this.saveCategorization();
        });

        // Remove categorization
        this.querySelector('#remove-cat-btn').addEventListener('click', () => {
            this.removeCategorization();
        });

        // Category select change - update color pickers
        this.querySelector('#category-select').addEventListener('change', (e) => {
            const categoryId = e.target.value;
            if (categoryId) {
                const category = stateManager.getCategory(categoryId);
                if (category) {
                    this.querySelector('#char-bg').value = category.bgColor;
                    this.querySelector('#char-text').value = category.textColor;
                }
            }
        });

        // Animation toggle
        this.querySelector('#toggle-animation').addEventListener('click', () => {
            this.toggleAnimation();
        });
    }

    toggleNewCategoryForm(show) {
        const form = this.querySelector('#new-category-form');
        form.style.display = show ? 'block' : 'none';

        if (show) {
            this.querySelector('#new-cat-name').focus();
        }
    }

    createCategory() {
        const name = this.querySelector('#new-cat-name').value.trim();
        const description = this.querySelector('#new-cat-desc').value.trim();
        const bgColor = this.querySelector('#new-cat-bg').value;
        const textColor = this.querySelector('#new-cat-text').value;

        if (!name) {
            alert('Please enter a category name');
            return;
        }

        const category = stateManager.addCategory(null, {
            name,
            description,
            bgColor,
            textColor
        });

        // Reset form
        this.querySelector('#new-cat-name').value = '';
        this.querySelector('#new-cat-desc').value = '';
        this.toggleNewCategoryForm(false);

        // Update category selector
        this.updateCategoryList();

        // Select the new category
        this.querySelector('#category-select').value = category.id;

        // Update color pickers
        this.querySelector('#char-bg').value = bgColor;
        this.querySelector('#char-text').value = textColor;
    }

    updateCategoryList() {
        const select = this.querySelector('#category-select');
        const currentValue = select.value;

        // Clear and rebuild
        select.innerHTML = '<option value="">-- Select Category --</option>';

        const categories = stateManager.getAllCategories();
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });

        // Restore selection if it still exists
        if (currentValue && categories.find(c => c.id === currentValue)) {
            select.value = currentValue;
        }
    }

    open(codepointOrArray) {
        // Handle both single codepoint and array of codepoints
        if (Array.isArray(codepointOrArray)) {
            this.currentCodepoints = codepointOrArray;
            this.currentCodepoint = null;
            this.openMultiple();
        } else {
            this.currentCodepoint = codepointOrArray;
            this.currentCodepoints = [];
            this.openSingle();
        }

        // Show modal
        this.querySelector('.modal-overlay').style.display = 'flex';
        this.classList.add('visible');
    }

    openSingle() {
        this.currentCharData = stateManager.getCharacterData(this.currentCodepoint);

        // Update title
        this.querySelector('#modal-title').textContent = 'Categorize Character';

        // Update character display
        const char = String.fromCodePoint(this.currentCodepoint);
        this.querySelector('#char-preview').textContent = char;
        this.querySelector('#char-code').textContent = `U+${this.currentCodepoint.toString(16).toUpperCase().padStart(4, '0')}`;

        // Hide animation controls
        this.querySelector('#animation-controls').style.display = 'none';

        // Update category list
        this.updateCategoryList();

        // Load existing data if available
        if (this.currentCharData) {
            this.querySelector('#category-select').value = this.currentCharData.category || '';
            this.querySelector('#char-bg').value = this.currentCharData.bgColor || '#2d2d2d';
            this.querySelector('#char-text').value = this.currentCharData.textColor || '#e0e0e0';
            this.querySelector('#char-notes').value = this.currentCharData.notes || '';
            this.querySelector('#remove-cat-btn').style.display = 'block';
        } else {
            this.querySelector('#category-select').value = '';
            this.querySelector('#char-bg').value = '#2d2d2d';
            this.querySelector('#char-text').value = '#e0e0e0';
            this.querySelector('#char-notes').value = '';
            this.querySelector('#remove-cat-btn').style.display = 'none';
        }

        // Update notes label
        this.querySelector('label[for="char-notes"]').textContent = 'Notes';
    }

    openMultiple() {
        // Update title
        this.querySelector('#modal-title').textContent = `Categorize ${this.currentCodepoints.length} Characters`;

        // Show animation controls
        this.querySelector('#animation-controls').style.display = 'flex';
        this.querySelector('#animation-info').textContent = `1 of ${this.currentCodepoints.length}`;

        // Start animation
        this.startAnimation();

        // Update category list
        this.updateCategoryList();

        // Clear form fields for batch categorization
        this.querySelector('#category-select').value = '';
        this.querySelector('#char-bg').value = '#2d2d2d';
        this.querySelector('#char-text').value = '#e0e0e0';
        this.querySelector('#char-notes').value = '';
        this.querySelector('#remove-cat-btn').style.display = 'block';
        this.querySelector('#remove-cat-btn').textContent = 'Remove All Categorizations';

        // Update notes label
        this.querySelector('label[for="char-notes"]').textContent = 'Notes (applied to all)';
    }

    startAnimation() {
        this.animationIndex = 0;
        this.updateAnimationFrame();

        this.animationInterval = setInterval(() => {
            this.animationIndex = (this.animationIndex + 1) % this.currentCodepoints.length;
            this.updateAnimationFrame();
        }, 250); // 0.25s between frames

        this.querySelector('#toggle-animation').textContent = '⏸ Pause';
    }

    updateAnimationFrame() {
        const codepoint = this.currentCodepoints[this.animationIndex];
        const char = String.fromCodePoint(codepoint);

        this.querySelector('#char-preview').textContent = char;
        this.querySelector('#char-code').textContent = `U+${codepoint.toString(16).toUpperCase().padStart(4, '0')}`;
        this.querySelector('#animation-info').textContent = `${this.animationIndex + 1} of ${this.currentCodepoints.length}`;
    }

    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }

    toggleAnimation() {
        if (this.animationInterval) {
            this.stopAnimation();
            this.querySelector('#toggle-animation').textContent = '▶ Play';
        } else {
            this.startAnimation();
        }
    }

    close() {
        this.stopAnimation();
        this.querySelector('.modal-overlay').style.display = 'none';
        this.classList.remove('visible');
        this.toggleNewCategoryForm(false);
        this.currentCodepoint = null;
        this.currentCodepoints = [];
        this.currentCharData = null;
    }

    saveCategorization() {
        const categoryId = this.querySelector('#category-select').value;
        const notes = this.querySelector('#char-notes').value.trim();
        const bgColor = this.querySelector('#char-bg').value;
        const textColor = this.querySelector('#char-text').value;

        if (!categoryId) {
            alert('Please select or create a category');
            return;
        }

        if (this.currentCodepoints.length > 0) {
            // Batch categorization
            this.currentCodepoints.forEach(codepoint => {
                stateManager.categorizeCharacter(
                    codepoint,
                    categoryId,
                    notes,
                    { bgColor, textColor }
                );
            });
        } else {
            // Single categorization
            stateManager.categorizeCharacter(
                this.currentCodepoint,
                categoryId,
                notes,
                { bgColor, textColor }
            );
        }

        this.close();
    }

    removeCategorization() {
        if (this.currentCodepoints.length > 0) {
            // Batch removal
            if (confirm(`Remove categorization from ${this.currentCodepoints.length} characters?`)) {
                this.currentCodepoints.forEach(codepoint => {
                    stateManager.uncategorizeCharacter(codepoint);
                });
                this.close();
            }
        } else {
            // Single removal
            if (confirm('Remove categorization from this character?')) {
                stateManager.uncategorizeCharacter(this.currentCodepoint);
                this.close();
            }
        }
    }
}

// Define custom element
customElements.define('categorization-menu', CategorizationMenu);

export default CategorizationMenu;
