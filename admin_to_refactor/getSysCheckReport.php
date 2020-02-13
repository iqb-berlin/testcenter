<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
		require_once('../../vo_code/DBConnectionAdmin.php');

		// *****************************************************************

		$myreturn = [];

		$myerrorcode = 503;

		$myDBConnection = new DBConnectionAdmin();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;

			$data = json_decode(file_get_contents('php://input'), true);
			$myToken = $data["at"];
			$wsId = $data["ws"];
			$reportIds = $data["r"];
			$deli = $data["cd"];
			$quote = $data["q"];

			if (isset($myToken)) {
				$workspaces = $myDBConnection->getWorkspaces($myToken);
				if (count($workspaces) > 0) {
					$wsIdInt = intval($wsId);
					$wsId = 0;
					foreach($workspaces as $ws) {
						if ($ws['id'] == $wsIdInt) {
							$wsId = $wsIdInt;
						}
					}

					if ($wsId > 0) {
						$myerrorcode = 0;

						$allReports = [];

						// collect all reports, ignore doubles /////////////////////////////////////
						$reportFolderName = '../../vo_data/ws_' . $wsId . '/SysCheck/reports';
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
							$csvLine = $csvLine . $deli . $c;
						}
						foreach($columnsEnv as $c) {
							$csvLine = $csvLine . $deli . $quote . $c . $quote;
						}
						foreach($columnsNet as $c) {
							$csvLine = $csvLine . $deli . $quote . $c . $quote;
						}
						foreach($columnsQuest as $c) {
							$csvLine = $csvLine . $deli . $quote . $c . $quote;
						}
						array_push($myreturn, $csvLine);

						// hand over to return /////////////////////////////////////
						foreach(array_keys($allReports) as $reportKey) {
							$csvLine = $quote . $allReports[$reportKey]['filename'] . $quote;
							foreach($columnsGeneral as $c) {
								$csvLine = $csvLine . $deli . $quote . $allReports[$reportKey]['data'][$c] . $quote;
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
									$csvLine = $csvLine . $deli . $quote . $myEntries[$c] . $quote;
								} else {
									$csvLine = $csvLine . $deli;
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
									$csvLine = $csvLine . $deli . $quote . $myEntries[$c] . $quote;
								} else {
									$csvLine = $csvLine . $deli;
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
									$csvLine = $csvLine . $deli . $quote . $myEntries[$c] . $quote;
								} else {
									$csvLine = $csvLine . $deli;
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
	}
?>