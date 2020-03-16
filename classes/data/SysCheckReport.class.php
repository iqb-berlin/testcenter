<?php

/** @noinspection PhpUnhandledExceptionInspection */

class SysCheckReport extends AbstractDataCollection {

    public $keyPhrase =  null;
    public $title = null;
    public $environment = array();
    public $network = array();
    public $questionnaire =  array();
    public $unit = array();
    public $date = "";

    public function __construct($initData) {

        $this->date = date('Y-m-d H:i:s', time());

        parent::__construct($initData);
    }

}
