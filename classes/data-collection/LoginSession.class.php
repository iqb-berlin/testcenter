<?php
declare(strict_types=1);

class LoginSession extends DataCollectionTypeSafe {

    private int $id;
    private ?string $token;
    private int $validUntil;
    private Login $login;

    function __construct(
        int $id,
        ?string $token,
        int $validUntil,
        Login $login
    ) {

        $this->id = $id;
        $this->token = $token;
        $this->validUntil = $validUntil;
        $this->login = $login;
    }


    public function getId(): int {

        return $this->id;
    }


    public function getToken(): ?string {

        return $this->token;
    }


    public function getLogin(): Login {

        return $this->login;
    }


    public function getValidUntil(): int {

        return $this->validUntil;
    }
}