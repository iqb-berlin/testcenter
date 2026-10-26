<?php

use PHPUnit\Framework\TestCase;

class WorkspaceRoleTest extends TestCase {
  public function test_readOnlyDoesNotIncludeReadWrite() {
    static::assertFalse(WorkspaceRole::RO->includes(WorkspaceRole::RW));
    static::assertTrue(WorkspaceRole::RW->includes(WorkspaceRole::RO));
  }
}
