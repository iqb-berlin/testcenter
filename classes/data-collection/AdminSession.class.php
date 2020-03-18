<?php


class AdminSession extends DataCollection {

    // construction time
    public $adminToken = null;
    public $userId = null;
    public $name = null;
    public $isSuperadmin = null;

    public $workspaces = [];
    public $userEmail = '';
}
