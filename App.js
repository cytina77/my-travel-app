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
​// ✅ 已填入您專屬的 Firebase 設定
const firebaseConfig = {
apiKey: "AIzaSyAXrK9th0TmDlVuyeQjF8y_II21x24IBhY",
authDomain: "my-travel-splitter.firebaseapp.com",
projectId: "my-travel-splitter",
storageBucket: "my-travel-splitter.firebasestorage.app",
messagingSenderId: "610664442521",
appId: "1:610664442521:web:aac6f099133bf14576e608",
measurementId: "G-RLP8MNM7W2"
};
​// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
​// ✅ 建議將 appId 設定為一個固定的英文名稱，這樣大家登入後看到的資料才會一致
const appId = 'my-trip-group-2024';
​const CURRENCIES = [
{ code: 'TWD', symbol: '', name: '台幣', weight: 1 },
{ code: 'AUD', symbol: '', name: '澳幣', weight: 21.2 },
{ code: 'JPY', symbol: '¥', name: '日圓', weight: 0.21 },
{ code: 'USD', symbol: '', name: '美金', weight: 32.5 },
{ code: 'HKD', symbol: '', name: '港幣', weight: 4.15 },
{ code: 'KRW', symbol: '₩', name: '韓元', weight: 0.024 },
{ code: 'EUR', symbol: '€', name: '歐元', weight: 35.5 },
];
​const CATEGORIES = [
{ id: '飲食', icon: <Utensils size={18} />, color: 'bg-orange-500 text-white' },
{ id: '住宿', icon: <Home size={18} />, color: 'bg-indigo-500 text-white' },
{ id: '機票', icon: <Plane size={18} />, color: 'bg-sky-500 text-white' },
{ id: '交通', icon: <Car size={18} />, color: 'bg-emerald-500 text-white' },
{ id: '購物', icon: <ShoppingBag size={18} />, color: 'bg-rose-500 text-white' },
{ id: '其他', icon: <Tag size={18} />, color: 'bg-slate-500 text-white' },
];
​const formatAmt = (num) => {
if (num === null || isNaN(num)) return "0";
return Number(Math.round(num * 100) / 100).toLocaleString(undefined, {
minimumFractionDigits: 0,
maximumFractionDigits: 2
});
};
​export default function App() {
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
​const [historyTrips, setHistoryTrips] = useState(() => {
try { return JSON.parse(localStorage.getItem('travel_history_v40') || '[]'); } catch { return []; }
});
​useEffect(() => {
const initAuth = async () => {
try {
await signInAnonymously(auth);
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
​useEffect(() => {
if (!groupId || !user) return;
const groupRef = doc(db, 'artifacts', appId, 'public', 'data', 'groups', groupId);
const unsubscribe = onSnapshot(groupRef, (docSnap) => {
if (docSnap.exists()) {
const data = docSnap.data();
setGroup(data);
setHistoryTrips(prev => {
const filtered = prev.filter(t => t.id !== groupId);
const updated = [{ id: groupId, name: data.name, date: Date.now() }, ...filtered].slice(0, 15);
localStorage.setItem('travel_history_v40', JSON.stringify(updated));
return updated;
});
if (view === 'loading') setView('list');
} else {
handleExitGroup();
}
}, () => { handleExitGroup(); });
return () => unsubscribe();
}, [groupId, user]);
​const handleExitGroup = () => {
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
​const createGroup = async (name, members, baseCurrency) => {
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
​const handleSaveExpense = async (data) => {
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
} catch (err) { setError("儲存失敗"); }
finally { setIsSubmitting(false); }
};
​const { totalInBase, transfers, balances, memberHistory } = useMemo(() => {
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
