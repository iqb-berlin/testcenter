<?php



$myreturn = [];

$myerrorcode = 503;

$myDBConnection = new DBConnectionAdmin();
if (!$myDBConnection->isError()) {
    $myerrorcode = 401;

    $data = json_decode(file_get_contents('php://input'), true);
    $myToken = $data["at"];
    $workspaceId = $data["ws"];
    $reportIds = $data["r"];
    $columnDelimiter = $data["cd"];
    $cellDelimiter = $data["q"];

    if (isset($myToken)) {
        $workspaces = $myDBConnection->getWorkspaces($myToken);
        if (count($workspaces) > 0) {
            $wsIdInt = intval($workspaceId);
            $workspaceId = 0;
            foreach($workspaces as $ws) {
                if ($ws['id'] == $wsIdInt) {
                    $workspaceId = $wsIdInt;
                }
            }

            if ($workspaceId > 0) {
                $myerrorcode = 0;

                $allReports = [];

                // collect all reports, ignore doubles /////////////////////////////////////
                $reportFolderName = '../../vo_data/ws_' . $workspaceId . '/SysCheck/reports';
                if (file_exists($reportFolderName)) {
                    $reportDir = opendir($reportFolderName);
                    while (($reportFileName = readdir($reportDir)) !== false) {
                        $fullReportFileName = $reportFolderName . '/' . $reportFileName;
                        if (is_file($fullReportFileName) && (strtoupper(substr($reportFileName, -5)) == '.JSON')) {
                            $filecontent = file_get_contents($fullReportFileName);
                            if ($filecontent !== false) {
                                $filecontentJson = json_decode($filecontent, true);
                                if (!is_null($filecontentJson)) {
                                    $syscheckId = $filecontentJson['checkId'];
                                    if (strlen($syscheckId) == 0) {
                                        $syscheckId = '--';
                                        $filecontentJson['checkId'] = '--';
                                    }
                                    if (in_array($syscheckId, $reportIds)) {
                                        $filecontentJson['date'] = '';
                                        $checksum = crc32(serialize($filecontentJson));
                                        $filecontentJson['date'] = filemtime($fullReportFileName);
                                        $filecontentJson['datestr'] = date('Y-m-d H:i:s', filemtime($fullReportFileName));
                                        if (isset($allReports[$checksum])) {
                                            $oldData = $allReports[$checksum];
                                            if ($oldData['data']['date'] < $filecontentJson['date']) {
                                                $allReports[$checksum] = [
                                                    'filename' => $reportFileName,
                                                    'data' => $filecontentJson
                                                ];
                                            }
                                        } else {
                                            $allReports[$checksum] = [
                                                'filename' => $reportFileName,
                                                'data' => $filecontentJson
                                            ];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // define column headers /////////////////////////////////////
                $columnsGeneral = ['checkId', 'datestr', 'checkLabel', 'title'];
                $columnsEnv = [];
                $columnsNet = [];
                $columnsQuest = [];


                foreach(array_keys($allReports) as $reportKey) {
                    foreach($allReports[$reportKey]['data']['envData'] as $env) {
                        $colKey = $env['id'] . ': ' . $env['label'];
                        if (!in_array($colKey, $columnsEnv)) {
                            array_push($columnsEnv, $colKey);
                        }
                    }
                    foreach($allReports[$reportKey]['data']['netData'] as $net) {
                        $colKey = $net['id'] . ': ' . $net['label'];
                        if (!in_array($colKey, $columnsNet)) {
                            array_push($columnsNet, $colKey);
                        }
                    }
                    foreach($allReports[$reportKey]['data']['questData'] as $quest) {
                        $colKey = $quest['id'] . ': ' . $quest['label'];
                        if (!in_array($colKey, $columnsQuest)) {
                            array_push($columnsQuest, $colKey);
                        }
                    }
                }

                $csvLine = 'filename';
                foreach($columnsGeneral as $c) {
                    $csvLine = $csvLine . $columnDelimiter . $c;
                }
                foreach($columnsEnv as $c) {
                    $csvLine = $csvLine . $columnDelimiter . $cellDelimiter . $c . $cellDelimiter;
                }
                foreach($columnsNet as $c) {
                    $csvLine = $csvLine . $columnDelimiter . $cellDelimiter . $c . $cellDelimiter;
                }
                foreach($columnsQuest as $c) {
                    $csvLine = $csvLine . $columnDelimiter . $cellDelimiter . $c . $cellDelimiter;
                }
                array_push($myreturn, $csvLine);

                // hand over to return /////////////////////////////////////
                foreach(array_keys($allReports) as $reportKey) {
                    $csvLine = $cellDelimiter . $allReports[$reportKey]['filename'] . $cellDelimiter;
                    foreach($columnsGeneral as $c) {
                        $csvLine = $csvLine . $columnDelimiter . $cellDelimiter . $allReports[$reportKey]['data'][$c] . $cellDelimiter;
                    }

                    // env ++++++++++++++++++++++++++++++++++
                    $myEntries = [];
                    foreach($allReports[$reportKey]['data']['envData'] as $entry) {
                        $colKey = $entry['id'] . ': ' . $entry['label'];
                        if (!isset($myEntries[$colKey])) {
                            $myEntries[$colKey] = $entry['value'];
                        }
                    }
                    foreach($columnsEnv as $c) {
                        if (isset($myEntries[$c])) {
                            $csvLine = $csvLine . $columnDelimiter . $cellDelimiter . $myEntries[$c] . $cellDelimiter;
                        } else {
                            $csvLine = $csvLine . $columnDelimiter;
                        }
                    }

                    // net ++++++++++++++++++++++++++++++++++
                    $myEntries = [];
                    foreach($allReports[$reportKey]['data']['netData'] as $entry) {
                        $colKey = $entry['id'] . ': ' . $entry['label'];
                        if (!isset($myEntries[$colKey])) {
                            $myEntries[$colKey] = $entry['value'];
                        }
                    }
                    foreach($columnsNet as $c) {
                        if (isset($myEntries[$c])) {
                            $csvLine = $csvLine . $columnDelimiter . $cellDelimiter . $myEntries[$c] . $cellDelimiter;
                        } else {
                            $csvLine = $csvLine . $columnDelimiter;
                        }
                    }

                    // quest ++++++++++++++++++++++++++++++++++
                    $myEntries = [];
                    foreach($allReports[$reportKey]['data']['questData'] as $entry) {
                        $colKey = $entry['id'] . ': ' . $entry['label'];
                        if (!isset($myEntries[$colKey])) {
                            $myEntries[$colKey] = $entry['value'];
                        }
                    }
                    foreach($columnsQuest as $c) {
                        if (isset($myEntries[$c])) {
                            $csvLine = $csvLine . $columnDelimiter . $cellDelimiter . $myEntries[$c] . $cellDelimiter;
                        } else {
                            $csvLine = $csvLine . $columnDelimiter;
                        }
                    }

                    array_push($myreturn, $csvLine);
                }
            }
        }
    }
}
unset($myDBConnection);

if ($myerrorcode > 0) {
    http_response_code($myerrorcode);
} else {
    echo(json_encode($myreturn));
}
