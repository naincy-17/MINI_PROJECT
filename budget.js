// Budget: localStorage-backed category budget tracking with transaction integration + income targets
(function(){
    const BUDGET_KEY = 'bp_budgets_v1';
    const INCOME_BUDGET_KEY = 'bp_income_budgets_v1';
    const TX_KEY = 'bp_transactions_v1';
    const CAT_KEY = 'bp_categories_v1';
    const INCOME_HOMEMAKER = ['Freelancing & Remote Work','Tutoring & Coaching','Small Business & Entrepreneurship','Digital Ventures','Affiliate Marketing & E-commerce','Passive Income','Spouse Support'];
    const INCOME_STUDENT = ['Part-time Jobs & Internships','Freelancing','Digital Content Creation','Affiliate Marketing','Online Courses & Digital Products','Scholarships & Stipends','Passive Income','Parents Support'];



    let currentTab = 'expense';
    let selectedPerson = '';

    // Get person from URL parameter
    function getUrlParam(param) {
        const params = new URLSearchParams(window.location.search);
        return params.get(param) || '';
    }

    const personDetailsSection = document.getElementById('personDetailsSection');
    const detailName = document.getElementById('detailName');
    const detailRole = document.getElementById('detailRole');
    const detailTxCount = document.getElementById('detailTxCount');
    const detailExpense = document.getElementById('detailExpense');
    const detailIncome = document.getElementById('detailIncome');
    const detailBalance = document.getElementById('detailBalance');
    const personSelector = document.getElementById('personSelector');

    function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
    function loadBudgets() { try { return JSON.parse(localStorage.getItem(BUDGET_KEY) || '[]'); } catch(e){ return []; } }
    function saveBudgets(arr){ localStorage.setItem(BUDGET_KEY, JSON.stringify(arr)); }
    function loadTx() { try { return JSON.parse(localStorage.getItem(TX_KEY) || '[]'); } catch(e){ return []; } }
    function formatAmt(v){ return '₹' + Number(v).toFixed(2); }
    function escapeHtml(s){ return String(s).replace(/[&<>"]+/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]||c)); }



    function getAllPeople() {
        const tx = loadTx();
        const people = new Set();
        tx.forEach(t => { if(t.person) people.add(t.person); });
        return Array.from(people).sort();
    }

    function populatePersonSelector() {
        const people = getAllPeople();
        personSelector.innerHTML = '<option value="">-- Select a Person --</option>';
        people.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            personSelector.appendChild(opt);
        });
    }

    function getPersonDetails(person) {
        if(!person) return null;
        const tx = loadTx();
        const personTx = tx.filter(t => t.person === person);
        if(personTx.length === 0) return null;
        
        let role = '';
        let totalTx = personTx.length;
        let totalExpense = 0;
        let totalIncome = 0;
        
        personTx.forEach(t => {
            if(t.personType && !role) role = t.personType;
            const amt = Number(t.amount) || 0;
            if(t.type === 'expense') totalExpense += amt;
            else totalIncome += amt;
        });
        
        return { person, role, totalTx, totalExpense, totalIncome, netBalance: totalIncome - totalExpense };
    }

    function renderPersonDetails() {
        if(!selectedPerson) {
            personDetailsSection.style.display = 'none';
            return;
        }
        
        const details = getPersonDetails(selectedPerson);
        if(!details) {
            personDetailsSection.style.display = 'none';
            return;
        }
        
        personDetailsSection.style.display = 'block';
        detailName.textContent = details.person;
        detailRole.textContent = details.role || '-';
        detailTxCount.textContent = details.totalTx;
        detailExpense.textContent = formatAmt(details.totalExpense);
        detailIncome.textContent = formatAmt(details.totalIncome);
        detailBalance.textContent = formatAmt(details.netBalance);
        
        if(details.netBalance < 0) {
            detailBalance.style.color = '#f5576c';
        } else {
            detailBalance.style.color = '#4CAF50';
        }
    }



    function render(){ 
        populatePersonSelector();
        renderPersonDetails();
    }

    // Load person from URL parameter on page load
    const urlPerson = getUrlParam('person');
    if(urlPerson) {
        selectedPerson = urlPerson;
    }

    // Person selector
    personSelector.addEventListener('change', function(){ selectedPerson = this.value; render(); });

    render();
    
    // Set the selected value after options are populated
    if(selectedPerson) {
        personSelector.value = selectedPerson;
    }
})();
