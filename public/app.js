const state={data:{categories:[],products:[],banners:[],settings:{}},cart:JSON.parse(localStorage.cart||'[]'),favorites:new Set(JSON.parse(localStorage.favs||'[]')),user:null,adminProducts:[],adminCategories:[],adminBanners:[]};
const $=s=>document.querySelector(s);
const money=n=>Number(n||0).toLocaleString('ar-IQ')+' '+(state.data.settings.currency||'د.ع');
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)};
function save(){localStorage.cart=JSON.stringify(state.cart);localStorage.favs=JSON.stringify([...state.favorites]);$('#cartCount').textContent=state.cart.reduce((a,x)=>a+x.qty,0)||''}
async function api(url,opt={}){const r=await fetch(url,{credentials:'include',...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'حدث خطأ');return d}
async function load(){state.data=await api('/api/store');render();try{state.user=(await api('/api/auth/me')).user}catch{}}
function render(){
 $('#storeName').textContent=state.data.settings.store_name||'سلة الفاكهة';
 renderBanners();renderCats();renderProducts(state.data.products);save();
}
function renderBanners(){
 const bs=state.data.banners;const el=$('#banners');el.innerHTML=(bs.length?bs:[{title_ar:'طازج كل يوم',subtitle_ar:'اختياراتك المفضلة تصل إلى بابك',image_url:''}]).map(b=>`
 <article class="banner">${b.image_url?`<img src="${b.image_url}">`:''}<div class="banner-content"><h2>${esc(b.title_ar)}</h2><p>${esc(b.subtitle_ar)}</p></div></article>`).join('');
 $('#dots').innerHTML=Array.from({length:bs.length||1},(_,i)=>`<i class="${i===0?'on':''}"></i>`).join('');
}
function renderCats(){
 $('#cats').innerHTML=state.data.categories.map(c=>`<div class="cat" onclick="filterCat(${c.id})"><div class="ci">${c.icon}</div><b>${esc(c.name_ar)}</b></div>`).join('');
}
function productCard(p){
 const sale=p.old_price&&Number(p.old_price)>Number(p.price);
 return `<article class="product"><button class="fav ${state.favorites.has(Number(p.id))?'on':''}" onclick="toggleFav(${p.id})">♥</button>
 ${sale?`<span class="badge">خصم ${Math.round((1-p.price/p.old_price)*100)}%</span>`:''}
 <div class="pimg">${p.image_url?`<img src="${p.image_url}" loading="lazy">`:`<div class="ph">🍎</div>`}</div>
 <h3>${esc(p.name_ar)}</h3><div class="desc">${esc(p.description_ar||p.unit||'')}</div>
 <div class="price"><b>${money(p.price)}</b>${sale?`<span class="old">${money(p.old_price)}</span>`:''}</div>
 <button class="add" onclick="addCart(${p.id})">أضف إلى السلة</button></article>`;
}
function renderProducts(list){
 const featured=list.filter(p=>p.featured).slice(0,10);
 $('#featuredSection').style.display=featured.length?'block':'none';
 $('#featured').innerHTML=featured.map(productCard).join('');
 $('#products').innerHTML=list.map(productCard).join('');
}
function filterCat(id){const list=state.data.products.filter(p=>Number(p.category_id)===Number(id));$('#products').innerHTML=list.map(productCard).join('');scrollTo({top:document.querySelector('#products').offsetTop-100,behavior:'smooth'})}
function addCart(id){const p=state.data.products.find(x=>Number(x.id)===Number(id));if(!p)return;const x=state.cart.find(x=>x.product_id==id);if(x)x.qty++;else state.cart.push({product_id:id,qty:1});save();toast('تمت إضافة المنتج إلى السلة')}
function toggleFav(id){id=Number(id);state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);save();renderProducts(state.data.products)}
function cartSheet(){
 const rows=state.cart.map(x=>{const p=state.data.products.find(p=>Number(p.id)===Number(x.product_id));return p?`<div class="cart-row"><div class="thumb">${p.image_url?`<img src="${p.image_url}">`:'🍎'}</div><div class="info"><b>${esc(p.name_ar)}</b><div>${money(p.price)}</div></div><div class="qty"><button onclick="changeQty(${p.id},-1)">−</button><b>${x.qty}</b><button onclick="changeQty(${p.id},1)">+</button></div></div>`:''}).join('');
 const sub=state.cart.reduce((a,x)=>{const p=state.data.products.find(p=>p.id==x.product_id);return a+(p?Number(p.price)*x.qty:0)},0);
 openSheet(`<button class="close" onclick="closeSheet()">×</button><h2>سلة المشتريات</h2>${rows||'<p>السلة فارغة.</p>'}${rows?`<div class="total"><span>المجموع</span><span>${money(sub)}</span></div><button class="primary" onclick="checkout()">متابعة الطلب</button>`:''}`);
}
function changeQty(id,d){const x=state.cart.find(x=>x.product_id==id);if(!x)return;x.qty+=d;if(x.qty<=0)state.cart=state.cart.filter(y=>y!==x);save();cartSheet()}
function checkout(){
 if(!state.cart.length)return;
 openSheet(`<button class="close" onclick="closeSheet()">×</button><h2>تأكيد الطلب</h2>
 <div class="field"><label>الاسم</label><input id="coName" value="${esc(state.user?.name||'')}"></div>
 <div class="field"><label>رقم الهاتف</label><input id="coPhone" value="${esc(state.user?.phone||'')}"></div>
 <div class="field"><label>عنوان التوصيل</label><textarea id="coAddress" placeholder="المنطقة، الشارع، أقرب نقطة دالة"></textarea></div>
 <div class="field"><label>طريقة الدفع</label><select id="coPay"><option value="cash">الدفع عند الاستلام</option></select></div>
 <div class="field"><label>ملاحظات</label><textarea id="coNotes"></textarea></div>
 <button class="primary" onclick="placeOrder()">إرسال الطلب</button>`);
}
async function placeOrder(){
 const payload={customer_name:$('#coName').value,customer_phone:$('#coPhone').value,address_text:$('#coAddress').value,payment_method:$('#coPay').value,notes:$('#coNotes').value,items:state.cart};
 try{const d=await api('/api/orders',{method:'POST',body:JSON.stringify(payload)});state.cart=[];save();closeSheet();toast(`تم إنشاء الطلب #${d.order.id}`)}catch(e){toast(e.message)}
}
function loginSheet(){
 openSheet(`<button class="close" onclick="closeSheet()">×</button><h2>${state.user?'حسابي':'تسجيل الدخول'}</h2>
 ${state.user?`<p>مرحباً ${esc(state.user.name)} 👋</p>${state.user.role==='admin'?'<button class="primary" onclick="admin()">لوحة الإدارة</button>':''}<button class="primary danger" onclick="logout()">تسجيل الخروج</button>`:
 `<div class="tabs"><button class="active" id="lt">دخول</button><button id="rt">حساب جديد</button></div><div id="authBox"></div>`}
 `);
 if(!state.user)authForm(false);
}
function authForm(register){
 $('#authBox').innerHTML=`<div class="field"><label>${register?'الاسم':'الهاتف / معرف الدخول'}</label><input id="aName" ${register?'':'style="display:none"'}></div>
 <div class="field"><label>رقم الهاتف</label><input id="aPhone"></div><div class="field"><label>كلمة المرور</label><input id="aPass" type="password"></div>
 <button class="primary" onclick="${register?'registerUser()':'loginUser()'}">${register?'إنشاء الحساب':'دخول'}</button>`;
 $('#lt').onclick=()=>{authForm(false);$('#lt').classList.add('active');$('#rt').classList.remove('active')};
 $('#rt').onclick=()=>{authForm(true);$('#rt').classList.add('active');$('#lt').classList.remove('active')};
}
async function loginUser(){try{const d=await api('/api/auth/login',{method:'POST',body:JSON.stringify({phone:$('#aPhone').value,password:$('#aPass').value})});state.user=d.user;closeSheet();toast('تم تسجيل الدخول')}catch(e){toast(e.message)}}
async function registerUser(){try{const d=await api('/api/auth/register',{method:'POST',body:JSON.stringify({name:$('#aName').value,phone:$('#aPhone').value,password:$('#aPass').value})});state.user=d.user;closeSheet();toast('تم إنشاء الحساب')}catch(e){toast(e.message)}}
async function logout(){await api('/api/auth/logout',{method:'POST'});state.user=null;closeSheet();toast('تم تسجيل الخروج')}
function ordersSheet(){
 if(!state.user){toast('سجل الدخول أولاً');return}
 api('/api/orders/mine').then(ds=>openSheet(`<button class="close" onclick="closeSheet()">×</button><h2>طلباتي</h2>${ds.map(o=>`<div class="admin-item"><div class="grow"><b>#${o.id}</b><div>${money(o.total)}</div><small>${new Date(o.created_at).toLocaleString('ar-IQ')}</small></div><span class="status">${statusAr(o.status)}</span></div>`).join('')||'<p>لا توجد طلبات.</p>'}`)).catch(e=>toast(e.message))
}
async function admin(){
 if(!state.user||state.user.role!=='admin'){loginSheet();return}
 const [ps,cs,bs]=await Promise.all([api('/api/admin/products'),api('/api/admin/categories'),api('/api/admin/banners')]);
 state.adminProducts=ps;state.adminCategories=cs;state.adminBanners=bs;
 openSheet(`<button class="close" onclick="closeSheet()">×</button><h2>لوحة إدارة سلة الفاكهة</h2>
 <div class="tabs"><button onclick="adminProducts()">المنتجات</button><button onclick="adminCats()">الأقسام</button><button onclick="adminBanners()">العروض</button><button onclick="adminOrders()">الطلبات</button></div><div id="adminBox"></div>`);
 adminProducts();
}
function adminProducts(){
 $('#adminBox').innerHTML=`<button class="primary" onclick="productForm()">+ إضافة منتج</button><div class="admin-list">${state.adminProducts.map(p=>`<div class="admin-item"><div class="grow"><b>${esc(p.name_ar)}</b><div>${money(p.price)} · المخزون ${p.stock}</div></div><button onclick="productForm(${p.id})">تعديل</button><button onclick="deleteProduct(${p.id})">حذف</button></div>`).join('')}</div>`;
}
function productForm(id){
 const p=state.adminProducts.find(x=>x.id==id)||{};
 $('#adminBox').innerHTML=`<h3>${id?'تعديل المنتج':'إضافة منتج'}</h3>
 <div class="field"><label>اسم المنتج</label><input id="pn" value="${esc(p.name_ar||'')}"></div>
 <div class="field"><label>الوصف</label><textarea id="pd">${esc(p.description_ar||'')}</textarea></div>
 <div class="field"><label>القسم</label><select id="pc">${state.adminCategories.map(c=>`<option value="${c.id}" ${c.id==p.category_id?'selected':''}>${esc(c.name_ar)}</option>`).join('')}</select></div>
 <div class="field"><label>السعر</label><input id="pp" type="number" value="${p.price||0}"></div>
 <div class="field"><label>السعر القديم (اختياري)</label><input id="po" type="number" value="${p.old_price||''}"></div>
 <div class="field"><label>المخزون</label><input id="ps" type="number" value="${p.stock||0}"></div>
 <div class="field"><label>صورة المنتج</label><input id="pi" type="file" accept="image/*"></div>
 <label><input id="pf" type="checkbox" ${p.featured?'checked':''}> الأكثر طلباً</label>
 <button class="primary" onclick="saveProduct(${id||0})">حفظ المنتج</button>`;
}
async function saveProduct(id){
 try{
  let image_url=state.adminProducts.find(x=>x.id==id)?.image_url||null;
  if($('#pi').files[0]){const fd=new FormData();fd.append('image',$('#pi').files[0]);const r=await fetch('/api/admin/upload',{method:'POST',body:fd,credentials:'include'});const d=await r.json();if(!r.ok)throw Error(d.error);image_url=d.url}
  const body={name_ar:$('#pn').value,description_ar:$('#pd').value,category_id:Number($('#pc').value),price:Number($('#pp').value),old_price:$('#po').value?Number($('#po').value):null,stock:Number($('#ps').value),featured:$('#pf').checked,active:true,image_url};
  await api(id?`/api/admin/products/${id}`:'/api/admin/products',{method:id?'PUT':'POST',body:JSON.stringify(body)});
  toast('تم الحفظ');admin();
 }catch(e){toast(e.message)}
}
async function deleteProduct(id){if(!confirm('حذف المنتج؟'))return;await api('/api/admin/products/'+id,{method:'DELETE'});admin()}
function adminCats(){
 $('#adminBox').innerHTML=`<button class="primary" onclick="catForm()">+ إضافة قسم</button><div class="admin-list">${state.adminCategories.map(c=>`<div class="admin-item"><b>${c.icon}</b><div class="grow">${esc(c.name_ar)}</div><button onclick="catForm(${c.id})">تعديل</button><button onclick="deleteCat(${c.id})">حذف</button></div>`).join('')}</div>`;
}
function catForm(id){
 const c=state.adminCategories.find(x=>x.id==id)||{};
 $('#adminBox').innerHTML=`<div class="field"><label>اسم القسم</label><input id="cn" value="${esc(c.name_ar||'')}"></div><div class="field"><label>الأيقونة</label><input id="ci" value="${esc(c.icon||'🍎')}"></div><div class="field"><label>الترتيب</label><input id="co" type="number" value="${c.sort_order||0}"></div><button class="primary" onclick="saveCat(${id||0})">حفظ</button>`;
}
async function saveCat(id){const body={name_ar:$('#cn').value,icon:$('#ci').value,sort_order:Number($('#co').value),active:true};await api(id?'/api/admin/categories/'+id:'/api/admin/categories',{method:id?'PUT':'POST',body:JSON.stringify(body)});admin()}
async function deleteCat(id){if(confirm('حذف القسم؟')){await api('/api/admin/categories/'+id,{method:'DELETE'});admin()}}
function adminBanners(){
 $('#adminBox').innerHTML=`<button class="primary" onclick="bannerForm()">+ إضافة عرض</button><div class="admin-list">${state.adminBanners.map(b=>`<div class="admin-item"><div class="grow"><b>${esc(b.title_ar)}</b><small>${esc(b.subtitle_ar)}</small></div><button onclick="deleteBanner(${b.id})">حذف</button></div>`).join('')}</div>`;
}
function bannerForm(){
 $('#adminBox').innerHTML=`<div class="field"><label>عنوان العرض</label><input id="bt"></div><div class="field"><label>النص</label><input id="bs"></div><div class="field"><label>الصورة</label><input id="bi" type="file" accept="image/*"></div><button class="primary" onclick="saveBanner()">حفظ العرض</button>`;
}
async function saveBanner(){try{const fd=new FormData();fd.append('image',$('#bi').files[0]);const r=await fetch('/api/admin/upload',{method:'POST',body:fd,credentials:'include'});const d=await r.json();if(!r.ok)throw Error(d.error);await api('/api/admin/banners',{method:'POST',body:JSON.stringify({title_ar:$('#bt').value,subtitle_ar:$('#bs').value,image_url:d.url,sort_order:0})});admin()}catch(e){toast(e.message)}}
async function deleteBanner(id){if(confirm('حذف العرض؟')){await api('/api/admin/banners/'+id,{method:'DELETE'});admin()}}
async function adminOrders(){const os=await api('/api/admin/orders');$('#adminBox').innerHTML=`<div class="admin-list">${os.map(o=>`<div class="admin-item"><div class="grow"><b>#${o.id} · ${esc(o.customer_name)}</b><div>${money(o.total)} · ${esc(o.customer_phone)}</div><small>${esc(o.address_text)}</small></div><select onchange="setStatus(${o.id},this.value)">${['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'].map(s=>`<option ${o.status===s?'selected':''} value="${s}">${statusAr(s)}</option>`).join('')}</select></div>`).join('')||'<p>لا توجد طلبات.</p>'}`;}
async function setStatus(id,status){await api('/api/admin/orders/'+id+'/status',{method:'PUT',body:JSON.stringify({status})});toast('تم تحديث حالة الطلب')}
function openSheet(html){$('#sheet').innerHTML=html;$('#modal').classList.remove('hidden')}
function closeSheet(){$('#modal').classList.add('hidden')}
function statusAr(s){return {pending:'قيد المراجعة',confirmed:'تم التأكيد',preparing:'قيد التجهيز',out_for_delivery:'خرج للتوصيل',delivered:'تم التسليم',cancelled:'ملغي'}[s]||s}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

$('#cartNav').onclick=cartSheet;$('#loginBtn').onclick=loginSheet;$('#locationBtn').onclick=()=>openSheet(`<button class="close" onclick="closeSheet()">×</button><h2>عنوان التوصيل</h2><p>اكتب عنوانك بالتفصيل حتى يصل الطلب بسهولة.</p><div class="field"><label>العنوان</label><textarea id="addr"></textarea></div><button class="primary" onclick="$('#addressLabel').textContent=$('#addr').value||'أضف عنوان التوصيل';closeSheet()">حفظ العنوان</button>`);
$('[data-tab="orders"]').onclick=ordersSheet;$('[data-tab="favorites"]').onclick=()=>{const a=state.data.products.filter(p=>state.favorites.has(Number(p.id)));openSheet(`<button class="close" onclick="closeSheet()">×</button><h2>المفضلة</h2><div class="products grid">${a.map(productCard).join('')||'<p>لا توجد منتجات مفضلة.</p>'}</div>`)};
$('#search').oninput=e=>{const q=e.target.value.trim();renderProducts(state.data.products.filter(p=>(p.name_ar+' '+p.description_ar).includes(q)))};
$('#allCats').onclick=()=>toast('مرر الأقسام أفقياً لاختيار القسم');
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});
load();
