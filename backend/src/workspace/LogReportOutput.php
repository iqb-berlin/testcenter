<?php

declare(strict_types=1);

class LogReportOutput extends Report {

  public function generate(bool $useNewVersion = false): bool {
    $this->useNewVersion = $useNewVersion;
    $adminDAO = new AdminDAO();
    $logs = $adminDAO->getLogReportData($this->workspaceId, $this->dataIds);

    if (empty($logs)) {
      return false;

    } else {
      $this->reportData = $logs;

      if ($this->format == ReportFormat::CSV) {
        $this->csvReportData = $this->generateCsvReportData($logs);
      }
    }

    return true;
  }

  private function generateCsvReportData(array $logData): string {
    $columns = [
      'groupname',
      'loginname',
      'code',
      'bookletname',
      'unitname',
      'originalUnitId',
      'timestamp',
      'logentry'
    ];
    return CSV::BOM . CSV::build($logData, $columns);
  }
}
