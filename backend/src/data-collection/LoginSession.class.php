<?php
declare(strict_types=1);

class LoginSession extends DataCollectionTypeSafe {

    private int $id;
    private ?string $token;
    private ?string $groupToken;
    private Login $login;

  function __construct(
        int $id,
        ?string $token,
        ?string $groupToken,
        Login $login
    ) {

        $this->id = $id;
        $this->token = $token;
        $this->groupToken = $groupToken;
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

  public function getGroupToken(): ?string {
      return $this->groupToken;
  }
}