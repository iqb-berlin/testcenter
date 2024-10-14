<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


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
    private $title = '--';

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

        if (isset($this->report['title']) and $this->report['title']) {
            $this->title = $this->report['title'];
        }

        $this->fileName = basename($reportFilePath);

        $this->addEntry('fileData', 'date', 'DatumTS', (string) FileTime::modification($reportFilePath));
        $this->addEntry('fileData', 'datestr', 'Datum', TimeStamp::toSQLFormat(FileTime::modification($reportFilePath)));
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


    function getReport(): array {

        return $this->report;
    }


    function getCheckLabel(): string {

        return $this->checkLabel;
    }


    function getCheckId(): string {

        return $this->checkId;
    }


    function getFlatReport(): array {

        $flatReport = [
            'Titel' => $this->title,
            'SysCheck-Id' => $this->checkId,
            'SysCheck' => $this->checkLabel,
            'Responses' => $this->report['responses'] ? json_encode($this->report['responses']): ''
        ];

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


    // TODO unit Test
    function getDigest(): array {

        return [
            'os' =>  $this->getValueIfExists('environment', 'Betriebsystem') . ' '
                . $this->getValueIfExists('environment', 'Betriebsystem-Version'),
            'browser' => $this->getValueIfExists('environment', 'Browser') . ' '
                . $this->getValueIfExists('environment', 'Browser-Version'),
        ];
    }


    // TODO unit Test
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


    // TODO unit Test
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
