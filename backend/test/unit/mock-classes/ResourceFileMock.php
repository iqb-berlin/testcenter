<?php

class ResourceFileMock extends ResourceFile {
  /** @noinspection PhpMissingParentConstructorInspection */
  public function __construct(string $name) {
    $this->id = FileID::normalize($name);
    $this->name = $name;
  }

  public function getContent(): string {
    return 'content of: ' . $this->name;
  }
}