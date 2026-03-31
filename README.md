# Algorithms Visualizer

A comprehensive project featuring algorithm visualizations and analysis simulations for studying data structures and algorithms.

## Project Structure

### 1. **Website/** - Interactive Algorithm Visualizer
A web-based interface for visualizing various algorithms in real-time.

**Features:**
- Sorting Algorithm Visualizations (sort.js)
- Recursion Visualization (recursion.js)
- Minimum Spanning Tree (MST) Visualization (mst.js)
- Utility functions for algorithm implementation (utils.js)

**Files:**
- `app.py` - Flask backend server
- `index.html` - Main web interface
- `style.css` - Styling
- `app.js`, `sort.js`, `recursion.js`, `mst.js`, `utils.js` - Frontend logic

### 2. **Algorithms Finals/** - Analysis Simulation
A Jupyter notebook containing algorithm analysis and performance simulations.

**Files:**
- `Algorithm_Analysis_Simulation.ipynb` - Jupyter notebook with analysis and simulations

---

## Getting Started

### Option 1: Run the Interactive Website

#### Prerequisites
- Python 3.x
- Flask

#### Installation & Setup

1. Navigate to the Website folder:
   ```bash
   cd finals_website
   ```

2. Install Flask (if not already installed):
   ```bash
   pip install flask
   ```

3. Run the Flask server:
   ```bash
   python app.py
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5001
   ```

The server will be running in debug mode, so changes to your files will auto-reload.

---

### Option 2: Run the Jupyter Notebook Analysis

#### Prerequisites
- Python 3.x
- Jupyter Notebook
- Required Python packages (numpy, matplotlib, etc.)

#### Installation & Setup

1. Navigate to the Algorithms Finals folder:
   ```bash
   cd Algorithms\ Finals
   ```

2. Install Jupyter (if not already installed):
   ```bash
   pip install jupyter
   ```

3. Start Jupyter Notebook:
   ```bash
   jupyter notebook
   ```

4. Open `Algorithm_Analysis_Simulation.ipynb` in the Jupyter interface that opens in your browser.

---

## How to Use

### Website
1. Start the Flask server (see instructions above)
2. The website provides interactive visualizations:
   - Select an algorithm from the interface
   - Observe the step-by-step execution
   - Modify inputs to see how algorithms behave

### Jupyter Notebook
1. Start Jupyter Notebook (see instructions above)
2. Run cells sequentially to:
   - Analyze algorithm complexity
   - View performance simulations
   - Compare different algorithms

---

## Troubleshooting

### Port 5001 Already in Use
If you get "Address already in use" error:
- Edit `Website/app.py` and change the port number in the last line
- Or kill the process using port 5001:
  ```bash
  lsof -ti:5001 | xargs kill -9
  ```

### Flask Not Found
Make sure Flask is installed:
```bash
pip install flask
```

### Jupyter Notebook Not Found
Make sure Jupyter is installed:
```bash
pip install jupyter
```

---

## Requirements

- Python 3.x
- Flask (for the website)
- Jupyter Notebook (for the analysis simulation)
- Modern web browser (Chrome, Firefox, Safari, Edge)

---

## Author
Joseph Garcia
Analysis of Algorithms - Final Project
