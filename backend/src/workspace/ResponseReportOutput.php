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
    $columns = ['groupname', 'loginname', 'code', 'bookletname', 'unitname', 'originalUnitId', 'responses', 'laststate'];
    $rows = array_map(
      fn(array $row) => [...$row, 'responses' => json_encode($row['responses'])],
      $responseData
    );
    return CSV::BOM . CSV::build($rows, $columns);
  }
}
