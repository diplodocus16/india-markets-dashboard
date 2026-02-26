export const ASSETS = [
  { key:"sensex_inr", label:"Sensex (INR)", color:"#C0392B", unit:"pts", prefix:"", ticker:"^BSESN", currency:"INR", convertToINR:false, priceScale:1 },
  { key:"gold_inr", label:"Gold (INR)", color:"#B07D10", unit:"₹/10g", prefix:"₹", ticker:"GC=F", currency:"INR", convertToINR:true, priceScale:10/31.1035 },
  { key:"gold_usd", label:"Gold (USD)", color:"#D4A017", unit:"$/oz", prefix:"$", ticker:"GC=F", currency:"USD", convertToINR:false, priceScale:1 },
  { key:"silver_inr", label:"Silver (INR)", color:"#3A6EA5", unit:"₹/kg", prefix:"₹", ticker:"SI=F", currency:"INR", convertToINR:true, priceScale:1000/31.1035 },
  { key:"silver_usd", label:"Silver (USD)", color:"#5B8DB8", unit:"$/oz", prefix:"$", ticker:"SI=F", currency:"USD", convertToINR:false, priceScale:1 },
  { key:"snp500", label:"S&P 500", color:"#27AE60", unit:"pts", prefix:"", ticker:"^GSPC", currency:"USD", convertToINR:false, priceScale:1 },
  { key:"nasdaq", label:"NASDAQ", color:"#8E44AD", unit:"pts", prefix:"", ticker:"^IXIC", currency:"USD", convertToINR:false, priceScale:1 },
  { key:"sensex_usd", label:"Sensex (USD)", color:"#E67E22", unit:"pts", prefix:"", ticker:"^BSESN", currency:"USD", convertToINR:false, priceScale:1 },
];
export const ASSET_MAP = Object.fromEntries(ASSETS.map(a=>[a.key,a]));