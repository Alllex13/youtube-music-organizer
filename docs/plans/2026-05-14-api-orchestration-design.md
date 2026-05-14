# YouTube Music Organizer - API Orchestration Design

## Overview
This document outlines the architecture and data flow for the extension's core functionality: interacting invisibly with YouTube Music's internal APIs to fetch songs, extract genres, and create/populate playlists without disrupting the user's browsing experience.

## Section 1: API Authorization & Token Extraction
To authenticate requests against the `youtubei/v1/...` endpoints, the extension needs the user's active session tokens.

1. **Content Script Bridge:** When the user initiates the organization process via the popup, the Background Service Worker sends a message to the Content Script running on `music.youtube.com`.
2. **Extraction:** The Content Script parses the page's HTML `<script>` tags to locate the global `ytcfg` object. It extracts the `INNERTUBE_API_KEY`, `CLIENT_VERSION`, and `SAPISID` hash.
3. **Hand-off:** These credentials are sent back to the Service Worker.
4. **Service Worker Configuration:** The Service Worker configures a base `fetch` client that automatically attaches these authentication headers to all subsequent requests.

## Section 2: Playlist Fetching & Genre Extraction
Once authenticated, the extension processes the selected source playlist.

1. **Fetch Playlist Content:** The Service Worker calls the `browse` endpoint with the source playlist ID. It automatically handles continuation tokens to paginate through and retrieve the complete list of tracks.
2. **Batched Genre Fetching:** Because the `browse` endpoint often omits genre metadata, the Service Worker hits the `next` endpoint (the player endpoint) for each video ID to extract the "Info" panel metadata. To optimize speed and avoid rate-limiting, these requests are executed in small, concurrent batches (e.g., 5 requests at a time).
3. **The Uncategorized Queue:** Tracks that fail or lack genre data in YouTube's backend are placed into a "Pending" array.
4. **Live Progress:** The Service Worker continuously dispatches `UPDATE_PROGRESS` messages to the Popup UI to provide real-time feedback to the user.

## Section 3: Playlist Creation and Track Routing
The final execution phase organizes the processed tracks into their respective destination playlists.

1. **Genre Grouping:** The Service Worker groups all successfully processed track IDs by their assigned genres.
2. **Playlist Verification & Creation:** The extension fetches the user's existing library of playlists.
   - If a playlist named "Genre: [Name]" exists, its ID is used.
   - If it does not exist, the Service Worker calls the `playlist/create` endpoint to generate it and captures the new ID.
3. **Bulk Track Addition:** For each genre group, the Service Worker uses the `browse/edit_playlist` endpoint to bulk-add the array of video IDs into the corresponding playlist in a single network request.
4. **Completion:** An `ORGANIZATION_COMPLETE` message is sent to the Popup UI, which displays a summary report of the operation (e.g., total songs organized, playlists created).
