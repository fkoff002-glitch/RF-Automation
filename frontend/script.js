class RFManager {
    constructor() {
        this.links = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.searchTerm = '';
        this.API_URL = "/api/inventory";
        this.DIAG_URL = "/api/diagnose";

        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.updateStats();
    }

    async loadData() {
        try {
            const response = await fetch(this.API_URL);
            this.links = await response.json();
            this.renderTable();
            this.updateStats();
        } catch (error) {
            console.error("Connection Error:", error);
            document.getElementById('tableBody').innerHTML = `<tr><td colspan="9" style="text-align:center; color:red;">Backend Offline</td></tr>`;
        }
    }

    async saveData() {
        try {
            await fetch(this.API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(this.links)
            });
        } catch (error) {
            alert("Failed to save data to server!");
        }
    }

    renderTable() {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        const filteredLinks = this.getFilteredLinks();
        const paginatedLinks = this.getPaginatedLinks(filteredLinks);

        paginatedLinks.forEach(link => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${link.Link_ID}</td>
                <td>${link.POP_Name}</td>
                <td>${link.BTS_Name}</td>
                <td style="font-weight:600">${link.Client_Name}</td>
                <td>${link.Base_IP}</td>
                <td>${link.Client_IP}</td>
                <td>${link.Loopback_IP || '-'}</td>
                <td>${link.Location}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn diag" onclick="window.app.runDiagnostics('${link.Client_IP}', '${link.Client_Name}')" title="Check Status">
                            <i class="fas fa-bolt"></i>
                        </button>
                        <button class="action-btn edit" data-id="${link.Link_ID}"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" data-id="${link.Link_ID}"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        this.updatePagination(filteredLinks.length);
    }

    // --- DIAGNOSTICS LOGIC ---
    async runDiagnostics(ip, name) {
        // Open Modal
        const modal = document.getElementById('diagModal');
        const content = document.getElementById('diagContent');
        modal.style.display = 'block';
        content.innerHTML = `<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Scanning ${ip}...</div>`;

        try {
            const res = await fetch(this.DIAG_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ ip: ip, name: name })
            });
            const data = await res.json();
            
            // Render Result
            let color = data.final_status.includes("UP") ? "#28a745" : (data.final_status.includes("UNSTABLE") ? "#ffc107" : "#dc3545");
            
            content.innerHTML = `
                <div style="text-align:center; margin-bottom:20px;">
                    <h2 style="color:${color};">${data.final_status}</h2>
                    <p>${data.cause}</p>
                </div>
                <table style="width:100%; border-collapse:collapse;">
                    <tr style="background:#f8f9fa; border-bottom:1px solid #ddd;">
                        <th style="padding:8px; text-align:left;">Target</th>
                        <th style="padding:8px; text-align:left;">Status</th>
                        <th style="padding:8px; text-align:left;">Signal</th>
                    </tr>
                    ${data.steps.map(s => `
                        <tr style="border-bottom:1px solid #eee;">
                            <td style="padding:8px;">${s.target}</td>
                            <td style="padding:8px; font-weight:bold; color:${s.status==='UP'?'green':'red'}">${s.status}</td>
                            <td style="padding:8px;">${s.data.rssi || '-'}</td>
                        </tr>
                    `).join('')}
                </table>
                <div style="margin-top:20px; text-align:right;">
                    <button class="btn btn-secondary" onclick="document.getElementById('diagModal').style.display='none'">Close</button>
                </div>
            `;

        } catch(e) {
            content.innerHTML = `<div style="color:red; text-align:center;">Diagnosis Failed: ${e}</div>`;
        }
    }

    // --- STANDARD CRUD ---
    getFilteredLinks() {
        if (!this.searchTerm) return this.links;
        const s = this.searchTerm.toLowerCase();
        return this.links.filter(l => Object.values(l).some(v => v && v.toString().toLowerCase().includes(s)));
    }

    getPaginatedLinks(links) {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return links.slice(start, start + this.itemsPerPage);
    }

    updatePagination(total) {
        const pages = Math.ceil(total / this.itemsPerPage) || 1;
        document.getElementById('pageInfo').textContent = `Page ${this.currentPage} of ${pages}`;
        document.getElementById('prevBtn').disabled = this.currentPage === 1;
        document.getElementById('nextBtn').disabled = this.currentPage >= pages;
    }

    updateStats() {
        document.getElementById('totalLinks').textContent = this.links.length;
        document.getElementById('uniqueLocations').textContent = new Set(this.links.map(l => l.Location)).size;
        document.getElementById('uniquePOPs').textContent = new Set(this.links.map(l => l.POP_Name)).size;
    }

    // CSV & Modal logic remains same as before...
    // (Ensure you keep the openModal, closeModal, importCSV, exportCSV methods here)
    // For brevity, assuming standard implementation or copied from previous script.
    
    // SETUP
    setupEventListeners() {
        // ... (Keep existing listeners) ... 
        // Adding listeners for buttons
        document.getElementById('addLinkBtn').addEventListener('click', () => this.openModal());
        document.getElementById('searchInput').addEventListener('input', (e) => { this.searchTerm=e.target.value; this.renderTable(); });
        document.getElementById('prevBtn').addEventListener('click', () => { if(this.currentPage>1){this.currentPage--; this.renderTable();} });
        document.getElementById('nextBtn').addEventListener('click', () => { if(this.currentPage < Math.ceil(this.links.length/this.itemsPerPage)){this.currentPage++; this.renderTable();} });
        
        // Delegated clicks
        document.getElementById('tableBody').addEventListener('click', (e) => {
            const t = e.target.closest('.action-btn');
            if(!t) return;
            const id = t.dataset.id;
            if(t.classList.contains('edit')) { const l = this.links.find(x=>x.Link_ID===id); this.openModal(l); }
            else if(t.classList.contains('delete')) { if(confirm('Delete?')) { this.links=this.links.filter(x=>x.Link_ID!==id); this.saveData(); this.renderTable(); } }
        });

        // Close modal
        window.onclick = (e) => {
            if(e.target == document.getElementById('diagModal')) document.getElementById('diagModal').style.display='none';
            if(e.target == document.getElementById('linkModal')) document.getElementById('linkModal').style.display='none';
        }
    }
}

// Expose app to window so onclick works
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RFManager();
});
