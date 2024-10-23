<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class SysChecksFolder extends Workspace {
  public function findAvailableSysChecks(): array {
    $sysChecks = [];

    foreach (Folder::glob($this->getOrCreateSubFolderPath('SysCheck'), "*.[xX][mM][lL]") as $fullFilePath) {
      $xFile = new XMLFileSysCheck($fullFilePath);

      if ($xFile->isValid()) {
        $sysChecks[] = $xFile;
      }
    }

    return $sysChecks;
  }

  // TODO unit test
  public function getSysCheckReportList(): array {
    $allReports = $this->collectSysCheckReports();

    $allReportsByCheckIds = array_reduce($allReports, function($agg, SysCheckReportFile $report) {
      if (!isset($agg[$report->getCheckId()])) {
        $agg[$report->getCheckId()] = [$report];
      } else {
        $agg[$report->getCheckId()][] = $report;
      }
      return $agg;
    }, []);

    return array_map(function(array $reportSet, string $checkId) {
      return [
        'id' => $checkId,
        'count' => count($reportSet),
        'label' => $reportSet[0]->getCheckLabel(),
        'details' => SysCheckReportFile::getStatistics($reportSet)
      ];
    }, $allReportsByCheckIds, array_keys($allReportsByCheckIds));
  }

  // TODO unit test

  /**
   * @return SysCheckReportFile[]
   */
  public function collectSysCheckReports(array $filterCheckIds = null): array {
    $reportFolderName = $this->getSysCheckReportsPath();
    $reportDir = opendir($reportFolderName);
    $reports = [];

    while (($reportFileName = readdir($reportDir)) !== false) {
      $reportFilePath = $reportFolderName . '/' . $reportFileName;

      if (!is_file($reportFilePath) or !(strtoupper(substr($reportFileName, -5)) == '.JSON')) {
        continue;
      }

      $report = new SysCheckReportFile($reportFilePath);

      if (($filterCheckIds === null) or (in_array($report->getCheckId(), $filterCheckIds))) {
        $reports[] = $report;
      }
    }

    return $reports;
  }

  private function getSysCheckReportsPath(): string {
    $sysCheckPath = $this->workspacePath . '/SysCheck';
    if (!file_exists($sysCheckPath)) {
      mkdir($sysCheckPath);
    }
    $sysCheckReportsPath = $sysCheckPath . '/reports';
    if (!file_exists($sysCheckReportsPath)) {
      mkdir($sysCheckReportsPath);
    }
    return $sysCheckReportsPath;
  }

  // TODO unit test
  public function deleteSysCheckReports(array $checkIds): FileDeletionReport {
    $reports = $this->collectSysCheckReports($checkIds);

    $deletionReport = new FileDeletionReport();

    foreach ($reports as $report) {
      /* @var SysCheckReportFile $report */
      $fullPath = "$this->workspacePath/SysCheck/reports/{$report->getFileName()}";
      $fieldName = $this->deleteFileFromFs($fullPath);
      $deletionReport->$fieldName[] = $report->getCheckId();
    }

    return $deletionReport;
  }

  // TODO unit test
  public function saveSysCheckReport(SysCheckReport $report): void {
    $reportFilename = $this->getSysCheckReportsPath() . '/' . uniqid('report_', true) . '.json';

    if (!file_put_contents($reportFilename, json_encode((array) $report))) {
      throw new Exception("Could not write to file `$reportFilename`");
    }
  }

}
