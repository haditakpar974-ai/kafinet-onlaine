const $ = (id) => document.getElementById(id);
const menuToggle = $('menuToggle');
const mainNav = $('mainNav');
menuToggle?.addEventListener('click', () => {
  const opened = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(opened));
});
mainNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mainNav.classList.remove('open'); menuToggle?.setAttribute('aria-expanded', 'false');
}));
$('year').textContent = new Date().getFullYear();
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
  const select = $('service'); if (select) select.value = link.dataset.service;
}));

const configReady = window.SUPABASE_URL && window.SUPABASE_ANON_KEY &&
  !window.SUPABASE_URL.includes('YOUR-PROJECT') && !window.SUPABASE_ANON_KEY.includes('YOUR_');
const supabase = configReady && window.supabase ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
let currentUser = null;
const statusLabels = {received:'دریافت شد', reviewing:'در حال بررسی', in_progress:'در حال انجام', completed:'تکمیل شد', rejected:'نیازمند پیگیری'};
const statusOptions = Object.entries(statusLabels).map(([v,l]) => `<option value="${v}">${l}</option>`).join('');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function showAuth(){ $('authModal').classList.remove('hidden'); $('authEmail').focus(); }
function hideAuth(){ $('authModal').classList.add('hidden'); }
$('openAuth').addEventListener('click', showAuth); $('authFromForm').addEventListener('click', showAuth);
$('closeAuth').addEventListener('click', hideAuth); $('authModal').addEventListener('click', e => { if(e.target === $('authModal')) hideAuth(); });
function setMessage(id, msg, bad=false){ const el=$(id); el.textContent=msg; el.classList.toggle('error',bad); }
function updateAccountUI(){
  $('openAuth').classList.toggle('hidden', !!currentUser);
  $('openDashboard').classList.toggle('hidden', !currentUser);
  $('authRequired').classList.toggle('hidden', !!currentUser);
  $('submitOrder').disabled = !currentUser;
  $('userEmail').textContent = currentUser?.email || '';
}
async function loadOrders(){
  if(!supabase || !currentUser) return;
  $('ordersList').innerHTML = '<p>در حال دریافت سفارش‌ها...</p>';
  const {data: orders,error} = await supabase.from('orders').select('*').order('created_at',{ascending:false});
  if(error){ $('ordersList').textContent='دریافت سفارش‌ها ناموفق بود: '+error.message; return; }
  if(!orders.length){ $('ordersList').innerHTML='<div class="empty-state">هنوز سفارشی ثبت نکرده‌اید.</div>'; return; }
  const isAdmin = currentUser.app_metadata?.role === 'admin';
  $('adminTools').classList.toggle('hidden',!isAdmin);
  $('ordersList').innerHTML = orders.map(o => `<article class="order-card"><div class="order-top"><div><span class="order-code">کد رهگیری: <b>${escapeHtml(o.tracking_code)}</b></span><small>${new Date(o.created_at).toLocaleString('fa-IR')}</small></div><span class="order-status">${escapeHtml(statusLabels[o.status]||o.status)}</span></div><h3>${escapeHtml(o.service)}</h3><p>${escapeHtml(o.details||'بدون توضیحات')}</p>${isAdmin?`<div class="admin-update"><label>تغییر وضعیت <select data-order-status="${o.id}">${Object.entries(statusLabels).map(([v,l])=>`<option value="${v}" ${o.status===v?'selected':''}>${l}</option>`).join('')}</select></label><button class="btn btn-primary" data-save-status="${o.id}">ذخیره وضعیت</button></div>`:''}</article>`).join('');
  $('ordersList').querySelectorAll('[data-save-status]').forEach(btn=>btn.addEventListener('click',async()=>{
    const id=btn.dataset.saveStatus, status=$('ordersList').querySelector(`[data-order-status="${id}"]`).value;
    btn.disabled=true; const {error}=await supabase.from('orders').update({status}).eq('id',id);
    if(error) alert('ذخیره انجام نشد: '+error.message); else await loadOrders(); btn.disabled=false;
  }));
}
async function openDashboard(){
  if(!currentUser){showAuth();return;}
  $('dashboardSection').classList.remove('hidden'); $('dashboardSection').scrollIntoView({behavior:'smooth'}); await loadOrders();
}
$('openDashboard').addEventListener('click',openDashboard); $('refreshOrders').addEventListener('click',loadOrders);
$('signOut').addEventListener('click',async()=>{await supabase.auth.signOut(); currentUser=null; updateAccountUI(); $('dashboardSection').classList.add('hidden'); setMessage('formMessage','از حساب خارج شدید.');});
$('loginButton').addEventListener('click', async e=>{e.preventDefault(); await authAction('login');});
$('signupButton').addEventListener('click', async()=>{await authAction('signup');});
async function authAction(mode){
  if(!supabase){setMessage('authMessage','اتصال پایگاه داده هنوز تنظیم نشده است. ابتدا راهنمای README و فایل supabase-config.js را تکمیل کنید.',true);return;}
  const email=$('authEmail').value.trim(), password=$('authPassword').value;
  setMessage('authMessage','در حال انجام...');
  const result = mode==='signup' ? await supabase.auth.signUp({email,password}) : await supabase.auth.signInWithPassword({email,password});
  if(result.error){setMessage('authMessage',result.error.message,true);return;}
  if(mode==='signup' && !result.data.session){setMessage('authMessage','حساب ساخته شد. ایمیل خود را برای تأیید باز کنید، سپس وارد شوید.');return;}
  currentUser=result.data.user; updateAccountUI(); hideAuth(); setMessage('authMessage','ورود موفق بود.');
}
if(supabase){
  supabase.auth.getSession().then(({data})=>{currentUser=data.session?.user||null;updateAccountUI();});
  supabase.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;updateAccountUI();});
} else {
  $('submitOrder').disabled=true;
  $('formMessage').textContent='برای فعال شدن ثبت‌نام، ورود و ذخیره سفارش‌ها، اتصال Supabase را طبق فایل README تنظیم کنید.';
}

$('requestForm').addEventListener('submit', async event=>{
  event.preventDefault();
  if(!supabase){setMessage('formMessage','پایگاه داده هنوز راه‌اندازی نشده است.',true);return;}
  if(!currentUser){showAuth();return;}
  const form=new FormData(event.currentTarget), phone=String(form.get('phone')||'').replace(/[\s-]/g,'');
  if(!/^(\+98|0)?9\d{9}$/.test(phone)){setMessage('formMessage','شماره موبایل معتبر وارد کنید.',true);return;}
  const button=$('submitOrder');button.disabled=true;button.textContent='در حال ثبت سفارش...';
  const {data,error}=await supabase.rpc('create_order',{p_name:String(form.get('name')),p_phone:phone,p_service:String(form.get('service')),p_details:String(form.get('details')||'')});
  if(error){setMessage('formMessage','ثبت سفارش انجام نشد: '+error.message,true);} else {
    const order=Array.isArray(data)?data[0]:data;
    setMessage('formMessage',`سفارش با موفقیت ثبت شد. کد رهگیری شما: ${order.tracking_code} — این کد را نگه دارید.`);
    event.currentTarget.reset(); await openDashboard();
  }
  button.disabled=false;button.innerHTML='ثبت سفارش و دریافت کد رهگیری <span>←</span>';
});
