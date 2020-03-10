<?php

/** @noinspection PhpUnhandledExceptionInspection */


class TestSession extends AbstractDataCollection {

    const availableModes = [
        'run-hot-return',
        'run-hot-restart',
        'run-trial',
        'run-review',
        'monitor-study',
        'monitor-login'
    ];

    // construction time
    public $workspaceId = null;
    public $groupName = null;
    public $loginName = null;
    public $mode = null;
    public $booklets = null;

    public $customTexts = []; // TODO after https://github.com/iqb-berlin/testcenter-iqb-php/issues/53 make null

    // if log-in part I is done
    public $loginToken = '';
    public $workspaceName = '';

    // if log-in part II is done
    public $personToken = '';
    public $code = '';

    // if test is running
    public $testId = 0;
    public $bookletLabel = '';

    function __construct($initData) {

        parent::__construct($initData);

        $this->mode = !in_array($this->mode, $this::availableModes) ? 'run-trial' : $this->mode;
    }
}
