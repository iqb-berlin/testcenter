<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class PotentialLoginArray implements IteratorAggregate {

    protected $array = [];

    public function __construct(PotentialLogin... $potentialLogins) {

        $this->array = $potentialLogins;
    }


    public function add(PotentialLogin $potentialLogin) {

        $this->array[] = $potentialLogin;
    }


    public function getIterator(): Iterator {

        return new ArrayIterator($this->array);
    }


    public function asArray() : array {

        return $this->array;
    }
}
