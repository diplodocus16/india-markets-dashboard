import { useState, useMemo, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from "recharts";
import { ASSETS } from "../assets.config.js";
import { getFullSeries, fmtVal, fmtAxis } from "../utils/calc.js";

function CustomTooltip({active,payload,label,slots,normalize}) {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:"#fff",border:"1px solid #e0e0e0",borderRadius:8,padding:"10px 14px",fontSize:12.5,boxShadow:"0 2px 12px rgba(0,0,0,0.08)",fontFamily:"Inter,sans-serif"}}>
      <div style={{fontWeight:600,color:"#111",marginBottom:6}}>{label}</div>
      {payload.map((p,i)=>{
        const def=slots[i];
        const display=normalize?`${p.value?.toFixed(1)} (idx)`:fmtVal(def?.prefix??"",p.value);
        return <div key={i} style={{color:p.color,marginBottom:2,display:"flex",gap:16,justifyContent:"space-between",minWidth:160}}>
          <span>{def?.label}</span><span style={{fontWeight:600}}>{display}</span>
        </div>;
      })}
    </div>
  );
}

export default function ChartPanel({slotKeys,onSlotChange,historicalData,liveData}) {
  const [logScale,setLogScale] = useState(false);
  const [normalize,setNormalize] = useState(false);
  const [zoomLeft,setZoomLeft] = useState(null);
  const [zoomRight,setZoomRight] = useState(null);
  const [xDomain,setXDomain] = useState(["auto","auto"]);
  const [isDragging,setIsDragging] = useState(false);

  const activeSlots=slotKeys.filter(k=>k!=="none");
  const defs=activeSlots.map(k=>ASSETS.find(a=>a.key===k)).filter(Boolean);
  const hasMultiple=activeSlots.length>1;

  const chartData = useMemo(()=>{
    const seriesArr=activeSlots.map(k=>getFullSeries(k,historicalData,liveData));
    const allYears=[...new Set(seriesArr.flatMap(s=>s.map(d=>d.year)))].sort((a,b)=>a-b);
    const maps=seriesArr.map(s=>Object.fromEntries(s.map(d=>[d.year,d.value])));
    const bases=seriesArr.map(s=>s.length?s[0].value:1);
    return allYears.map(yr=>{
      const row={year:yr};
      activeSlots.forEach((_,i)=>{
        const v=maps[i][yr];
        if(v!=null) row[`v${i}`]=normalize?(v/bases[i])*100:v;
      });
      return row;
    });
  },[activeSlots,normalize,historicalData,liveData]);

  const visibleData = useMemo(()=>
    xDomain[0]==="auto"?chartData:chartData.filter(d=>d.year>=xDomain[0]&&d.year<=xDomain[1]),
    [chartData,xDomain]);

  const yDomains = useMemo(()=>
    activeSlots.map((_,i)=>{
      const vals=visibleData.map(d=>d[`v${i}`]).filter(v=>v!=null&&v>0);
      if(!vals.length) return ["auto","auto"];
      return logScale?[Math.min(...vals)*0.9,Math.max(...vals)*1.05]:[0,Math.max(...vals)*1.05];
    }),[visibleData,activeSlots,logScale]);

  const handleMouseDown=useCallback(e=>{
    if(!e?.activeLabel)return;
    setZoomLeft(e.activeLabel);setZoomRight(null);setIsDragging(true);
  },[]);
  const handleMouseMove=useCallback(e=>{
    if(!isDragging||!e?.activeLabel)return;
    setZoomRight(e.activeLabel);
  },[isDragging]);
  const handleMouseUp=useCallback(()=>{
    if(!isDragging)return;
    setIsDragging(false);
    if(zoomLeft!=null&&zoomRight!=null&&zoomLeft!==zoomRight)
      setXDomain([Math.min(zoomLeft,zoomRight),Math.max(zoomLeft,zoomRight)]);
    setZoomLeft(null);setZoomRight(null);
  },[isDragging,zoomLeft,zoomRight]);

  const isZoomed=xDomain[0]!=="auto";
  const xTickCount=visibleData.length>30?10:visibleData.length>15?8:6;
  const rightDef=hasMultiple&&!normalize?defs[1]:null;
  const usedKeys=new Set(slotKeys.filter(k=>k!=="none"));
  const getOptions=cur=>ASSETS.filter(a=>a.key===cur||!usedKeys.has(a.key));

  const cap={fontSize:10,color:"#888",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.8px",fontWeight:500};
  const sel={background:"#fff",border:"1px solid #ddd",color:"#111",borderRadius:8,padding:"6px 28px 6px 10px",fontSize:13,cursor:"pointer",fontFamily:"Inter,sans-serif",outline:"none",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M0 0l4.5 5L9 0z' fill='%23888'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"calc(100% - 8px) center",minWidth:170};
  const pill=active=>({padding:"4px 14px",borderRadius:20,fontSize:12,cursor:"pointer",fontWeight:active?500:400,background:active?"#111":"transparent",border:`1px solid ${active?"#111":"#ddd"}`,color:active?"#fff":"#555",transition:"all 0.12s",fontFamily:"Inter,sans-serif"});

  return (
    <div>
      <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:12,padding:"12px 18px",marginBottom:12,display:"flex",flexWrap:"wrap",gap:16,alignItems:"flex-end"}}>
        {[0,1,2].map(i=>(
          <div key={i}>
            <div style={cap}>{i===0?"Chart 1":i===1?"Chart 2 (Compare)":"Chart 3 (Compare)"}</div>
            <select style={sel} value={slotKeys[i]} onChange={e=>onSlotChange(i,e.target.value)}>
              {i>0&&<option value="none">— None —</option>}
              {getOptions(slotKeys[i]).map(a=><option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
          </div>
        ))}
        <div style={{width:1,height:34,background:"#ececec",alignSelf:"flex-end",marginBottom:1}}/>
        <div>
          <div style={cap}>Scale</div>
          <div style={{display:"flex",gap:3}}>
            {[["Linear",false],["Log",true]].map(([lbl,v])=>
              <button key={lbl} onClick={()=>setLogScale(v)} style={pill(logScale===v)}>{lbl}</button>)}
          </div>
        </div>
        {hasMultiple&&(
          <div>
            <div style={cap}>Mode</div>
            <div style={{display:"flex",gap:3}}>
              {[["Actual",false],["Normalize",true]].map(([lbl,v])=>
                <button key={lbl} onClick={()=>setNormalize(v)} style={pill(normalize===v)}>{lbl}</button>)}
            </div>
          </div>
        )}
        {liveData?.updatedAt&&(
          <div style={{marginLeft:"auto",alignSelf:"flex-end"}}>
            <div style={{fontSize:10.5,color:"#bbb"}}>Live: {new Date(liveData.updatedAt).toLocaleTimeString()}</div>
            <div style={{fontSize:10.5,color:"#bbb"}}>USD/INR: {liveData.usdInr?.toFixed(1)}</div>
          </div>
        )}
        {isZoomed&&(
          <button onClick={()=>setXDomain(["auto","auto"])} style={{padding:"5px 12px",borderRadius:8,border:"1px solid #ddd",background:"#fff",color:"#444",fontSize:12,cursor:"pointer",fontFamily:"Inter,sans-serif",alignSelf:"flex-end"}}>
            ↺ Reset zoom
          </button>
        )}
      </div>
      <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:12,padding:"18px 12px 10px 2px",userSelect:"none"}}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={visibleData} margin={{top:8,right:rightDef?60:16,left:8,bottom:8}}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            <CartesianGrid stroke="#f0f0f0" vertical={false}/>
            <XAxis dataKey="year" type="number" domain={isZoomed?xDomain:["dataMin","dataMax"]}
              tickCount={xTickCount} tickFormatter={v=>v.toString()}
              tick={{fill:"#111",fontSize:11.5,fontFamily:"Inter,sans-serif"}}
              axisLine={{stroke:"#ccc"}} tickLine={{stroke:"#ccc"}} allowDataOverflow/>
            <YAxis yAxisId="y0" orientation="left" scale={logScale?"log":"linear"} domain={yDomains[0]??["auto","auto"]}
              tickFormatter={v=>fmtAxis(normalize?"":defs[0]?.prefix??"",v)}
              tick={{fill:"#111",fontSize:11,fontFamily:"Inter,sans-serif"}}
              axisLine={{stroke:"#ccc"}} tickLine={{stroke:"#ccc"}} tickCount={6} width={52} allowDataOverflow/>
            {rightDef&&(
              <YAxis yAxisId="y1" orientation="right" scale={logScale?"log":"linear"} domain={yDomains[1]??["auto","auto"]}
                tickFormatter={v=>fmtAxis(rightDef.prefix??"",v)}
                tick={{fill:"#111",fontSize:11,fontFamily:"Inter,sans-serif"}}
                axisLine={{stroke:"#ccc"}} tickLine={{stroke:"#ccc"}} tickCount={6} width={52} allowDataOverflow/>
            )}
            {activeSlots.length>=3&&!normalize&&(
              <YAxis yAxisId="y2" orientation="right" tick={{fill:"transparent",fontSize:1}} axisLine={false} tickLine={false} width={1} allowDataOverflow/>
            )}
            <Tooltip content={<CustomTooltip slots={defs} normalize={normalize}/>} cursor={{stroke:"#ddd",strokeWidth:1,strokeDasharray:"4 2"}}/>
            <Legend verticalAlign="top" align="left" iconType="plainline" wrapperStyle={{paddingBottom:6,paddingLeft:16,fontSize:12.5,fontFamily:"Inter,sans-serif",color:"#222"}}/>
            {activeSlots.map((k,i)=>{
              const def=ASSETS.find(a=>a.key===k);
              const yId=!normalize&&i===1&&hasMultiple?"y1":!normalize&&i===2&&activeSlots.length>=3?"y2":"y0";
              return <Line key={k} yAxisId={yId} type="monotone" dataKey={`v${i}`} name={def.label} stroke={def.color} strokeWidth={2} dot={false} activeDot={{r:4,strokeWidth:0}} connectNulls/>;
            })}
            {isDragging&&zoomLeft!=null&&zoomRight!=null&&(
              <ReferenceArea yAxisId="y0" x1={Math.min(zoomLeft,zoomRight)} x2={Math.max(zoomLeft,zoomRight)} strokeOpacity={0} fill="#0066cc" fillOpacity={0.06}/>
            )}
          </LineChart>
        </ResponsiveContainer>
        <p style={{textAlign:"center",fontSize:11,color:"#bbb",marginTop:2,fontFamily:"Inter,sans-serif"}}>
          Drag to zoom · {isZoomed?<span style={{color:"#777"}}>{xDomain[0]}–{xDomain[1]}</span>:"showing all years"}
        </p>
      </div>
    </div>
  );
}