// Transactions: localStorage-backed tracker with category management
(function(){
    const STORAGE_KEY = 'bp_transactions_v1';
    const CAT_KEY = 'bp_categories_v1';
    const DEFAULT_CATEGORIES = ['Groceries','Utilities','Rent','Food','Transport','Entertainment','Education','Household','Other'];
    const EXPENSES_HOMEMAKER = ['Food & Groceries','Housing & Utilities','Education & Childcare','Healthcare','Transport','Personal Care & Household Needs','Savings & Investments','Discretionary & Lifestyle','Other'];
    const EXPENSES_STUDENT = ['Accommodation (Hostel/PG rent)','Food & Mess Charges','Utilities (electricity, water, internet, mobile)','Education (tuition fees, books, stationery)','Transport (public transport, fuel, ride-hailing)','Personal Care (clothing, toiletries, grooming)','Healthcare (medicines, doctor visits, insurance)','Entertainment & Socializing','Travel (visits home, trips, excursions)','Miscellaneous'];
    const INCOME_HOMEMAKER = ['Freelancing & Remote Work','Tutoring & Coaching','Small Business & Entrepreneurship','Digital Ventures','Affiliate Marketing & E-commerce','Passive Income','Spouse Support'];
    const INCOME_STUDENT = ['Part-time Jobs & Internships','Freelancing','Digital Content Creation','Affiliate Marketing','Online Courses & Digital Products','Scholarships & Stipends','Passive Income','Parents Support'];

    const form = document.getElementById('txForm');
    const tableBody = document.querySelector('#txTable tbody');
    const personSummaryEl = document.getElementById('personSummary');
    const categorySummaryEl = document.getElementById('categorySummary');
    const categorySelect = document.getElementById('category');
    const personTypeSelect = document.getElementById('personType');
    const newCatInput = document.getElementById('newCategoryInput');
    const addCatBtn = document.getElementById('addCategoryBtn');
    const categoryList = document.getElementById('categoryList');

    function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

    function load() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){ return []; }
    }
    function save(items){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

    function loadCats(){
        try{
            const c = JSON.parse(localStorage.getItem(CAT_KEY) || 'null');
            if(Array.isArray(c) && c.length) return c;
        }catch(e){}
        localStorage.setItem(CAT_KEY, JSON.stringify(DEFAULT_CATEGORIES.slice()));
        return DEFAULT_CATEGORIES.slice();
    }
    function saveCats(arr){ localStorage.setItem(CAT_KEY, JSON.stringify(arr)); }

    function formatAmt(v){ return Number(v).toFixed(2); }

    function populateCategorySelect(){
        updateCategoryOptions();
    }

    function updateCategoryOptions(){
        const stored = loadCats();
        const txType = (document.getElementById('type') && document.getElementById('type').value) || 'expense';
        const personRole = (personTypeSelect && personTypeSelect.value) || 'Homemaker';
        categorySelect.innerHTML = '';

        if(txType === 'income'){
            const incomeList = personRole === 'Student' ? INCOME_STUDENT : INCOME_HOMEMAKER;
            const label = personRole === 'Student' ? 'Income - Student' : 'Income - Homemaker';
            const ig = document.createElement('optgroup'); ig.label = label;
            incomeList.forEach(c=> { const o = document.createElement('option'); o.value = c; o.textContent = c; ig.appendChild(o); });
            categorySelect.appendChild(ig);
            return;
        }

        // expense categories depend on selected person role
        const list = personRole === 'Student' ? EXPENSES_STUDENT : EXPENSES_HOMEMAKER;
        const seen = new Set();
        list.forEach(c=>{ seen.add(c); const o = document.createElement('option'); o.value = c; o.textContent = c; categorySelect.appendChild(o); });

        // add any stored custom categories not already present
        stored.forEach(c=>{ if(!seen.has(c)){ const o = document.createElement('option'); o.value = c; o.textContent = c; categorySelect.appendChild(o); } });
    }

    function renderCategoryList(){
        const cats = loadCats();
        if(!cats.length){ categoryList.innerHTML = '<small>No categories</small>'; return; }
        categoryList.innerHTML = cats.map(c=> `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px dashed #f0f0f0;"><span>${escapeHtml(c)}</span><button data-cat="${escapeHtml(c)}" class="delete-cat" style="background:none;border:none;color:#c33;cursor:pointer">Remove</button></div>`).join('');
    }

    function render() {
        populateCategorySelect();
        const items = load().sort((a,b)=> new Date(b.date) - new Date(a.date));
        tableBody.innerHTML = '';
        items.forEach(tx => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${tx.date}</td>
                <td><a href="budget.html?person=${encodeURIComponent(tx.person)}" style="color:#667eea;cursor:pointer;text-decoration:none;" title="View budget for ${escapeHtml(tx.person)}">${escapeHtml(tx.person)}</a> <small style="color:#666;">(${escapeHtml(tx.personType||'')})</small></td>
                <td>${tx.type}</td>
                <td>${escapeHtml(tx.category)}</td>
                <td style="padding-right:0.5rem;">${tx.type==='expense' ? '-' : '+'}${formatAmt(tx.amount)}</td>
                <td><button data-id="${tx.id}" class="delete-btn">Delete</button></td>
            `;
            tableBody.appendChild(tr);
        });
        renderSummaries(items);
    }

    function renderSummaries(items){
        const byPersonExpInc = {};
        const personRoles = {};
        const byCategory = {};
        items.forEach(tx => {
            const amt = Number(tx.amount) || 0;
            const person = tx.person || 'Unknown';
            if(!byPersonExpInc[person]) byPersonExpInc[person] = { expense: 0, income: 0 };
            if(tx.type === 'expense') byPersonExpInc[person].expense += amt;
            else byPersonExpInc[person].income += amt;
            if(tx.personType) personRoles[person] = tx.personType;
            const key = tx.category || 'Other';
            const signed = tx.type === 'expense' ? -amt : amt;
            byCategory[key] = (byCategory[key]||0) + signed;
        });

        personSummaryEl.innerHTML = Object.keys(byPersonExpInc).length ? Object.entries(byPersonExpInc).map(([p,v])=>{
            const role = personRoles[p] ? ` <small style="color:#666">(${escapeHtml(personRoles[p])})</small>` : '';
            const netBalance = v.income - v.expense;
            const balanceColor = netBalance < 0 ? '#f5576c' : '#4CAF50';
            return `<div style="padding:8px 0;border-bottom:1px dashed #eee;"><a href="budget.html?person=${encodeURIComponent(p)}" style="color:#667eea;cursor:pointer;text-decoration:none;" title="View budget"><strong>${escapeHtml(p)}${role}</strong></a><div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-top:4px;"><span>Expense: <strong style="color:#f5576c;">₹${formatAmt(v.expense)}</strong></span><span>Income: <strong style="color:#4CAF50;">₹${formatAmt(v.income)}</strong></span><span>Balance: <strong style="color:${balanceColor};">₹${formatAmt(netBalance)}</strong></span></div></div>`
        }).join('') : '<p>No transactions yet.</p>';

        // Calculate expense and income by category
        const byCategoryExpInc = {};
        items.forEach(tx => {
            const key = tx.category || 'Other';
            if(!byCategoryExpInc[key]) byCategoryExpInc[key] = { expense: 0, income: 0 };
            const amt = Number(tx.amount) || 0;
            if(tx.type === 'expense') byCategoryExpInc[key].expense += amt;
            else byCategoryExpInc[key].income += amt;
        });

        categorySummaryEl.innerHTML = Object.keys(byCategoryExpInc).length ? Object.entries(byCategoryExpInc).map(([c,v])=>{
            const total = v.income - v.expense;
            const totalColor = total < 0 ? '#f5576c' : '#4CAF50';
            return `<div style="padding:8px 0;border-bottom:1px dashed #eee;"><strong>${escapeHtml(c)}</strong><div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-top:4px;"><span>Expense: <strong style="color:#f5576c;">₹${formatAmt(v.expense)}</strong></span><span>Income: <strong style="color:#4CAF50;">₹${formatAmt(v.income)}</strong></span><span>Total: <strong style="color:${totalColor};">₹${formatAmt(total)}</strong></span></div></div>`
        }).join('') : '<p>No transactions yet.</p>';
    }

    function escapeHtml(s){ return String(s).replace(/[&<>\"]+/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]||c)); }

    form.addEventListener('submit', function(e){
        e.preventDefault();
        const cat = (document.getElementById('category').value || 'Other');
        const txType = (document.getElementById('type').value || 'expense');
        // if expense and category not in stored list, add it
        if(txType === 'expense'){
            const cats = loadCats();
            if(cat && !cats.includes(cat)){
                cats.push(cat); saveCats(cats); 
            }
        }
        const tx = {
            id: uid(),
            person: (document.getElementById('person').value || 'Unknown').trim(),
            personType: (document.getElementById('personType') && document.getElementById('personType').value) || '',
            type: txType,
            category: cat,
            amount: Number(document.getElementById('amount').value) || 0,
            date: document.getElementById('date').value || new Date().toISOString().slice(0,10),
            note: document.getElementById('note').value || ''
        };
        const items = load();
        items.push(tx);
        save(items);
        form.reset();
        updateCategoryOptions(); render();
    });

    tableBody.addEventListener('click', function(e){
        if(e.target.matches('.delete-btn')){
            const id = e.target.getAttribute('data-id');
            let items = load();
            items = items.filter(i=> i.id !== id);
            save(items);
            render();
        }
    });

    // category add/remove handlers
    addCatBtn.addEventListener('click', function(){
        const v = (newCatInput.value || '').trim();
        if(!v) return;
        const cats = loadCats();
        if(cats.includes(v)){ newCatInput.value = ''; return; }
        cats.push(v); saveCats(cats); newCatInput.value = ''; updateCategoryOptions();
    });

    categoryList.addEventListener('click', function(e){
        if(e.target.matches('.delete-cat')){
            const cat = e.target.getAttribute('data-cat');
            const items = load();
            const used = items.some(i=> i.category === cat);
            if(used){ alert('Category is used by existing transactions and cannot be removed.'); return; }
            let cats = loadCats(); cats = cats.filter(c=> c !== cat); saveCats(cats); updateCategoryOptions();
        }
    });

    // update category options when person role or tx type changes
    if(personTypeSelect) personTypeSelect.addEventListener('change', function(){ updateCategoryOptions(); });
    const typeSelectEl = document.getElementById('type');
    if(typeSelectEl) typeSelectEl.addEventListener('change', function(){ updateCategoryOptions(); });

    // initial render
    render();
})();
