<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class Person extends DataCollectionTypeSafe {

    protected int $id = 0;
    protected string $token = "";
    protected string $code = "";
    protected string $nameSuffix = "";

    protected $validTo = 0;

    function __construct(
        int $id,
        string $token,
        string $code,
        string $nameSuffix,
        int $validTo = 0
    ) {

        $this->id = $id;
        $this->token  = $token;
        $this->code = $code;
        $this->nameSuffix = $nameSuffix;
        $this->validTo = $validTo;
    }


    public function getId(): int {

        return $this->id;
    }


    public function getToken(): string {

        return $this->token;
    }


    public function getCode(): string {

        return $this->code;
    }


    public function getNameSuffix(): string {

        return $this->nameSuffix;
    }



    public function getValidTo(): int {

        return $this->validTo;
    }


    public function withNewToken(string $token): Person {

        return new Person(
            $this->id,
            $token,
            $this->code,
            $this->nameSuffix,
            $this->validTo
        );
    }
}
