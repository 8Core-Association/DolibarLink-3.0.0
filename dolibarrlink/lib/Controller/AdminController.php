<?php

namespace OCA\DolibarrLink\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IConfig;
use OCP\IRequest;

class AdminController extends Controller {
    private $config;

    public function __construct($AppName, IRequest $request, IConfig $config) {
        parent::__construct($AppName, $request);
        $this->config = $config;
    }

    /**
     * @NoCSRFRequired
     */
    public function saveSettings() {
        try {
            $rules = $this->request->getParam('rules', '[]');
            $enabled = $this->request->getParam('enabled', false);

            // Validate JSON
            $decodedRules = json_decode($rules, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JSONResponse([
                    'status' => 'error', 
                    'message' => 'Invalid JSON format'
                ]);
            }

            // Save settings
            $this->config->setAppValue('dolibarrlink', 'rules', $rules);
            $this->config->setAppValue('dolibarrlink', 'feature_enabled', $enabled ? '1' : '0');

            return new JSONResponse(['status' => 'success']);
        } catch (\Exception $e) {
            return new JSONResponse([
                'status' => 'error', 
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * @NoCSRFRequired
     */
    public function getSettings() {
        try {
            $rules = $this->config->getAppValue('dolibarrlink', 'rules', '[]');
            $enabled = $this->config->getAppValue('dolibarrlink', 'feature_enabled', '1');

            return new JSONResponse([
                'status' => 'success',
                'rules' => $rules,
                'enabled' => $enabled === '1'
            ]);
        } catch (\Exception $e) {
            return new JSONResponse([
                'status' => 'error', 
                'message' => $e->getMessage()
            ]);
        }
    }
}