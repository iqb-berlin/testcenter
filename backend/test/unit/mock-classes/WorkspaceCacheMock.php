<?php

class WorkspaceCacheMock extends WorkspaceCache {
  /** @noinspection PhpMissingParentConstructorInspection */
  public function __construct(array $mockResources) {
    foreach ($mockResources as $mockResource) {
      $this->addFile('Resource', new ResourceFileMock($mockResource));
    }
  }
}