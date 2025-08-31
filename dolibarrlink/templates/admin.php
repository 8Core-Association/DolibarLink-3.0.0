<?php
script('dolibarrlink', 'admin');
style('dolibarrlink', 'admin');
?>

<div id="dolibarrlink-admin" class="section">
    <h2>Konfiguracija Dolibarr Link</h2>
    
    <div class="dolibarr-settings">
        <div class="setting-row">
            <label>
                <input type="checkbox" id="dolibarr-enabled" <?php if ($_['enabled']) p('checked'); ?>>
                Omogući Dolibarr Link patchiranje
            </label>
            <p class="hint">Kada je omogućeno, linkovi koji se poklapaju s pravilima ispod bit će prisilno otvoreni u istom tabu.</p>
        </div>

        <div class="setting-row">
            <h3>Pravila za poklapanje linkova</h3>
            <p class="hint">Konfiguriraj koji linkovi trebaju biti patchani da se otvore u istom tabu.</p>
            
            <div id="rules-container">
                <!-- Rules will be populated by JavaScript -->
            </div>
            
            <button id="add-rule" class="button">Dodaj pravilo</button>
        </div>

        <div class="setting-row">
            <button id="save-settings" class="button primary">Spremi postavke</button>
            <button id="test-rules" class="button">Testiraj pravila</button>
            <span id="save-status"></span>
        </div>

        <div class="setting-row">
            <h3>Trenutni status</h3>
            <div id="status-info">
                <p><strong>Status skripte:</strong> <span id="script-status">Učitava...</span></p>
                <p><strong>Zadnje skeniranje:</strong> <span id="last-scan">Nikad</span></p>
                <p><strong>Patchani linkovi:</strong> <span id="links-patched">0</span></p>
            </div>
        </div>

        <div class="setting-row">
            <div class="developer-info">
                <p><strong>Develop by:</strong> 8Core Association 2014-2025</p>
            </div>
        </div>
    </div>

    <script>
        // Pass PHP data to JavaScript
        window.DolibarrLinkConfig = {
            rules: <?php echo json_encode($_['rules']); ?>,
            enabled: <?php echo json_encode($_['enabled']); ?>
        };
    </script>
</div>