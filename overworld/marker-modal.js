// Marker Categories
const MarkerCategories = [
    { id: 'base', name: 'Base', image: 'categoryimages/house.png', defaultColor: '#ffffff' },
    { id: 'ressources', name: 'Ressources', image: 'categoryimages/pickaxe.png', defaultColor: '#4a9eff' },
    { id: 'village', name: 'Village', image: 'categoryimages/village.png', defaultColor: '#4caf50' },
    { id: 'spawner', name: 'Spawner', image: 'categoryimages/zombie.png', defaultColor: '#f44336' },
    { id: 'portal', name: 'Portal', image: 'categoryimages/portal.png', defaultColor: '#00bcd4' },
    { id: 'mineshaft', name: 'Mineshaft', image: 'categoryimages/mineshaft.png', defaultColor: '#9c27b0' },
    { id: 'ancientcity', name: 'Ancient City', image: 'categoryimages/ancientcity.png', defaultColor: '#5c6bc0' },
    { id: 'deserttemple', name: 'Desert Temple', image: 'categoryimages/deserttemple.png', defaultColor: '#ff9800' },
    { id: 'igloo', name: 'Igloo', image: 'categoryimages/igloo.png', defaultColor: '#00bcd4' },
    { id: 'mansion', name: 'Mansion', image: 'categoryimages/mansion.png', defaultColor: '#795548' },
    { id: 'junglepyramid', name: 'Jungle Pyramid', image: 'categoryimages/junglepyramid.png', defaultColor: '#8bc34a' },
    { id: 'oceantemple', name: 'Ocean Temple', image: 'categoryimages/oceantemple.png', defaultColor: '#2196f3' },
    { id: 'trialchamber', name: 'Trial Chamber', image: 'categoryimages/trialchamber.png', defaultColor: '#ff5722' },
    { id: 'pillager', name: 'Pillager', image: 'categoryimages/pillager.png', defaultColor: '#d32f2f' },
    { id: 'other', name: 'Other', image: 'categoryimages/pin.png', defaultColor: '#cccccc' }
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
                        <div class="marker-modal-custom-dropdown" id="marker-category">
                            <button type="button" class="marker-modal-dropdown-trigger" aria-haspopup="listbox" aria-expanded="false">
                                <span class="marker-modal-dropdown-selected">
                                    <span class="marker-modal-dropdown-text">None</span>
                                </span>
                                <span class="marker-modal-dropdown-arrow">▼</span>
                            </button>
                            <ul class="marker-modal-dropdown-list" role="listbox" aria-label="Category selection">
                                <li class="marker-modal-dropdown-item" role="option" data-value="" aria-selected="true">
                                    <span class="marker-modal-dropdown-text">None</span>
                                </li>
                            </ul>
                            <input type="hidden" id="marker-category-value" value="">
                        </div>
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
                    <div class="marker-modal-field">
                        <label class="marker-modal-label" style="display: flex; align-items: center; gap: 0.5rem;">
                            <input 
                                type="checkbox" 
                                id="marker-checked" 
                                class="marker-modal-checkbox"
                            />
                            <span>Mark as completed</span>
                        </label>
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
        const dropdown = this.modal.querySelector('#marker-category');
        const dropdownList = dropdown.querySelector('.marker-modal-dropdown-list');
        
        // Clear existing options except "None"
        dropdownList.innerHTML = '<li class="marker-modal-dropdown-item" role="option" data-value="" aria-selected="true"><span class="marker-modal-dropdown-text">None</span></li>';
        
        // Add category options with images
        MarkerCategories.forEach(category => {
            const item = document.createElement('li');
            item.className = 'marker-modal-dropdown-item';
            item.setAttribute('role', 'option');
            item.setAttribute('data-value', category.id);
            item.setAttribute('aria-selected', 'false');
            
            const image = document.createElement('img');
            image.src = category.image;
            image.alt = category.name;
            image.className = 'marker-modal-dropdown-image';
            
            const text = document.createElement('span');
            text.className = 'marker-modal-dropdown-text';
            text.textContent = category.name;
            
            item.appendChild(image);
            item.appendChild(text);
            dropdownList.appendChild(item);
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

        // Custom dropdown interaction
        this.setupCustomDropdown();
    }

    setupCustomDropdown() {
        const dropdown = this.modal.querySelector('#marker-category');
        const trigger = dropdown.querySelector('.marker-modal-dropdown-trigger');
        const dropdownList = dropdown.querySelector('.marker-modal-dropdown-list');
        const hiddenInput = dropdown.querySelector('#marker-category-value');
        const selectedDisplay = trigger.querySelector('.marker-modal-dropdown-selected');

        // Toggle dropdown on trigger click
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('open');
            this.closeAllDropdowns();
            if (!isOpen) {
                dropdown.classList.add('open');
                trigger.setAttribute('aria-expanded', 'true');
            }
        });

        // Handle item selection
        dropdownList.addEventListener('click', (e) => {
            const item = e.target.closest('.marker-modal-dropdown-item');
            if (!item) return;

            e.stopPropagation();
            const value = item.getAttribute('data-value');
            this.selectCategory(value);
            this.closeAllDropdowns();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                this.closeAllDropdowns();
            }
        });

        // Close dropdown on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && dropdown.classList.contains('open')) {
                this.closeAllDropdowns();
            }
        });
    }

    selectCategory(categoryId) {
        const dropdown = this.modal.querySelector('#marker-category');
        const trigger = dropdown.querySelector('.marker-modal-dropdown-trigger');
        const dropdownList = dropdown.querySelector('.marker-modal-dropdown-list');
        const hiddenInput = dropdown.querySelector('#marker-category-value');
        const selectedDisplay = trigger.querySelector('.marker-modal-dropdown-selected');

        // Update hidden input
        hiddenInput.value = categoryId || '';

        // Update selected display
        if (categoryId) {
            const category = getCategoryById(categoryId);
            if (category) {
                selectedDisplay.innerHTML = `
                    <img src="${category.image}" alt="${category.name}" class="marker-modal-dropdown-image">
                    <span class="marker-modal-dropdown-text">${category.name}</span>
                `;
                
                // Update color inputs with category's default color
                const colorInput = this.modal.querySelector('#marker-color');
                const colorText = this.modal.querySelector('#marker-color-text');
                if (category.defaultColor && colorInput && colorText) {
                    colorInput.value = category.defaultColor;
                    colorText.value = category.defaultColor.toUpperCase();
                }
            }
        } else {
            selectedDisplay.innerHTML = '<span class="marker-modal-dropdown-text">None</span>';
            
            // Reset to default gray when "None" is selected
            const colorInput = this.modal.querySelector('#marker-color');
            const colorText = this.modal.querySelector('#marker-color-text');
            if (colorInput && colorText) {
                const defaultColor = '#cccccc';
                colorInput.value = defaultColor;
                colorText.value = defaultColor.toUpperCase();
            }
        }

        // Update aria-selected attributes
        dropdownList.querySelectorAll('.marker-modal-dropdown-item').forEach(item => {
            const isSelected = item.getAttribute('data-value') === categoryId;
            item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            item.classList.toggle('selected', isSelected);
        });
    }

    closeAllDropdowns() {
        const dropdown = this.modal.querySelector('#marker-category');
        const trigger = dropdown.querySelector('.marker-modal-dropdown-trigger');
        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
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
        const textInput = this.modal.querySelector('#marker-text');
        const colorInput = this.modal.querySelector('#marker-color');
        const colorText = this.modal.querySelector('#marker-color-text');

        const checkedInput = this.modal.querySelector('#marker-checked');

        if (existingMarker) {
            // Restore category if it exists
            if (existingMarker.category) {
                this.selectCategory(existingMarker.category);
            } else {
                this.selectCategory('');
            }
            
            // Text should already be just the label (no emoji/image prefix)
            // Handle backward compatibility - remove emoji if present (for old markers)
            let markerText = existingMarker.text || '';
            if (existingMarker.category) {
                const category = getCategoryById(existingMarker.category);
                if (category) {
                    // Check if text starts with old emoji symbols (backward compatibility)
                    const oldEmojis = ['🏠', '⚔️', '🏛️', '💎', '⚠️', '🌀', '🌾', '📍', '🏪', '📌'];
                    for (const emoji of oldEmojis) {
                        if (markerText.startsWith(emoji)) {
                            markerText = markerText.substring(emoji.length).trim();
                            break;
                        }
                    }
                }
            }
            textInput.value = markerText;
            
            const color = existingMarker.textColor || '#cccccc';
            colorInput.value = color;
            colorText.value = color.toUpperCase();
            
            // Restore checked state (default to false if not present)
            checkedInput.checked = existingMarker.checked === true;
        } else {
            this.selectCategory('');
            textInput.value = '';
            colorInput.value = '#cccccc';
            colorText.value = '#CCCCCC';
            checkedInput.checked = false;
        }

        // Show modal
        this.overlay.classList.add('active');
        textInput.focus();
    }

    close() {
        this.overlay.classList.remove('active');
        this.closeAllDropdowns();
        this.currentMarker = null;
        this.coordinates = null;
    }

    isOpen() {
        return this.overlay.classList.contains('active');
    }

    handleSave() {
        const hiddenInput = this.modal.querySelector('#marker-category-value');
        const textInput = this.modal.querySelector('#marker-text');
        const colorInput = this.modal.querySelector('#marker-color');
        const checkedInput = this.modal.querySelector('#marker-checked');
        const saveBtn = this.modal.querySelector('.marker-modal-btn-save');

        const categoryId = hiddenInput.value || '';
        const text = textInput.value.trim();
        const textColor = colorInput.value;
        const checked = checkedInput.checked;

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
        // Store only the label text - category image will be used as icon
        const category = categoryId ? getCategoryById(categoryId) : null;
        const markerData = {
            id: this.currentMarker ? this.currentMarker.id : 'marker-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            x: this.coordinates[0],
            z: this.coordinates[1],
            text: sanitizedText,
            category: categoryId || null,
            textColor: textColor,
            checked: checked,
            font: "500 18px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            textBackgroundColor: "rgba(0, 0, 0, 0.65)",
            image: categoryId ? null : "custom.pin.png", // No pin image if category exists (category image will be icon)
            imageScale: categoryId ? 0.1 : 0.1, // 0.1 scale for 32x32 display (from 320x320 source images)
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

