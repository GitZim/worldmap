// Marker Integration - Extends Unmined class functionality
(function() {
    const dimension = 'end';
    let markerAPI = null;
    let markerModal = null;
    let markerFilter = null;
    let userMarkersLayer = null;
    let userMarkers = [];
    let unminedInstance = null;
    let clickListener = null;

    // Wait for Unmined to be available
    function initMarkerIntegration(unmined) {
        unminedInstance = unmined;
        markerAPI = new MarkerAPI();
        markerModal = new MarkerModal();
        markerFilter = new MarkerFilter(dimension);

        // Set up modal save callback
        markerModal.setOnSave(async (markerData, isEdit) => {
            try {
                if (isEdit) {
                    await markerAPI.updateMarker(dimension, markerData.id, markerData);
                    Unmined.toast('Marker updated successfully');
                } else {
                    await markerAPI.saveMarker(dimension, markerData);
                    Unmined.toast('Marker added successfully');
                }
                
                markerModal.close();
                await loadAndDisplayUserMarkers();
            } catch (error) {
                console.error('Error saving marker:', error);
                Unmined.toast('Failed to save marker. Please try again.');
            }
        });

        // Set up filter apply callback
        markerFilter.setOnApply((filterState) => {
            updateUserMarkersLayer();
        });

        // Create filter button
        createFilterButton();

        // Extend context menu
        extendContextMenu(unmined);

        // Load user markers
        loadAndDisplayUserMarkers();
    }

    function createFilterButton() {
        // Listen for messages from parent window to open filter
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'openFilter') {
                markerFilter.open();
            }
        });
    }

    // Function to find marker at given coordinates
    function findMarkerAtCoordinates(x, z, tolerance = 30) {
        for (let i = 0; i < userMarkers.length; i++) {
            const marker = userMarkers[i];
            const dx = Math.abs(marker.x - x);
            const dz = Math.abs(marker.z - z);
            // Check if coordinates are within tolerance (default 30 blocks)
            if (dx <= tolerance && dz <= tolerance) {
                return marker;
            }
        }
        return null;
    }

    function extendContextMenu(unmined) {
        // Get the context menu control
        const contextMenuControl = unmined.olMap.getControls().getArray().find(control => {
            return control instanceof ContextMenu;
        });

        if (!contextMenuControl) {
            console.error('Context menu not found');
            return;
        }

        // Listen for context menu open events
        contextMenuControl.on('open', (evt) => {
            const coordinates = ol.proj.transform(
                unmined.olMap.getEventCoordinate(evt.originalEvent),
                unmined.viewProjection,
                unmined.dataProjection
            );

            coordinates[0] = Math.round(coordinates[0]);
            coordinates[1] = Math.round(coordinates[1]);

            // Check if a marker exists at this location
            const markerAtLocation = findMarkerAtCoordinates(coordinates[0], coordinates[1]);

            // Add "Add Custom Marker" option after the red dot marker option
            setTimeout(() => {
                const menuItems = contextMenuControl.container.querySelectorAll('li');
                let insertAfter = null;

                // Find the "Place red dot marker here" item
                menuItems.forEach(item => {
                    if (item.textContent.includes('Place red dot marker here')) {
                        insertAfter = item;
                    }
                });

                // Remove existing custom menu items if present
                menuItems.forEach(item => {
                    if (item.textContent.includes('Add Custom Marker') || 
                        item.textContent.includes('Delete Marker') ||
                        item.textContent.includes('Mark as completed') ||
                        item.textContent.includes('Mark as incomplete') ||
                        item.textContent.includes('Toggle Completed') ||
                        item.classList.contains('ol-ctx-menu-separator')) {
                        // Check if it's our separator (one before our items)
                        const prevSibling = item.previousElementSibling;
                        if (prevSibling && (prevSibling.textContent.includes('Add Custom Marker') || 
                            prevSibling.textContent.includes('Delete Marker') ||
                            prevSibling.textContent.includes('Mark as completed') ||
                            prevSibling.textContent.includes('Mark as incomplete'))) {
                            // This is our separator, remove it too
                        }
                        item.remove();
                    }
                });

                // Create "Add Custom Marker" menu item
                const addMenuItem = document.createElement('li');
                addMenuItem.textContent = 'Add Custom Marker';
                addMenuItem.style.cursor = 'pointer';
                addMenuItem.addEventListener('click', () => {
                    markerModal.open(coordinates, dimension);
                    // Hide the context menu by adding the hidden class
                    if (contextMenuControl.container) {
                        contextMenuControl.container.classList.add('ol-ctx-menu-hidden');
                    }
                });

                // Insert after red dot marker option
                let insertPoint = null;
                if (insertAfter && insertAfter.nextSibling) {
                    insertPoint = insertAfter.nextSibling;
                } else if (insertAfter) {
                    insertPoint = null; // Will append
                } else {
                    // Fallback: add at the beginning
                    insertPoint = contextMenuControl.container.querySelector('ul').firstChild;
                }

                if (insertPoint) {
                    insertPoint.parentNode.insertBefore(addMenuItem, insertPoint);
                } else if (insertAfter) {
                    insertAfter.parentNode.appendChild(addMenuItem);
                } else {
                    contextMenuControl.container.querySelector('ul').insertBefore(
                        addMenuItem,
                        contextMenuControl.container.querySelector('ul').firstChild
                    );
                }

                // If marker exists at location, add toggle and delete options
                if (markerAtLocation) {
                    // Add separator
                    const separator = document.createElement('li');
                    separator.className = 'ol-ctx-menu-separator';
                    separator.innerHTML = '<hr>';
                    addMenuItem.parentNode.insertBefore(separator, addMenuItem.nextSibling);

                    // Create "Toggle Completed" / "Mark as completed" menu item
                    const isChecked = markerAtLocation.checked === true;
                    const toggleMenuItem = document.createElement('li');
                    toggleMenuItem.textContent = isChecked ? 'Mark as incomplete' : 'Mark as completed';
                    toggleMenuItem.style.cursor = 'pointer';
                    toggleMenuItem.style.color = isChecked ? '#ff9800' : '#4caf50';
                    toggleMenuItem.addEventListener('mouseenter', () => {
                        toggleMenuItem.style.backgroundColor = '#333';
                    });
                    toggleMenuItem.addEventListener('mouseleave', () => {
                        toggleMenuItem.style.backgroundColor = '';
                    });
                    toggleMenuItem.addEventListener('click', async () => {
                        try {
                            const updatedMarkerData = {
                                ...markerAtLocation,
                                checked: !isChecked
                            };
                            await markerAPI.updateMarker(dimension, markerAtLocation.id, updatedMarkerData);
                            Unmined.toast(isChecked ? 'Marker marked as incomplete' : 'Marker marked as completed');
                            await loadAndDisplayUserMarkers();
                        } catch (error) {
                            console.error('Error toggling marker completion:', error);
                            Unmined.toast('Failed to update marker. Please try again.');
                        }
                        // Hide the context menu
                        if (contextMenuControl.container) {
                            contextMenuControl.container.classList.add('ol-ctx-menu-hidden');
                        }
                    });

                    // Create "Delete Marker" menu item
                    const deleteMenuItem = document.createElement('li');
                    deleteMenuItem.textContent = 'Delete Marker';
                    deleteMenuItem.style.cursor = 'pointer';
                    deleteMenuItem.style.color = '#ff6b6b';
                    deleteMenuItem.addEventListener('mouseenter', () => {
                        deleteMenuItem.style.backgroundColor = '#333';
                    });
                    deleteMenuItem.addEventListener('mouseleave', () => {
                        deleteMenuItem.style.backgroundColor = '';
                    });
                    deleteMenuItem.addEventListener('click', async () => {
                        const markerText = markerAtLocation.text || 'this marker';
                        if (confirm(`Are you sure you want to delete "${markerText}"?`)) {
                            try {
                                await markerAPI.deleteMarker(dimension, markerAtLocation.id);
                                Unmined.toast('Marker deleted successfully');
                                await loadAndDisplayUserMarkers();
                            } catch (error) {
                                console.error('Error deleting marker:', error);
                                Unmined.toast('Failed to delete marker. Please try again.');
                            }
                        }
                        // Hide the context menu
                        if (contextMenuControl.container) {
                            contextMenuControl.container.classList.add('ol-ctx-menu-hidden');
                        }
                    });

                    // Insert toggle after separator, then delete after toggle
                    separator.parentNode.insertBefore(toggleMenuItem, separator.nextSibling);
                    toggleMenuItem.parentNode.insertBefore(deleteMenuItem, toggleMenuItem.nextSibling);
                }
            }, 10);
        });
    }

    async function loadAndDisplayUserMarkers() {
        try {
            userMarkers = await markerAPI.loadMarkers(dimension);
            updateUserMarkersLayer();
        } catch (error) {
            console.error('Error loading user markers:', error);
            Unmined.toast('Failed to load user markers');
        }
    }

    function updateUserMarkersLayer() {
        if (!unminedInstance) return;

        // Remove existing click listener
        if (clickListener) {
            unminedInstance.olMap.un('click', clickListener);
            clickListener = null;
        }

        // Remove existing user markers layer
        if (userMarkersLayer) {
            unminedInstance.olMap.removeLayer(userMarkersLayer);
        }

        // Filter markers based on filter state
        const filterState = markerFilter ? markerFilter.getFilterState() : null;
        let filteredMarkers = userMarkers;

        if (filterState) {
            filteredMarkers = userMarkers.filter(marker => {
                // If marker has a category, check if that category is visible
                if (marker.category) {
                    return filterState[marker.category] === true;
                }
                // If marker has no category, show it if "other" category is visible
                return filterState['other'] === true;
            });
        }

        // Create new layer with filtered markers
        if (filteredMarkers.length > 0) {
            userMarkersLayer = unminedInstance.createMarkersLayer(filteredMarkers, unminedInstance.olMap);
            unminedInstance.olMap.addLayer(userMarkersLayer);

            // Add click handlers for edit/delete
            userMarkersLayer.getSource().forEachFeature((feature) => {
                feature.set('isUserMarker', true);
            });

            // Handle marker clicks (single listener)
            clickListener = (evt) => {
                const feature = unminedInstance.olMap.forEachFeatureAtPixel(
                    evt.pixel,
                    (feature) => feature
                );

                if (feature && feature.get('isUserMarker')) {
                    const markerData = feature.get('markerData');
                    if (markerData) {
                        showMarkerContextMenu(evt.coordinate, markerData);
                    }
                }
            };
            unminedInstance.olMap.on('click', clickListener);
        }
    }

    function showMarkerContextMenu(coordinate, markerData) {
        // Create a simple context menu for edit/delete
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: absolute;
            background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
            border: 1px solid #555555;
            border-radius: 4px;
            padding: 0.5rem;
            z-index: 10001;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        `;

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.style.cssText = `
            display: block;
            width: 100%;
            padding: 0.5rem;
            margin-bottom: 0.25rem;
            background: linear-gradient(135deg, #404040 0%, #2d2d2d 100%);
            border: 1px solid #555555;
            border-radius: 3px;
            color: #cccccc;
            cursor: pointer;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        editBtn.addEventListener('click', () => {
            const coords = ol.proj.transform(
                coordinate,
                unminedInstance.viewProjection,
                unminedInstance.dataProjection
            );
            markerModal.open([coords[0], coords[1]], dimension, markerData);
            document.body.removeChild(menu);
        });

        const toggleBtn = document.createElement('button');
        const isChecked = markerData.checked === true;
        toggleBtn.textContent = isChecked ? 'Mark as incomplete' : 'Mark as completed';
        toggleBtn.style.cssText = `
            display: block;
            width: 100%;
            padding: 0.5rem;
            margin-bottom: 0.25rem;
            background: linear-gradient(135deg, ${isChecked ? '#ff9800' : '#4caf50'} 0%, ${isChecked ? '#f57c00' : '#388e3c'} 100%);
            border: 1px solid ${isChecked ? '#ff9800' : '#4caf50'};
            border-radius: 3px;
            color: #ffffff;
            cursor: pointer;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        toggleBtn.addEventListener('click', async () => {
            try {
                const updatedMarkerData = {
                    ...markerData,
                    checked: !isChecked
                };
                await markerAPI.updateMarker(dimension, markerData.id, updatedMarkerData);
                Unmined.toast(isChecked ? 'Marker marked as incomplete' : 'Marker marked as completed');
                await loadAndDisplayUserMarkers();
            } catch (error) {
                console.error('Error toggling marker completion:', error);
                Unmined.toast('Failed to update marker');
            }
            document.body.removeChild(menu);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.cssText = `
            display: block;
            width: 100%;
            padding: 0.5rem;
            background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
            border: 1px solid #d32f2f;
            border-radius: 3px;
            color: #ffffff;
            cursor: pointer;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this marker?')) {
                try {
                    await markerAPI.deleteMarker(dimension, markerData.id);
                    Unmined.toast('Marker deleted');
                    await loadAndDisplayUserMarkers();
                } catch (error) {
                    console.error('Error deleting marker:', error);
                    Unmined.toast('Failed to delete marker');
                }
            }
            document.body.removeChild(menu);
        });

        menu.appendChild(editBtn);
        menu.appendChild(toggleBtn);
        menu.appendChild(deleteBtn);

        const pixel = unminedInstance.olMap.getPixelFromCoordinate(coordinate);
        menu.style.left = pixel[0] + 'px';
        menu.style.top = pixel[1] + 'px';
        document.body.appendChild(menu);

        // Close menu on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    if (document.body.contains(menu)) {
                        document.body.removeChild(menu);
                    }
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 10);
    }

    // Store marker data in features for easy access
    const originalCreateMarkersLayer = Unmined.prototype.createMarkersLayer;
    Unmined.prototype.createMarkersLayer = function(markers, map) {
        const layer = originalCreateMarkersLayer.call(this, markers, map);
        
        // Store marker data in features
        layer.getSource().forEachFeature((feature, index) => {
            if (markers[index]) {
                feature.set('markerData', markers[index]);
            }
        });
        
        return layer;
    };

    // Export init function
    window.initMarkerIntegration = initMarkerIntegration;
})();

