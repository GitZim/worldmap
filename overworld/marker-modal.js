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

        // Bind events
        this.bindEvents();
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
        const textInput = this.modal.querySelector('#marker-text');
        const colorInput = this.modal.querySelector('#marker-color');
        const colorText = this.modal.querySelector('#marker-color-text');

        if (existingMarker) {
            textInput.value = existingMarker.text || '';
            const color = existingMarker.textColor || '#cccccc';
            colorInput.value = color;
            colorText.value = color.toUpperCase();
        } else {
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
        const textInput = this.modal.querySelector('#marker-text');
        const colorInput = this.modal.querySelector('#marker-color');
        const saveBtn = this.modal.querySelector('.marker-modal-btn-save');

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
        const markerData = {
            id: this.currentMarker ? this.currentMarker.id : 'marker-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            x: this.coordinates[0],
            z: this.coordinates[1],
            text: sanitizedText,
            textColor: textColor,
            font: "500 18px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            textBackgroundColor: "rgba(0, 0, 0, 0.65)",
            image: "custom.pin.png",
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

