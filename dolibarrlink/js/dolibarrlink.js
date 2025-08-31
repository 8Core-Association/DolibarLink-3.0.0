(function() {
    'use strict';
    
    console.log('DolibarrLink: Script loaded successfully');
    
    // Global status object for admin interface
    window.DolibarrLinkStatus = {
        lastScan: null,
        patchedCount: 0,
        enabled: true
    };
    
    let rules = [
        {"type": "hrefContains", "value": "/dolibarr/"},
        {"type": "title", "value": "Dolibarr"},
        {"type": "hrefContains", "value": "dolibarr"}
    ];
    
    // Load rules from server
    loadRulesFromServer();
    
    function loadRulesFromServer() {
        fetch(OC.generateUrl('/apps/dolibarrlink/admin/get'))
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    try {
                        rules = JSON.parse(data.rules);
                        window.DolibarrLinkStatus.enabled = data.enabled;
                        console.log('DolibarrLink: Loaded', rules.length, 'rules from server');
                    } catch (e) {
                        console.error('DolibarrLink: Error parsing rules:', e);
                    }
                }
            })
            .catch(error => {
                console.log('DolibarrLink: Using default rules (server not available)');
            });
    }
    
    function matchesRule(link) {
        if (!window.DolibarrLinkStatus.enabled) return false;
        
        return rules.some(rule => {
            try {
                switch (rule.type) {
                    case 'title':
                        const title = link.getAttribute('title') || '';
                        return title.toLowerCase().includes(rule.value.toLowerCase());
                    case 'hrefContains':
                        const href = link.getAttribute('href') || '';
                        return href.toLowerCase().includes(rule.value.toLowerCase());
                    case 'textContent':
                        const text = link.textContent || '';
                        return text.toLowerCase().includes(rule.value.toLowerCase());
                    default:
                        return false;
                }
            } catch (e) {
                console.error('DolibarrLink: Error matching rule:', e);
                return false;
            }
        });
    }
    
    function patchLink(link) {
        if (!link || link.dataset.dolibarrPatched === '1') return;
        if (!matchesRule(link)) return;
        
        console.log('DolibarrLink: Patching link:', link.href || link.textContent);
        
        // Remove target="_blank" and similar
        link.removeAttribute('target');
        link.setAttribute('target', '_self');
        
        // Add click handler to ensure same-tab navigation
        link.addEventListener('click', function(e) {
            if (e.defaultPrevented) return;
            if (e.button !== 0) return; // Only left click
            if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; // Allow modifier keys
            
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
            
            console.log('DolibarrLink: Navigating to:', href);
            e.preventDefault();
            window.location.href = href;
        });
        
        link.dataset.dolibarrPatched = '1';
    }
    
    function scanAndPatchLinks() {
        const links = document.querySelectorAll('a[href]');
        console.log('DolibarrLink: Scanning', links.length, 'links');
        
        let patchedCount = 0;
        links.forEach(link => {
            if (matchesRule(link)) {
                patchLink(link);
                patchedCount++;
            }
        });
        
        // Update status
        window.DolibarrLinkStatus.lastScan = Date.now();
        window.DolibarrLinkStatus.patchedCount = patchedCount;
        
        if (patchedCount > 0) {
            console.log('DolibarrLink: Patched', patchedCount, 'links');
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scanAndPatchLinks);
    } else {
        scanAndPatchLinks();
    }
    
    // Watch for dynamic content changes
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(function(mutations) {
            let shouldScan = false;
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (let node of mutation.addedNodes) {
                        if (node.nodeType === 1) { // Element node
                            if (node.tagName === 'A' || node.querySelector('a')) {
                                shouldScan = true;
                                break;
                            }
                        }
                    }
                }
            });
            
            if (shouldScan) {
                setTimeout(scanAndPatchLinks, 100); // Small delay to let DOM settle
            }
        });
        
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }
    
})();