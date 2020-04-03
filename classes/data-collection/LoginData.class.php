<?php

/** @noinspection PhpUnhandledExceptionInspection */


class LoginData extends DataCollection {

    const availableModes = [
        'run-hot-return',
        'run-hot-restart',
        'run-trial',
        'run-review',
        'monitor-study',
        'monitor-login'
    ];

    public $id = 0;
    public $token = "";

    // construction time
    public $workspaceId = null;
    public $groupName = null;
    public $name = null;
    public $mode = null;
    public $booklets = null;

    public $_validFrom = 0;
    public $_validTo = 0;
    public $_validForMinutes = 0;

    public $customTexts; // TODO after https://github.com/iqb-berlin/testcenter-iqb-php/issues/53 make null

    // if log-in part II is done
    public $personToken = '';
    public $code = '';


    function __construct($initData) {

        $this->customTexts = new stdClass();

        parent::__construct($initData);

        $this->mode = !in_array($this->mode, $this::availableModes) ? 'run-trial' : $this->mode;
    }

}
