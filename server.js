const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const statsFile = path.join(__dirname, "stats.json");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// -------------------------
// Statistics
// -------------------------

function loadStats() {
    try {
        if (!fs.existsSync(statsFile)) {
            const initial = {
                visitors: 0,
                processed: 0,
                visitorIds: []
            };

            fs.writeFileSync(statsFile, JSON.stringify(initial, null, 2));
            return initial;
        }

        return JSON.parse(fs.readFileSync(statsFile, "utf8"));
    } catch {
        return {
            visitors: 0,
            processed: 0,
            visitorIds: []
        };
    }
}

function saveStats(stats) {
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
}

// -------------------------
// Static website
// -------------------------

app.use(express.static(path.join(__dirname, "public")));

// -------------------------
// Visitor counter
// -------------------------

app.get("/api/stats", (req, res) => {

    const stats = loadStats();

    let visitorId = req.headers["x-visitor-id"];

    if (!visitorId) {
        visitorId = crypto.randomUUID();
    }

    if (!stats.visitorIds.includes(visitorId)) {
        stats.visitorIds.push(visitorId);
        stats.visitors++;
        saveStats(stats);
    }

    res.json({
        success: true,
        visitors: stats.visitors,
        processed: stats.processed,
        visitorId
    });
});

// -------------------------
// Health check
// -------------------------

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        app: "Tera Player",
        message: "Server is running"
    });
});

// -------------------------
// TeraBox Extraction
// -------------------------

app.post("/api/extract", async (req, res) => {

    try {

        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: "TeraBox URL is required"
            });
        }

        const apiKey = process.env.TERABOX_API_KEY;
        const apiSecret = process.env.TERABOX_API_SECRET;

        if (!apiKey || !apiSecret) {
            return res.status(500).json({
                success: false,
                message: "API credentials are not configured"
            });
        }

        const timestamp = Math.floor(Date.now() / 1000).toString();

        const requestBody = {
            url: url,
            dir_path: "",
            page: 1
        };

        const body = JSON.stringify(requestBody);

        // HMAC payload
        const signaturePayload =
            `POST/v1/api${timestamp}${body}`;

        const signature = crypto
            .createHmac("sha256", apiSecret)
            .update(signaturePayload)
            .digest("hex");

        const apiResponse = await fetch(
            "https://api.teraboxdl.site/v1/api",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": apiKey,
                    "X-Timestamp": timestamp,
                    "X-Signature": signature
                },

                body: body
            }
        );

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            return res.status(apiResponse.status).json({
                success: false,
                message: "TeraBox API request failed",
                data
            });
        }

        if (data.errno !== 0) {
            return res.status(400).json({
                success: false,
                message: "TeraBox could not process this link",
                data
            });
        }

        const file = data.list?.[0];

        if (!file) {
            return res.status(404).json({
                success: false,
                message: "No video found"
            });
        }

        // Count successfully processed URL
        const stats = loadStats();
        stats.processed++;
        saveStats(stats);

        res.json({
            success: true,

            video: {
                name: file.server_filename,
                size: file.formatted_size,
                duration: file.duration,
                quality: file.quality,

                thumbnail:
                    file.thumbs?.url3 ||
                    file.thumbs?.url2 ||
                    file.thumbs?.url1 ||
                    null,

                streamUrl: file.stream_url || null,
                directUrl: file.direct_link || null
            }
        });

    } catch (error) {

        console.error("Extraction error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// -------------------------
// Homepage
// -------------------------

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

// -------------------------
// Start
// -------------------------

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Tera Player server started on port ${PORT}`
    );
});