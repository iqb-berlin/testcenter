<?php
/** @noinspection PhpUnhandledExceptionInspection */


class LoginWithPerson extends DataCollectionTypeSafe {


    protected $login;
    protected $person;

    public function __construct(Login $login, Person $person) {

        $this->login = $login;
        $this->person = $person;
    }


    public function getLogin(): Login {

        return $this->login;
    }


    public function getPerson(): Person {

        return $this->person;
    }
}
