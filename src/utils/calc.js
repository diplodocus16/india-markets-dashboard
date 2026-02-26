export function getFullSeries(key, historicalData, liveData) {
  const raw = { ...(historicalData[key] ?? {}) };
  if (liveData?.prices?.[key]?.value != null) {
    const { year, value } = liveData.prices[key];
    raw[year] = value;
  }
  return Object.keys(raw).map(Number).sort((a,b)=>a-b).map(yr=>({year:yr,value:raw[yr]}));
}
export function calcCAGR(series, nYears) {
  if (!series.length) return null;
  const last = series[series.length-1];
  let first;
  if (nYears==="max") { first=series[0]; }
  else { const target=last.year-nYears; first=series.find(d=>d.year>=target)??series[0]; }
  const n=last.year-first.year;
  if (n<=0||!first.value||!last.value) return null;
  return { cagr:(Math.pow(last.value/first.value,1/n)-1)*100, totalReturn:((last.value/first.value)-1)*100, startYear:first.year, endYear:last.year, startVal:first.value, endVal:last.value, n };
}
export function fmtVal(prefix,v) {
  if(v==null)return"—";
  if(prefix==="₹"){if(v>=1e5)return`₹${(v/1e5).toFixed(2)}L`;if(v>=1e3)return`₹${(v/1e3).toFixed(1)}k`;return`₹${Math.round(v)}`;}
  if(prefix==="$"){if(v>=1000)return`$${(v/1000).toFixed(1)}k`;return`$${v.toFixed(2)}`;}
  if(v>=1e5)return`${(v/1e5).toFixed(2)}L`;if(v>=1e3)return`${(v/1e3).toFixed(1)}k`;return Math.round(v).toString();
}
export function fmtAxis(prefix,v) {
  if(v==null)return"";
  if(prefix==="₹"){if(v>=1e7)return`${(v/1e7).toFixed(0)}Cr`;if(v>=1e5)return`${(v/1e5).toFixed(0)}L`;if(v>=1e3)return`${(v/1e3).toFixed(0)}k`;return Math.round(v).toString();}
  if(prefix==="$"){if(v>=1e6)return`${(v/1e6).toFixed(1)}M`;if(v>=1e3)return`${(v/1e3).toFixed(0)}k`;return v.toFixed(0);}
  if(v>=1e5)return`${(v/1e5).toFixed(0)}L`;if(v>=1e3)return`${(v/1e3).toFixed(0)}k`;return Math.round(v).toString();
}