# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension built with WXT framework that extracts annotated data from Codesign design projects. The extension provides functionality to:

- Extract annotation data from selected layers in Codesign designs
- Connect to a WebSocket server (ws://localhost:3690) for real-time data communication
- Provide a popup interface for monitoring WebSocket connection status
- Inject custom buttons into the Codesign UI for data extraction

## Common Commands

### Development
```bash
# Start development server
npm run dev

# Start development server for Firefox
npm run dev:firefox

# Type check compilation
npm run compile
```

### Build
```bash
# Build for production
npm run build

# Build for Firefox
npm run build:firefox

# Create zip package
npm run zip

# Create zip package for Firefox
npm run zip:firefox
```

### Code Quality
```bash
# Lint and format code
npm run lint
npx biome check .

# Fix linting issues
npx biome check --write .
```

## Architecture

### Core Components

**Extension Structure:**
- `src/entrypoints/background.ts` - Background script with WebSocket connection management
- `src/entrypoints/content.ts` - Content script that injects UI into Codesign pages
- `src/entrypoints/popup/` - React popup for connection status monitoring
- `src/messages.ts` - Extension messaging protocol using @webext-core/messaging
- `src/utils.ts` - Utility functions for data extraction and UI interactions
- `src/constants.ts` - CSS styles and constants
- `src/types.ts` - TypeScript type definitions

**Key Features:**
- **WebSocket Connection**: Background script maintains persistent WebSocket connection to localhost:3690 with auto-reconnection and keep-alive mechanisms
- **Data Extraction**: Content script extracts annotation data from Codesign's internal API and DOM structure
- **UI Injection**: Dynamically adds "获取标注数据" (Get Annotation Data) and "复制 URL" (Copy URL) buttons to Codesign interface
- **Cross-Script Communication**: Uses @webext-core/messaging for reliable communication between background, content, and popup scripts

### Data Flow

1. **Content Script** monitors Codesign pages and injects custom buttons
2. **Background Script** maintains WebSocket connection and handles server requests
3. When server requests annotation data, background script queries content script via messaging
4. **Content Script** extracts data from Codesign's API and DOM, returns structured annotation data
5. **Background Script** forwards data to WebSocket server
6. **Popup** provides real-time connection status monitoring

### Technical Details

**WebSocket Connection Management:**
- Auto-reconnection on connection loss (5-second interval)
- Ping/pong mechanism for connection health (30-second intervals)
- Chrome alarms API for background script keep-alive
- Persistent background configuration to prevent suspension

**Data Extraction Process:**
- Parses design ID from URL pattern `/design/(\d+)`
- Extracts screen and layer information from DOM data attributes
- Fetches detailed annotation data from Codesign's meta API
- Builds hierarchical node tree with parent-child relationships
- Cleans and formats annotation data for transmission

**UI Integration:**
- MutationObserver-based DOM monitoring for dynamic UI injection
- Custom styled buttons with hover and active states
- Toast notifications for user feedback
- Responsive design with Tailwind CSS

## Development Notes

### File Organization
- Shared types are defined in `src/types.ts`
- Utility functions are in `src/utils.ts`
- Constants and styles are in `src/constants.ts`
- Extension messaging protocol is defined in `src/messages.ts`

### Browser Compatibility
- Primary target: Chrome (extensionApi: "chrome")
- Firefox support available via build commands
- Requires permissions: "tabs", "alarms"
- Host permissions: "*://codesign.qq.com/*"

### Code Style
- Uses Biome for linting and formatting
- TypeScript strict mode enabled
- Tab indentation with 2-space width
- 80-character line width limit
- No unused variables/imports (warned)

### Testing
- Extension can be tested in developer mode
- WebSocket server must be running on localhost:3690 for full functionality
- Test on actual Codesign design pages for data extraction features