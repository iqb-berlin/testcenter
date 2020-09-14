<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test


class SysChecksFolder extends Workspace {


    public function findAvailableSysChecks() {

        $sysChecks = [];

        foreach (Folder::glob($this->getOrCreateSubFolderPath('SysCheck'), "*.[xX][mM][lL]") as $fullFilePath) {

            $xFile = new XMLFileSysCheck($fullFilePath);

            if ($xFile->isValid()) {
                if ($xFile->getRoottagName()  == 'SysCheck') {
                    $sysChecks[] = [
                        'workspaceId' => $this->_workspaceId,
                        'name' => $xFile->getId(),
                        'label' => $xFile->getLabel(),
                        'description' => $xFile->getDescription()
                    ];
                }
            }
        }

        return $sysChecks;
    }


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

        $sysCheckPath = $this->_workspacePath . '/SysCheck';
        if (!file_exists($sysCheckPath)) {
            mkdir($sysCheckPath);
        }
        $sysCheckReportsPath = $sysCheckPath . '/reports';
        if (!file_exists($sysCheckReportsPath)) {
            mkdir($sysCheckReportsPath);
        }
        return $sysCheckReportsPath;
    }


    public function deleteSysCheckReports(array $checkIds) : array {

        $reports = $this->collectSysCheckReports($checkIds);

        $filesToDelete = array_map(function(SysCheckReportFile $report) {
            return 'SysCheck/reports/' . $report->getFileName();
        }, $reports);

        return $this->deleteFiles($filesToDelete);
    }


    public function saveSysCheckReport(SysCheckReport $report): void {

        $reportFilename = $this->getSysCheckReportsPath() . '/' . uniqid('report_', true) . '.json';

        if (!file_put_contents($reportFilename, json_encode((array) $report))) {
            throw new Exception("Could not write to file `$reportFilename`");
        }
    }

}
