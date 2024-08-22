<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

class AccessSetTest extends TestCase {
  function test__createFromPersonSession(): void {
    // Arrange
    $personSession = new PersonSession(
      new LoginSession(
        4,
        'test_token',
        "group-token",
        new Login(
          'sample_user',
          '',
          'monitor-study',
          'sample_group',
          'Sample Group',
          ["xxx" => ["BOOKLET.SAMPLE-1"]],
          1,
          1893574800,
          0,
          0,
          (object) []
        )
      ),
      new Person(
        1,
        'person-token',
        'xxx',
        'xxx',
        1893574800
      )
    );

    // Act
    $workspaceData = new WorkspaceData(1, 'ws_name', 'R');
    $accessSet = AccessSet::createFromPersonSession($personSession, $workspaceData);

    // Assert
    parent::assertTrue($accessSet->hasAccessType(AccessObjectType::STUDY_MONITOR));
  }
}
