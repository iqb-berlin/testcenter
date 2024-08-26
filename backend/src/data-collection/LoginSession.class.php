<?php

declare(strict_types=1);

// TODO make class readonly and remove getters

class LoginSession extends DataCollectionTypeSafe {
  function __construct(
    private int $id,
    private ?string $token,
    private ?string $groupToken,
    private Login $login
  ) {
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