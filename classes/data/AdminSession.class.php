<?php

/** @noinspection PhpUnhandledExceptionInspection */


class AdminSession extends AbstractDataCollection {

    // construction time
    public $adminToken = null;
    public $userId = null;
    public $userName = null;
    public $isSuperadmin = null;

    public $workspaces = [];
    public $userEmail = '';
}
