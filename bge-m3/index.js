import express from "express";
import cors from "cors";
import axios from "axios";
import { QdrantClient } from "@qdrant/qdrant-js";

const app = express();
app.use(cors());
app.use(express.json());

const COLLECTION = "international-foods";
const VECTOR_SIZE = 1024;
const DISTANCE = "Cosine";
const QDRANT_URL = "http://localhost:6333";
const EMBED_URL = "http://localhost:11434/api/embeddings";

const qdrant = new QdrantClient({ url: QDRANT_URL });

// --- Ollama embedder ---
async function embedder(text) {
    try {
        const resp = await axios.post(
            EMBED_URL,
            { model: "bge-m3", prompt: text },
            { headers: { "Content-Type": "application/json" }, timeout: 60_000 }
        );

        let vec = resp.data?.embedding || undefined;

        if (!vec || vec.length === 0) {
            console.warn("Empty embedding, using zero vector fallback");
            vec = new Array(VECTOR_SIZE).fill(0);
        }

        if (vec.length > VECTOR_SIZE) vec = vec.slice(0, VECTOR_SIZE);
        if (vec.length < VECTOR_SIZE) vec = vec.concat(new Array(VECTOR_SIZE - vec.length).fill(0));

        return vec;
    } catch (err) {
        console.error("Embedding failed:", err.message);
        return new Array(VECTOR_SIZE).fill(0);
    }
}

// --- Create new collection ---
async function createInternationalFoodsCollection() {
    try {

        const collections = await qdrant.getCollections();
        const exists = collections.collections.find(c => c.name === COLLECTION);

        if (exists) {
            console.log("Collection already exists, deleting...");
            await qdrant.deleteCollection(COLLECTION);
        }

        console.log("Creating international-foods collection...");
        await qdrant.createCollection(COLLECTION, {
            vectors: { size: VECTOR_SIZE, distance: DISTANCE, on_disk: true, on_disk_payload: true },
        });
        console.log("Collection created ✅");
        return true;
    } catch (error) {
        console.error("Collection creation failed:", error);
        return false;
    }
}

// --- Insert sample food data ---
async function insertSampleFoodData() {
    const foods = [
        {
            id: 1,
            food: "Sushi",
            country: "Japan",
            description: "Sushi သည် popular ဖြစ်သောဂျပန်အမျိုးအစားအစားအစာတစ်မျိုးဖြစ်သည်။ Sushi ၏ မူလအစသည် ငါးကို ထမင်းဖြင့်သိမ်းဆည်းထားသော Southeast Asia ရဲ့ fermented နည်းမှ စတင်ခဲ့သည်။"
        },
        {
            id: 2,
            food: "Pizza",
            country: "Italy",
            description: "Pizza သည် Italy ၏ မူရင်းအစားအစာဖြစ်ပြီး flattened dough ကို tomato sauce, cheese, vegetables, meat များဖြင့် topping ထားသည်။"
        },
        {
            id: 3,
            food: "Tacos",
            country: "Mexico",
            description: "Taco သည် Mexico ၏ handheld street food ဖြစ်ပြီး corn သို့မဟုတ် flour tortilla နှင့် meat, beans, salsa များဖြင့် ပြုလုပ်တတ်သည်။"
        },
        {
            id: 4,
            food: "Plov",
            country: "Uzbekistan",
            description: "Plov သည် Uzbekistan ရဲ့ နာမည်ကြီးအစားအစာဖြစ်ပြီး, rice, meat, carrots, onions, garlic နှင့် စပါးအနံ့အမျိုးမျိုးဖြင့် ပြုလုပ်ထားသော traditional dish ဖြစ်သည်။"
        },
        {
            id: 5,
            food: "Pelmeni",
            country: "Russia",
            description: "Pelmeni သည် Russia ၏ traditional dumpling dish တစ်မျိုးဖြစ်ပြီး, thin dough wrapper ထဲတွင် minced meat, onion, garlic, pepper, salt စသဖြင့် ထည့်ပြီး ထုပ်ထားသည်။"
        },
        {
            id: 6,
            food: "Peking Duck",
            country: "China",
            description: "Peking Duck သည် China ၏ Beijing မူရင်းအစားအစာဖြစ်ပြီး, crispy roasted duck ကို အဓိကအဖြစ်ပြုလုပ်ထားသော traditional royal dish ဖြစ်သည်။"
        },
        {
            id: 7,
            food: "Bibimbap",
            country: "Korea",
            description: "Bibimbap သည် Korea ၏ traditional mixed rice dish တစ်မျိုးဖြစ်ပြီး, warm rice bowl ပေါ်တွင် seasoned vegetables, sliced meat, fried egg, နှင့် gochujang တို့ကို ထပ်တင်ထားသည်။"
        },
        {
            id: 8,
            food: "Sauerbraten",
            country: "German",
            description: "Sauerbraten သည် Germany ၏ traditional pot roast dish တစ်မျိုးဖြစ်ပြီး, beef ကို vinegar, water, onions, peppercorns, bay leaves စတဲ့ အမွှေးအကြိုင်များဖြင့် marinate လုပ်ထားပြီး slow-cooked လုပ်ထားသည်။"
        },
        {
            id: 9,
            food: "Pot-au-feu",
            country: "French",
            description: "Pot-au-feu သည် France ၏ classic traditional stew ဖြစ်ပြီး, beef, vegetables တို့ကို slowly simmered in broth လုပ်ထားသော အနံ့အရသာပြည့်ဝတဲ့ dish ဖြစ်သည်။"
        },
        {
            id: 10,
            food: "Stamppot",
            country: "Netherland",
            description: "Stamppot သည် Netherlands ၏ traditional comfort food တစ်မျိုးဖြစ်ပြီး, mashed potatoes နှင့် vegetables တို့ကို ပေါင်းဖျက်ထားသော hearty winter dish ဖြစ်သည်။"
        }
    ];

    console.log("Generating embeddings and inserting food data...");

    for (const food of foods) {
        try {

            const vector = await embedder(food.description);


            await qdrant.upsert(COLLECTION, {
                wait: true,
                points: [{
                    id: food.id,
                    vector: vector,
                    payload: {
                        food: food.food,
                        country: food.country,
                        description: food.description
                    }
                }]
            });

            console.log(`Inserted ${food.food} from ${food.country} ✅`);

        } catch (error) {
            console.error(`Failed to insert ${food.food}:`, error.message);
        }
    }

    console.log("All sample food data inserted ✅");
}


async function insertMassiveData(targetSizeMB = 10) {
    console.log(`Starting massive data insertion target: ${targetSizeMB}MB`);

    const baseFoods = [
        { food: "Sushi", country: "Japan" },
        { food: "Pizza", country: "Italy" },
        { food: "Taco", country: "Mexico" },
        { food: "Curry", country: "India" },
        { food: "Paella", country: "Spain" }
    ];

    let totalPoints = 0;
    let estimatedSize = 0;
    const pointsPerMB = 500; // Approximation

    const targetPoints = targetSizeMB * pointsPerMB;
    const BATCH_SIZE = 100;

    let batch = [];
    let pointId = 1000;

    while (estimatedSize < targetSizeMB * 1024 * 1024 && totalPoints < targetPoints * 2) {
        for (let i = 0; i < BATCH_SIZE; i++) {
            const baseFood = baseFoods[Math.floor(Math.random() * baseFoods.length)];
            const description = `${baseFood.food} from ${baseFood.country} - variant ${i} with unique ingredients and cooking style`;

            batch.push({
                id: pointId++,
                vector: new Array(VECTOR_SIZE).fill(0).map(() => Math.random() - 0.5),
                payload: {
                    food: `${baseFood.food}_${totalPoints + i}`,
                    country: baseFood.country,
                    description: description,
                    batch: Math.floor(totalPoints / BATCH_SIZE)
                }
            });
        }

        try {
            await qdrant.upsert(COLLECTION, {
                wait: false,
                points: batch
            });

            totalPoints += batch.length;
            estimatedSize += batch.length * (VECTOR_SIZE * 4 + 200);

            console.log(`Batch inserted: ${totalPoints} points, estimated: ${(estimatedSize / (1024 * 1024)).toFixed(2)}MB`);

            // Progress every 10%
            if (totalPoints % Math.floor(targetPoints / 10) === 0) {
                const progress = (estimatedSize / (targetSizeMB * 1024 * 1024)) * 100;
                console.log(`Progress: ${progress.toFixed(1)}%`);
            }

        } catch (error) {
            console.error("Batch insert failed:", error.message);
        }

        batch = [];

        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Massive data insertion completed: ${totalPoints} points, ~${(estimatedSize / (1024 * 1024)).toFixed(2)}MB`);
    return { totalPoints, estimatedSize: estimatedSize / (1024 * 1024) };
}

// --- Backup with timeout testing ---
async function backupCollectionWithTimeout(timeoutMs = 30000) {
    console.log(`Starting backup with timeout: ${timeoutMs}ms`);

    try {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Backup timeout after ${timeoutMs}ms`)), timeoutMs)
        );

        const backupPromise = axios.post(
            `${QDRANT_URL}/collections/${COLLECTION}/snapshots?wait=true`
        );

        const result = await Promise.race([backupPromise, timeoutPromise]);
        console.log("Backup completed successfully ✅", result.data);
        return { success: true, snapshot: result.data };

    } catch (error) {
        console.error("Backup failed:", error.message);
        return { success: false, error: error.message };
    }
}

// --- Routes ---

// Setup new collection with sample data
app.post("/setup-international-foods", async (req, res) => {
    try {
        await createInternationalFoodsCollection();
        await insertSampleFoodData();
        res.json({
            success: true,
            message: "International foods collection created with sample data!"
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Semantic search
app.get("/search-semantic", async (req, res) => {
    try {
        const query = req.query.q || "Japanese food";
        const limit = parseInt(req.query.limit) || 5;

        const vector = await embedder(query);

        const result = await qdrant.search(COLLECTION, {
            vector: vector,
            limit: limit,
            with_payload: true,
            with_vector: false
        });

        res.json({
            success: true,
            query: query,
            results: result
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Points search (filter based)
app.get("/search-points", async (req, res) => {
    try {
        const country = req.query.country;
        const food = req.query.food;
        const limit = parseInt(req.query.limit) || 10;

        let filter = {};

        if (country) {
            filter.must = [{ key: "country", match: { value: country } }];
        }

        if (food) {
            if (!filter.must) filter.must = [];
            filter.must.push({ key: "food", match: { value: food } });
        }

        const searchParams = {
            limit: limit,
            with_payload: true,
            with_vector: false
        };

        if (Object.keys(filter).length > 0) {
            searchParams.filter = filter;
        }

        // Use scroll for filtered searches
        const result = await qdrant.scroll(COLLECTION, searchParams);

        res.json({
            success: true,
            filter: { country, food },
            results: result.points
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- Keyword search ---
app.get("/search-keyword", async (req, res) => {
    try {
        const keyword = req.query.q;
        const field = req.query.field || "description"; // default: description field မှာရှာ
        const limit = parseInt(req.query.limit) || 10;

        if (!keyword) {
            return res.status(400).json({
                success: false,
                error: "Keyword query (q) is required"
            });
        }

        // Filter သုံးပြီး keyword search လုပ်မယ်
        const result = await qdrant.scroll(COLLECTION, {
            limit: limit,
            with_payload: true,
            with_vector: false,
            filter: {
                must: [
                    {
                        key: field,
                        match: {
                            text: keyword
                        }
                    }
                ]
            }
        });

        res.json({
            success: true,
            query: keyword,
            field: field,
            results: result.points
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Massive data insertion endpoint
app.post("/insert-massive-data", async (req, res) => {
    try {
        const targetSizeMB = parseInt(req.body.size) || 10;

        if (targetSizeMB > 10000) { // 10GB
            return res.status(400).json({
                success: false,
                error: "Size too large. Maximum 10GB for testing."
            });
        }

        const result = await insertMassiveData(targetSizeMB);
        res.json({
            success: true,
            message: `Massive data insertion completed`,
            stats: result
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Backup testing endpoint
app.post("/backup-test", async (req, res) => {
    try {
        const timeoutMs = parseInt(req.body.timeout) || 30000;
        const result = await backupCollectionWithTimeout(timeoutMs);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get collection info
app.get("/collection-info", async (req, res) => {
    try {
        const info = await qdrant.getCollection(COLLECTION);
        res.json({ success: true, collection: info });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3000, () => {
    console.log("International Foods Server running on http://localhost:3000...");
});