<?php
/** @noinspection PhpUnhandledExceptionInspection */

// TODO unit Test

class SysCheckReportFile {

    const reportSections = ['envData', 'netData', 'questData', 'unitData', 'fileData'];

    private $_report = [];
    private $_checkId = '--';
    private $_checkLabel = '--';
    private $_fileName = '';

    function __construct($reportFilePath) {

        if (!is_file($reportFilePath) or !(strtoupper(substr($reportFilePath, -5)) == '.JSON')) {
            throw new HttpError("No SysCheck-Report File: $reportFilePath", 500);
        }

        $file = file_get_contents($reportFilePath);

        if ($file === false) {
            throw new HttpError("Could not read File: $reportFilePath", 500);
        }

        $this->_report = JSON::decode($file, true);

        if (isset($this->_report['checkId']) and $this->_report['checkId']) {
            $this->_checkId = $this->_report['checkId'];
        }

        if (isset($this->_report['checkLabel']) and $this->_report['checkLabel']) {
            $this->_checkLabel = $this->_report['checkLabel'];
        }

        $this->_fileName = basename($reportFilePath);

        $this->addEntry('fileData', 'date', 'DatumTS', (string) filemtime($reportFilePath));
        $this->addEntry('fileData', 'datestr', 'Datum', date('Y-m-d H:i:s', filemtime($reportFilePath)));
        $this->addEntry('fileData', 'filename', 'FileName', basename($reportFilePath));
    }


    function addEntry(string $section, string $id, string $label, string $value): void {

        if (!isset($this->_report[$section])) {
            $this->_report[$section] = [];
        }

        $this->_report[$section][] = [
            'id' => $id,
            'label' => $label,
            'value' => $value
        ];
    }


    function get(): array {

        return $this->_report;
    }


    function getCheckLabel(): string {

        return $this->_checkLabel;
    }


    function getCheckId(): string {

        return $this->_checkId;
    }


    function getFlat(): array {

        $flatReport = [];

        foreach (SysCheckReportFile::reportSections as $section) {

            if (!isset($this->_report[$section])) {
                continue;
            }

            foreach ($this->_report[$section] as $id => $entry) {
                $flatReport[$entry['label']] = $entry['value'];
            }
        }

        return $flatReport;
    }


    function getDigest(): array {

        return [
            'os' =>  $this->_getValueIfExists('envData', 'Betriebssystem') . ' '
                . $this->_getValueIfExists('envData', 'Betriebssystem-Version'),
            'browser' => $this->_getValueIfExists('envData', 'Browser') . ' '
                . $this->_getValueIfExists('envData', 'Browser-Version'),
        ];
    }


    // TODO use ids instead of labels (but ids has to be set in FE)
    private function _getValueIfExists(string $section, string $field, string $default = '') {

        $sectionEntries = isset($this->_report[$section]) ? $this->_report[$section] : [];

        foreach ($sectionEntries as $entry) {

            if ($entry['label'] == $field) {
                return $entry['value'];
            }
        }

        return $default;
    }


    static function getStatistics(array $reportSet): array {

        $digests = array_map(function(SysCheckReportFile $report) {return $report->getDigest();}, $reportSet);

        return array_reduce($digests, function ($agg, $item) {
            foreach ($item as $key => $value) {
                if (!isset($agg[$key])) {
                    $agg[$key] = [];
                }

                if (!isset($agg[$key][$value])) {
                    $agg[$key][$value] = 0;
                }
                $agg[$key][$value] += 1;
            }
            return $agg;
        }, []);
    }


    public function getFileName(): string {

        return $this->_fileName;
    }

}
