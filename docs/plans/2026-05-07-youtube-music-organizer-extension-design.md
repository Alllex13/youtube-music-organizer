# YouTube Music Organizer Extension Design

## Overview
A professional Chrome Web Store extension that allows users to automatically organize their YouTube Music playlists by genre. The extension reads from a user-selected source playlist (defaulting to "Your Likes"), fetches genre information using YouTube Music's internal data, and creates new playlists categorized by genre, handling any missing data via a user-friendly queue.

## Architecture & User Interface
1. **Extension Popup UI:** 
   - A clean, professional popup interface built with HTML/Tailwind CSS.
   - Contains a dropdown to select the source playlist.
   - Contains the main "Organize by Genre" action button.
   - Displays a progress bar during the analysis and execution phases.
2. **Injected UI (Content Scripts):**
   - Injects custom UI elements directly into the YouTube Music DOM (`music.youtube.com`).
   - Adds "New Genre Playlist" buttons and manual selection options to allow users to manually manage songs alongside the automated process.
3. **Background Service Worker (MV3):**
   - Handles the heavy lifting of API orchestration.
   - Communicates with YouTube Music's internal endpoints to fetch playlist tracks, retrieve genre metadata, create playlists, and add tracks to playlists.
   - Manages state to prevent the YTM tab from freezing during large batch operations.

## Data Flow & Fallback Handling
1. **Source Selection:** User opens the popup and selects a source playlist from a dropdown (default: "Your Likes"). The dropdown is populated by fetching the user's playlists.
2. **Analysis Phase:** Upon clicking "Start", the background script fetches all tracks from the selected playlist and attempts to extract genre data using YTM's internal endpoints for each track.
3. **The "Uncategorized" Queue:** If the background script cannot determine a genre for certain songs, it pauses the automation.
4. **User Resolution:** The UI presents the user with a list of unknown songs. The user can use dropdowns to manually assign a genre, type a custom genre, or skip the song.
5. **Final Execution:** Once the queue is resolved, the extension bulk-creates the necessary genre playlists and moves/copies all processed songs into their respective newly created genre playlists.

## Technical Requirements
- **Manifest V3:** The extension will be built using Chrome Extension Manifest V3 standards to ensure Web Store compliance.
- **Zero-Config:** No third-party APIs (like Spotify) are used. All data is fetched natively from the active YouTube Music session, meaning the user does not need to input any API keys.
- **Permissions:** Will require permissions for `*://music.youtube.com/*` and potentially `storage` to save user preferences.
