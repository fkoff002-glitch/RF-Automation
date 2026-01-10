class RFManager {
    constructor() {
        this.links = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.searchTerm = '';
        this.currentEditId = null;
        this.API_URL = "/api/inventory"; // Connects to Python Main.py

        this.init();
    }

    async init() {
        await this.loadData(); // Wait for data from server
        this.setupEventListeners();
        this.updateStats();
    }

    // --- CHANGED: FETCH FROM PYTHON SERVER ---
    async loadData() {
        try {
            const response = await fetch(this.API_URL);
            this.links = await response.json();
            this.renderTable();
            this.updateStats();
        } catch (error) {
            console.error("Error loading data:", error);
            alert("Could not connect to Python Server!");
        }
    }

    // --- CHANGED: SAVE TO PYTHON SERVER ---
    async saveData() {
        try {
            await fetch(this.API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(this.links)
            });
            // console.log("Data saved to server");
        } catch (error) {
            console.error("Error saving data:", error);
            alert("Failed to save data!");
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
                <td>${link.Client_Name}</td>
                <td>${link.Base_IP}</td>
                <td>${link.Client_IP}</td>
                <td>${link.Loopback_IP || 'N/A'}</td>
                <td>${link.Location}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" data-id="${link.Link_ID}"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" data-id="${link.Link_ID}"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        this.updatePagination(filteredLinks.length);
    }

    getFilteredLinks() {
        if (!this.searchTerm) return this.links;
        const searchLower = this.searchTerm.toLowerCase();
        return this.links.filter(link =>
            Object.values(link).some(value => value && value.toString().toLowerCase().includes(searchLower))
        );
    }

    getPaginatedLinks(links) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        return links.slice(startIndex, startIndex + this.itemsPerPage);
    }

    updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
        document.getElementById('pageInfo').textContent = `Page ${this.currentPage} of ${totalPages}`;
        document.getElementById('prevBtn').disabled = this.currentPage === 1;
        document.getElementById('nextBtn').disabled = this.currentPage >= totalPages;
    }

    updateStats() {
        document.getElementById('totalLinks').textContent = this.links.length;
        const uniqueLocations = new Set(this.links.map(link => link.Location));
        document.getElementById('uniqueLocations').textContent = uniqueLocations.size;
        const uniquePOPs = new Set(this.links.map(link => link.POP_Name));
        document.getElementById('uniquePOPs').textContent = uniquePOPs.size;
    }

    // --- MODAL & FORM HANDLING ---
    openModal(link = null) {
        const modal = document.getElementById('linkModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('linkForm');
        
        if (link) {
            title.textContent = 'Edit Link';
            document.getElementById('linkId').value = link.Link_ID;
            document.getElementById('popName').value = link.POP_Name;
            document.getElementById('btsName').value = link.BTS_Name;
            document.getElementById('clientName').value = link.Client_Name;
            document.getElementById('baseIP').value = link.Base_IP;
            document.getElementById('clientIP').value = link.Client_IP;
            document.getElementById('loopbackIP').value = link.Loopback_IP || '';
            document.getElementById('location').value = link.Location;
            this.currentEditId = link.Link_ID;
        } else {
            title.textContent = 'Add New Link';
            form.reset();
            this.currentEditId = null;
        }
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('linkModal').style.display = 'none';
        document.getElementById('linkForm').reset();
        this.currentEditId = null;
    }

    async saveLink(formData) {
        const linkData = {
            Link_ID: formData.get('linkId'),
            POP_Name: formData.get('popName'),
            BTS_Name: formData.get('btsName'),
            Client_Name: formData.get('clientName'),
            Base_IP: formData.get('baseIP'),
            Client_IP: formData.get('clientIP'),
            Loopback_IP: formData.get('loopbackIP'),
            Location: formData.get('location')
        };

        if (this.currentEditId) {
            const index = this.links.findIndex(link => link.Link_ID === this.currentEditId);
            if (index !== -1) this.links[index] = linkData;
        } else {
            this.links.push(linkData);
        }

        await this.saveData(); // Sync with Python
        this.renderTable();
        this.updateStats();
        this.closeModal();
    }

    async deleteLink(linkId) {
        this.links = this.links.filter(link => link.Link_ID !== linkId);
        await this.saveData(); // Sync with Python
        this.renderTable();
        this.updateStats();
    }

    // --- CSV LOGIC ---
    exportToCSV() {
        const headers = ['Link_ID', 'POP_Name', 'BTS_Name', 'Client_Name', 'Base_IP', 'Client_IP', 'Loopback_IP', 'Location'];
        const csvContent = [
            headers.join(','),
            ...this.links.map(link => headers.map(h => `"${(link[h] || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'RF_LINKS_EXPORT.csv';
        link.click();
    }

    importFromCSV(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const lines = e.target.result.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const newLinks = lines.slice(1).filter(l => l.trim()).map(line => {
                const values = line.split(',');
                const link = {};
                headers.forEach((h, i) => link[h] = values[i] ? values[i].trim().replace(/"/g, '') : '');
                return link;
            });

            // Merge Logic
            const existingIds = new Set(this.links.map(l => l.Link_ID));
            const uniqueNew = newLinks.filter(l => !existingIds.has(l.Link_ID));
            this.links = [...this.links, ...uniqueNew];
            
            await this.saveData(); // Save to Python
            this.renderTable();
            this.updateStats();
            alert(`Imported ${uniqueNew.length} new links!`);
        };
        reader.readAsText(file);
    }

    setupEventListeners() {
        document.getElementById('addLinkBtn').addEventListener('click', () => this.openModal());
        document.getElementById('searchInput').addEventListener('input', (e) => { this.searchTerm = e.target.value; this.currentPage = 1; this.renderTable(); });
        document.getElementById('prevBtn').addEventListener('click', () => { if (this.currentPage > 1) { this.currentPage--; this.renderTable(); } });
        document.getElementById('nextBtn').addEventListener('click', () => { if (this.currentPage < Math.ceil(this.links.length / this.itemsPerPage)) { this.currentPage++; this.renderTable(); } });
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToCSV());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('csvFileInput').click());
        document.getElementById('csvFileInput').addEventListener('change', (e) => { if (e.target.files[0]) { this.importFromCSV(e.target.files[0]); e.target.value = ''; }});
        document.getElementById('linkForm').addEventListener('submit', (e) => { e.preventDefault(); this.saveLink(new FormData(e.target)); });
        document.querySelectorAll('.close, .close-modal').forEach(b => b.addEventListener('click', () => this.closeModal()));
        document.getElementById('tableBody').addEventListener('click', (e) => {
            const t = e.target.closest('.action-btn');
            if (!t) return;
            const id = t.dataset.id;
            if (t.classList.contains('edit')) { const link = this.links.find(l => l.Link_ID === id); if (link) this.openModal(link); }
            else if (t.classList.contains('delete')) { if (confirm('Delete this link?')) this.deleteLink(id); }
        });
        window.addEventListener('click', (e) => { if (e.target === document.getElementById('linkModal')) this.closeModal(); });
    }
}

document.addEventListener('DOMContentLoaded', () => new RFManager());
