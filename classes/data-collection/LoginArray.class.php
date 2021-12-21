<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class LoginArray implements IteratorAggregate {

    protected $array = [];

    public function __construct(Login... $potentialLogins) {

        $this->array = $potentialLogins;
    }


    public function add(Login $potentialLogin) {

        $this->array[] = $potentialLogin;
    }


    public function getIterator(): Iterator {

        return new ArrayIterator($this->array);
    }


    public function asArray() : array {

        return $this->array;
    }
}
