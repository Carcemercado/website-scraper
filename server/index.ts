import express from "express";
import cors from "cors";
import { load } from "cheerio";
import type { Browser } from "puppeteer";
import puppeteer from "puppeteer";

// Keep a single browser instance
let browser: Browser | null = null;

const app = express();
app.use(express.json());
app.use(cors());

// Simple scraper endpoint. Accepts POST { url } or GET /api/scrape?url=...
app.all("/api/scrape", async (req, res) => {
  const url = (req.method === "GET" ? req.query.url : (req.body && req.body.url)) as string;
  const target = url || "https://en.wikipedia.org/wiki/Monster_Hunter_Wilds";

  if (!target || typeof target !== "string") {
    return res.status(400).json({ error: "missing url" });
  }

  try {
    console.log(`[${new Date().toISOString()}] Starting request to ${target}`);
    
    // Launch browser if not already running
    if (!browser) {
      console.log(`[${new Date().toISOString()}] Launching browser...`);
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--window-size=1920,1080',
          '--proxy-server=proxy-server.crawlera.com:8010', // Use a proxy
          '--ignore-certificate-errors',
          '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', // Try mobile user agent
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process'
        ],
        defaultViewport: {
          width: 1920,
          height: 1080
        },
        timeout: 60000
      });
    }

    // Create new page
    const page = await browser.newPage();
    
    try {
      // Configure the page
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-us',
        'Accept-Encoding': 'gzip, deflate, br',
        'X-Crawlera-Cookies': 'disable',
        'Proxy-Authorization': `Basic ${Buffer.from('your-api-key:').toString('base64')}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });
      
      // Enable JavaScript
      await page.setJavaScriptEnabled(true);
      
      // Log all console messages from the page
      page.on('console', msg => console.log('Browser console:', msg.text()));
      
      // Log network errors
      page.on('requestfailed', request => {
        console.log(`Request failed: ${request.url()}`);
        console.log(`Error: ${request.failure()?.errorText}`);
      });

      // Set a more permissive Content Security Policy
      await page.setBypassCSP(true);

      // Try to emulate an iPhone
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
      await page.setViewport({
        width: 375,
        height: 812,
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3
      });

      // Navigate to the page
      console.log(`[${new Date().toISOString()}] Navigating to page...`);
      try {
        const response = await page.goto(target, { 
          waitUntil: 'networkidle0',
          timeout: 60000
        });
        
        if (response) {
          console.log(`Response status: ${response.status()}`);
          if (!response.ok()) {
            throw new Error(`HTTP ${response.status()} - ${response.statusText()}`);
          }
        } else {
          throw new Error('No response received');
        }
      } catch (error) {
        console.error('Navigation error:', error);
        throw error;
      }
      
      // Wait for some dynamic content to load
      console.log(`[${new Date().toISOString()}] Waiting for content to stabilize...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Give extra time for dynamic content

      // Wait for content to load
      await page.waitForSelector('body', { timeout: 5000 });
      
      console.log(`[${new Date().toISOString()}] Page loaded, extracting content...`);
      const html = await page.content();
      console.log(`[${new Date().toISOString()}] Received HTML content length: ${html.length}`);
    const $ = load(html);

    const title = $("title").text().trim();

    // collect first several headings (h1-h3)
    const headings = [] as string[];
    $("h1,h2,h3").each((i: number, el: any) => {
      if (headings.length >= 8) return;
      const t = $(el).text().trim();
      if (t) headings.push(t);
    });

    // gather link hrefs (unique) up to 30
    const linksSet = new Set<string>();
    $("a[href]").each((i: number, el: any) => {
      if (linksSet.size >= 30) return;
      const href = $(el).attr("href")?.trim();
      if (href) linksSet.add(href);
    });
    const links = Array.from(linksSet);

    // image sources
    const imagesSet = new Set<string>();
    $("img[src]").each((i: number, el: any) => {
      if (imagesSet.size >= 30) return;
      const s = $(el).attr("src")?.trim();
      if (s) imagesSet.add(s);
    });
    const images = Array.from(imagesSet);

    // try to extract any schedule rows or items heuristically
    const scheduleItems: string[] = [];
    // common patterns: classes containing 'schedule' or 'event' or 'quest'
    $("[class*='schedule'], [class*='event'], [class*='quest']").each((i: number, el: any) => {
      if (scheduleItems.length >= 10) return;
      const txt = $(el).text().replace(/\s+/g, " ").trim();
      if (txt && txt.length > 10) scheduleItems.push(txt.slice(0, 400));
    });

    // fallback: first several paragraph texts
    if (scheduleItems.length === 0) {
      $("p").each((i: number, el: any) => {
        if (scheduleItems.length >= 6) return;
        const txt = $(el).text().replace(/\s+/g, " ").trim();
        if (txt && txt.length > 20) scheduleItems.push(txt.slice(0, 400));
      });
    }

    return res.json({ url: target, title, headings, linksCount: links.length, imagesCount: images.length, links: links.slice(0, 30), images: images.slice(0, 30), scheduleItems });
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error:`, err);
      return res.status(500).json({ 
        error: "Error during scraping",
        details: err instanceof Error ? err.message : String(err)
      });
    } finally {
      // Always close the page to free up resources
      await page.close().catch(console.error);
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Fatal error:`, err);
    // Try to clean up the browser on fatal error
    if (browser) {
      await browser.close().catch(console.error);
      browser = null;
    }
    return res.status(500).json({ 
      error: "Fatal error during scraping",
      details: err instanceof Error ? err.message : String(err)
    });
  }
});const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const server = app.listen(port, () => console.log(`scraper API listening on http://localhost:${port}`));

// Clean up browser on server shutdown
process.on('SIGINT', async () => {
  if (browser) {
    console.log('Closing browser...');
    await browser.close();
  }
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});
