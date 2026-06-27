import { EXP_CATS, INC_CATS, MONTHS } from "./constants";
import { formatIDR } from "./format";

export const fmt        = (n) => formatIDR(Number(n) || 0);
export const toDay      = () => new Date().toISOString().slice(0, 10);
export const monthKey   = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
export const monthLabel = (d) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
export const prevMonth  = (d) => { const n=new Date(d); n.setDate(1); n.setMonth(n.getMonth()-1); return n; };
export const nextMonth  = (d) => { const n=new Date(d); n.setDate(1); n.setMonth(n.getMonth()+1); return n; };
export const dayLabel   = (s) => {
  const DAYS = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
  const d = new Date(s+"T00:00:00");
  return { day: d.getDate(), dow: DAYS[d.getDay()] };
};
export const catOf = (tx) => {
  const pool = tx.type==="income" ? INC_CATS : EXP_CATS;
  return tx.categories || pool.find(c=>c.id===tx.category_id) || { name:"Lainnya", icon:"📦", color:"#636E72" };
};
export const randToken = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
