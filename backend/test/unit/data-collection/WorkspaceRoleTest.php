<?php

use PHPUnit\Framework\TestCase;

class WorkspaceRoleTest extends TestCase {
  public function test_readOnlyDoesNotIncludeReadWrite() {
    $this->assertFalse(WorkspaceRole::RO->includes(WorkspaceRole::RW));
    $this->assertTrue(WorkspaceRole::RW->includes(WorkspaceRole::RO));
  }
}
