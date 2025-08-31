(function() {
    'use strict';
    
    console.log('DolibarrLink: Script loaded successfully');
    
    // Global status object for admin interface
    window.DolibarrLinkStatus = {
        lastScan: null,
        patchedCount: 0,
        enabled: true,
        patchedLinks: []
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
                        // Re-scan after loading new rules
                        scanAndPatchLinks();
                    } catch (e) {
                        console.error('DolibarrLink: Error parsing rules:', e);
                    }
                }
            })
            .catch(error => {
                console.log('DolibarrLink: Using default rules (server not available)');
                scanAndPatchLinks();
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
        if (!link || link.dataset.dolibarrPatched === '1') return false;
        if (!matchesRule(link)) return false;
        
        console.log('DolibarrLink: Patching link:', link.href || link.textContent);
        
        // Store original target for potential restoration
        const originalTarget = link.getAttribute('target');
        
        // Store link info for admin interface
        const linkInfo = {
            href: link.getAttribute('href') || '',
            text: link.textContent.trim() || 'Bez teksta',
            title: link.getAttribute('title') || '',
            timestamp: Date.now(),
            element: link,
            originalTarget: originalTarget
        };
        
        window.DolibarrLinkStatus.patchedLinks.push(linkInfo);
        window.DolibarrLinkStatus.patchedCount = window.DolibarrLinkStatus.patchedLinks.length;
        
        // Remove any target attributes that would open in new tab/window
        link.removeAttribute('target');
        
        // Add click handler to ensure same-tab navigation
        const clickHandler = function(e) {
            if (e.defaultPrevented) return;
            if (e.button !== 0) return; // Only left click
            if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; // Allow modifier keys
            
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
            
            console.log('DolibarrLink: Forcing same-tab navigation to:', href);
            e.preventDefault();
            e.stopPropagation();
            window.location.href = href;
        };
        
        link.addEventListener('click', clickHandler, true); // Use capture phase
        link.dataset.dolibarrPatched = '1';
        link.dataset.dolibarrHandler = 'attached';
        
        // Store handler reference for cleanup
        linkInfo.clickHandler = clickHandler;
        
        return true;
    }
    
    // Function to unpatch a specific link
    window.unpatchLink = function(index) {
        if (window.DolibarrLinkStatus.patchedLinks[index]) {
            const linkInfo = window.DolibarrLinkStatus.patchedLinks[index];
            const element = linkInfo.element;
            
            if (element && element.parentNode) {
                // Restore original target if it existed
                if (linkInfo.originalTarget) {
                    element.setAttribute('target', linkInfo.originalTarget);
                } else {
                    element.removeAttribute('target');
                }
                
                // Remove our modifications
                element.removeAttribute('data-dolibarr-patched');
                element.removeAttribute('data-dolibarr-handler');
                
                // Remove event listener if we stored it
                if (linkInfo.clickHandler) {
                    element.removeEventListener('click', linkInfo.clickHandler, true);
                }
                
                // Remove from list
                window.DolibarrLinkStatus.patchedLinks.splice(index, 1);
                window.DolibarrLinkStatus.patchedCount = window.DolibarrLinkStatus.patchedLinks.length;
                
                console.log('DolibarrLink: Unpatched link:', linkInfo.href);
                return true;
            }
        }
        return false;
    };
    
    // Function to clear all patched links
    window.clearAllPatchedLinks = function() {
        const linksToUnpatch = [...window.DolibarrLinkStatus.patchedLinks];
        
        linksToUnpatch.forEach((linkInfo, index) => {
            if (linkInfo.element && linkInfo.element.parentNode) {
                // Restore original target
                if (linkInfo.originalTarget) {
                    linkInfo.element.setAttribute('target', linkInfo.originalTarget);
                } else {
                    linkInfo.element.removeAttribute('target');
                }
                
                linkInfo.element.removeAttribute('data-dolibarr-patched');
                linkInfo.element.removeAttribute('data-dolibarr-handler');
                
                // Remove event listener
                if (linkInfo.clickHandler) {
                    linkInfo.element.removeEventListener('click', linkInfo.clickHandler, true);
                }
            }
        });
        
        window.DolibarrLinkStatus.patchedLinks = [];
        window.DolibarrLinkStatus.patchedCount = 0;
        
        console.log('DolibarrLink: Cleared all patched links');
    };
    
    // Function to test rules without actually patching
    window.testRulesOnly = function() {
        const links = document.querySelectorAll('a[href]');
        let matchCount = 0;
        const matchedLinks = [];
        
        links.forEach(link => {
            if (matchesRule(link)) {
                matchCount++;
                matchedLinks.push({
                    href: link.getAttribute('href') || '',
                    text: link.textContent.trim() || 'Bez teksta',
                    title: link.getAttribute('title') || ''
                });
                
                // Visual highlight
                link.style.outline = '2px solid red';
                setTimeout(() => {
                    link.style.outline = '';
                }, 3000);
            }
        });
        
        return { count: matchCount, links: matchedLinks };
    };
    
    function scanAndPatchLinks() {
        if (!window.DolibarrLinkStatus.enabled) {
            console.log('DolibarrLink: Feature disabled, skipping scan');
            return;
        }
        
        const links = document.querySelectorAll('a[href]:not([data-dolibarr-patched="1"])');
        console.log('DolibarrLink: Scanning', links.length, 'unpatched links');
        
        let newlyPatchedCount = 0;
        links.forEach(link => {
            if (patchLink(link)) {
                newlyPatchedCount++;
            }
        });
        
        // Update status
        window.DolibarrLinkStatus.lastScan = Date.now();
        
        if (newlyPatchedCount > 0) {
            console.log('DolibarrLink: Newly patched', newlyPatchedCount, 'links (total:', window.DolibarrLinkStatus.patchedCount, ')');
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(scanAndPatchLinks, 100); // Small delay to ensure everything is loaded
        });
    } else {
        setTimeout(scanAndPatchLinks, 100);
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
                setTimeout(scanAndPatchLinks, 200); // Delay to let DOM settle
            }
        });
        
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }
    
})();