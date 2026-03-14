# Holography Simulation Planner

This repository provides a lightweight holography planning surface where you can assemble lasers, galvanized mirrors, and reflector panels on a custom mesh canvas. The simulation renders beam trajectories, reflections, and projection output in real time as you drag and configure devices.

## Features

- Drag-and-drop optical devices onto a mesh canvas
- Interactive laser beam tracing with mirror and reflector bounces
- Device settings panel for angles, intensity, reflectivity, and segment length
- Management view to track all active modules and devices

## Getting Started

1. Start a local server from the repository root:

   ```bash
   npm start
   ```

   Or use a simple Python server:

   ```bash
   python3 -m http.server 8000
   ```

2. Open `http://localhost:8000` in your browser.

## Controls

- Drag devices from the palette into the mesh board.
- Click a device to edit its settings in the right-hand panel.
- Hold Shift to multi-select devices and pick the active configuration from the dropdown.
- Adjust the mesh size slider to match your custom build spacing.
- Use the reset button to clear the board.
