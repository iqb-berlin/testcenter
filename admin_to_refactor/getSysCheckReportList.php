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

						// count by checkId /////////////////////////////////////
						$reportList = [];
						foreach(array_keys($allReports) as $reportKey) { 
							$checkId = $allReports[$reportKey]['data']['checkId'];
							if (strlen($checkId) == 0) {
								$checkId = '--';
							}

							$browserV = '';
							$browserN = '';
							$os = '';
							foreach($allReports[$reportKey]['data']['envData'] as $env) {
								if ($env['label'] == 'Betriebssystem') {
									$os = $env['value'];
								} else if ($env['label'] == 'Browser Version') {
									$browserV = $env['value'];
								} else if ($env['label'] == 'Browser Name') {
									$browserN = $env['value'];
								}
							}
							$browser = $browserN . ' ' . $browserV;

							if (isset($reportList[$checkId])) {
								$reportList[$checkId]['count'] = $reportList[$checkId]['count'] + 1;
								if ($allReports[$reportKey]['data']['date'] > $reportList[$checkId]['last']) {
									$reportList[$checkId]['last'] = $allReports[$reportKey]['data']['date'];
								}
							} else {
								$reportList[$checkId] = [
									'id' => $checkId,
									'count' => 1,
									'label' => $allReports[$reportKey]['data']['checkLabel'],
									'browser' => [],
									'os' => [],
									'last' => $allReports[$reportKey]['data']['date'],
									'details' => []
								];
							}

							if (isset($reportList[$checkId]['browser'][$browser])) {
								$reportList[$checkId]['browser'][$browser] = $reportList[$checkId]['browser'][$browser] + 1;
							} else {
								$reportList[$checkId]['browser'][$browser] = 1;
							}
							if (isset($reportList[$checkId]['os'][$os])) {
								$reportList[$checkId]['os'][$os] = $reportList[$checkId]['os'][$os] + 1;
							} else {
								$reportList[$checkId]['os'][$os] = 1;
							}
						}

						// hand over to return /////////////////////////////////////
						foreach(array_keys($reportList) as $report) {
							$os_string = '';
							foreach(array_keys($reportList[$report]['os']) as $os) {
								$os_string = $os_string . $os . ' (' . strval($reportList[$report]['os'][$os]) . '); ';
							}
							$browser_string = '';
							foreach(array_keys($reportList[$report]['browser']) as $browser) {
								$browser_string = $browser_string . $browser . ' (' . strval($reportList[$report]['browser'][$browser]) . '); ';
							}
							array_push($reportList[$report]['details'], $os_string);
							array_push($reportList[$report]['details'], $browser_string);
							array_push($myreturn, $reportList[$report]);
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