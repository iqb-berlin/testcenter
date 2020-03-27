<?php

/** @noinspection PhpUnhandledExceptionInspection */


class LoginSession extends DataCollection {

    const availableModes = [
        'run-hot-return',
        'run-hot-restart',
        'run-trial',
        'run-review',
        'monitor-study',
        'monitor-login'
    ];

    public $id = 0;
    public $name = "";
    public $workspaceId = 0;
    public $_validTo = 0;
    public $token = "";
    public $mode = null;
    public $booklets = [];
    public $groupName = "";

    function __construct($initData) {

        $this->mode = !in_array($this->mode, $this::availableModes) ? 'run-trial' : $this->mode;
        parent::__construct($initData);
    }
}
