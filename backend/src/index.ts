// src/index.ts
import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const QDRANT_URL = "http://localhost:6333";
const COLLECTION = "myanmar_cities";
// If your Qdrant uses API key, set environment variable QDRANT_API_KEY
const QDRANT_API_KEY = "my_secret_key ";

const qdrantHeaders = {
  "Content-Type": "application/json",
  ...(QDRANT_API_KEY ? { "api-key": QDRANT_API_KEY } : {}),
};

// 1) create collection
app.post("/create-collection", async (req, res) => {
  try {
    const body = {
      vectors: { size: 10, distance: "Cosine" },
    };

    const r = await axios.put(`${QDRANT_URL}/collections/${COLLECTION}`, body, {
      headers: qdrantHeaders,
    });

    res.json({ ok: true, data: r.data });
  } catch (err: any) {
    console.error(
      "create-collection error:",
      err.response?.data || err.message
    );
    res
      .status(500)
      .json({ ok: false, error: err.response?.data || err.message });
  }
});

// sample cities data (id, vector length 10, payload)
const SAMPLE_POINTS = [
  {
    id: 1,
    vector: [0.31, 0.12, 0.13, 0.45, 0.22, 0.11, 0.41, 0.51, 0.23, 0.17],
    payload: {
      city: "Yangon",
      region: "Yangon",
      description:
        "Yangon is Myanmar's most populous city and its most important commercial centre.",
    },
  },
  {
    id: 2,
    vector: [0.11, 0.42, 0.33, 0.18, 0.65, 0.21, 0.31, 0.29, 0.1, 0.5],
    payload: {
      city: "Mandalay",
      region: "Mandalay",
      description:
        "Mandalay is the cultural and religious centre of Myanmar, with many historic sites.",
    },
  },
  {
    id: 3,
    vector: [0.21, 0.22, 0.73, 0.12, 0.15, 0.47, 0.09, 0.34, 0.6, 0.19],
    payload: {
      city: "Naypyitaw",
      region: "Union",
      description:
        "Naypyidaw is the capital city of Myanmar, known for its wide roads and government buildings.",
    },
  },
  {
    id: 4,
    vector: [0.05, 0.09, 0.42, 0.66, 0.12, 0.38, 0.27, 0.44, 0.21, 0.31],
    payload: {
      city: "Bago",
      region: "Bago",
      description:
        "Bago is a historic city with many pagodas and rich Mon heritage.",
    },
  },
  {
    id: 5,
    vector: [0.71, 0.12, 0.21, 0.05, 0.32, 0.29, 0.18, 0.55, 0.11, 0.07],
    payload: {
      city: "Taunggyi",
      region: "Shan",
      description:
        "Taunggyi is the capital of Shan State, known for its annual balloon festival and cool climate.",
    },
  },
  {
    id: 6,
    vector: [0.25, 0.14, 0.35, 0.48, 0.39, 0.16, 0.24, 0.3, 0.41, 0.2],
    payload: {
      city: "Mawlamyine",
      region: "Mon",
      description:
        "Mawlamyine is the capital of Mon State, famous for its colonial architecture and riverfront.",
    },
  },
  {
    id: 7,
    vector: [0.18, 0.28, 0.32, 0.22, 0.45, 0.52, 0.11, 0.13, 0.27, 0.33],
    payload: {
      city: "Sittwe",
      region: "Rakhine",
      description:
        "Sittwe is a port city in Rakhine State, located at the confluence of the Kaladan and Mayu rivers.",
    },
  },
  {
    id: 8,
    vector: [0.09, 0.31, 0.29, 0.37, 0.26, 0.14, 0.4, 0.49, 0.15, 0.23],
    payload: {
      city: "Pathein",
      region: "Ayeyarwady",
      description:
        "Pathein is a major city in the Ayeyarwady region, known for its traditional umbrellas and rice production.",
    },
  },
  {
    id: 9,
    vector: [0.39, 0.1, 0.28, 0.16, 0.55, 0.24, 0.12, 0.08, 0.34, 0.44],
    payload: {
      city: "Kengtung",
      region: "Shan",
      description:
        "Kengtung is a scenic town in eastern Shan State, known for its ethnic diversity and traditional festivals.",
    },
  },
  {
    id: 10,
    vector: [0.13, 0.27, 0.19, 0.33, 0.21, 0.4, 0.36, 0.26, 0.3, 0.12],
    payload: {
      city: "Hpa-An",
      region: "Kayin",
      description:
        "Hpa-An is the capital of Kayin State, famous for its limestone mountains and caves.",
    },
  },
];

// 2) upsert (insert) sample points
app.post("/insert", async (req, res) => {
  try {
    // Upsert endpoint (PUT)
    const body = {
      points: SAMPLE_POINTS.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
    };

    const r = await axios.put(
      `${QDRANT_URL}/collections/${COLLECTION}/points`,
      body,
      { headers: qdrantHeaders }
    );

    res.json({ ok: true, upsert: r.data });
  } catch (err: any) {
    console.error("insert error:", err.response?.data || err.message);
    res
      .status(500)
      .json({ ok: false, error: err.response?.data || err.message });
  }
});

// 3) search endpoint — expects body: { vector: number[], top: number }
app.post("/search", async (req, res) => {
  try {
    const queryVector: number[] = req.body.vector;
    const top = req.body.top || 5;

    if (!Array.isArray(queryVector)) {
      return res
        .status(400)
        .json({ ok: false, error: "body.vector must be an array of numbers" });
    }

    const body = {
      vector: queryVector,
      top: top,
    };

    // Qdrant search endpoint
    const r = await axios.post(
      `${QDRANT_URL}/collections/${COLLECTION}/points/search`,
      body,
      { headers: qdrantHeaders }
    );

    // r.data will contain "result" array with (id, payload, score) possibly
    res.json({ ok: true, result: r.data.result || r.data });
  } catch (err: any) {
    console.error("search error:", err.response?.data || err.message);
    res
      .status(500)
      .json({ ok: false, error: err.response?.data || err.message });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}...`);
});
