/**
 * State Manager - Handles application state, persistence, and export
 */

class StateManager {
    constructor() {
        this.state = {
            version: '1.0.0',
            categories: new Map(),
            characterData: new Map(), // Maps codepoint to { category, notes, colors }
            groups: new Map(), // Maps group ID to { name, characters, category, notes }
            selectedCharacters: new Set(),
            multiSelectMode: false,
            currentRange: { start: 0x0000, end: 0x007F }
        };

        this.listeners = new Set();
        this.loadState();
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners of state change
     */
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    /**
     * Add or update a category
     */
    addCategory(id, data) {
        const category = {
            id: id || this.generateId('cat'),
            name: data.name,
            bgColor: data.bgColor || '#2d2d2d',
            textColor: data.textColor || '#e0e0e0',
            description: data.description || '',
            created: data.created || Date.now()
        };

        this.state.categories.set(category.id, category);
        this.saveState();
        this.notify();
        return category;
    }

    /**
     * Update a category
     */
    updateCategory(id, updates) {
        const category = this.state.categories.get(id);
        if (category) {
            Object.assign(category, updates);
            this.saveState();
            this.notify();
        }
    }

    /**
     * Delete a category
     */
    deleteCategory(id) {
        // Remove category from all characters
        for (const [codepoint, data] of this.state.characterData.entries()) {
            if (data.category === id) {
                this.state.characterData.delete(codepoint);
            }
        }

        // Remove category from all groups
        for (const [groupId, group] of this.state.groups.entries()) {
            if (group.category === id) {
                group.category = null;
            }
        }

        this.state.categories.delete(id);
        this.saveState();
        this.notify();
    }

    /**
     * Get a category by ID
     */
    getCategory(id) {
        return this.state.categories.get(id);
    }

    /**
     * Get all categories
     */
    getAllCategories() {
        return Array.from(this.state.categories.values());
    }

    /**
     * Categorize a character
     */
    categorizeCharacter(codepoint, categoryId, notes = '', customColors = null) {
        const category = this.state.categories.get(categoryId);
        if (!category) return;

        const data = {
            category: categoryId,
            notes: notes,
            bgColor: customColors?.bgColor || category.bgColor,
            textColor: customColors?.textColor || category.textColor,
            modified: Date.now()
        };

        this.state.characterData.set(codepoint, data);
        this.saveState();
        this.notify();
    }

    /**
     * Get character data
     */
    getCharacterData(codepoint) {
        return this.state.characterData.get(codepoint);
    }

    /**
     * Remove categorization from a character
     */
    uncategorizeCharacter(codepoint) {
        this.state.characterData.delete(codepoint);
        this.saveState();
        this.notify();
    }

    /**
     * Create a group from selected characters
     */
    createGroup(name, characters, categoryId = null, notes = '') {
        const group = {
            id: this.generateId('grp'),
            name: name,
            characters: Array.from(characters),
            category: categoryId,
            notes: notes,
            created: Date.now()
        };

        this.state.groups.set(group.id, group);

        // Mark characters as part of group
        characters.forEach(codepoint => {
            const data = this.state.characterData.get(codepoint) || {};
            data.groupId = group.id;
            this.state.characterData.set(codepoint, data);
        });

        this.saveState();
        this.notify();
        return group;
    }

    /**
     * Update a group
     */
    updateGroup(id, updates) {
        const group = this.state.groups.get(id);
        if (group) {
            Object.assign(group, updates);
            this.saveState();
            this.notify();
        }
    }

    /**
     * Delete a group
     */
    deleteGroup(id) {
        const group = this.state.groups.get(id);
        if (group) {
            // Remove group reference from characters
            group.characters.forEach(codepoint => {
                const data = this.state.characterData.get(codepoint);
                if (data && data.groupId === id) {
                    delete data.groupId;
                }
            });
        }

        this.state.groups.delete(id);
        this.saveState();
        this.notify();
    }

    /**
     * Get a group by ID
     */
    getGroup(id) {
        return this.state.groups.get(id);
    }

    /**
     * Get all groups
     */
    getAllGroups() {
        return Array.from(this.state.groups.values());
    }

    /**
     * Toggle character selection
     */
    toggleCharacterSelection(codepoint) {
        if (this.state.selectedCharacters.has(codepoint)) {
            this.state.selectedCharacters.delete(codepoint);
        } else {
            if (!this.state.multiSelectMode) {
                this.state.selectedCharacters.clear();
            }
            this.state.selectedCharacters.add(codepoint);
        }
        this.notify();
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.state.selectedCharacters.clear();
        this.notify();
    }

    /**
     * Get selected characters
     */
    getSelectedCharacters() {
        return Array.from(this.state.selectedCharacters);
    }

    /**
     * Toggle multi-select mode
     */
    toggleMultiSelectMode() {
        this.state.multiSelectMode = !this.state.multiSelectMode;
        if (!this.state.multiSelectMode) {
            this.clearSelection();
        }
        this.notify();
    }

    /**
     * Set Unicode range
     */
    setUnicodeRange(start, end) {
        this.state.currentRange = { start, end };
        this.notify();
    }

    /**
     * Generate unique ID
     */
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get character count for a category
     */
    getCategoryCharCount(categoryId) {
        let count = 0;
        for (const data of this.state.characterData.values()) {
            if (data.category === categoryId) count++;
        }
        return count;
    }

    /**
     * Export state to JSON
     */
    exportState() {
        const exportData = {
            version: this.state.version,
            exportDate: new Date().toISOString(),
            categories: Array.from(this.state.categories.entries()).map(([id, cat]) => ({
                ...cat,
                characterCount: this.getCategoryCharCount(id)
            })),
            characters: Array.from(this.state.characterData.entries()).map(([codepoint, data]) => ({
                codepoint: codepoint,
                char: String.fromCodePoint(codepoint),
                ...data,
                categoryName: data.category ? this.state.categories.get(data.category)?.name : null
            })),
            groups: Array.from(this.state.groups.entries()).map(([id, group]) => ({
                ...group,
                charactersString: group.characters.map(cp => String.fromCodePoint(cp)).join(''),
                categoryName: group.category ? this.state.categories.get(group.category)?.name : null
            })),
            metadata: {
                totalCategories: this.state.categories.size,
                totalCategorizedCharacters: this.state.characterData.size,
                totalGroups: this.state.groups.size
            }
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import state from JSON
     */
    importState(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // Validate version
            if (!data.version) {
                throw new Error('Invalid state file: missing version');
            }

            // Clear current state
            this.state.categories.clear();
            this.state.characterData.clear();
            this.state.groups.clear();

            // Import categories
            if (data.categories) {
                data.categories.forEach(cat => {
                    this.state.categories.set(cat.id, {
                        id: cat.id,
                        name: cat.name,
                        bgColor: cat.bgColor,
                        textColor: cat.textColor,
                        description: cat.description,
                        created: cat.created
                    });
                });
            }

            // Import character data
            if (data.characters) {
                data.characters.forEach(charData => {
                    const { codepoint, char, ...data } = charData;
                    this.state.characterData.set(codepoint, data);
                });
            }

            // Import groups
            if (data.groups) {
                data.groups.forEach(group => {
                    this.state.groups.set(group.id, {
                        id: group.id,
                        name: group.name,
                        characters: group.characters,
                        category: group.category,
                        notes: group.notes,
                        created: group.created
                    });
                });
            }

            this.saveState();
            this.notify();
            return true;
        } catch (error) {
            console.error('Failed to import state:', error);
            return false;
        }
    }

    /**
     * Save state to localStorage
     */
    saveState() {
        try {
            const stateObj = {
                version: this.state.version,
                categories: Array.from(this.state.categories.entries()),
                characterData: Array.from(this.state.characterData.entries()),
                groups: Array.from(this.state.groups.entries()),
                currentRange: this.state.currentRange
            };

            localStorage.setItem('unifont-categorizer-state', JSON.stringify(stateObj));
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    /**
     * Load state from localStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem('unifont-categorizer-state');
            if (saved) {
                const stateObj = JSON.parse(saved);

                this.state.version = stateObj.version || this.state.version;
                this.state.categories = new Map(stateObj.categories || []);
                this.state.characterData = new Map(stateObj.characterData || []);
                this.state.groups = new Map(stateObj.groups || []);
                this.state.currentRange = stateObj.currentRange || this.state.currentRange;

                this.notify();
            }
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }

    /**
     * Reset state
     */
    resetState() {
        this.state.categories.clear();
        this.state.characterData.clear();
        this.state.groups.clear();
        this.state.selectedCharacters.clear();
        this.saveState();
        this.notify();
    }
}

// Create singleton instance
const stateManager = new StateManager();

export default stateManager;
