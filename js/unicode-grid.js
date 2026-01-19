/**
 * Unicode Grid Web Component - Canvas-based with zoom/pan
 * Displays a grid of Unicode characters using HTML5 Canvas
 */

import stateManager from './state-manager.js';

class UnicodeGrid extends HTMLElement {
    constructor() {
        super();
        this.currentRange = { start: 0x0000, end: 0x007F };
        this.unsubscribe = null;

        // Canvas properties
        this.canvas = null;
        this.ctx = null;
        this.dpr = window.devicePixelRatio || 1;

        // Grid properties
        this.cellSize = 60; // Base cell size in pixels
        this.padding = 4;
        this.columns = 16;
        this.characters = [];

        // Zoom and pan
        this.zoom = 1;
        this.minZoom = 0.1;
        this.maxZoom = 10;
        this.panX = 0;
        this.panY = 0;

        // Interaction
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.hoveredCell = null;

        // Font loading
        this.fontLoaded = false;
    }

    connectedCallback() {
        this.render();
        this.setupCanvas();
        this.attachEventListeners();

        // Subscribe to state changes
        this.unsubscribe = stateManager.subscribe((state) => {
            this.handleStateChange(state);
        });

        // Initial render with current range
        this.updateRange(stateManager.state.currentRange.start, stateManager.state.currentRange.end);

        // Load font
        this.loadFont();
    }

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        window.removeEventListener('resize', this.handleResize);
    }

    handleStateChange(state) {
        // Re-render if selection changes or categorization changes
        this.drawGrid();
    }

    render() {
        this.innerHTML = `
            <div class="canvas-grid-container">
                <canvas id="unicode-canvas"></canvas>
                <div class="zoom-controls">
                    <button id="zoom-in" class="zoom-btn" title="Zoom In">+</button>
                    <button id="zoom-reset" class="zoom-btn" title="Reset Zoom">⌂</button>
                    <button id="zoom-out" class="zoom-btn" title="Zoom Out">−</button>
                    <span id="zoom-level">100%</span>
                </div>
                <div class="canvas-info" id="canvas-info">
                    <span id="hover-info"></span>
                </div>
            </div>
        `;
    }

    setupCanvas() {
        this.canvas = this.querySelector('#unicode-canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });

        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);

        this.resizeCanvas();
    }

    resizeCanvas() {
        const container = this.querySelector('.canvas-grid-container');
        const rect = container.getBoundingClientRect();

        // Set display size
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        // Set actual size in memory (scaled for DPI)
        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;

        // Scale context to account for DPI
        this.ctx.scale(this.dpr, this.dpr);

        this.drawGrid();
    }

    handleResize() {
        this.resizeCanvas();
    }

    attachEventListeners() {
        // Zoom controls
        this.querySelector('#zoom-in').addEventListener('click', () => this.zoomIn());
        this.querySelector('#zoom-out').addEventListener('click', () => this.zoomOut());
        this.querySelector('#zoom-reset').addEventListener('click', () => this.resetZoom());

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }

    loadFont() {
        // Try to load Unifont or fallback to monospace
        if (document.fonts) {
            document.fonts.ready.then(() => {
                this.fontLoaded = true;
                this.drawGrid();
            });
        } else {
            this.fontLoaded = true;
        }
    }

    updateRange(start, end) {
        this.currentRange = { start, end };

        // Generate character list
        this.characters = [];
        const maxChars = 10000; // Increased limit for canvas rendering
        const actualEnd = Math.min(end, start + maxChars);

        for (let codepoint = start; codepoint <= actualEnd; codepoint++) {
            this.characters.push(codepoint);
        }

        // Calculate columns based on canvas width
        const containerWidth = this.canvas ? this.canvas.clientWidth : 800;
        this.columns = Math.max(8, Math.floor(containerWidth / (this.cellSize * this.zoom + this.padding * 2)));

        this.drawGrid();
    }

    drawGrid() {
        if (!this.canvas || !this.ctx) return;

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        // Clear canvas
        this.ctx.fillStyle = '#2d2d2d';
        this.ctx.fillRect(0, 0, width, height);

        const scaledCellSize = this.cellSize * this.zoom;
        const scaledPadding = this.padding * this.zoom;

        // Calculate visible range
        const startCol = Math.max(0, Math.floor(-this.panX / (scaledCellSize + scaledPadding * 2)));
        const startRow = Math.max(0, Math.floor(-this.panY / (scaledCellSize + scaledPadding * 2)));
        const endCol = Math.min(this.columns, Math.ceil((width - this.panX) / (scaledCellSize + scaledPadding * 2)));
        const endRow = Math.min(Math.ceil(this.characters.length / this.columns),
                                Math.ceil((height - this.panY) / (scaledCellSize + scaledPadding * 2)));

        // Draw only visible cells
        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const index = row * this.columns + col;
                if (index >= this.characters.length) break;

                const codepoint = this.characters[index];
                const x = this.panX + col * (scaledCellSize + scaledPadding * 2);
                const y = this.panY + row * (scaledCellSize + scaledPadding * 2);

                this.drawCell(x, y, scaledCellSize, codepoint);
            }
        }

        // Update zoom level display
        const zoomPercent = Math.round(this.zoom * 100);
        const zoomLevelSpan = this.querySelector('#zoom-level');
        if (zoomLevelSpan) {
            zoomLevelSpan.textContent = `${zoomPercent}%`;
        }
    }

    drawCell(x, y, size, codepoint) {
        const charData = stateManager.getCharacterData(codepoint);
        const isSelected = stateManager.state.selectedCharacters.has(codepoint);
        const isHovered = this.hoveredCell === codepoint;

        // Determine colors
        let bgColor = '#1a1a1a';
        let textColor = '#e0e0e0';
        let borderColor = '#404040';

        if (charData) {
            bgColor = charData.bgColor || bgColor;
            textColor = charData.textColor || textColor;
        }

        if (isSelected) {
            borderColor = '#4a90e2';
        } else if (isHovered) {
            borderColor = '#4a90e2';
        }

        // Draw background
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(x, y, size, size);

        // Draw border
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = isSelected ? 3 * this.zoom : 2 * this.zoom;
        this.ctx.strokeRect(x, y, size, size);

        // Draw character
        const char = String.fromCodePoint(codepoint);
        const fontSize = Math.max(12, size * 0.5);
        this.ctx.font = `${fontSize}px 'Unifont', monospace`;
        this.ctx.fillStyle = textColor;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(char, x + size / 2, y + size / 2);

        // Draw indicators
        if (charData) {
            // Categorized indicator (green dot bottom-right)
            this.ctx.fillStyle = '#2ecc71';
            const dotSize = Math.max(3, size * 0.1);
            this.ctx.beginPath();
            this.ctx.arc(x + size - dotSize * 1.5, y + size - dotSize * 1.5, dotSize, 0, Math.PI * 2);
            this.ctx.fill();
        }

        if (charData && charData.groupId) {
            // Group indicator (purple dot top-right)
            this.ctx.fillStyle = '#7b68ee';
            const dotSize = Math.max(3, size * 0.1);
            this.ctx.beginPath();
            this.ctx.arc(x + size - dotSize * 1.5, y + dotSize * 1.5, dotSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    // Zoom methods
    zoomIn() {
        this.setZoom(this.zoom * 1.2);
    }

    zoomOut() {
        this.setZoom(this.zoom / 1.2);
    }

    resetZoom() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.drawGrid();
    }

    setZoom(newZoom, centerX = null, centerY = null) {
        const oldZoom = this.zoom;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));

        // Adjust pan to zoom toward center point
        if (centerX !== null && centerY !== null) {
            const zoomRatio = this.zoom / oldZoom;
            this.panX = centerX - (centerX - this.panX) * zoomRatio;
            this.panY = centerY - (centerY - this.panY) * zoomRatio;
        }

        this.drawGrid();
    }

    // Mouse event handlers
    handleMouseDown(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (this.isDragging) {
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;

            this.panX += deltaX;
            this.panY += deltaY;

            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;

            this.drawGrid();
        } else {
            // Update hover state
            const codepoint = this.getCodepointAtPosition(mouseX, mouseY);
            if (codepoint !== this.hoveredCell) {
                this.hoveredCell = codepoint;
                this.drawGrid();
                this.updateHoverInfo(codepoint);
            }
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }

    handleMouseLeave(e) {
        this.isDragging = false;
        this.hoveredCell = null;
        this.canvas.style.cursor = 'grab';
        this.updateHoverInfo(null);
        this.drawGrid();
    }

    handleWheel(e) {
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.setZoom(this.zoom * zoomFactor, mouseX, mouseY);
    }

    handleClick(e) {
        if (this.isDragging) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const codepoint = this.getCodepointAtPosition(mouseX, mouseY);

        if (codepoint !== null) {
            this.handleCellClick(codepoint, e);
        }
    }

    // Touch event handlers
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            this.isDragging = true;
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        }
    }

    handleTouchMove(e) {
        e.preventDefault();

        if (e.touches.length === 1 && this.isDragging) {
            const deltaX = e.touches[0].clientX - this.lastMouseX;
            const deltaY = e.touches[0].clientY - this.lastMouseY;

            this.panX += deltaX;
            this.panY += deltaY;

            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;

            this.drawGrid();
        }
    }

    handleTouchEnd(e) {
        this.isDragging = false;
    }

    getCodepointAtPosition(x, y) {
        const scaledCellSize = this.cellSize * this.zoom;
        const scaledPadding = this.padding * this.zoom;

        const col = Math.floor((x - this.panX) / (scaledCellSize + scaledPadding * 2));
        const row = Math.floor((y - this.panY) / (scaledCellSize + scaledPadding * 2));

        if (col < 0 || col >= this.columns || row < 0) return null;

        const index = row * this.columns + col;
        if (index >= this.characters.length) return null;

        // Check if click is within cell bounds
        const cellX = this.panX + col * (scaledCellSize + scaledPadding * 2);
        const cellY = this.panY + row * (scaledCellSize + scaledPadding * 2);

        if (x >= cellX && x <= cellX + scaledCellSize &&
            y >= cellY && y <= cellY + scaledCellSize) {
            return this.characters[index];
        }

        return null;
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

    updateHoverInfo(codepoint) {
        const hoverInfo = this.querySelector('#hover-info');
        if (!hoverInfo) return;

        if (codepoint === null) {
            hoverInfo.textContent = '';
            return;
        }

        const char = String.fromCodePoint(codepoint);
        const code = `U+${codepoint.toString(16).toUpperCase().padStart(4, '0')}`;
        const charData = stateManager.getCharacterData(codepoint);

        let info = `${char} ${code}`;

        if (charData) {
            const category = stateManager.getCategory(charData.category);
            if (category) {
                info += ` • ${category.name}`;
            }
        }

        hoverInfo.textContent = info;
    }

    /**
     * Highlight characters in a group
     */
    highlightGroup(groupId) {
        // This will be handled by the drawGrid method checking character data
        this.drawGrid();
    }

    /**
     * Clear group highlights
     */
    clearGroupHighlight() {
        this.drawGrid();
    }
}

// Define custom element
customElements.define('unicode-grid', UnicodeGrid);

export default UnicodeGrid;
