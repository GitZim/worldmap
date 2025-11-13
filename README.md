# Minecraft Server Maps Website

A unified web interface for viewing your Minecraft server maps (Overworld, Nether, and The End).

## Features

- **Unified Interface**: Single website with navigation between all three dimensions
- **Responsive Design**: Works on desktop and mobile devices
- **Fast Switching**: Instant switching between maps without page reloads
- **Clean UI**: Modern design with clear navigation buttons

## Structure

- `index.html` - Main website with navigation
- `overworld/` - Overworld map viewer
- `nether/` - Nether map viewer
- `end/` - The End map viewer

## How to Use

1. Open `index.html` in your web browser
2. Use the navigation buttons at the top to switch between:
   - 🌍 Overworld
   - 🔥 Nether
   - 🌌 The End
3. Each map is fully interactive with zoom, pan, and all original features

## Updating the Maps

When you update your Minecraft maps:

1. **Update the Last Updated date**: Open `index.html` and find this line near the top of the `<script>` section:
   ```javascript
   const MAP_LAST_UPDATED = "2025-01-13"; // Change this to today's date
   ```
   Change the date to when you updated the maps.

2. **Replace the map files**: Update the `overworld/`, `nether/`, and `end/` folders with your new map data

## Hosting

To host this on a web server:

1. Upload all files and folders to your web server
2. Ensure the server serves the files correctly (no special server configuration needed)
3. Access the main `index.html` file

## Map Generation

The individual maps were generated using uNmINeD, a popular Minecraft map renderer. Each dimension maintains its original functionality and features.
