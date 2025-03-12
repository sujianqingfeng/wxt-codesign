# Codesign Screen Extractor

A Chrome extension that extracts screen data from Codesign projects.

## Features

- Extracts screen data from Codesign projects
- Shows screen previews by combining preview_path and cdn_host
- Directly fetches and displays meta data when clicking on a screen
- Cleans JSON data by removing empty fields
- Copy meta data JSON to clipboard
- Modern UI built with Tailwind CSS
- Simple and easy-to-use interface

## Installation

1. Clone this repository
2. Install dependencies with `pnpm install`
3. Build the extension with `pnpm build`
4. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/chrome-mv3` directory

## Development

- Run `pnpm dev` to start the development server
- The extension will be built to the `.output` directory

## Usage

1. Navigate to a Codesign project page (e.g., https://codesign.qq.com/app/design/507749266252061/board)
2. Click on the extension icon to open the popup
3. Click the "Sync Screens" button to fetch screen data
4. View the list of screens with previews and names
5. Click on a screen to directly fetch and view its meta data (screens with meta data are indicated)
6. View the cleaned JSON meta data with empty fields removed
7. Click "Copy Meta Data" to copy the meta data JSON to clipboard
8. Click "Back to List" to return to the screens list

## Data Structure

The screens data contains:
- ID
- Name
- Thumbnail URL
- Meta URL
- Preview URL (combined from cdn_host and preview_path)
- CDN Host
- Preview Path

## Image Handling

The extension handles screen previews by:
1. Using the full_preview_url if available
2. Falling back to thumbnail_url if full_preview_url is not available
3. Combining cdn_host and preview_path if neither of the above are available

## JSON Cleaning

The extension cleans JSON meta data by:
1. Removing null or undefined values
2. Removing empty strings
3. Removing empty arrays
4. Removing empty objects
5. Recursively cleaning nested objects and arrays

## Technologies Used

- WXT (Web Extension Tools)
- React
- TypeScript
- Tailwind CSS
- @webext-core/messaging for communication between extension components

## License

MIT


