import { useState, useMemo } from "react";
import { ASSETS } from "../assets.config.js";
import { getFullSeries, calcCAGR } from "../utils/calc.js";

const PERIODS = [
  {label:"1Y",y:1},{label:"3Y",y:3},{label:"5Y",y:5},{label:"10Y",y:10},
  {label:"15Y",y:15},{label:"20Y",y:20},{label:"30Y",y:30},{label:"Max",y:"max"},
];

function SortIcon({col,sortCol,sortDir}) {
  const active = sortCol===col;
  return <span style={{display:"inline-flex",flexDirection:"column",marginLeft:5,gap:1,verticalAlign:"middle",position:"relative",top:-1}}>
    <span style={{fontSize:8,lineHeight:1,color:active&&sortDir==="asc"?"#111":"#ccc"}}>▲</span>
    <span style={{fontSize:8,lineHeight:1,color:active&&sortDir==="desc"?"#111":"#ccc"}}>▼</span>
  </span>;
}

function cagrColor(v) {
  if(v==null)return"#bbb";if(v>=20)return"#0A3D21";if(v>=15)return"#145A32";
  if(v>=10)return"#1E6B3A";if(v>=5)return"#1E8449";if(v>=0)return"#333";return"#922B21";
}

export default function CagrTable({historicalData,liveData}) {
  const [sortCol,setSortCol] = useState("asset");
  const [sortDir,setSortDir] = useState("asc");

  const handleSort = col => {
    if(sortCol===col) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const cagrData = useMemo(()=>ASSETS.map(def=>{
    const series=getFullSeries(def.key,historicalData,liveData);
    const rows={};
    PERIODS.forEach(({label,y})=>{rows[label]=calcCAGR(series,y);});
    return {...def,rows,series};
  }),[historicalData,liveData]);

  const bestPerCol = useMemo(()=>{
    const best={};
    PERIODS.forEach(({label})=>{
      const vals=cagrData.map(d=>d.rows[label]?.cagr).filter(v=>v!=null);
      best[label]=vals.length?Math.max(...vals):null;
    });
    return best;
  },[cagrData]);

  const sortedData = useMemo(()=>{
    const arr=[...cagrData];
    arr.sort((a,b)=>{
      let av,bv;
      if(sortCol==="asset"){av=a.label;bv=b.label;}
      else{av=a.rows[sortCol]?.cagr??-Infinity;bv=b.rows[sortCol]?.cagr??-Infinity;}
      if(typeof av==="string") return sortDir==="asc"?av.localeCompare(bv):bv.localeCompare(av);
      return sortDir==="asc"?av-bv:bv-av;
    });
    return arr;
  },[cagrData,sortCol,sortDir]);

  const thBase={padding:"10px 14px",fontSize:11,color:"#333",textTransform:"uppercase",letterSpacing:"0.75px",fontWeight:600,borderBottom:"2px solid #e8e8e8",background:"#fafafa",whiteSpace:"nowrap",userSelect:"none",cursor:"pointer"};
  const tdBase={padding:"11px 14px",textAlign:"right",borderBottom:"1px solid #f0f0f0",fontVariantNumeric:"tabular-nums",fontFamily:"Inter,sans-serif",verticalAlign:"middle"};

  return (
    <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:12,overflow:"hidden"}}>
      <div style={{padding:"16px 20px 14px",borderBottom:"1px solid #f0f0f0"}}>
        <h2 style={{fontSize:14,fontWeight:600,color:"#111",margin:0}}>CAGR Comparison</h2>
        <p style={{fontSize:11.5,color:"#888",marginTop:3}}>
          Annualised returns · Click any column to sort · "—" = insufficient history
          {liveData?.updatedAt&&<span style={{marginLeft:8,color:"#27AE60"}}>● Live as of {new Date(liveData.updatedAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</span>}
        </p>
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"Inter,sans-serif"}}>
          <thead>
            <tr>
              <th style={{...thBase,textAlign:"left",paddingLeft:20,minWidth:160}} onClick={()=>handleSort("asset")}>
                Asset <SortIcon col="asset" sortCol={sortCol} sortDir={sortDir}/>
              </th>
              {PERIODS.map(({label})=>(
                <th key={label} style={{...thBase,textAlign:"right"}} onClick={()=>handleSort(label)}>
                  {label} <SortIcon col={label} sortCol={sortCol} sortDir={sortDir}/>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((d,ri)=>(
              <tr key={d.key} style={{background:ri%2===0?"#fff":"#fafafa"}}>
                <td style={{...tdBase,textAlign:"left",paddingLeft:20}}>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:d.color,flexShrink:0}}/>
                    <span style={{fontWeight:500,color:"#111",fontSize:13.5}}>{d.label}</span>
                    {liveData?.prices?.[d.key]?.live&&<span style={{fontSize:9.5,color:"#27AE60",background:"#f0fff5",border:"1px solid #c3e6cb",borderRadius:4,padding:"1px 5px"}}>live</span>}
                  </div>
                </td>
                {PERIODS.map(({label})=>{
                  const r=d.rows[label];
                  const isBest=r?.cagr!=null&&bestPerCol[label]!=null&&Math.abs(r.cagr-bestPerCol[label])<0.01;
                  const col=cagrColor(r?.cagr);
                  const fw=r?.cagr>=15?700:r?.cagr>=10?600:400;
                  return (
                    <td key={label} style={{...tdBase,background:isBest?"#f0faf3":ri%2===0?"#fff":"#fafafa"}}>
                      {r?.cagr!=null?(
                        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:1}}>
                          <span style={{color:col,fontWeight:fw,fontSize:13.5}}>{r.cagr>=0?"+":""}{r.cagr.toFixed(1)}%</span>
                          <span style={{fontSize:9.5,color:"#aaa",lineHeight:1}}>{r.startYear}–{r.endYear}</span>
                        </div>
                      ):(
                        <span style={{color:"#ccc",fontSize:13}}>—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}