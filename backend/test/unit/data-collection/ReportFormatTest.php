<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

class ReportFormatTest extends TestCase {
  function test_fromAcceptHeader(): void {
    $expectations = [
      'text/csv' => ReportFormat::CSV,
      'text/csv;charset=utf-8' => ReportFormat::CSV,
      ' TEXT/CSV ' => ReportFormat::CSV,
      'application/xml, text/csv' => ReportFormat::CSV,
      'application/json' => ReportFormat::JSON,
      'application/json, text/csv' => ReportFormat::JSON,
      // naming no type we produce leaves the choice to the default
      '*/*' => ReportFormat::JSON,
      'text/html,application/xhtml+xml,*/*;q=0.8' => ReportFormat::JSON,
      '' => ReportFormat::JSON
    ];

    foreach ($expectations as $acceptHeader => $expected) {
      $this->assertEquals(
        $expected,
        ReportFormat::fromAcceptHeader((string) $acceptHeader, ReportFormat::JSON),
        "Accept: $acceptHeader"
      );
    }

    $this->assertEquals(ReportFormat::CSV, ReportFormat::fromAcceptHeader('*/*', ReportFormat::CSV));
  }
}
