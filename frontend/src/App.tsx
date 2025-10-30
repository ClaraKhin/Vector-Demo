import { useState } from "react";
import axios from "axios";

function App() {
  const [searchType, setSearchType] = useState("semantic"); // semantic, keyword, point
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [food, setFood] = useState("");
  const [field, setField] = useState("description");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      let res;

      if (searchType === "semantic") {
        // Semantic search - vector similarity
        res = await axios.get(
          `http://localhost:3000/search-semantic?q=${encodeURIComponent(
            query
          )}&limit=10`
        );
        setResults(res.data.results || []);
      } else if (searchType === "keyword") {
        // Keyword search - text matching
        res = await axios.get(
          `http://localhost:3000/search-keyword?q=${encodeURIComponent(
            query
          )}&field=${field}&limit=10`
        );
        setResults(res.data.results || []);
      }
      // else if (searchType === "point") {
      //   // Point search - filter based
      //   const params = new URLSearchParams();
      //   if (country) params.append("country", country);
      //   if (food) params.append("food", food);
      //   params.append("limit", "10");

      //   res = await axios.get(`http://localhost:3000/search-points?${params}`);
      //   setResults(res.data.results || []);
      // }
    } catch (error: any) {
      console.error("Search failed:", error);
      alert("Search failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      await axios.post("http://localhost:3000/setup-international-foods");
      alert("International foods collection created with sample data!");
    } catch (error: any) {
      alert("Setup failed: " + error.message);
    }
  };

  const renderSearchForm = () => {
    switch (searchType) {
      case "semantic":
        return (
          <div>
            <label>
              Search Query (Semantic):
              <input
                style={{ width: "400px", marginLeft: "10px" }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Japanese food, traditional dish, etc."
              />
            </label>
          </div>
        );

      case "keyword":
        return (
          <div>
            <label>
              Keyword:
              <input
                style={{ width: "300px", marginLeft: "10px" }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., sushi, rice, Japan, etc."
              />
            </label>
            <label style={{ marginLeft: "20px" }}>
              Search in:
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                style={{ marginLeft: "10px" }}
              >
                <option value="description">Description</option>
                <option value="food">Food Name</option>
                <option value="country">Country</option>
              </select>
            </label>
          </div>
        );

      case "point":
        return (
          <div>
            <label>
              Country:
              <input
                style={{ width: "180px", marginLeft: "10px" }}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., Japan, Italy"
              />
            </label>
            <label style={{ marginLeft: "20px" }}>
              Food:
              <input
                style={{ width: "180px", marginLeft: "10px" }}
                value={food}
                onChange={(e) => setFood(e.target.value)}
                placeholder="e.g., Sushi, Pizza"
              />
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>International Foods Search</h1>

      {/* Setup Button */}
      <button onClick={handleSetup} style={{ marginBottom: "1rem" }}>
        Setup Sample Foods Data
      </button>

      {/* Search Type Selection */}
      <div style={{ marginBottom: "1rem" }}>
        <label>
          Search Type:
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            style={{ marginLeft: "10px" }}
          >
            <option value="semantic">Semantic Search</option>
            <option value="keyword">Keyword Search</option>
          </select>
        </label>
      </div>

      {/* Search Form */}
      <div style={{ marginBottom: "1rem" }}>{renderSearchForm()}</div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={loading}
        style={{ marginBottom: "1rem" }}
      >
        {loading ? "Searching..." : "Search"}
      </button>

      {/* Results */}
      <div>
        <h3>Results ({results.length} found)</h3>
        {results.length === 0 ? (
          <p>No results found</p>
        ) : (
          <ul>
            {results.map((item, index) => (
              <li
                key={item.id || index}
                style={{
                  marginBottom: "1rem",
                  padding: "1rem",
                  border: "1px solid #ccc",
                }}
              >
                <strong>{item.payload?.food}</strong> from{" "}
                <strong>{item.payload?.country}</strong>
                {item.score && (
                  <span style={{ marginLeft: "10px", color: "#666" }}>
                    (score: {item.score.toFixed(3)})
                  </span>
                )}
                <div style={{ marginTop: "0.5rem", color: "#555" }}>
                  {item.payload?.description}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
