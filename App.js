import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import {
Plus, Receipt, Calculator, Users, Trash2, Share2, ChevronRight, Check, X,
Wallet, ArrowRightLeft, AlertCircle, Loader2, User, ArrowRight, Edit3,
Utensils, Home, Plane, Car, ShoppingBag, Tag, Settings, Heart, UserMinus,
ArrowLeft, MapPin, ChevronDown
} from 'lucide-react';
/**
 * 📢 部署提示：
 *    * 本程式碼需要 Firebase 環境變數 (__firebase_config)。
 *    * 需安裝 npm install lucide-react firebase。
     */
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'travel-split-v39';
// 幣別權重 (基準 TWD = 1)
const CURRENCIES = [
{ code: 'TWD', symbol: '', name: '台幣', weight: 1 },
{ code: 'AUD', symbol: '', name: '澳幣', weight: 21.2 },
{ code: 'JPY', symbol: '¥', name: '日圓', weight: 0.21 },
{ code: 'USD', symbol: '', name: '美金', weight: 32.5 },
{ code: 'HKD', symbol: '', name: '港幣', weight: 4.15 },
{ code: 'KRW', symbol: '₩', name: '韓元', weight: 0.024 },
{ code: 'EUR', symbol: '€', name: '歐元', weight: 35.5 },
];
const CATEGORIES = [
{ id: '飲食', icon: <Utensils size={18} />, color: 'bg-orange-500 text-white' },
{ id: '住宿', icon: <Home size={18} />, color: 'bg-indigo-500 text-white' },
{ id: '機票', icon: <Plane size={18} />, color: 'bg-sky-500 text-white' },
{ id: '交通', icon: <Car size={18} />, color: 'bg-emerald-500 text-white' },
{ id: '購物', icon: <ShoppingBag size={18} />, color: 'bg-rose-500 text-white' },
{ id: '其他', icon: <Tag size={18} />, color: 'bg-slate-500 text-white' },
];
const formatAmt = (num) => {
if (num === null || isNaN(num)) return "0";
return Number(Math.round(num * 100) / 100).toLocaleString(undefined, {
minimumFractionDigits: 0,
maximumFractionDigits: 2
});
};
export default function App() {
const [user, setUser] = useState(null);
const [groupId, setGroupId] = useState(null);
const [group, setGroup] = useState(null);
const [view, setView] = useState('loading');
const [error, setError] = useState(null);
const [isSubmitting, setIsSubmitting] = useState(false);
const [copyStatus, setCopyStatus] = useState(false);
const [deleteId, setDeleteId] = useState(null);
const [detailMemberId, setDetailMemberId] = useState(null);
const [viewingExpense, setViewingExpense] = useState(null);
const [editingExpense, setEditingExpense] = useState(null);
const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
const [memberToDelete, setMemberToDelete] = useState(null);
const [tripToDelete, setTripToDelete] = useState(null);
const [memberAlert, setMemberAlert] = useState(null);
const [historyTrips, setHistoryTrips] = useState(() => {
try { return JSON.parse(localStorage.getItem('travel_history_v39') || '[]'); } catch { return []; }
});
// Auth 狀態檢查
useEffect(() => {
const initAuth = async () => {
try {
if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
await signInWithCustomToken(auth, __initial_auth_token);
} else {
await signInAnonymously(auth);
}
} catch (err) { setError("連線初始化失敗"); }
};
initAuth();
const unsubscribe = onAuthStateChanged(auth, (u) => {
setUser(u);
if (u) {
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('g');
if (id) setGroupId(id); else setView('setup');
}
});
return () => unsubscribe();
}, []);
// 數據實時監聽
useEffect(() => {
if (!groupId || !user) return;
const groupRef = doc(db, 'artifacts', appId, 'public', 'data', 'groups', groupId);
const unsubscribe = onSnapshot(groupRef, (docSnap) => {
if (docSnap.exists()) {
const data = docSnap.data();
setGroup(data);
setHistoryTrips(prev => {
const filtered = prev.filter(t => t.id !== groupId);
const updated = [{ id: groupId, name: data.name, date: Date.now() }, ...filtered].slice(0, 15);
localStorage.setItem('travel_history_v39', JSON.stringify(updated));
return updated;
});
if (view === 'loading') setView('list');
} else {
handleExitGroup();
}
}, () => { handleExitGroup(); });
return () => unsubscribe();
}, [groupId, user]);
const handleExitGroup = () => {
setGroupId(null);
setGroup(null);
setView('setup');
setEditingExpense(null);
setViewingExpense(null);
try {
const url = new URL(window.location.href);
url.searchParams.delete('g');
window.history.replaceState({}, '', url.pathname);
} catch(e) {}
};
const createGroup = async (name, members, baseCurrency) => {
if (!user) return;
setIsSubmitting(true);
try {
const newId = Math.random().toString(36).substring(2, 10);
const newGroup = {
id: newId, name,
members: members.map(n => ({ id: Math.random().toString(36).substring(2, 15), name: n })),
expenses: [], baseCurrency, createdAt: Date.now(), creator: user.uid
};
await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'groups', newId), newGroup);
setGroupId(newId);
setView('list');
} catch (err) { setError("建立行程失敗"); }
finally { setIsSubmitting(false); }
};
const handleSaveExpense = async (data) => {
if (!groupId) return;
setIsSubmitting(true);
try {
const groupRef = doc(db, 'artifacts', appId, 'public', 'data', 'groups', groupId);
const cleanData = {
...data, amount: parseFloat(data.amount) || 0, rate: parseFloat(data.rate) || 1,
involvedSplits: (data.involvedSplits || []).map(s => ({...s, amount: parseFloat(s.amount) || 0}))
};
if (data.id) {
const updated = (group.expenses || []).map(e => e.id === data.id ? cleanData : e);
await updateDoc(groupRef, { expenses: updated });
} else {
const newExp = { ...cleanData, id: Math.random().toString(36).substring(2, 15), createdAt: Date.now() };
await updateDoc(groupRef, { expenses: arrayUnion(newExp) });
}
setEditingExpense(null); setViewingExpense(null); setView('list');
} catch (err) { setError("存檔失敗"); }
finally { setIsSubmitting(false); }
};
// 貪婪演算法結算邏輯
const { totalInBase, transfers, balances, memberHistory } = useMemo(() => {
if (!group || !group.members) return { totalInBase: 0, transfers: [], balances: {}, memberHistory: {} };
const bals = {}; const history = {};
group.members.forEach(m => { bals[m.id] = 0; history[m.id] = { paid: [], shared: [] }; });
let total = 0;
(group.expenses || []).forEach(exp => {
const rate = parseFloat(exp.rate) || 1;
const amountInBaseCent = Math.round(parseFloat(exp.amount || 0) * rate * 100);
total += (amountInBaseCent / 100);
if (bals[exp.payerId] !== undefined) {
bals[exp.payerId] += (amountInBaseCent / 100);
history[exp.payerId].paid.push({ ...exp, baseValue: (amountInBaseCent / 100) });
}
const payer = group.members.find(m => m.id === exp.payerId);
exp.involvedSplits?.forEach(split => {
if (bals[split.memberId] !== undefined) {
const splitBaseValCent = Math.round(parseFloat(split.amount || 0) * rate * 100);
bals[split.memberId] -= (splitBaseValCent / 100);
const others = (exp.involvedSplits || []).filter(s => s.memberId !== split.memberId).map(s => group.members.find(m => m.id === s.memberId)?.name || '未知');
history[split.memberId].shared.push({
...exp, personalShare: split.amount, personalBaseShare: (splitBaseValCent / 100), payerName: payer?.name || '未知', othersList: others.join(', ') || '無'
});
}
});
});
const debtors = [], creditors = [];
Object.keys(bals).forEach(id => {
  const b = Math.round(bals[id] * 100) / 100;
  if (b < -0.01) debtors.push({ id, amount: Math.abs(b) });
  else if (b > 0.01) creditors.push({ id, amount: b });
});
const results = []; let dIdx = 0, cIdx = 0;
debtors.sort((a,b) => b.amount - a.amount); creditors.sort((a,b) => b.amount - a.amount);
while (dIdx < debtors.length && cIdx < creditors.length) {
  const d = debtors[dIdx], c = creditors[cIdx];
  const amt = Math.min(d.amount, c.amount);
  if (amt > 0.01) results.push({ from: d.id, to: c.id, amount: amt });
  d.amount = Math.round((d.amount - amt) * 100) / 100;
  c.amount = Math.round((c.amount - amt) * 100) / 100;
  if (d.amount <= 0.01) dIdx++; if (c.amount <= 0.01) cIdx++;
}
return { totalInBase: total, transfers: results, balances: bals, memberHistory: history };

}, [group]);
if (view === 'loading') return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
// 導航安全攔截
if (!groupId || !group) {
return (
<div className="min-h-screen bg-white max-w-md mx-auto relative shadow-2xl overflow-hidden sm:w-full flex flex-col">
{tripToDelete && <ConfirmModal title="移除紀錄？" desc="這會從手機清單移除，不影響其他人連結。" onConfirm={() => {
const updated = historyTrips.filter(t => t.id !== tripToDelete.id);
setHistoryTrips(updated);
localStorage.setItem('travel_history_v39', JSON.stringify(updated));
setTripToDelete(null);
}} onCancel={() => setTripToDelete(null)} />}
<SetupUI onCreate={createGroup} history={historyTrips} onJoin={id => { setGroupId(id); setView('loading'); }} isSubmitting={isSubmitting} onJoinById={setGroupId} onRemoveRequest={setTripToDelete} />
</div>
);
}
return (
<div className="min-h-screen bg-[#F9FAFB] text-slate-800 font-sans max-w-md mx-auto flex flex-col relative shadow-2xl overflow-hidden sm:w-full">
{deleteId && <ConfirmModal title="刪除這筆支出？" desc="這項紀錄將從雲端永久移除。" onConfirm={async () => {
const groupRef = doc(db, 'artifacts', appId, 'public', 'data', 'groups', groupId);
await updateDoc(groupRef, { expenses: (group.expenses || []).filter(e => e.id !== deleteId) });
setDeleteId(null); setViewingExpense(null);
}} onCancel={() => setDeleteId(null)} />}
  {memberToDelete && <ConfirmModal title="確認移除旅伴？" desc={`您即將移除「${memberToDelete.name}」。`} onConfirm={() => {
    updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'groups', groupId), { members: group.members.filter(m => m.id !== memberToDelete.id) });
    setMemberToDelete(null);
  }} onCancel={() => setMemberToDelete(null)} />}

  {memberAlert && <ConfirmModal title="無法移除成員" desc={`「${memberAlert.name}」已有帳目紀錄。請先刪除該成員參與的所有支出後再試。`} showCancel={false} onConfirm={() => setMemberAlert(null)} />}
  
  {detailMemberId && group && <MemberDetailModal member={group.members.find(m => m.id === detailMemberId)} history={memberHistory[detailMemberId]} onClose={() => setDetailMemberId(null)} baseCurrency={group.baseCurrency} />}
  {viewingExpense && group && <ExpenseDetailModal expense={viewingExpense} members={group.members} onClose={() => setViewingExpense(null)} onEdit={() => { setEditingExpense(viewingExpense); setViewingExpense(null); setView('add'); }} onDelete={() => setDeleteId(viewingExpense.id)} />}
  {isManageMembersOpen && group && <ManageMembersModal members={group.members} expenses={group.expenses || []} onUpdate={mems => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'groups', groupId), { members: mems })} onClose={() => setIsManageMembersOpen(false)} onDeleteRequest={setMemberToDelete} onAlert={setMemberAlert} />}

  <header className="p-3 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-20 shadow-sm">
    <div className="flex items-center gap-2 flex-1 overflow-hidden pr-2">
      <button onClick={handleExitGroup} className="p-1.5 bg-slate-50 text-slate-400 rounded-full active:scale-90"><ArrowLeft size={20} /></button>
      <div className="overflow-hidden min-w-0">
        <h1 className="font-black text-lg tracking-tight text-indigo-600">旅遊分帳</h1>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate block max-w-[120px]">{group?.name}</span>
          <button onClick={() => setIsManageMembersOpen(true)} className="p-0.5 bg-slate-50 rounded text-slate-400 hover:text-indigo-500 transition-colors"><Settings size={12} /></button>
        </div>
      </div>
    </div>
    <button onClick={() => {
      const url = `${window.location.origin}${window.location.pathname}?g=${groupId}`;
      const ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      setCopyStatus(true); setTimeout(() => setCopyStatus(false), 2000);
    }} className="p-2.5 bg-indigo-600 text-white rounded-full active:scale-90 shadow-md flex-shrink-0 transition-all">{copyStatus ? <Check size={16} /> : <Share2 size={16} />}</button>
  </header>

  <main className="flex-1 overflow-y-auto pb-28 p-3.5">
    {view === 'list' && (
      <div className="space-y-4 animate-in fade-in">
        <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden text-center">
          <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">總支出 ({group.baseCurrency})</p>
          <h2 className="text-3xl font-black tabular-nums">${formatAmt(totalInBase)}</h2>
          <div className="mt-3 flex flex-wrap justify-center gap-1">
            {group.members.map((m) => (<div key={m.id} className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold border border-white/5">{m.name}</div>))}
          </div>
        </div>
        <div className="space-y-2">
          {(group.expenses || []).length === 0 ? (
            <div className="text-center py-20 text-slate-300"><Receipt size={54} className="mx-auto mb-3" /><p className="font-bold text-sm uppercase tracking-widest">目前尚無帳目</p></div>
          ) : (
            group.expenses.slice().sort((a,b) => new Date(b.date) - new Date(a.date)).map(e => (
              <ExpenseItem key={e.id} exp={e} members={group.members} base={group.baseCurrency} onClick={() => setViewingExpense(e)} />
            ))
          )}
        </div>
      </div>
    )}
    {view === 'add' && <AddUI group={group} onSave={handleSaveExpense} onCancel={() => { setEditingExpense(null); setView('list'); }} isSubmitting={isSubmitting} initialData={editingExpense} />}
    {view === 'settle' && <SettleUI transfers={transfers} balances={balances} members={group.members} base={group.baseCurrency} onShowDetails={setDetailMemberId} />}
  </main>

  <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-100 px-10 py-3 flex justify-around items-center z-50 rounded-t-[2rem] shadow-sm">
    <button onClick={() => { setEditingExpense(null); setView('list'); }} className={`flex flex-col items-center gap-1 transition-all ${view === 'list' ? 'text-indigo-600 scale-110 font-bold' : 'text-slate-300'}`}>
      <Receipt size={24} strokeWidth={3} />
      <span className="text-[9px] font-black uppercase">明細</span>
    </button>
    <button onClick={() => { setEditingExpense(null); setView('add'); }} className={`w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center -mt-8 shadow-xl active:scale-95 ring-[5px] ring-[#F9FAFB]`}>
      {editingExpense ? <Edit3 size={26} strokeWidth={3} /> : <Plus size={32} strokeWidth={3} />}
    </button>
    <button onClick={() => { setEditingExpense(null); setView('settle'); }} className={`flex flex-col items-center gap-1 transition-all ${view === 'settle' ? 'text-indigo-600 scale-110 font-bold' : 'text-slate-300'}`}>
      <Calculator size={24} strokeWidth={3} />
      <span className="text-[9px] font-black uppercase">結算</span>
    </button>
  </nav>
</div>

);
}
// --- Setup UI ---
function SetupUI({ onCreate, history, onJoin, onJoinById, isSubmitting, onRemoveRequest }) {
const [name, setName] = useState('');
const [members, setMembers] = useState([]);
const [input, setInput] = useState('');
const [base, setBase] = useState('TWD');
const [joinId, setJoinId] = useState('');
const add = () => { if(input.trim()){ setMembers([...members, input.trim()]); setInput(''); } };
return (
<div className="flex-1 flex flex-col p-6 overflow-y-auto bg-white">
<div className="text-center pt-8 pb-10">
<div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl mx-auto mb-4"><Wallet size={32}/></div>
<h1 className="text-4xl font-black tracking-tighter text-slate-800 leading-none">旅遊分帳</h1>
<p className="text-indigo-500 font-bold text-[11px] uppercase tracking-[0.3em] mt-3 text-center w-full">即時同步 • 紀錄保留</p>
</div>
<div className="space-y-8 flex-1">
{history.length > 0 && (
<div className="space-y-3">
<div className="flex items-center gap-2 px-1 text-slate-400 font-black text-xs uppercase tracking-widest"><History size={14} /> 最近行程紀錄</div>
{history.map(trip => (
<div key={trip.id} className="flex gap-2 w-full">
<button onClick={() => onJoin(trip.id)} className="flex-1 flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-100 text-left transition-all overflow-hidden">
<div className="flex items-center gap-3 overflow-hidden min-w-0">
<MapPin size={16} className="text-indigo-500 flex-shrink-0" />
<span className="font-bold text-slate-700 truncate text-base">{trip.name}</span>
</div>
<ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
</button>
<button onClick={() => onRemoveRequest(trip)} className="p-4 text-slate-200 hover:text-rose-400 active:scale-90 flex-shrink-0"><X size={18} /></button>
</div>
))}
</div>
)}
<div className="space-y-5 px-0.5">
<div className="flex items-center gap-2 px-1 text-slate-400 font-black text-xs uppercase tracking-widest"><Plus size={14} /> 開啟新行程</div>
<input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-500 transition-all text-lg shadow-sm placeholder:text-sm placeholder:text-slate-300 truncate" value={name} onChange={e=>setName(e.target.value)} placeholder="旅行標題 (例如: 日本五日遊)" />
<div className="relative">
<select className="w-full p-4 bg-slate-50 rounded-2xl font-bold appearance-none outline-none border-2 border-transparent focus:border-indigo-500 text-base shadow-sm" value={base} onChange={e=>setBase(e.target.value)}>{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} {c.name}</option>)}</select>
<ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20}/>
</div>
<div className="space-y-3">
<div className="flex gap-3 w-full items-center">
<input className="flex-1 min-w-0 p-4 bg-slate-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-indigo-500 transition-all text-lg shadow-inner placeholder:text-sm placeholder:text-slate-300 truncate" placeholder="輸入旅伴姓名" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} />
<button onClick={add} className="w-14 h-14 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 flex-shrink-0 transition-all"><Plus size={28} strokeWidth={4}/></button>
</div>
<div className="flex flex-wrap gap-1.5 pt-1">{members.map((m, i) => (<div key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-sm font-black flex items-center gap-2 border border-indigo-100">{m} <X size={12} className="cursor-pointer" onClick={()=>setMembers(members.filter((_,idx)=>idx!==i))} /></div>))}</div>
</div>
<button disabled={!name || members.length < 2 || isSubmitting} onClick={() => onCreate(name, members, base)} className={w-full py-5 rounded-2xl font-black text-xl shadow-lg flex items-center justify-center gap-4 transition-all ${ (!name || members.length < 2 || isSubmitting) ? 'bg-slate-100 text-slate-300 shadow-none' : 'bg-indigo-600 text-white active:scale-95' }}>{isSubmitting ? <Loader2 className="animate-spin" size={24}/> : <ArrowRight size={24} strokeWidth={3}/>} 建立行程活動</button>
</div>
<div className="pt-4 border-t border-slate-100 flex gap-2"><input className="flex-1 p-3 bg-transparent border-2 border-slate-100 rounded-xl font-bold outline-none text-[10px] text-center min-w-0" placeholder="貼上分享 ID 加入" value={joinId} onChange={e=>setJoinId(e.target.value)} /><button onClick={() => onJoinById(joinId)} className="px-8 bg-slate-200 text-slate-500 font-black rounded-xl text-[10px] flex-sh
