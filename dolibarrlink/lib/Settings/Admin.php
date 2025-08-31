<?php

namespace OCA\DolibarrLink\Settings;

use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\IL10N;
use OCP\Settings\ISettings;
use OCP\Util;

class Admin implements ISettings {
    private $config;
    private $l;

    public function __construct(IConfig $config, IL10N $l) {
        $this->config = $config;
        $this->l = $l;
    }

    public function getForm() {
        // Get current settings
        $rules = $this->config->getAppValue('dolibarrlink', 'rules', '[]');
        $enabled = $this->config->getAppValue('dolibarrlink', 'feature_enabled', '1');
        
        // Add JavaScript and CSS
        Util::addScript('dolibarrlink', 'admin');
        Util::addStyle('dolibarrlink', 'admin');
        
        // Pass data to template
        $parameters = [
            'rules' => $rules,
            'feature_enabled' => $enabled === '1'
        ];

        return new TemplateResponse('dolibarrlink', 'admin', $parameters);
    }

    public function getSection() {
        return 'dolibarrlink';
    }

    public function getPriority() {
        return 50;
    }
}