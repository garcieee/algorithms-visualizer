# Algorithm Visualizer Website

An interactive web interface for visualizing sorting algorithms, recursion, and graph algorithms.

## Quick Start

### 1. Install Dependencies
```bash
pip install flask
```

### 2. Run the Server
```bash
python app.py
```

### 3. Open in Browser
Navigate to: `http://localhost:5001`

---

## What's Included

- **Sorting Visualizations** - Watch algorithms like bubble sort, merge sort, quicksort, etc. in action
- **Recursion Visualizations** - Understand recursive algorithms with visual step-throughs
- **MST Algorithms** - See Minimum Spanning Tree algorithms like Kruskal's and Prim's
- **Real-time Interaction** - Adjust parameters and see algorithms respond instantly

---

## File Structure

- `app.py` - Flask backend server that serves the website
- `index.html` - Main webpage with UI and layout
- `style.css` - Styling and appearance
- `app.js` - Main application logic and page interactions
- `sort.js` - Sorting algorithm implementations and visualizations
- `recursion.js` - Recursion algorithm implementations and visualizations
- `mst.js` - Minimum Spanning Tree algorithm implementations
- `utils.js` - Utility functions used across the application

---

## Troubleshooting

**Port 5001 already in use?**
- Edit the last line of `app.py` to use a different port (e.g., 5002)
- Or kill the process: `lsof -ti:5001 | xargs kill -9`

**Flask not found?**
- Install it: `pip install flask`

**Server starts but page won't load?**
- Make sure all HTML, CSS, and JS files are in the same directory as `app.py`
- Check browser console for errors (F12)

---

## Development

The Flask server runs in debug mode by default, which means:
- Changes to files are automatically detected
- The server will reload automatically
- Detailed error messages are displayed

For production, change `debug=True` to `debug=False` in `app.py`.
