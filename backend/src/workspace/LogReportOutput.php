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
    ]; // TODO: Adjust column headers?
    $csv[] = implode(self::DELIMITER, $columns);

    foreach ($logData as $log) {
      $csv[] = implode(
        self::DELIMITER,
        [
          sprintf(self::CSV_CELL_FORMAT, $log['groupname']),
          sprintf(self::CSV_CELL_FORMAT, $log['loginname']),
          sprintf(self::CSV_CELL_FORMAT, $log['code']),
          sprintf(self::CSV_CELL_FORMAT, $log['bookletname']),
          sprintf(self::CSV_CELL_FORMAT, $log['unitname']),
          sprintf(self::CSV_CELL_FORMAT, $log['originalUnitId']),
          sprintf(self::CSV_CELL_FORMAT, $log['timestamp']),
          preg_replace("/\\\\\"/", '""', $log['logentry'])   // TODO: adjust replacement & use cell enclosure ?
        ]
      );
    }

    $csv = implode(self::LINE_ENDING, $csv);

    return self::BOM . $csv;
  }
}