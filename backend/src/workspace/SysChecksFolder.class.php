<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class SysChecksFolder extends Workspace {
  public function findAvailableSysChecks(): array {
    $sysChecks = [];

    $directory = $this->storageDirectory->createSubdirectory('SysCheck');
    foreach (Storage::getDriver()->listFiles($directory) as $fileName => $fileInfo) {
      if (!fnmatch("*.[xX][mM][lL]", $fileName)) {
        continue;
      }
      $xFile = self::loadAndValidateFile($directory->createFilePath($fileName), 'SysCheck', $fileInfo);

      if ($xFile->isValid()) {
        $sysChecks[] = $xFile;
      }
    }

    return $sysChecks;
  }

  // TODO unit test
  public function getSysCheckReportList(): array {
    $allReports = $this->collectSysCheckReports();

    $allReportsByCheckIds = array_reduce($allReports, static function($agg, SysCheckReportFile $report) {
      if (!isset($agg[$report->getCheckId()])) {
        $agg[$report->getCheckId()] = [$report];
      } else {
        $agg[$report->getCheckId()][] = $report;
      }
      return $agg;
    }, []);

    return array_map(static function(array $reportSet, string $checkId) {
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
   * @param string[]|null $filterCheckIds null = no filter
   * @return SysCheckReportFile[]
   */
  public function collectSysCheckReports(?array $filterCheckIds = null): array {
    $directory = $this->getReportsDirectory();
    $reports = [];

    foreach (Storage::getDriver()->listFiles($directory) as $reportFileName => $fileInfo) {
      if (strtoupper(substr($reportFileName, -5)) != '.JSON') {
        continue;
      }

      $report = new SysCheckReportFile(
        $reportFileName,
        Storage::getDriver()->get($directory->createFilePath($reportFileName)),
        $fileInfo->modificationTime
      );

      if (($filterCheckIds === null) or (in_array($report->getCheckId(), $filterCheckIds))) {
        $reports[] = $report;
      }
    }

    return $reports;
  }

  private function getReportsDirectory(): StorageDirectory {
    return $this->storageDirectory->createSubdirectory('SysCheck', 'reports');
  }

  // TODO unit test
  public function deleteSysCheckReports(array $checkIds): FileDeletionReport {
    $reports = $this->collectSysCheckReports($checkIds);

    $deletionReport = new FileDeletionReport();

    /** @var SysCheckReportFile $report */
    foreach ($reports as $report) {
      $path = $this->getReportsDirectory()->createFilePath($report->getFileName());
      self::deleteFromStorage($path, $deletionReport, $report->getCheckId());
    }

    return $deletionReport;
  }

  public function saveSysCheckReport(SysCheckReport $report): void {
    Storage::getDriver()->putContents(
      $this->getReportsDirectory()->createFilePath(uniqid('report_', true) . '.json'),
      json_encode((array) $report, JSON_THROW_ON_ERROR)
    );
  }

}
