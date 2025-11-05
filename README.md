# Website Scraper

A modern web scraping tool built with React, Mantine UI, and Puppeteer. This application provides a clean, user-friendly interface for scraping websites that allow scraping, with real-time notifications and data visualization.

## Features

- 🎨 **Modern UI** - Built with Mantine v8 components for a polished, responsive interface
- 🔍 **Web Scraping** - Server-side scraping using Puppeteer to bypass CORS restrictions
- 📊 **Data Display** - View extracted data including titles, headings, links, images, and schedule items
- 🔔 **Real-time Notifications** - Toast notifications for scraping status and errors
- 📋 **Copy to Clipboard** - Quickly copy all results with a single click
- 🌐 **Full-page Rendering** - Uses headless browser for JavaScript-heavy websites

## Tech Stack

### Frontend

- **React 19** - Modern React with hooks
- **Mantine UI v8** - Component library for UI elements
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tabler Icons** - Beautiful icon set

### Backend

- **Express** - Node.js web framework
- **Puppeteer** - Headless browser automation
- **Cheerio** - HTML parsing and manipulation
- **CORS** - Cross-origin resource sharing support

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Carcemercado/website-scraper.git
cd website-scraper
```

2. Install dependencies:

```bash
npm install
```

### Running the Application

1. Start the backend server:

```bash
npx ts-node server/index.ts
```

Or compile and run:

```bash
cd server
npx tsc index.ts
node index.js
```

2. In a separate terminal, start the frontend:

```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Enter a URL in the input field (e.g., `https://example.com`)
2. Click the "Scrape" button
3. Wait for the scraping process to complete
4. View the results including:
   - Page title
   - Headings
   - Number of links and images
   - Schedule items (if available)
5. Use the copy button to copy all results to clipboard

## API Endpoints

### POST `/api/scrape`

Scrapes a given URL and returns structured data.

**Request Body:**

```json
{
  "url": "https://example.com"
}
```

**Response:**

```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "headings": ["Example", "More Information"],
  "linksCount": 1,
  "imagesCount": 0,
  "scheduleItems": []
}
```

## Project Structure

```
website-scraper/
├── src/
│   ├── App.tsx          # Main React component
│   ├── main.tsx         # React entry point
│   └── theme.ts         # Mantine theme configuration
├── server/
│   ├── index.ts         # Express server with scraping logic
│   └── index.js         # Compiled JavaScript
├── public/              # Static assets
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── README.md           # This file
```

## Development

### Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run typecheck` - Run TypeScript type checking

### Server Development

The Express server runs on port 3000 and handles scraping requests using Puppeteer. It launches a headless Chrome instance to render JavaScript-heavy pages and extract data.

## Important Notes

⚠️ **Ethical Scraping**

- Only scrape websites that allow scraping
- Check robots.txt and terms of service
- Respect rate limits and don't overload servers
- Use responsibly and ethically

## License

This project is open source and available for educational purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Carlo Mercado ([@Carcemercado](https://github.com/Carcemercado))
