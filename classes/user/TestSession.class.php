<?php

/** @noinspection PhpUnhandledExceptionInspection */


class TestSession {

    const availableModes = [
        'run-hot-return',
        'run-hot-restart',
        'run-trial',
        'run-review',
        'monitor-study',
        'monitor-login'
    ];

    public $loginToken = '';
    public $personToken = '';
    public $mode = 'run-hot-return';
    public $groupName = '';
    public $loginName = '';
    public $workspaceName = '';
    public $booklets = '';
    public $testId = 0;
    public $bookletLabel = '';
    public $customTexts = [];
    public $code = '';
    public $workspaceId = 0;
    public $loginId = 0;

    function __construct($initData) {

        foreach ($initData as $key => $value) {
            if (property_exists($this, $key)) {
                $this->$key = $value;
            } else {
                throw new Exception("`$key` is unknown");
            }
        }
    }
}
