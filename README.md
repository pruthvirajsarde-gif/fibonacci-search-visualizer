# 🔍 Fibonacci Search Visualizer

An interactive, educational web-based algorithm learning tool designed for Data Structures & Algorithms (DSA) students. Visualizes the **Fibonacci Search Algorithm** step-by-step with real-time probe calculations, two-tier gliding pointers, synchronized pseudocode execution, and interactive speed controls.

---

## 🚀 Live Demo
- **GitHub Pages:** [https://pruthvirajsarde-gif.github.io/fibonacci-search-visualizer/](https://pruthvirajsarde-gif.github.io/fibonacci-search-visualizer/)
- **In-Browser Automated Test Suite:** [https://pruthvirajsarde-gif.github.io/fibonacci-search-visualizer/test_suite.html](https://pruthvirajsarde-gif.github.io/fibonacci-search-visualizer/test_suite.html)

---

## ✨ Features

- **Interactive Array & Target Configuration**:
  - Enter custom comma-separated sorted arrays or generate random sorted datasets.
  - Quick presets: *Default (9)*, *First Element (10)*, *Last Element (91)*, *Missing Element (70)*, *Single Element [42]*, and *15-Item Arrays*.
  - Unsorted array detection with one-click automatic sorting.
- **Visual Color Harmony**:
  - **Search Range**: Soft cyan border and glowing region.
  - **Probe ($i$)**: Vibrant amber highlight with smooth gliding pointer badge.
  - **Offset Indicator**: Gliding lower-tier badge indicating eliminated left boundaries.
  - **Comparing**: Magenta pulse on active comparisons.
  - **Eliminated**: Smoothly dimmed elements with subtle grayscale.
  - **Found**: Emerald green celebration glow upon locating the target.
- **Media-Player Style Playback Controls**:
  - Play, Pause, Step Forward (`→`), Step Backward (`←`), and Reset (`R`).
  - Interactive speed slider from `0.25x` to `3.0x`.
- **Integrated Live HUD & Explorer**:
  - Real-time comparison arena (`Array[i]` vs `Target`) with plain-English verdicts.
  - Fibonacci variables HUD ($F_m, F_{m-1}, F_{m-2}$) and active formula bar: $i = \min(\text{offset} + F_{m-2}, n - 1)$.
  - Step-by-step execution timeline with click-to-jump navigation.
  - Synchronized line-by-line pseudocode execution viewer.
  - Time & space complexity analysis.
- **Collapsible DSA Guide**:
  - Comprehensive theory and side-by-side comparison between **Fibonacci Search** and **Binary Search**.
- **Dark & Light Mode**:
  - Toggle between dark glassmorphism and clean light themes with `T` shortcut.
- **Synthetic Web Audio**:
  - Sound effects for probes, comparisons, and matches with `M` toggle.

---

## 📊 Complexity Analysis

| Metric | Fibonacci Search | Binary Search |
| :--- | :--- | :--- |
| **Best Case Time** | $O(1)$ | $O(1)$ |
| **Average Case Time** | $O(\log n)$ | $O(\log n)$ |
| **Worst Case Time** | $O(\log n)$ ($\approx 1.44 \log_2 n$) | $O(\log n)$ ($\log_2 n$) |
| **Space Complexity** | $O(1)$ (Iterative) | $O(1)$ |
| **Arithmetic Operators** | **Only Addition & Subtraction** | Division or Bit-shift |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `Space` | Play / Pause auto-step animation |
| `→` | Advance one step forward |
| `←` | Step backward to previous state |
| `R` | Reset visualizer to beginning |
| `T` | Toggle Dark / Light theme |
| `M` | Toggle audio sound effects |
| `?` | Open keyboard shortcuts & guide |

---

## 🛠️ Tech Stack

- **HTML5**: Semantic layout and accessible regions.
- **Vanilla CSS**: Responsive custom design system, glassmorphism, dynamic variables, and smooth CSS transitions.
- **Vanilla JavaScript**: State-driven search engine, deterministic stepping, Web Audio synthesizer.
- **Zero Dependencies**: Pure client-side execution without external runtime packages.

---

## 🧪 Testing

Run algorithmic and DOM alignment tests locally using Node.js:
```bash
node test_visualizer.js
```
Or open `test_suite.html` in your browser to run the 15-test browser suite.
