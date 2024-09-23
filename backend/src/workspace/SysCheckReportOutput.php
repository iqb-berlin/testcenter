<?php

declare(strict_types=1);

class SysCheckReportOutput extends Report {

  public function asString(): string {
    return match ($this->format) {
      ReportFormat::CSV => $this->csvReportData,
      ReportFormat::JSON => json_encode($this->reportData)
    };
  }

  public function generate(bool $useNewVersion = false): bool {
    $this->useNewVersion = $useNewVersion;
    $sysChecksFolder = new SysChecksFolder($this->workspaceId);
    $systemChecks = $sysChecksFolder->collectSysCheckReports($this->dataIds);

    if (empty($systemChecks)) {
      return false;

    } else {
      $this->reportData = array_map(
        function (SysCheckReportFile $report) {
          return $report->getReport();
        },
        $systemChecks
      );

      if ($this->format == ReportFormat::CSV) {
        $flatReports = array_map(
          function (SysCheckReportFile $report) {
            return $report->getFlatReport();
          },
          $systemChecks
        );
        $this->csvReportData = $this->generateCsvReportData($flatReports);
      }
    }
    return true;

  }

  private function generateCsvReportData(array $flatReports): string {
    return self::BOM .
    CSV::build(
      $flatReports,
      [],
      self::DELIMITER,
      self::ENCLOSURE,
      self::LINE_ENDING
    );
  }
}