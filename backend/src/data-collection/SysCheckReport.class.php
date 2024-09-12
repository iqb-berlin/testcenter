<?php

/** @noinspection PhpUnhandledExceptionInspection */

class SysCheckReport extends DataCollection {

    public $keyPhrase = '';
    public $title = '';
    public $environment = array();
    public $network = array();
    public $questionnaire =  array();
    public $unit = array();
    public $date = "";

    public $checkId = "--";
    public $checkLabel = "--";

    public function __construct($initData) {

        $this->date = TimeStamp::toSQLFormat(TimeStamp::now());

        parent::__construct($initData);
    }

}
