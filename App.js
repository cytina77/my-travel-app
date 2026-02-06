);
}
​function SetupUI({ onCreate, history, onJoin, onJoinById, isSubmitting, onRemoveRequest }) {
const [name, setName] = useState('');
const [members, setMembers] = useState([]);
const [input, setInput] = useState('');
const [base, setBase] = useState('TWD');
const [joinId, setJoinId] = useState('');
const add = () => { if(input.trim()){ setMembers([...members, input.trim()]); setInput(''); } };
return (
<div className="flex-1 flex flex-col p-6 overflow-y-auto bg-white animate-in fade-in">
<div className="text-center pt-8 pb-10">
<div className="w-18 h-18 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl mx-auto mb-4"><Wallet size={36}/></div>
<h1 className="text-4xl font-black tracking-tighter text-slate-800 leading-none">旅遊分帳</h1>
<p className="text-indigo-500 font-bold text-[11px] uppercase tracking-[0.3em] mt-3">即時同步 • 多人對帳</p>
</div>
<div className="space-y-8 px-1">
{history.length > 0 && (
<div className="space-y-3">
<div className="flex items-center gap-2 px-1 text-slate-400 font-black text-xs uppercase tracking-widest"><History size={14} /> 最近行程</div>
{history.map(trip => (
<div key={trip.id} className="flex gap-2 w-full">
<button onClick={() => onJoin(trip.id)} className="flex-1 flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-100 text-left transition-all overflow-hidden"><div className="flex items-center gap-3 overflow-hidden min-w-0"><MapPin size={16} className="text-indigo-500 flex-shrink-0" /><span className="font-bold text-slate-700 truncate text-base">{trip.name}</span></div><ChevronRight size={18} className="text-slate-300 flex-shrink-0" /></button>
<button onClick={() => onRemoveRequest(trip)} className="p-4 text-slate-200 hover:text-rose-400 active:scale-90"><X size={18} /></button>
</div>
))}
</div>
)}
<div className="space-y-5">
<div className="flex items-center gap-2 px-1 text-slate-400 font-black text-xs uppercase tracking-widest"><Plus size={14} /> 開啟新冒險</div>
<input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-500 transition-all text-lg shadow-sm placeholder:text-sm placeholder:text-slate-300 truncate" value={name} onChange={e=>setName(e.target.value)} placeholder="旅行名稱 (例如: 東京遊)" />
<div className="relative"><select className="w-full p-4 bg-slate-50 rounded-2xl font-bold appearance-none outline-none border-2 border-transparent focus:border-indigo-500 text-base shadow-sm" value={base} onChange={e=>setBase(e.target.value)}>{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} {c.name}</option>)}</select><ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20}/></div>
<div className="space-y-3">
<div className="flex gap-3 w-full items-center"><input className="flex-1 min-w-0 p-4 bg-slate-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-indigo-500 transition-all text-lg shadow-inner placeholder:text-sm placeholder:text-slate-300 truncate" placeholder="輸入旅伴名字" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} /><button onClick={add} className="w-14 h-14 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 flex-shrink-0 transition-all"><Plus size={28} strokeWidth={4}/></button></div>
<div className="flex flex-wrap gap-1.5 pt-1">{members.map((m, i) => (<div key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-sm font-black flex items-center gap-2 border border-indigo-100">{m} <X size={12} className="cursor-pointer" onClick={()=>setMembers(members.filter((_,idx)=>idx!==i))} /></div>))}</div>
</div>
<button disabled={!name || members.length < 2 || isSubmitting} onClick={() => onCreate(name, members, base)} className={w-full py-5 rounded-2xl font-black text-xl shadow-lg flex items-center justify-center gap-3 transition-all ${ (!name || members.length < 2 || isSubmitting) ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white active:scale-95' }}>{isSubmitting ? <Loader2 className="animate-spin" size={24}/> : <ArrowRight size={24} strokeWidth={3}/>} 建立行程活動</button>
</div>
</div>
</div>
);
}
​function AddUI({ group, onSave, onCancel, isSubmitting, initialData }) {
const [f, setF] = useState({
id: initialData?.id || null, title: initialData?.title || '', amount: initialData?.amount || '', category: initialData?.category || '飲食', date: initialData?.date || new Date().toISOString().split('T')[0],
currency: initialData?.currency || group.baseCurrency, rate: initialData?.rate || 1, payerId: initialData?.payerId || group.members[0]?.id, splitType: initialData?.splitType || 'equal',
involvedSplits: initialData?.involvedSplits || group.members.map(m => ({ memberId: m.id, amount: '' }))
});
​const updateRate = (code) => {
const baseW = CURRENCIES.find(c => c.code === group.baseCurrency)?.weight || 1;
const targetW = CURRENCIES.find(c => c.code === code)?.weight || 1;
const newRate = Math.round((targetW / baseW) * 1000) / 1000;
setF(prev => ({...prev, currency: code, rate: newRate}));
};
​const toggleMember = (mid) => {
const exists = f.involvedSplits.some(s => s.memberId === mid);
const newSplits = exists ? f.involvedSplits.filter(s => s.memberId !== mid) : [...f.involvedSplits, { memberId: mid, amount: '' }];
setF({ ...f, involvedSplits: newSplits });
};
​const currentSplitSum = f.involvedSplits.reduce((s, item) => s + (parseFloat(item.amount) || 0), 0);
const isValid = f.title && f.amount && f.involvedSplits.length > 0 && (f.splitType === 'equal' || Math.abs(currentSplitSum - parseFloat(f.amount)) < 0.2);
​return (
<div className="space-y-4 animate-in slide-in-from-right pb-4">
<div className="flex justify-between items-center px-1"><h2 className="text-2xl font-black text-indigo-600 leading-none">{f.id ? '修改支出' : '新增項目'}</h2><button onClick={onCancel} className="p-2 bg-white rounded-full text-slate-300 active:scale-90"><X size={20}/></button></div>
<div className="space-y-3.5">
<input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold outline-none text-lg shadow-sm focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-200" placeholder="消費標題" value={f.title} onChange={e=>setF({...f, title: e.target.value})} />
<div className="grid grid-cols-2 gap-4 px-1">
<input type="date" className="w-full p-3.5 bg-white border border-slate-100 rounded-xl font-bold text-xs shadow-sm" value={f.date} onChange={e=>setF({...f, date: e.target.value})} />
<div className="relative"><select className="w-full p-3.5 bg-white border border-slate-100 rounded-xl font-bold text-xs appearance-none shadow-sm" value={f.category} onChange={e=>setF({...f, category: e.target.value})}>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/></div>
</div>
<div className="space-y-2 px-1">
<div className="flex gap-2">
<select className="min-w-[100px] p-4 bg-white border border-slate-100 rounded-xl font-bold text-base shadow-sm" value={f.currency} onChange={e=>updateRate(e.target.value)}>{CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.code}</option>)}</select>
<input type="number" className="flex-1 min-w-0 p-4 bg-white border border-slate-100 rounded-xl font-black text-2xl shadow-inner text-right" placeholder="0" value={f.amount} onChange={e=>setF({...f, amount: e.target.value})} />
</div>
{f.currency !== group?.baseCurrency && (
<div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 mt-1 overflow-hidden">
<span className="text-sm font-bold text-indigo-400 whitespace-nowrap">匯率 1{f.currency}=</span>
<div className="flex items-center gap-1.5 flex-1 justify-end min-w-0"><input type="number" step="0.001" className="min-w-[60px] max-w-[100px] bg-transparent outline-none text-indigo-600 font-black text-xl text-right" value={f.rate} onChange={e=>setF({...f, rate: parseFloat(e.target.value)||0})} /><span className="text-sm font-bold text-indigo-400 flex-shrink-0">{group?.baseCurrency}</span></div>
</div>
)}
</div>
<div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide px-1">{group?.members.map(m=>(<button key={m.id} onClick={()=>setF({...f, payerId: m.id})} className={px-5 py-3 rounded-2xl border-2 whitespace-nowrap text-base font-black transition-all ${f.payerId===m.id?'bg-indigo-600 text-white border-indigo-600 shadow-md':'bg-white text-slate-400 border-slate-100'}}>{m.name}</button>))}</div>
<div className="space-y-4 bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-inner">
<div className="flex justify-between items-center mb-1"><label className="text-[10px] font-black text-slate-400 uppercase">分帳細節</label><div className="flex bg-slate-50 p-0.5 rounded-full"><button onClick={()=>setF({...f, splitType: 'equal'})} className={px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${f.splitType==='equal'?'bg-white text-indigo-600 shadow-sm':'text-slate-300'}}>平分</button><button onClick={()=>setF({...f, splitType: 'manual'})} className={px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${f.splitType==='manual'?'bg-white text-indigo-600 shadow-sm':'text-slate-300'}}>自訂</button></div></div>
<div className="flex flex-row flex-wrap gap-2.5">
{group?.members.map(m => {
const split = f.involvedSplits.find(s => s.memberId === m.id); const isSelected = !!split;
return (
<div key={m.id} className={flex items-center gap-1.5 p-1 rounded-2xl transition-all border ${isSelected ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'border-transparent opacity-40'}}>
<button onClick={()=>toggleMember(m.id)} className="flex items-center gap-2 px-2 py-2"><div className={w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}}>{isSelected && <Check size={12} strokeWidth={4} className="text-white" />}</div><span className="text-sm font-bold text-slate-700 whitespace-nowrap">{m.name}</span></button>
{isSelected && f.splitType === 'manual' && (<input type="number" className="w-18 p-1.5 rounded-lg text-center font-black text-xs outline-none bg-white border border-slate-200 text-indigo-600 shadow-sm" value={split.amount} onChange={e => setF({ ...f, involvedSplits: f.involvedSplits.map(s => s.memberId === m.id ? { ...s, amount: e.target.value } : s) })} />)}
</div>
);
})}
</div>
{f.splitType === 'manual' && (<div className={mt-2 p-2.5 rounded-xl text-center text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-colors ${Math.abs(currentSplitSum - parseFloat(f.amount)) < 0.2 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}}><AlertCircle size={14} /> 分配提示：{formatAmt(currentSplitSum)} / {formatAmt(parseFloat(f.amount || 0))}</div>)}
</div>
</div>
<button disabled={!isValid || isSubmitting} onClick={()=>onSave(f)} className="w-full py-5 rounded-2xl font-black text-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 bg-indigo-600 text-white shadow-indigo-100 disabled:bg-slate-100">儲存開銷紀錄</button>
</div>
);
}
​function SettleUI({ transfers, balances, members, base, onShowDetails }) {
return (
<div className="space-y-6 animate-in fade-in pb-10">
<h2 className="text-3xl font-black tracking-tighter text-slate-800 leading-none text-center">結算分析</h2>
<div className="bg-white p-7 rounded-[2.5rem] border border-slate-50 shadow-sm space-y-8">
<h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2 px-1"><ArrowRightLeft size={16}/> 最佳化還錢路徑</h3>
{transfers.length === 0 ? <p className="text-center py-10 text-slate-200 font-black text-lg">目前帳目已平！</p> : (
<div className="space-y-5 text-sm">
{transfers.map((t, i) => (
<div key={i} className="flex flex-col p-5 bg-slate-50 rounded-3xl border border-slate-100/50 shadow-sm">
<div className="flex items-center justify-between font-black text-slate-700 leading-none mb-3 overflow-hidden pr-1"><span className="text-rose-500 text-2xl truncate flex-1 min-w-0">{members.find(m=>m.id===t.from)?.name}</span><ArrowRight size={26} className="text-slate-300 flex-shrink-0 mx-4"/><span className="text-emerald-500 text-2xl truncate flex-1 min-w-0 text-right">{members.find(m=>m.id===t.to)?.name}</span></div>
<div className="text-center bg-white py-3 rounded-2xl shadow-inner"><span className="font-black text-3xl tabular-nums text-slate-800">{base} {formatAmt(t.amount)}</span></div>
</div>
))}
</div>
)}
</div>
<div className="bg-white p-7 rounded-[2.5rem] border border-slate-50 shadow-sm space-y-6">
<h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2 px-1"><Users size={18}/> 成員結餘狀態</h3>
<div className="space-y-3">
{members.map(m=>{
const b = Math.round(balances[m.id] * 100) / 100 || 0;
return (
<button key={m.id} onClick={() => onShowDetails(m.id)} className="w-full flex justify-between items-center p-5 hover:bg-slate-50 rounded-[2rem] transition-all group overflow-hidden"><div className="flex items-center gap-5 font-black text-xl text-slate-700 min-w-0 flex-1"><div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-500 group-hover:text-white transition-all flex-shrink-0 shadow-inner"><User size={28} /></div><span className="truncate">{m.name}</span></div><div className="flex items-center gap-4 flex-shrink-0"><span className={font-black tabular-nums text-2xl ${b>=0.01?'text-emerald-500':b<=-0.01?'text-rose-500':'text-slate-300'}}>{b>=0.01?'+':''}{formatAmt(b)}</span><ChevronRight size={24} className="text-slate-100 group-hover:text-indigo-500" /></div></button>
);
})}
</div>
</div>
</div>
);
}
​function ConfirmModal({ title, desc, onConfirm, onCancel, showCancel = true }) {
return (
<div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 animate-in fade-in">
<div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={showCancel ? onCancel : undefined}></div>
<div className="bg-white rounded-[2.5rem] p-10 w-full max-w-xs relative shadow-2xl space-y-6 animate-in zoom-in-95 text-center border border-slate-100">
<div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-sm"><AlertCircle size={40} /></div>
<h3 className="text-2xl font-black text-slate-800 leading-tight">{title}</h3>
<p className="text-slate-400 text-base leading-relaxed font-bold">{desc}</p>
<div className="flex flex-col gap-4 pt-3"><button onClick={onConfirm} className="w-full py-5 rounded-2xl bg-rose-500 text-white font-black text-xl shadow-md active:scale-95 transition-all">確定</button>{showCancel && <button onClick={onCancel} className="w-full py-5 rounded-2xl bg-slate-100 text-slate-400 font-black text-xl active:scale-95 transition-all">取消</button>}</div>
</div>
</div>
);
}
​function ExpenseItem({ exp, members, base, onClick }) {
const payer = members.find(m => m.id === exp.payerId)?.name || '未知';
const sym = CURRENCIES.find(c => c.code === exp.currency)?.symbol || '$';
const cat = CATEGORIES.find(c => c.id === exp.category) || CATEGORIES[5];
return (
<div onClick={onClick} className="bg-white p-5 rounded-2xl border border-slate-50 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer hover:shadow-md">
<div className="flex items-center gap-5 flex-1 overflow-hidden min-w-0"><div className={w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm}>{cat.icon}</div><div className="overflow-hidden min-w-0"><h4 className="font-bold text-xl text-slate-800 leading-none mb-2 truncate">{exp.title}</h4><p className="text-xs text-slate-400 font-black uppercase truncate tracking-wide">{exp.date} • {payer} 付款</p></div></div>
<div className="text-right ml-4 flex items-center gap-4 flex-shrink-0"><div><p className="font-black text-2xl tabular-nums text-slate-800 leading-none">{sym}{parseFloat(exp.amount).toLocaleString()}</p>{exp.currency !== base && <p className="text-[10px] text-rose-500 font-black tracking-widest mt-1">≈ {base} {formatAmt(exp.amount * exp.rate)}</p>}</div><ChevronRight size={24} className="text-slate-100 group-hover:text-indigo-600 transition-colors" /></div>
</div>
);
}
​// 其餘詳細 Modal 代碼保持與 v38 一致，但加入更多渲染保護...
function MemberDetailModal({ member, history, onClose, baseCurrency }) {
const totalPaid = history.paid.reduce((s, e) => s + e.baseValue, 0);
const totalOwe = history.shared.reduce((s, e) => s + (parseFloat(e.personalBaseShare) || 0), 0);
return (
<div className="fixed inset-0 z-[800] flex items-end animate-in fade-in">
<div className="absolute inset-0 bg-slate-900/15 backdrop-blur-sm" onClick={onClose}></div>
<div className="bg-white rounded-t-[4rem] w-full max-w-md mx-auto h-[90vh] relative shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden text-sm">
<div className="p-8 border-b border-slate-50 flex justify-between items-start bg-white sticky top-0 z-10 shadow-sm"><div><span className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em] mb-1 block">收支明細</span><h3 className="text-2xl font-black tracking-tighter text-slate-800 leading-none">{member.name}</h3></div><button onClick={onClose} className="p-2.5 bg-slate-50 rounded-full text-slate-400 active:scale-90 transition-colors"><X size={24}/></button></div>
<div className="flex-1 overflow-y-auto p-8 space-y-12 pb-24">
<div className="grid grid-cols-2 gap-5 font-black text-center"><div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm"><p className="text-[10px] text-emerald-600 uppercase mb-2 leading-none w-full">幫大家墊的</p><p className="text-2xl">{formatAmt(totalPaid)}</p></div><div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 shadow-sm"><p className="text-[10px] text-rose-500 uppercase mb-2 leading-none w-full">分攤總額</p><p className="text-2xl">{formatAmt(totalOwe)}</p></div></div>
<div className="space-y-6"><h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><Heart size={18} className="text-rose-500"/> 個人分攤紀錄</h4>
{history.shared.length === 0 ? <p className="text-base text-slate-300 px-2 py-4 font-bold text-center">無參與紀錄</p> :
history.shared.map((e, idx) => (
<div key={idx} className="p-6 bg-white rounded-3xl border border-slate-100 space-y-4 shadow-sm">
<div className="flex justify-between items-start"><div><p className="font-bold text-xl text-slate-800 leading-tight">{e.title}</p><p className="text-xs text-slate-400 font-bold uppercase mt-1.5">{e.date} • {e.category}</p></div><p className="font-black text-2xl text-rose-500">-{formatAmt(parseFloat(e.personalShare))}</p></div>
<div className="pt-4 border-t border-slate-50 space-y-2"><p className="text-xs text-slate-500 font-bold uppercase tracking-wide">買單人：<span className="text-indigo-600 font-black">{e.payerName}</span></p><p className="text-xs text-slate-300 font-bold uppercase">分攤夥伴：<span className="text-slate-500 truncate">{e.othersList}</span></p><div className="flex justify-end pt-1"><span className="text-[10px] text-slate-200 font-black uppercase">折合約 {baseCurrency} {formatAmt(e.personalBaseShare)}</span></div></div>
</div>
))}
</div>
</div>
</div>
</div>
);
}
​function ManageMembersModal({ members, expenses, onUpdate, onClose, onDeleteRequest, onAlert }) {
const [names, setNames] = useState([]);
const [input, setInput] = useState('');
const add = () => { if(input.trim()){ setNames([...names, input.trim()]); setInput(''); } };
const checkAndHandleDelete = (member) => {
const hasRecords = (expenses || []).some(exp => exp.payerId === member.id || exp.involvedSplits?.some(s => s.memberId === member.id));
if (hasRecords) onAlert(member); else onDeleteRequest(member);
};
return (
<div className="fixed inset-0 z-[600] flex items-center justify-center p-6 animate-in fade-in">
<div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
<div className="bg-white rounded-[2rem] p-10 w-full max-w-sm relative shadow-2xl space-y-8 animate-in zoom-in-95">
<div className="flex justify-between items-start"><div><h3 className="text-2xl font-black tracking-tight text-slate-800 leading-none">管理旅伴</h3><p className="text-slate-400 text-sm font-bold mt-2 leading-relaxed">移除成員或新增夥伴。</p></div><button onClick={onClose} className="p-3 bg-slate-50 rounded-full text-slate-300 active:scale-90 transition-colors"><X size={24}/></button></div>
<div className="space-y-6">
<div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto pr-2">{members.map(m => (<div key={m.id} className="px-4 py-2.5 bg-slate-50 rounded-full text-sm font-black text-slate-500 border border-slate-100 flex items-center gap-3">{m.name} <UserMinus size={18} className="text-rose-400 cursor-pointer active:scale-90" onClick={() => checkAndHandleDelete(m)} /></div>))}</div>
<div className="flex gap-3 w-full items-center"><input className="flex-1 min-w-0 p-5 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-600 transition-all text-lg shadow-inner placeholder:text-sm" placeholder="旅伴姓名" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} /><button onClick={add} className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 flex-shrink-0 transition-all"><Plus size={32} strokeWidth={4}/></button></div>
</div>
<button disabled={names.length === 0} onClick={() => { onUpdate([...members, ...names.map(n => ({ id: Math.random().toString(36).substring(2, 15), name: n }))]); setNames([]); onClose(); }} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-lg active:scale-95">更新旅伴名單</button>
</div>
</div>
);
}
​function ExpenseDetailModal({ expense, members, onClose, onEdit, onDelete }) {
const payer = members.find(m => m.id === expense.payerId);
const cat = CATEGORIES.find(c => c.id === expense.category) || CATEGORIES[5];
const sym = CURRENCIES.find(c => c.code === expense.currency)?.symbol || '$';
return (
<div className="fixed inset-0 z-[500] flex items-center justify-center p-6 animate-in fade-in">
<div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
<div className="bg-white rounded-3xl w-full max-w-sm relative shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
<div className={p-10 ${cat.color} flex justify-between items-start shadow-inner}><div><div className="flex items-center gap-2 text-white/80 font-black text-xs uppercase tracking-widest mb-2">{cat.icon} {expense.category}</div><h3 className="text-3xl font-black tracking-tight">{expense.title}</h3></div><button onClick={onClose} className="p-2 bg-white/20 rounded-full text-white active:scale-90"><X size={24}/></button></div>
<div className="p-10 space-y-8 flex-1 overflow-y-auto">
<div className="flex justify-between items-end border-b border-slate-50 pb-6"><div><p className="text-xs font-black text-slate-300 uppercase mb-2">總金額</p><p className="text-4xl font-black tabular-nums text-slate-800">{sym}{parseFloat(expense.amount).toLocaleString()}</p></div><div className="text-right"><p className="text-xs font-black text-slate-300 uppercase mb-2">日期</p><p className="text-base font-bold text-slate-500">{expense.date}</p></div></div>
<div className="space-y-6">
<div className="flex items-center gap-4 bg-slate-50 p-5 rounded-3xl"><div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-sm">{payer?.name[0]}</div><div><p className="text-xs font-black text-slate-300 uppercase leading-none">付款者</p><p className="text-xl font-black text-slate-800 leading-none mt-1.5">{payer?.name}</p></div></div>
<div className="space-y-4"><p className="text-xs font-black text-slate-300 uppercase tracking-widest px-1">成員分攤明細</p><div className="space-y-3">{(expense.involvedSplits || []).map(s => (<div key={s.memberId} className="flex justify-between items-center bg-white border border-slate-100 p-5 rounded-3xl shadow-sm text-sm"><span className="font-bold text-slate-700 text-lg">{members.find(m => m.id === s.memberId)?.name}</span><span className="font-black tabular-nums text-indigo-600 text-xl">{sym}{s.amount}</span></div>))}</div></div>
</div>
</div>
<div className="p-8 bg-slate-50 flex gap-4"><button onClick={() => onDelete()} className="p-5 bg-rose-50 text-rose-500 rounded-2xl active:scale-95 transition-all shadow-sm"><Trash2 size={28}/></button><button onClick={onEdit} className="flex-1 py-5 bg-indigo-500 text-white rounded-2xl font-black text-xl active:scale-95 shadow-md flex items-center justify-center gap-3 transition-all"><Edit3 size={20}/> 編輯</button></div>
</div>
</div>
);
}
