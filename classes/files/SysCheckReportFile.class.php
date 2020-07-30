<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


// TODO unit Test

class SysCheckReportFile {

    const reportSections = [
        'envData', 'netData', 'questData', 'unitData', // deprecated section names to maintain backwards compatibility
        'fileData',
        'environment', 'network', 'questionnaire', 'unit'
    ];

    private $report = [];
    private $checkId = '--';
    private $checkLabel = '--';
    private $fileName = '';

    function __construct($reportFilePath) {

        if (!is_file($reportFilePath) or !(strtoupper(substr($reportFilePath, -5)) == '.JSON')) {
            throw new HttpError("No SysCheck-Report File: $reportFilePath", 500);
        }

        $file = file_get_contents($reportFilePath);

        if ($file === false) {
            throw new HttpError("Could not read File: $reportFilePath", 500);
        }

        $this->report = JSON::decode($file, true);

        if (isset($this->report['checkId']) and $this->report['checkId']) {
            $this->checkId = $this->report['checkId'];
        }

        if (isset($this->report['checkLabel']) and $this->report['checkLabel']) {
            $this->checkLabel = $this->report['checkLabel'];
        }

        $this->fileName = basename($reportFilePath);

        $this->addEntry('fileData', 'date', 'DatumTS', (string) filemtime($reportFilePath));
        $this->addEntry('fileData', 'datestr', 'Datum', date('Y-m-d H:i:s', filemtime($reportFilePath)));
        $this->addEntry('fileData', 'filename', 'FileName', basename($reportFilePath));
    }


    function addEntry(string $section, string $id, string $label, string $value): void {

        if (!isset($this->report[$section])) {
            $this->report[$section] = [];
        }

        $this->report[$section][] = [
            'id' => $id,
            'label' => $label,
            'value' => $value
        ];
    }


    function get(): array {

        return $this->report;
    }


    function getCheckLabel(): string {

        return $this->checkLabel;
    }


    function getCheckId(): string {

        return $this->checkId;
    }


    function getFlat(): array {

        $flatReport = [];

        foreach (SysCheckReportFile::reportSections as $section) {

            if (!isset($this->report[$section])) {
                continue;
            }

            foreach ($this->report[$section] as $id => $entry) {
                $flatReport[$entry['label']] = $entry['value'];
            }
        }

        return $flatReport;
    }


    function getDigest(): array {

        return [
            'os' =>  $this->getValueIfExists('envData', 'Betriebssystem') . ' '
                . $this->getValueIfExists('envData', 'Betriebssystem-Version'),
            'browser' => $this->getValueIfExists('envData', 'Browser') . ' '
                . $this->getValueIfExists('envData', 'Browser-Version'),
        ];
    }


    // TODO use ids instead of labels (but ids has to be set in FE)
    private function getValueIfExists(string $section, string $field, string $default = '') {

        $sectionEntries = isset($this->report[$section]) ? $this->report[$section] : [];

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

        return $this->fileName;
    }

}
