# Algorithm Analysis and Simulation Toolkit

**Final Project — Algorithms & Complexity | Term 2, SY 2025–2026**

An interactive web-based application that demonstrates, visualizes, and analyzes fundamental algorithms across three domains: sorting, minimum spanning trees, and recursive functions.

---

## Table of Contents

1. [How to Run](#how-to-run)
2. [System Architecture](#system-architecture)
3. [Module Structure](#module-structure)
4. [Part 1: Sorting Algorithms](#part-1-sorting-algorithms)
5. [Part 2: MST Algorithms](#part-2-mst-algorithms)
6. [Part 3: Recursive Functions](#part-3-recursive-functions)
7. [Algorithm Flowcharts](#algorithm-flowcharts)
8. [Complexity Reference](#complexity-reference)
9. [Sample Outputs](#sample-outputs)
10. [Bonus Features](#bonus-features)

---

## How to Run

**Requirements:** Python 3.x with Flask

```bash
# 1. Install Flask (if not already installed)
pip install flask

# 2. Navigate to the web app folder
cd finals_website

# 3. Start the server
python app.py

# 4. Open your browser and go to:
#    http://localhost:5002
```

The Jupyter notebook can be run independently:

```bash
cd algorithms_finals_notebook
jupyter notebook Algorithm_Analysis_Simulation.ipynb
```

---

## System Architecture

```mermaid
graph TB
    subgraph Browser["Browser (Client)"]
        HTML["index.html<br/>UI Layout & Structure"]
        CSS["style.css<br/>Dark Theme + Components"]
        subgraph JS["JavaScript Modules"]
            UTILS["utils.js<br/>Global State · Helpers · Metrics"]
            VIZ["visualizations.js<br/>Canvas Drawing Engine"]
            SORT["sort.js<br/>8 Sorting Algorithms + Compare All"]
            MST["mst.js<br/>Kruskal's · Prim's · Graph Editor"]
            REC["recursion.js<br/>6 Recursive Simulations"]
            APP["app.js<br/>Main Controller · Event Routing"]
        end
    end

    subgraph Server["Flask Server (app.py)"]
        FLASK["Python / Flask<br/>localhost:5002<br/>Serves static files"]
    end

    subgraph Notebook["Jupyter Notebook"]
        NB["Algorithm_Analysis_Simulation.ipynb<br/>Benchmarks · Charts · Analysis"]
    end

    Browser <-->|HTTP| Server
    APP --> SORT & MST & REC
    SORT & MST & REC --> UTILS & VIZ
```

---

## Module Structure

| Module | File | Responsibility |
|--------|------|----------------|
| `main_program` | `app.js` | Section switching, event wiring, keyboard shortcuts |
| `sorting_module` | `sort.js` | All 8 sorting algorithms (animated + benchmark) |
| `graph_module` | `mst.js` | Graph editor, Kruskal's, Prim's, Union-Find |
| `recursion_module` | `recursion.js` | Factorial, Fibonacci, Hanoi, GCD, Binary Search |
| `visualizations` | `visualizations.js` | Bar, line, scatter, bubble, circular chart renderers |
| `utilities` | `utils.js` | Global State, metrics UI, logging, complexity table |
| `styles` | `style.css` | Full UI design system (CSS custom properties) |
| `server` | `app.py` | Flask dev server |

---

## Part 1: Sorting Algorithms

### Implemented Algorithms (8 total)

| Algorithm | Strategy | Best | Average | Worst | Space | Stable |
|-----------|----------|------|---------|-------|-------|--------|
| Bubble Sort | Adjacent swaps with early exit | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Selection Sort | Find minimum, place at front | O(n²) | O(n²) | O(n²) | O(1) | No |
| Insertion Sort | Build sorted prefix | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Merge Sort | Divide and conquer | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick Sort | Partition around pivot | O(n log n) | O(n log n) | O(n²) | O(log n) | No |
| Random-Quick Sort | Quick Sort + random pivot | O(n log n) | O(n log n) | O(n²)* | O(log n) | No |
| Counting Sort | Frequency counting | O(n+k) | O(n+k) | O(n+k) | O(k) | Yes |
| Radix Sort | Digit-by-digit bucketing | O(nk) | O(nk) | O(nk) | O(n+k) | Yes |

\* Random-Quick worst case is O(n²) with vanishingly small probability.

### Features

- **Animated step-by-step visualization** on HTML5 Canvas
- **Multiple visualization styles**: Bar chart, Line graph, Scatter plot, Bubble chart, Pie/Circular
- **Configurable dataset**: size (5–300), type (random, sorted, reversed, nearly-sorted)
- **Real-time metrics**: comparisons, swaps, elapsed time, progress bar
- **Compare All mode**: benchmarks all 8 algorithms on the same dataset simultaneously

---

## Part 2: MST Algorithms

### Kruskal's Algorithm

Builds the MST by sorting all edges by weight, then greedily adding edges that don't create a cycle. Uses Union-Find (Disjoint Set Union) with path compression and union by rank for efficient cycle detection.

**Time Complexity:** O(E log E)
**Space Complexity:** O(V) for Union-Find

### Prim's Algorithm

Grows the MST from a chosen starting vertex. At each step, selects the minimum-weight edge crossing the frontier between the MST and the remaining graph. Uses a min-heap (priority queue).

**Time Complexity:** O(E log V) with binary heap
**Space Complexity:** O(V + E)

### Features

- **Interactive graph editor**: click to add nodes, click two nodes to add an edge
- **Random graph generator**: creates connected graphs with 3–12 nodes
- **Step-by-step animation**: edge consideration → accept/reject → MST formation
- **MST result panel**: lists selected edges and total cost
- Visual states: normal / active (considering) / MST (accepted) / rejected

---

## Part 3: Recursive Functions

### Implemented Functions (6 total)

| Function | Recurrence | Time | Space | Depth |
|----------|-----------|------|-------|-------|
| Factorial | T(n) = T(n-1) + O(1) | O(n) | O(n) | n |
| Fibonacci (Naive) | T(n) = T(n-1) + T(n-2) + O(1) | O(2ⁿ) | O(n) | n |
| Fibonacci (Memoized) | T(n) = T(n-1) + O(1) | O(n) | O(n) | n |
| Tower of Hanoi | T(n) = 2·T(n-1) + O(1) | O(2ⁿ) | O(n) | n |
| GCD (Euclidean) | T(a,b) = T(b, a mod b) | O(log min(a,b)) | O(log n) | log n |
| Binary Search | T(n) = T(n/2) + O(1) | O(log n) | O(log n) | log n |

### Features

- **Full call trace** with indentation showing recursion depth
- **Base case highlighting** (shown in orange)
- **Return values displayed** at each unwinding step
- **Cache hit indicators** for memoized Fibonacci
- **Configurable n** with safe upper bounds per function

---

## Algorithm Flowcharts

### Bubble Sort

```mermaid
flowchart TD
    A([Start]) --> B[i = 0]
    B --> C{i < n - 1?}
    C -- No --> Z([End: Array Sorted])
    C -- Yes --> D[swapped = false\nj = 0]
    D --> E{j < n - i - 1?}
    E -- No --> F{swapped?}
    F -- No --> Z
    F -- Yes --> G[i = i + 1]
    G --> C
    E -- Yes --> H{arr j > arr j+1 ?}
    H -- No --> I[j = j + 1]
    I --> E
    H -- Yes --> J[Swap arr j and arr j+1\nswapped = true]
    J --> I
```

### Merge Sort

```mermaid
flowchart TD
    A([Start: sort lo..hi]) --> B{lo >= hi?}
    B -- Yes --> Z([Return: base case])
    B -- No --> C[mid = lo + hi / 2]
    C --> D[sort lo..mid]
    D --> E[sort mid+1..hi]
    E --> F[merge lo..mid..hi]
    F --> G([Return])

    subgraph Merge["merge lo, mid, hi"]
        M1[Copy left and right halves] --> M2[i = 0, j = 0, k = lo]
        M2 --> M3{i < L.len AND j < R.len?}
        M3 -- No --> M4[Copy remaining elements]
        M4 --> M5([Done])
        M3 -- Yes --> M6{L i <= R j ?}
        M6 -- Yes --> M7[arr k = L i\ni++, k++]
        M6 -- No --> M8[arr k = R j\nj++, k++]
        M7 & M8 --> M3
    end
```

### Quick Sort

```mermaid
flowchart TD
    A([Start: sort lo..hi]) --> B{lo < hi?}
    B -- No --> Z([Return])
    B -- Yes --> C[partition lo..hi]
    C --> D[sort lo..p-1]
    D --> E[sort p+1..hi]
    E --> Z

    subgraph Partition["partition lo, hi"]
        P1[pivot = arr hi\ni = lo - 1] --> P2[j = lo]
        P2 --> P3{j < hi?}
        P3 -- No --> P4[Swap arr i+1 and arr hi\nreturn i + 1]
        P3 -- Yes --> P5{arr j <= pivot?}
        P5 -- No --> P6[j++]
        P5 -- Yes --> P7[i++\nSwap arr i and arr j\nj++]
        P6 & P7 --> P3
    end
```

### Kruskal's Algorithm

```mermaid
flowchart TD
    A([Start]) --> B[Sort all edges by weight]
    B --> C[Initialize Union-Find\nfor n vertices]
    C --> D[mst = empty list\ni = 0]
    D --> E{i < edges.length AND\nmst.size < n-1?}
    E -- No --> F[Mark remaining edges as rejected]
    F --> Z([End: Display MST])
    E -- Yes --> G[Consider edge i: u -- v, weight w]
    G --> H{find u == find v?\nWould create a cycle?}
    H -- Yes --> I[Reject edge\nmark as 'reject']
    H -- No --> J[Accept edge\nunion u and v\nadd to MST]
    I --> K[i++]
    J --> K
    K --> E
```

### Prim's Algorithm

```mermaid
flowchart TD
    A([Start]) --> B[Choose starting vertex s]
    B --> C[inTree = set with s\nAdd all edges from s to min-heap]
    C --> D{heap empty OR\nmst has n-1 edges?}
    D -- Yes --> Z([End: Display MST])
    D -- No --> E[Pop minimum-weight edge u--v]
    E --> F{v already in tree?}
    F -- Yes --> G[Discard stale entry]
    G --> D
    F -- No --> H[Add v to tree\nAdd edge u--v to MST]
    H --> I[Push all edges from v\nto not-yet-visited nodes onto heap]
    I --> D
```

### Factorial Recursion

```mermaid
flowchart TD
    A([factorial n]) --> B{n == 1?}
    B -- Yes --> C[Return 1\nBase case]
    B -- No --> D[Call factorial n-1]
    D --> E[Return n * factorial n-1]
    E --> F([Result])
```

### Fibonacci (Naive vs Memoized)

```mermaid
flowchart TD
    A([fib n]) --> B{n <= 1?}
    B -- Yes --> C[Return n\nBase case]
    B -- No --> D{Memoized?\nCheck cache}
    D -- Cache Hit --> E[Return cached value]
    D -- No Cache --> F[left = fib n-1]
    F --> G[right = fib n-2]
    G --> H[result = left + right]
    H --> I[Store in cache]
    I --> J[Return result]
```

### Tower of Hanoi

```mermaid
flowchart TD
    A([hanoi n, src, aux, dst]) --> B{n == 1?}
    B -- Yes --> C["Move disk 1: src → dst\nBase case"]
    B -- No --> D["hanoi n-1, src, dst, aux\nMove top n-1 disks to auxiliary"]
    D --> E["Move disk n: src → dst"]
    E --> F["hanoi n-1, aux, src, dst\nMove n-1 disks from auxiliary to dst"]
    F --> G([Return])
```

---

## Complexity Reference

### Sorting

| Algorithm | Best | Average | Worst | Space | Stable |
|-----------|------|---------|-------|-------|--------|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | No |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | No |
| Random-Quick | O(n log n) | O(n log n) | O(n²)* | O(log n) | No |
| Counting Sort | O(n+k) | O(n+k) | O(n+k) | O(k) | Yes |
| Radix Sort | O(nk) | O(nk) | O(nk) | O(n+k) | Yes |

### Graph (MST)

| Algorithm | Time | Space |
|-----------|------|-------|
| Kruskal's | O(E log E) | O(V) |
| Prim's | O(E log V) | O(V+E) |

### Recursion

| Function | Time | Space | Max Depth |
|----------|------|-------|-----------|
| Factorial(n) | O(n) | O(n) | n |
| Fibonacci naive | O(2ⁿ) | O(n) | n |
| Fibonacci memo | O(n) | O(n) | n |
| Tower of Hanoi | O(2ⁿ) | O(n) | n |
| GCD(a,b) | O(log min(a,b)) | O(log n) | log n |
| Binary Search | O(log n) | O(log n) | log n |

---

## Sample Outputs

### Sorting Comparison (n = 100, random dataset)

```
Dataset Size: 100   Type: random

Algorithm         Time (ms)    Comparisons    Swaps
Radix Sort        0.021        100            100
Counting Sort     0.024        100            100
Merge Sort        0.076        544            183
Quick Sort        0.091        411            139
Random-Quick      0.097        428            144
Insertion Sort    0.312        2,453          2,453
Bubble Sort       0.587        4,950          2,601
Selection Sort    0.601        4,950          99
```

### MST Result (Kruskal's)

```
Edges selected for MST:
A -- C  (weight 2)
C -- D  (weight 3)
B -- C  (weight 4)
D -- E  (weight 5)
E -- F  (weight 7)
G -- F  (weight 8)

Total MST Cost = 29
```

### Recursion Trace (Factorial, n = 4)

```
factorial(4)
 -> 4 * factorial(3)
 -> 3 * factorial(2)
 -> 2 * factorial(1)
 -> base case: return 1
Result = 24
```

### Recursion Trace (Tower of Hanoi, n = 3)

```
Tower of Hanoi (3 disks, A → C)
  hanoi(3, A → C)
    Move disk 1 from A to C
    Move disk 2 from A to B
    Move disk 1 from C to B
  Move disk 3 from A to C
    Move disk 1 from B to A
    Move disk 2 from B to C
    Move disk 1 from A to C
Total moves: 7 = 2³ - 1 = 7
```

---

## Bonus Features

| Feature | Implementation |
|---------|---------------|
| GUI Application | Full browser-based interactive interface |
| Step-by-step animation | All three sections support pause/resume/step |
| Graphical visualization | 5 chart types: bar, line, scatter, bubble, circular |
| Performance charts | Jupyter notebook: benchmark charts + scalability curves |
| Compare All | Live GUI benchmark table comparing all 8 sorting algorithms |
| Interactive graph editor | Click-to-add nodes and edges for MST |
| Memoized Fibonacci | Side-by-side comparison of naive vs. memoized recursion |
| Large dataset testing | Sorting visualizer supports up to 300 elements |
| Keyboard shortcuts | Space/Enter = Run, R = Reset, G = Generate |

---

## Project Structure

```
algorithms-visualizer/
├── README.md                               ← This file
├── algorithms_finals_notebook/
│   ├── Algorithm_Analysis_Simulation.ipynb ← Jupyter analysis notebook
│   ├── sorting_benchmark.png               ← Generated performance chart
│   ├── sorting_scalability.png             ← Scalability analysis chart
│   ├── mst_visualization.png               ← Graph + MST overlay
│   ├── recursion_call_growth.png           ← Recursion call count chart
│   └── hanoi_growth.png                    ← Hanoi complexity curve
└── finals_website/
    ├── app.py                              ← Flask server (port 5002)
    ├── index.html                          ← Application layout
    ├── style.css                           ← UI design system
    ├── utils.js                            ← Shared state + helpers
    ├── visualizations.js                   ← Canvas rendering engine
    ├── sort.js                             ← Sorting algorithms module
    ├── mst.js                              ← Graph/MST module
    ├── recursion.js                        ← Recursion module
    └── app.js                              ← Main application controller
```
