<?php

namespace OCA\DolibarrLink\Settings;

use OCP\IL10N;
use OCP\IURLGenerator;
use OCP\Settings\IIconSection;

class AdminSection implements IIconSection {
    private $l;
    private $urlGenerator;

    public function __construct(IL10N $l, IURLGenerator $urlGenerator) {
        $this->l = $l;
        $this->urlGenerator = $urlGenerator;
    }

    public function getID() {
        return 'dolibarrlink';
    }

    public function getName() {
        return $this->l->t('Dolibarr Link');
    }

    public function getPriority() {
        return 80;
    }

    public function getIcon() {
        return $this->urlGenerator->imagePath('core', 'actions/external.svg');
    }
}