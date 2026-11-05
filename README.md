# ReadEase

> **An Adaptive Accessibility Layer for the Web**  
> A lightweight, privacy-first Chrome extension (Manifest V3) that restyles any web page in one click for readers with dyslexia, colour-vision deficiency, or low vision.

---

## What is ReadEase?

The modern web is built primarily for typical vision: dense paragraphs, low-contrast grey text, tight line spacing, and color-coded status badges that rely heavily on red/green distinctions. 

**ReadEase** acts as an adaptive reading layer that sits directly between you and any website. With a single click or keyboard shortcut, it restyles typography, colors, contrast, and layout into proven, accessible formats—without breaking site navigation or transmitting any personal data.

---

## Core Profiles & Presets

ReadEase comes equipped with three research-backed presets that activate instantly:

### 1. 📖 Dyslexia Mode
- **Readable Typography**: Employs Lexend or clean system sans-serif typefaces.
- **WCAG Spacing**: Expands letter spacing (`0.12em`), word spacing (`0.16em`), line height (`1.5`), and doubles paragraph spacing (`2em`).
- **Comfortable Line Length**: Constrains text columns to ~65 characters (`65ch`) to prevent visual tracking errors.
- **Cream Background**: Applies a soft, glare-reducing cream tint (`#fbf5e6`) with dark charcoal text.
- **Reading Ruler**: Overlays a mouse-following clear reading strip that shades text above and below to keep your place.

### 2. 🔍 Low Vision Mode
- **Text Scaling**: Boosts content scale to 1.25× (fine-tunable up to 2.0×).
- **High Contrast**: Heightens color separation and visual clarity.
- **Underlined Links**: Explicitly underlines hyperlinks so interactive text is never missed.
- **3px Focus Outlines**: Enforces thick, high-visibility focus borders for keyboard navigators.
- **Enlarged Cursor**: Swaps the mouse pointer to a high-visibility 32px cursor.

### 3. 🎨 Colorblind Mode (Daltonization)
- **Mathematical Color Shift**: Uses the Machado et al. (2009) physiologically-based color matrix to simulate loss and redistribute indistinguishable colors into perceivable channels.
- **Deficiency Coverage**:
  - **Protanopia** (Red-blind / Red-weak)
  - **Deuteranopia** (Green-blind / Green-weak)
  - **Tritanopia** (Blue-blind / Blue-weak)
- **Strength Slider**: Fine-tune the color correction intensity from 0% to 100%.

---

## How to Install

ReadEase requires **Google Chrome** (v116 or higher) and requires no build tools or package managers.

1. **Clone or Download** this repository to your local machine:
   ```bash
   git clone https://github.com/prateek-pandey/readease-extension.git
   ```
   *(or download the folder containing `manifest.json`)*
2. Open Google Chrome and navigate to:
   ```text
   chrome://extensions
   ```
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click the **Load unpacked** button in the top-left toolbar.
5. Select the project folder (`hci_project`).
6. Click the puzzle-piece icon in your browser toolbar and **pin** ReadEase for fast access.

---

## How to Use

### 1. One-Click Profile Activation
1. Navigate to any website (e.g., Wikipedia, news articles, or documentation).
2. Click the **ReadEase toolbar icon** to open the popup.
3. Click any of the three profile buttons: **Dyslexia**, **Low Vision**, or **Colorblind**.
4. The page restyles immediately. An active badge (`DYS`, `LV`, or `CB`) appears on the toolbar icon.

### 2. Fine-Tuning
Under the **Fine-tune** section of the popup, adjust any slider to customize your comfort:
- **Font**: Choose between Lexend, System UI, Serif, or Monospace.
- **Text Scale, Line Height, Letter Spacing, Word Spacing**: Sliders update the page in real time with live numeric indicators.
- **Max Width**: Adjust line column width or set to *None*.
- **Page Tint**: Choose between Default, Cream, Soft Blue, Soft Yellow, White, or Dark mode.
- **Reading Ruler**: Toggle the overlay on or off at any time.

### 3. Quick Actions
- **Pause on this site**: Click `Pause site` to exclude the current domain. ReadEase remembers your choice and leaves that site untouched while staying active on all other tabs.
- **Reset**: Restores the currently selected profile back to its calibrated defaults.
- **Turn Off**: Click the currently active profile button again to revert the page to its original state.

### 4. Keyboard Shortcut
- Press **`Alt + Shift + D`** anywhere in Chrome to toggle between your last-used profile and the default web view.
- To customize the shortcut, go to `chrome://extensions/shortcuts`.

---

## Architecture & Technical Design

ReadEase is built with **zero external dependencies** and uses clean web standards:

- **Manifest V3 Compliant**: Uses modern background service workers and declarative permissions (`storage`, `activeTab`).
- **Dynamic CSS Custom Properties**: Injects a single `<style>` element on `:root`. Adjusting sliders updates CSS variables (`--re-font`, `--re-lh`, `--re-bg`) instantaneously without recalculating the DOM tree.
- **Hardware-Accelerated Reading Ruler**: Uses `requestAnimationFrame` with `pointer-events: none` to follow mouse coordinates at a smooth 60 FPS without layout thrashing.
- **SVG `<feColorMatrix>` Daltonization**: Computes $4 \times 5$ color transformation matrices on the fly and applies them through CSS `filter: url(#readease-cb)`.
- **SPA Resilience**: A throttled `MutationObserver` ensures styles and overlays persist across client-side page updates (e.g., single-page web applications).
- **100% Private**: Runs entirely offline on your device; no user data, browsing history, or condition details are ever tracked or transmitted.
