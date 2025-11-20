// Marker Categories
const MarkerCategories = [
    { id: 'base', name: 'Base', symbol: '🏠', emoji: '🏠' },
    { id: 'pvp', name: 'PvP', symbol: '⚔️', emoji: '⚔️' },
    { id: 'structure', name: 'Structure', symbol: '🏛️', emoji: '🏛️' },
    { id: 'resource', name: 'Resource', symbol: '💎', emoji: '💎' },
    { id: 'danger', name: 'Danger', symbol: '⚠️', emoji: '⚠️' },
    { id: 'portal', name: 'Portal', symbol: '🌀', emoji: '🌀' },
    { id: 'farm', name: 'Farm', symbol: '🌾', emoji: '🌾' },
    { id: 'spawn', name: 'Spawn', symbol: '📍', emoji: '📍' },
    { id: 'shop', name: 'Shop', symbol: '🏪', emoji: '🏪' },
    { id: 'other', name: 'Other', symbol: '📌', emoji: '📌' }
];

// Helper function to get category by ID
function getCategoryById(id) {
    return MarkerCategories.find(cat => cat.id === id) || null;
}

// Marker Modal Component
class MarkerModal {
    constructor() {
        this.overlay = null;
        this.modal = null;
        this.currentMarker = null;
        this.currentDimension = null;
        this.onSaveCallback = null;
        this.init();
    }

    init() {
        // Create modal HTML structure
        const overlay = document.createElement('div');
        overlay.className = 'marker-modal-overlay';
        overlay.innerHTML = `
            <div class="marker-modal">
                <div class="marker-modal-header">
                    <h3 class="marker-modal-title">Add Custom Marker</h3>
                    <button class="marker-modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="marker-modal-body">
                    <div class="marker-modal-field">
                        <label class="marker-modal-label" for="marker-category">Choose Category</label>
                        <select 
                            id="marker-category" 
                            class="marker-modal-select"
                        >
                            <option value="">None</option>
                        </select>
                    </div>
                    <div class="marker-modal-field">
                        <label class="marker-modal-label" for="marker-text">Marker Label</label>
                        <input 
                            type="text" 
                            id="marker-text" 
                            class="marker-modal-input" 
                            placeholder="Enter marker name..."
                            maxlength="50"
                        />
                    </div>
                    <div class="marker-modal-field">
                        <label class="marker-modal-label" for="marker-color">Text Color</label>
                        <div class="marker-modal-color-wrapper">
                            <input 
                                type="color" 
                                id="marker-color" 
                                class="marker-modal-color-input" 
                                value="#cccccc"
                            />
                            <input 
                                type="text" 
                                id="marker-color-text" 
                                class="marker-modal-input" 
                                value="#cccccc"
                                style="flex: 1;"
                                pattern="^#[0-9A-Fa-f]{6}$"
                            />
                        </div>
                    </div>
                </div>
                <div class="marker-modal-footer">
                    <button class="marker-modal-btn marker-modal-btn-cancel">Cancel</button>
                    <button class="marker-modal-btn marker-modal-btn-save">Save Marker</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.overlay = overlay;
        this.modal = overlay.querySelector('.marker-modal');

        // Populate category dropdown
        this.populateCategoryDropdown();

        // Bind events
        this.bindEvents();
    }

    populateCategoryDropdown() {
        const categorySelect = this.modal.querySelector('#marker-category');
        // Clear existing options except "None"
        categorySelect.innerHTML = '<option value="">None</option>';
        
        // Add category options
        MarkerCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `${category.symbol} ${category.name}`;
            categorySelect.appendChild(option);
        });
    }

    bindEvents() {
        // Close button
        this.overlay.querySelector('.marker-modal-close').addEventListener('click', () => this.close());
        
        // Cancel button
        this.overlay.querySelector('.marker-modal-btn-cancel').addEventListener('click', () => this.close());
        
        // Save button
        this.overlay.querySelector('.marker-modal-btn-save').addEventListener('click', () => this.handleSave());
        
        // Close on overlay click (outside modal)
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });

        // Sync color inputs
        const colorInput = this.overlay.querySelector('#marker-color');
        const colorText = this.overlay.querySelector('#marker-color-text');
        
        colorInput.addEventListener('input', (e) => {
            colorText.value = e.target.value.toUpperCase();
        });
        
        colorText.addEventListener('input', (e) => {
            const value = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                colorInput.value = value;
            }
        });
    }

    open(coordinates, dimension, existingMarker = null) {
        this.currentDimension = dimension;
        this.currentMarker = existingMarker;

        // Update title
        const title = this.modal.querySelector('.marker-modal-title');
        title.textContent = existingMarker ? 'Edit Marker' : 'Add Custom Marker';

        // Set coordinates (stored for save)
        this.coordinates = coordinates;

        // Populate form if editing
        const categorySelect = this.modal.querySelector('#marker-category');
        const textInput = this.modal.querySelector('#marker-text');
        const colorInput = this.modal.querySelector('#marker-color');
        const colorText = this.modal.querySelector('#marker-color-text');

        if (existingMarker) {
            // Restore category if it exists
            if (existingMarker.category) {
                categorySelect.value = existingMarker.category;
            } else {
                categorySelect.value = '';
            }
            
            // Text should already be just the label (no emoji)
            // But handle backward compatibility - remove emoji if present
            let markerText = existingMarker.text || '';
            if (existingMarker.category) {
                const category = getCategoryById(existingMarker.category);
                if (category && markerText.startsWith(category.symbol)) {
                    // Remove category symbol and leading space (backward compatibility)
                    markerText = markerText.substring(category.symbol.length).trim();
                }
            }
            textInput.value = markerText;
            
            const color = existingMarker.textColor || '#cccccc';
            colorInput.value = color;
            colorText.value = color.toUpperCase();
        } else {
            categorySelect.value = '';
            textInput.value = '';
            colorInput.value = '#cccccc';
            colorText.value = '#CCCCCC';
        }

        // Show modal
        this.overlay.classList.add('active');
        textInput.focus();
    }

    close() {
        this.overlay.classList.remove('active');
        this.currentMarker = null;
        this.coordinates = null;
    }

    isOpen() {
        return this.overlay.classList.contains('active');
    }

    handleSave() {
        const categorySelect = this.modal.querySelector('#marker-category');
        const textInput = this.modal.querySelector('#marker-text');
        const colorInput = this.modal.querySelector('#marker-color');
        const saveBtn = this.modal.querySelector('.marker-modal-btn-save');

        const categoryId = categorySelect.value;
        const text = textInput.value.trim();
        const textColor = colorInput.value;

        // Validation
        if (!text) {
            Unmined.toast('Please enter a marker label');
            textInput.focus();
            return;
        }

        // Sanitize text (basic XSS prevention)
        const sanitizedText = text.replace(/[<>]/g, '');

        // Disable save button during save
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        // Create marker data
        // Store only the label text (no emoji) - emoji will be used as icon
        const markerData = {
            id: this.currentMarker ? this.currentMarker.id : 'marker-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            x: this.coordinates[0],
            z: this.coordinates[1],
            text: sanitizedText,
            category: categoryId || null,
            textColor: textColor,
            font: "500 18px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            textBackgroundColor: "rgba(0, 0, 0, 0.65)",
            image: categoryId ? null : "custom.pin.png", // No pin image if category exists (emoji will be icon)
            imageScale: 0.1,
            imageAnchor: [0.5, 1],
            offsetX: 0,
            offsetY: 20
        };

        // Call save callback
        if (this.onSaveCallback) {
            this.onSaveCallback(markerData, this.currentMarker !== null).finally(() => {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Marker';
            });
        } else {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Marker';
        }
    }

    setOnSave(callback) {
        this.onSaveCallback = callback;
    }
}

