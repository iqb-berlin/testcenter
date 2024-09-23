<?php

declare(strict_types=1);

class ResponseReportOutput extends Report {
  public function generate(bool $useNewVersion = false): bool {
    $this->useNewVersion = $useNewVersion;
    $adminDAO = new AdminDAO();
    $responses = $adminDAO->getResponseReportData($this->workspaceId, $this->dataIds);

    if (empty($responses)) {
      return false;

    } else {
      $this->reportData = $responses;

      if ($this->format == ReportFormat::CSV) {
        $this->csvReportData = $this->generateCsvReportData($responses);
      }
    }

    return true;
  }

  private function generateCsvReportData(array $responseData): string {
    $csv[] = implode(
      self::DELIMITER,
      ['groupname', 'loginname', 'code', 'bookletname', 'unitname', 'originalUnitId', 'responses', 'laststate']
    );

    foreach ($responseData as $row) {
      $csv[] = implode(
        self::DELIMITER,
        [
          sprintf(self::CSV_CELL_FORMAT, $row['groupname']),
          sprintf(self::CSV_CELL_FORMAT, $row['loginname']),
          sprintf(self::CSV_CELL_FORMAT, $row['code']),
          sprintf(self::CSV_CELL_FORMAT, $row['bookletname']),
          sprintf(self::CSV_CELL_FORMAT, $row['unitname']),
          sprintf(self::CSV_CELL_FORMAT, $row['originalUnitId']),
          sprintf(self::CSV_CELL_FORMAT, preg_replace('/"/', '""', json_encode($row['responses']))),
          sprintf(self::CSV_CELL_FORMAT, preg_replace('/"/', '""', $row['laststate'] ?? ''))
        ]
      );

    }

    $csv = implode(self::LINE_ENDING, $csv);

    return self::BOM . $csv;
  }
}