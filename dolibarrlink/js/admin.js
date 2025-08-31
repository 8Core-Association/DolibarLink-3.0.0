(function() {
    'use strict';
    
    let currentRules = [];
    
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DolibarrLink Admin: Initializing');
        
        // Load initial data
        loadInitialData();
        
        // Bind events
        document.getElementById('add-rule').addEventListener('click', addRule);
        document.getElementById('save-settings').addEventListener('click', saveSettings);
        document.getElementById('test-rules').addEventListener('click', testRules);
        document.getElementById('clear-patched').addEventListener('click', clearPatchedLinks);
        
        // Update status periodically
        updateStatus();
        setInterval(updateStatus, 5000);
    });
    
    function loadInitialData() {
        try {
            if (window.DolibarrLinkConfig) {
                const config = window.DolibarrLinkConfig;
                currentRules = JSON.parse(config.rules || '[]');
                document.getElementById('dolibarr-enabled').checked = config.enabled;
            } else {
                currentRules = [
                    {"type": "hrefContains", "value": "/dolibarr/"},
                    {"type": "title", "value": "Dolibarr"}
                ];
            }
        } catch (e) {
            console.error('DolibarrLink Admin: Error loading config:', e);
            currentRules = [];
        }
        
        renderRules();
    }
    
    function renderRules() {
        const container = document.getElementById('rules-container');
        container.innerHTML = '';
        
        currentRules.forEach((rule, index) => {
            const ruleDiv = document.createElement('div');
            ruleDiv.className = 'rule-item';
            ruleDiv.innerHTML = `
                <select data-index="${index}" class="rule-type">
                    <option value="hrefContains" ${rule.type === 'hrefContains' ? 'selected' : ''}>URL sadrži</option>
                    <option value="title" ${rule.type === 'title' ? 'selected' : ''}>Title sadrži</option>
                    <option value="textContent" ${rule.type === 'textContent' ? 'selected' : ''}>Tekst sadrži</option>
                </select>
                <input type="text" data-index="${index}" class="rule-value" value="${rule.value || ''}" placeholder="Unesite vrijednost...">
                <button class="delete-rule" data-index="${index}">Obriši</button>
            `;
            container.appendChild(ruleDiv);
        });
        
        // Bind events for new elements
        container.querySelectorAll('.rule-type').forEach(select => {
            select.addEventListener('change', updateRule);
        });
        container.querySelectorAll('.rule-value').forEach(input => {
            input.addEventListener('input', updateRule);
        });
        container.querySelectorAll('.delete-rule').forEach(button => {
            button.addEventListener('click', deleteRule);
        });
    }
    
    function addRule() {
        currentRules.push({
            type: 'hrefContains',
            value: ''
        });
        renderRules();
    }
    
    function updateRule(event) {
        const index = parseInt(event.target.dataset.index);
        const isType = event.target.classList.contains('rule-type');
        
        if (isType) {
            currentRules[index].type = event.target.value;
        } else {
            currentRules[index].value = event.target.value;
        }
    }
    
    function deleteRule(event) {
        const index = parseInt(event.target.dataset.index);
        currentRules.splice(index, 1);
        renderRules();
    }
    
    function saveSettings() {
        const enabled = document.getElementById('dolibarr-enabled').checked;
        const statusSpan = document.getElementById('save-status');
        
        statusSpan.textContent = 'Spremam...';
        statusSpan.className = '';
        
        const data = new FormData();
        data.append('rules', JSON.stringify(currentRules));
        data.append('enabled', enabled);
        
        fetch(OC.generateUrl('/apps/dolibarrlink/admin/save'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rules: JSON.stringify(currentRules),
                enabled: enabled
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                statusSpan.textContent = 'Uspješno spremljeno!';
                statusSpan.className = 'success';
                
                // Reload the main script with new settings
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                statusSpan.textContent = 'Greška: ' + (data.message || 'Nepoznata greška');
                statusSpan.className = 'error';
            }
        })
        .catch(error => {
            console.error('Save error:', error);
            statusSpan.textContent = 'Mrežna greška';
            statusSpan.className = 'error';
        });
    }
    
    function testRules() {
        if (window.testRulesOnly) {
            const result = window.testRulesOnly();
            alert(`Pronađeno je ${result.count} poklapajućih linkova na ovoj stranici. Označeni su crveno na 3 sekunde.`);
        } else {
            alert('Glavna skripta nije učitana. Molimo osvježite stranicu.');
        }
    }
    
    function updateStatus() {
        const scriptStatus = document.getElementById('script-status');
        const lastScan = document.getElementById('last-scan');
        const linksPatched = document.getElementById('links-patched');
        
        // Check if main script is loaded
        if (window.DolibarrLinkStatus) {
            scriptStatus.textContent = 'Aktivan';
            scriptStatus.className = 'active';
            
            if (window.DolibarrLinkStatus.lastScan) {
                lastScan.textContent = new Date(window.DolibarrLinkStatus.lastScan).toLocaleString();
            }
            
            if (window.DolibarrLinkStatus.patchedCount !== undefined) {
                linksPatched.textContent = window.DolibarrLinkStatus.patchedCount;
            }
            
            updatePatchedLinksList();
            
            updatePatchedLinksList();
        } else {
            scriptStatus.textContent = 'Neaktivan';
            scriptStatus.className = 'inactive';
            document.getElementById('patched-links-list').innerHTML = '<p class="hint">Glavna skripta nije učitana</p>';
        }
    }
    
    function updatePatchedLinksList() {
        const container = document.getElementById('patched-links-list');
        
        if (!window.DolibarrLinkStatus || !window.DolibarrLinkStatus.patchedLinks) {
            container.innerHTML = '<p class="hint">Nema patchanih linkova</p>';
            return;
        }
        
        const links = window.DolibarrLinkStatus.patchedLinks;
        
        if (links.length === 0) {
            container.innerHTML = '<p class="hint">Nema patchanih linkova</p>';
            return;
        }
        
        let html = '<div class="patched-links-header"><strong>Patchani linkovi:</strong></div>';
        
        links.forEach((linkInfo, index) => {
            const timeStr = new Date(linkInfo.timestamp).toLocaleTimeString();
            html += `
                <div class="patched-link-item" data-index="${index}">
                    <div class="link-info">
                        <div class="link-text">${escapeHtml(linkInfo.text)}</div>
                        <div class="link-url">${escapeHtml(linkInfo.href)}</div>
                        <div class="link-time">Patchan u: ${timeStr}</div>
                    </div>
                    <button class="delete-patched-link" onclick="unpatchSingleLink(${index})">Ukloni patch</button>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    window.unpatchSingleLink = function(index) {
        if (window.unpatchLink && window.unpatchLink(index)) {
            updatePatchedLinksList();
            updateStatus();
        }
    };
    
    function clearPatchedLinks() {
        if (window.clearAllPatchedLinks) {
            if (confirm('Jeste li sigurni da želite ukloniti patch sa svih linkova?')) {
                window.clearAllPatchedLinks();
                updatePatchedLinksList();
                updateStatus();
            }
        }
    }
    
    function updatePatchedLinksList() {
        const container = document.getElementById('patched-links-list');
        
        if (!window.DolibarrLinkStatus || !window.DolibarrLinkStatus.patchedLinks) {
            container.innerHTML = '<p class="hint">Nema patchanih linkova</p>';
            return;
        }
        
        const links = window.DolibarrLinkStatus.patchedLinks;
        
        if (links.length === 0) {
            container.innerHTML = '<p class="hint">Nema patchanih linkova</p>';
            return;
        }
        
        let html = '<div class="patched-links-header"><strong>Patchani linkovi:</strong></div>';
        
        links.forEach((linkInfo, index) => {
            const timeStr = new Date(linkInfo.timestamp).toLocaleTimeString();
            html += `
                <div class="patched-link-item" data-index="${index}">
                    <div class="link-info">
                        <div class="link-text">${escapeHtml(linkInfo.text)}</div>
                        <div class="link-url">${escapeHtml(linkInfo.href)}</div>
                        <div class="link-time">Patchan u: ${timeStr}</div>
                    </div>
                    <button class="delete-patched-link" onclick="unpatchSingleLink(${index})">Ukloni patch</button>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    window.unpatchSingleLink = function(index) {
        if (window.unpatchLink && window.unpatchLink(index)) {
            updatePatchedLinksList();
            updateStatus();
        }
    };
    
    function clearPatchedLinks() {
        if (window.clearAllPatchedLinks) {
            if (confirm('Jeste li sigurni da želite ukloniti patch sa svih linkova?')) {
                window.clearAllPatchedLinks();
                updatePatchedLinksList();
                updateStatus();
            }
        }
    }
})();