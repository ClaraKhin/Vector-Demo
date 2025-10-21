import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const QDRANT_URL = "http://localhost:6333"; // Qdrant container port
const COLLECTION_NAME = "myanmar_cities";

// Sample 10 cities with 10-dim vectors
const cities = [
  {
    id: 1,
    vector: [0.2, 0.3, 0.5, 0.7, 0.1, 0.2, 0.8, 0.6, 0.9, 0.4],
    payload: { city: "Yangon", region: "Yangon" },
    description:
      "Yangon is Myanmar's most populous city and its most important commercial centre.",
  },
  {
    id: 2,
    vector: [0.5, 0.2, 0.7, 0.3, 0.4, 0.9, 0.1, 0.5, 0.6, 0.8],
    payload: { city: "Mandalay", region: "Mandalay" },
    description:
      "Mandalay is the cultural and religious centre of Myanmar, with many historic sites.",
  },
  {
    id: 3,
    vector: [0.3, 0.6, 0.4, 0.8, 0.2, 0.1, 0.5, 0.7, 0.3, 0.6],
    payload: { city: "Naypyidaw", region: "Naypyidaw" },
    description:
      "Naypyidaw is the capital city of Myanmar, known for its wide roads and government buildings.",
  },
  {
    id: 4,
    vector: [0.6, 0.1, 0.3, 0.9, 0.7, 0.2, 0.4, 0.5, 0.8, 0.2],
    payload: { city: "Bago", region: "Bago" },
    description:
      "Bago is a historic city with many pagodas and rich Mon heritage.",
  },
  {
    id: 5,
    vector: [0.7, 0.2, 0.5, 0.4, 0.3, 0.6, 0.9, 0.1, 0.2, 0.5],
    payload: { city: "Pathein", region: "Ayeyarwady" },
    description:
      "Pathein is a major city in the Ayeyarwady region, known for its traditional umbrellas and rice production.",
  },
  {
    id: 6,
    vector: [0.1, 0.4, 0.6, 0.2, 0.5, 0.8, 0.3, 0.7, 0.9, 0.1],
    payload: { city: "Mawlamyine", region: "Mon" },
    description:
      "Mawlamyine is the capital of Mon State, famous for its colonial architecture and riverfront.",
  },
  {
    id: 7,
    vector: [0.2, 0.5, 0.7, 0.1, 0.3, 0.4, 0.8, 0.6, 0.2, 0.9],
    payload: { city: "Taunggyi", region: "Shan" },
    description:
      "Taunggyi is the capital of Shan State, known for its annual balloon festival and cool climate.",
  },
  {
    id: 8,
    vector: [0.3, 0.7, 0.2, 0.5, 0.6, 0.1, 0.4, 0.8, 0.9, 0.3],
    payload: { city: "Sittwe", region: "Rakhine" },
    description:
      "Sittwe is a port city in Rakhine State, located at the confluence of the Kaladan and Mayu rivers.",
  },
  {
    id: 9,
    vector: [0.4, 0.1, 0.8, 0.2, 0.7, 0.5, 0.3, 0.6, 0.4, 0.8],
    payload: { city: "Hpa-An", region: "Kayin" },
    description:
      "Hpa-An is the capital of Kayin State, famous for its limestone mountains and caves.",
  },
  {
    id: 10,
    vector: [0.5, 0.3, 0.1, 0.6, 0.8, 0.2, 0.7, 0.4, 0.5, 0.6],
    payload: { city: "Kengtung", region: "Shan" },
    description:
      "Kengtung is a scenic town in eastern Shan State, known for its ethnic diversity and traditional festivals.",
  },
];

// Endpoint to insert points
app.post("/insert", async (req, res) => {
  try {
    // Create collection
    await axios
      .put(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
        vectors: { size: 10, distance: "Dot" },
      })
      .catch(() => {}); // ignore if exists

    // Insert points
    await axios.put(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points`, {
      points: cities,
    });

    res.json({ success: true, message: "Cities inserted!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err });
  }
});

// Endpoint to search nearest cities
app.post("/search", async (req, res) => {
  const queryVector = req.body.vector;
  try {
    const response = await axios.post(
      `${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`,
      {
        vector: queryVector,
        limit: 5,
        with_payload: true,
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ success: false, error: err });
  }
});

app.listen(4000, () => console.log("Backend running on port 4000..."));
