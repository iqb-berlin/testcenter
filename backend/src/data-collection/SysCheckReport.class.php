<?php

/** @noinspection PhpUnhandledExceptionInspection */

class SysCheckReport extends DataCollection {

    public $keyPhrase = '';
    public $title = '';
    public $environment = [];
    public $network = [];
    public $questionnaire =  [];
    public $unit = [];
    public $date = '';
    public $responses = '';

    public $checkId = '--';
    public $checkLabel = '--';

    public function __construct($initData) {

        $this->date = TimeStamp::toSQLFormat(TimeStamp::now());

        parent::__construct($initData);
    }

}
