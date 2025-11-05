const express = require("express");
const cors = require("cors");
const { load } = require("cheerio");

const app = express();
app.use(express.json());
app.use(cors());

app.all("/api/scrape", async (req, res) => {
  const url = req.method === "GET" ? req.query.url : req.body && req.body.url;
  const target =
    url ||
    "https://info.monsterhunter.com/wilds/event-quest/en-uk/schedule?utc=-8";

  if (!target || typeof target !== "string") {
    return res.status(400).json({ error: "missing url" });
  }

  try {
    const fetched = await fetch(target, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: "https://info.monsterhunter.com/",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
      },
    });
    if (!fetched.ok)
      return res.status(502).json({ error: `fetch failed ${fetched.status}` });

    const html = await fetched.text();
    const $ = load(html);

    const title = $("title").text().trim();

    const headings = [];
    $("h1,h2,h3").each((i, el) => {
      if (headings.length >= 8) return;
      const t = $(el).text().trim();
      if (t) headings.push(t);
    });

    const linksSet = new Set();
    $("a[href]").each((i, el) => {
      if (linksSet.size >= 30) return;
      const href = $(el).attr("href")?.trim();
      if (href) linksSet.add(href);
    });
    const links = Array.from(linksSet);

    const imagesSet = new Set();
    $("img[src]").each((i, el) => {
      if (imagesSet.size >= 30) return;
      const s = $(el).attr("src")?.trim();
      if (s) imagesSet.add(s);
    });
    const images = Array.from(imagesSet);

    const scheduleItems = [];
    $("[class*='schedule'], [class*='event'], [class*='quest']").each(
      (i, el) => {
        if (scheduleItems.length >= 10) return;
        const txt = $(el).text().replace(/\s+/g, " ").trim();
        if (txt && txt.length > 10) scheduleItems.push(txt.slice(0, 400));
      }
    );

    if (scheduleItems.length === 0) {
      $("p").each((i, el) => {
        if (scheduleItems.length >= 6) return;
        const txt = $(el).text().replace(/\s+/g, " ").trim();
        if (txt && txt.length > 20) scheduleItems.push(txt.slice(0, 400));
      });
    }

    return res.json({
      url: target,
      title,
      headings,
      linksCount: links.length,
      imagesCount: images.length,
      links: links.slice(0, 30),
      images: images.slice(0, 30),
      scheduleItems,
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () =>
  console.log(`scraper API listening on http://localhost:${port}`)
);
