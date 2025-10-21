import { useState } from "react";
import axios from "axios";

function App() {
  const [vector, setVector] = useState(
    "0.3,0.4,0.6,0.2,0.5,0.7,0.3,0.6,0.8,0.2"
  );
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async () => {
    const vectorArray = vector.split(",").map(Number);
    const res = await axios.post("http://localhost:4000/search", {
      vector: vectorArray,
    });
    setResults(res.data.result || []);
  };

  const handleInsert = async () => {
    await axios.post("http://localhost:4000/insert");
    alert("Inserted 10 cities!");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Myanmar Cities Vector Search</h1>
      <button onClick={handleInsert}>Insert Sample Cities</button>
      <div style={{ marginTop: "1rem" }}>
        <input
          style={{ width: "400px" }}
          value={vector}
          onChange={(e) => setVector(e.target.value)}
        />
        <button onClick={handleSearch}>Search Nearest Cities</button>
      </div>

      <ul>
        {results.map((item) => (
          <li key={item.id}>
            {item.payload.city} ({item.payload.region}) — score:{" "}
            {item.score.toFixed(3)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
