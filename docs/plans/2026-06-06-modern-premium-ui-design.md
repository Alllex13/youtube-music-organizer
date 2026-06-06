# Design: Modern Premium UI/UX for YouTube Music Auto Organizer

## Overview
This document specifies the design for a premium dark-themed, single-page application (SPA) popup interface for the YouTube Music Auto Organizer browser extension. It outlines the visual style, layout structure, state transitions, and background messaging logic.

---

## 1. Visual Styles & Theme

### Theme Palette
*   **Background**: Deep obsidian black (`#080808` to `#0d0d0d`).
*   **Panels/Cards**: Frosted glassmorphism using semi-transparent dark gray with backdrop filter (`rgba(28, 28, 28, 0.65)`).
*   **Primary/Action Accent**: Linear gradient from native YouTube Music red to deep crimson (`linear-gradient(135deg, #FF0000 0%, #B30000 100%)`).
*   **Secondary/Text Accent**: Pastel crimson (`#FF4D4D`) and soft warm gray (`#A0A0A0`) for metadata.
*   **Borders & Shadows**: Ultra-thin borders (`rgba(255, 255, 255, 0.08)`) with a soft red glow shadow to create depth.

### Typography
*   **Google Font**: `Outfit`
    ```css
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&display=swap');
    ```
*   Headers use semi-bold `Outfit` (`font-weight: 600` or `700`).
*   Body text and options use clean, readable regular weights.

---

## 2. Card Layouts & Dynamic Transitions

### HTML Structure
The popup HTML uses a single-viewport wrapper. Different stages of the workflow are separated into `<section>` blocks (cards), with only one marked as active:
*   **Card 1 (Setup)**: Dropdown to choose the source playlist, toggle for background auto-sync, and the main CTA "Organize by Genre" button.
*   **Card 2 (Duplicates)**: An interactive list of duplicate tracks grouped by similarity. Checkboxes allow the user to select which version to delete.
*   **Card 3 (Processing)**: A sleek loader containing status text (e.g., "Scanning playlist...") and a dynamic gradient progress bar.
*   **Card 4 (Uncategorized)**: Lists tracks whose genres could not be resolved, allowing the user to type in a genre or pick one.
*   **Card 5 (Report)**: A success screen displaying stats (tracks organized, playlists created, duplicates deleted) and a button to return home.

### CSS Transitions
*   Each card is absolutely positioned inside `.popup-viewport` to allow smooth slide-out / slide-in animations.
*   Transitions utilize cubic-bezier curves for premium micro-interactions:
    ```css
    .card {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
      opacity: 0;
      pointer-events: none;
    }
    
    .card.active {
      transform: translateX(0);
      opacity: 1;
      pointer-events: auto;
    }
    
    .card.slide-out-left {
      transform: translateX(-100%);
      opacity: 0;
      pointer-events: none;
    }
    
    .card.slide-in-right {
      transform: translateX(100%);
      opacity: 0;
      pointer-events: none;
    }
    ```

---

## 3. JavaScript State Management & DOM Updates

*   `popup.js` tracks the active state and updates class names to trigger slide transitions.
*   Scrollable containers for duplicates and uncategorized tracks will use custom-styled thin scrollbars (`::-webkit-scrollbar` with a red thumb) to ensure the popup layout does not overflow or expand past Chrome window boundaries.
*   On load, `popup.js` queries `background.js` to retrieve the extension's current state. If the extension is already processing, the popup restores its active card state (e.g., progress bar or manual input list) to prevent losing context if the user clicks away from the popup.
