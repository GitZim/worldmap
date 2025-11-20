// Marker API - JSONBin.io integration
class MarkerAPI {
    constructor() {
        this.binId = MarkerConfig.binId;
        this.apiKey = MarkerConfig.apiKey;
        this.baseUrl = MarkerConfig.baseUrl;
        this.cache = null;
        this.cacheTimestamp = 0;
        this.cacheTimeout = 30000; // 30 seconds cache
    }

    async loadAllMarkers() {
        // Check cache first
        const now = Date.now();
        if (this.cache && (now - this.cacheTimestamp) < this.cacheTimeout) {
            return this.cache;
        }

        try {
            const response = await fetch(`${this.baseUrl}/${this.binId}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load markers: ${response.statusText}`);
            }

            const data = await response.json();
            const markers = data.record || { overworld: [], nether: [], end: [] };

            // Update cache
            this.cache = markers;
            this.cacheTimestamp = now;

            return markers;
        } catch (error) {
            console.error('Error loading markers:', error);
            Unmined.toast('Failed to load markers. Using cached data if available.');
            return this.cache || { overworld: [], nether: [], end: [] };
        }
    }

    async loadMarkers(dimension) {
        const allMarkers = await this.loadAllMarkers();
        return allMarkers[dimension] || [];
    }

    async saveMarker(dimension, markerData) {
        try {
            // Load current data
            let allMarkers;
            try {
                allMarkers = await this.loadAllMarkers();
            } catch (error) {
                // If bin doesn't exist, initialize it
                allMarkers = { overworld: [], nether: [], end: [] };
            }
            
            // Add new marker to dimension
            if (!allMarkers[dimension]) {
                allMarkers[dimension] = [];
            }
            allMarkers[dimension].push(markerData);

            // Save to JSONBin
            const response = await fetch(`${this.baseUrl}/${this.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.apiKey
                },
                body: JSON.stringify(allMarkers)
            });

            let responseData;
            try {
                responseData = await response.json();
            } catch (parseError) {
                console.error('Failed to parse JSONBin response:', parseError);
                const text = await response.text();
                console.error('Response text:', text);
                throw new Error(`Failed to parse response: ${response.statusText}`);
            }

            if (!response.ok) {
                console.error('JSONBin API Error:', responseData);
                const errorMsg = responseData?.message || response.statusText;
                throw new Error(`Failed to save marker: ${errorMsg}`);
            }

            // Verify response structure - JSONBin v3 returns { record: {...}, metadata: {...} }
            if (responseData.record) {
                // Update cache with the actual response data
                this.cache = responseData.record;
            } else {
                // If no record in response, use our data (shouldn't happen but fallback)
                this.cache = allMarkers;
            }
            this.cacheTimestamp = Date.now();

            return markerData;
        } catch (error) {
            console.error('Error saving marker:', error);
            throw error;
        }
    }

    async updateMarker(dimension, markerId, markerData) {
        try {
            // Load current data
            const allMarkers = await this.loadAllMarkers();
            
            if (!allMarkers[dimension]) {
                throw new Error(`Dimension ${dimension} not found`);
            }

            // Find and update marker
            const index = allMarkers[dimension].findIndex(m => m.id === markerId);
            if (index === -1) {
                throw new Error('Marker not found');
            }

            allMarkers[dimension][index] = { ...markerData, id: markerId };

            // Save to JSONBin
            const response = await fetch(`${this.baseUrl}/${this.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.apiKey
                },
                body: JSON.stringify(allMarkers)
            });

            let responseData;
            try {
                responseData = await response.json();
            } catch (parseError) {
                console.error('Failed to parse JSONBin response:', parseError);
                const text = await response.text();
                console.error('Response text:', text);
                throw new Error(`Failed to parse response: ${response.statusText}`);
            }

            if (!response.ok) {
                console.error('JSONBin API Error:', responseData);
                const errorMsg = responseData?.message || response.statusText;
                throw new Error(`Failed to update marker: ${errorMsg}`);
            }

            // Update cache with response data
            if (responseData.record) {
                this.cache = responseData.record;
            } else {
                this.cache = allMarkers;
            }
            this.cacheTimestamp = Date.now();

            return markerData;
        } catch (error) {
            console.error('Error updating marker:', error);
            throw error;
        }
    }

    async deleteMarker(dimension, markerId) {
        try {
            // Load current data
            const allMarkers = await this.loadAllMarkers();
            
            if (!allMarkers[dimension]) {
                throw new Error(`Dimension ${dimension} not found`);
            }

            // Remove marker
            allMarkers[dimension] = allMarkers[dimension].filter(m => m.id !== markerId);

            // Save to JSONBin
            const response = await fetch(`${this.baseUrl}/${this.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.apiKey
                },
                body: JSON.stringify(allMarkers)
            });

            let responseData;
            try {
                responseData = await response.json();
            } catch (parseError) {
                console.error('Failed to parse JSONBin response:', parseError);
                const text = await response.text();
                console.error('Response text:', text);
                throw new Error(`Failed to parse response: ${response.statusText}`);
            }

            if (!response.ok) {
                console.error('JSONBin API Error:', responseData);
                const errorMsg = responseData?.message || response.statusText;
                throw new Error(`Failed to delete marker: ${errorMsg}`);
            }

            // Update cache with response data
            if (responseData.record) {
                this.cache = responseData.record;
            } else {
                this.cache = allMarkers;
            }
            this.cacheTimestamp = Date.now();

            return true;
        } catch (error) {
            console.error('Error deleting marker:', error);
            throw error;
        }
    }

    clearCache() {
        this.cache = null;
        this.cacheTimestamp = 0;
    }
}

