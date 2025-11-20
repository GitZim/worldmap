// Marker Integration - Extends Unmined class functionality
(function() {
    const dimension = 'overworld';
    let markerAPI = null;
    let markerModal = null;
    let userMarkersLayer = null;
    let userMarkers = [];
    let unminedInstance = null;
    let clickListener = null;

    // Wait for Unmined to be available
    function initMarkerIntegration(unmined) {
        unminedInstance = unmined;
        markerAPI = new MarkerAPI();
        markerModal = new MarkerModal();

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

        // Extend context menu
        extendContextMenu(unmined);

        // Load user markers
        loadAndDisplayUserMarkers();
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

                // Remove existing "Add Custom Marker" if present
                menuItems.forEach(item => {
                    if (item.textContent.includes('Add Custom Marker')) {
                        item.remove();
                    }
                });

                // Create new menu item
                const menuItem = document.createElement('li');
                menuItem.textContent = 'Add Custom Marker';
                menuItem.style.cursor = 'pointer';
                menuItem.addEventListener('click', () => {
                    markerModal.open(coordinates, dimension);
                    contextMenuControl.close();
                });

                // Insert after red dot marker option
                if (insertAfter && insertAfter.nextSibling) {
                    insertAfter.parentNode.insertBefore(menuItem, insertAfter.nextSibling);
                } else if (insertAfter) {
                    insertAfter.parentNode.appendChild(menuItem);
                } else {
                    // Fallback: add at the beginning
                    contextMenuControl.container.querySelector('ul').insertBefore(
                        menuItem,
                        contextMenuControl.container.querySelector('ul').firstChild
                    );
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

        // Create new layer with user markers
        if (userMarkers.length > 0) {
            userMarkersLayer = unminedInstance.createMarkersLayer(userMarkers);
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
    Unmined.prototype.createMarkersLayer = function(markers) {
        const layer = originalCreateMarkersLayer.call(this, markers);
        
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

