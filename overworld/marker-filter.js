// Marker Filter Component
class MarkerFilter {
    constructor(dimension) {
        this.dimension = dimension;
        this.overlay = null;
        this.modal = null;
        this.filterState = this.loadFilterState();
        this.onApplyCallback = null;
        this.init();
    }

    init() {
        // Create modal HTML structure
        const overlay = document.createElement('div');
        overlay.className = 'marker-filter-overlay';
        overlay.innerHTML = `
            <div class="marker-filter-modal">
                <div class="marker-filter-header">
                    <h3 class="marker-filter-title">Filter Markers</h3>
                    <button class="marker-filter-close" aria-label="Close">&times;</button>
                </div>
                <div class="marker-filter-body">
                    <div class="marker-filter-categories" id="filter-categories">
                        <!-- Categories will be populated here -->
                    </div>
                    <div class="marker-filter-actions">
                        <button class="marker-filter-btn marker-filter-btn-secondary" id="show-all-btn">Show All</button>
                        <button class="marker-filter-btn marker-filter-btn-secondary" id="hide-all-btn">Hide All</button>
                    </div>
                </div>
                <div class="marker-filter-footer">
                    <button class="marker-filter-btn marker-filter-btn-cancel">Cancel</button>
                    <button class="marker-filter-btn marker-filter-btn-apply">Apply</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.overlay = overlay;
        this.modal = overlay.querySelector('.marker-filter-modal');

        // Populate categories
        this.populateCategories();

        // Bind events
        this.bindEvents();
    }

    populateCategories() {
        const categoriesContainer = this.modal.querySelector('#filter-categories');
        categoriesContainer.innerHTML = '';

        MarkerCategories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'marker-filter-category-item';
            categoryItem.innerHTML = `
                <label class="marker-filter-category-label">
                    <input 
                        type="checkbox" 
                        class="marker-filter-checkbox" 
                        data-category="${category.id}"
                        ${this.filterState[category.id] ? 'checked' : ''}
                    />
                    <img src="${category.image}" alt="${category.name}" class="marker-filter-category-icon">
                    <span class="marker-filter-category-name">${category.name}</span>
                </label>
            `;
            categoriesContainer.appendChild(categoryItem);
        });
    }

    bindEvents() {
        // Close button
        this.overlay.querySelector('.marker-filter-close').addEventListener('click', () => this.close());
        
        // Cancel button
        this.overlay.querySelector('.marker-filter-btn-cancel').addEventListener('click', () => this.close());
        
        // Apply button
        this.overlay.querySelector('.marker-filter-btn-apply').addEventListener('click', () => this.handleApply());
        
        // Show All button
        this.overlay.querySelector('#show-all-btn').addEventListener('click', () => this.showAll());
        
        // Hide All button
        this.overlay.querySelector('#hide-all-btn').addEventListener('click', () => this.hideAll());
        
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
    }

    showAll() {
        const checkboxes = this.modal.querySelectorAll('.marker-filter-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }

    hideAll() {
        const checkboxes = this.modal.querySelectorAll('.marker-filter-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    handleApply() {
        // Get current filter state from checkboxes
        const checkboxes = this.modal.querySelectorAll('.marker-filter-checkbox');
        const newFilterState = {};
        
        checkboxes.forEach(checkbox => {
            const categoryId = checkbox.getAttribute('data-category');
            newFilterState[categoryId] = checkbox.checked;
        });

        // Update filter state
        this.filterState = newFilterState;
        this.saveFilterState();

        // Call apply callback
        if (this.onApplyCallback) {
            this.onApplyCallback(this.filterState);
        }

        this.close();
    }

    open() {
        // Reload filter state and update checkboxes
        this.filterState = this.loadFilterState();
        this.populateCategories();
        this.overlay.classList.add('active');
    }

    close() {
        this.overlay.classList.remove('active');
    }

    isOpen() {
        return this.overlay.classList.contains('active');
    }

    loadFilterState() {
        const key = `markerFilter_${this.dimension}`;
        const saved = localStorage.getItem(key);
        
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing filter state:', e);
            }
        }

        // Default: all categories visible
        const defaultState = {};
        MarkerCategories.forEach(category => {
            defaultState[category.id] = true;
        });
        return defaultState;
    }

    saveFilterState() {
        const key = `markerFilter_${this.dimension}`;
        localStorage.setItem(key, JSON.stringify(this.filterState));
    }

    getFilterState() {
        return this.filterState;
    }

    setOnApply(callback) {
        this.onApplyCallback = callback;
    }
}

