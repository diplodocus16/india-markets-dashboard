import { useState, useEffect } from "react";
import ChartPanel from "./components/ChartPanel.jsx";
import CagrTable from "./components/CagrTable.jsx";
import { ASSETS } from "./assets.config.js";
import { HISTORICAL } from "./historical.js";

const API_URL = "/api/prices";

export default function App() {
  const [slots, setSlots] = useState([ASSETS[0].key, ASSETS[1].key, "none"]);
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("API error " + res.status);
        const data = await res.json();
        if (!cancelled) { setLiveData(data); setError(null); }
      } catch (err) {
        if (!cancelled) setError("Live data unavailable — showing historical data only.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSlotChange = (i, val) => {
    setSlots(prev => {
      const next = [...prev];
      const existing = next.findIndex((k, idx) => idx !== i && k === val);
      if (existing >= 0) next[existing] = "none";
      next[i] = val;
      return next;
    });
  };

  return (
    <div style={{ fontFamily:"Inter,'Helvetica Neue',sans-serif", background:"#f5f5f5", color:"#111", minHeight:"100vh", padding:"28px 26px 40px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { height:4px; width:4px; background:#f0f0f0; }
        ::-webkit-scrollbar-thumb { background:#ddd; border-radius:3px; }
        tr:hover td { background:#f7f7f7 !important; }
      `}</style>
      <div style={{ marginBottom:22, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:600, color:"#111", letterSpacing:"-0.4px" }}>Historic Returns</h1>
          
        </div>
        <div style={{ textAlign:"right", fontSize:11.5, color:"#aaa" }}>
          {loading && "Loading live prices…"}
          {!loading && error && <span style={{ color:"#E67E22" }}>⚠ {error}</span>}
          {!loading && !error && liveData && <span style={{ color:"#27AE60" }}>● Prices live</span>}
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <ChartPanel slotKeys={slots} onSlotChange={handleSlotChange} historicalData={HISTORICAL} liveData={liveData} />
      </div>
      <CagrTable historicalData={HISTORICAL} liveData={liveData} />
      <div style={{ marginTop:18, fontSize:11, color:"#bbb", textAlign:"center", lineHeight:1.9 }}>
        Sources: RBI Handbook · BSE · MCX · IndiGraphs · Yahoo Finance (live) · Macrotrends<br />
        Gold INR ₹/10g · Silver INR ₹/kg · Gold/Silver USD $/oz · Indices = year-end close
      </div>
    </div>
  );
}
