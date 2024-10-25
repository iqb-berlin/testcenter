<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class Admin extends DataCollectionTypeSafe {

  private int $id;
  private string $name;
  private string $email;
  private bool $isSuperadmin;
  private bool $pwSetByAdmin;
  private string $token;

  function __construct(
    int $id,
    string $name,
    string $email,
    bool $isSuperadmin,
    string $token,
    bool $pwSetByAdmin = false
  ) {

    $this->id = $id;
    $this->name = $name;
    $this->email = $email;
    $this->isSuperadmin = $isSuperadmin;
    $this->token = $token;
    $this->pwSetByAdmin = $pwSetByAdmin;
  }


  public function getId(): int {

    return $this->id;
  }


  public function getName(): string {

    return $this->name;
  }


  public function getEmail(): string {

    return $this->email;
  }


  public function isSuperadmin(): bool {

    return $this->isSuperadmin;
  }


  public function getToken(): string {

    return $this->token;
  }

  public function isPwSetByAdmin(): bool {
    return $this->pwSetByAdmin;
  }
}