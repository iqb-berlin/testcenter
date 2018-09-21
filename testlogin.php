<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

// preflight OPTIONS-Request bei CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	exit();
} else {
	require_once('vo_code/DBConnectionLogin.php');

	// *****************************************************************

	// Booklet-Struktur: name, codes[], 
	$myreturn = '';

	$myerrorcode = 503;

	$myDBConnection = new DBConnectionLogin();
	if (!$myDBConnection->isError()) {
		$myerrorcode = 401;

		$data = json_decode(file_get_contents('php://input'), true);
		$myName = $data["n"];
		$myPassword = $data["p"];

		$hasfound = false;
		$myBooklets = [];
		$myWorkspace = '';
		$myMode = '';
		$myGroup = '';
		if (isset($myName) and isset($myPassword)) {
			$workspaceDir = opendir('vo_data');
			$testeefiledirprefix = 'vo_data/ws_';

			require_once('vo_code/XMLFile.php'); // // // // ========================

			while (($subdir = readdir($workspaceDir)) !== false) {
				$mysplits = explode('_', $subdir);

				if (count($mysplits) == 2) {
					if (($mysplits[0] == 'ws') && is_numeric($mysplits[1])) {
						$TesttakersDirname = $testeefiledirprefix . $mysplits[1] . '/Testtakers';
						if (file_exists($TesttakersDirname)) {
							$mydir = opendir($TesttakersDirname);
							while (($entry = readdir($mydir)) !== false) {
								$fullfilename = $TesttakersDirname . '/' . $entry;
								if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {
									// &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
									$xFile = new XMLFile($fullfilename);
									if ($xFile->isValid()) {
										if ($xFile->getRoottagName()  == 'Testtakers') {
											foreach($xFile->xmlfile->children() as $group) { 
												if ($group->getName() == 'Group') {
													$notBefore = '';
													if (isset($group['notbefore'])) {
														$notBefore = (string) $group['notbefore'];
													}
													$notAfter = '';
													if (isset($group['notafter'])) {
														$notAfter = (string) $group['notafter'];
													}
													if (isset($group['mode'])) {
														$myGroup = $group['name'];

														foreach($group->children() as $tt) { 
															if ($tt['name'] == $myName) {
																$hasfound = true;
																if ($tt['pw'] == $myPassword) {
																	$myerrorcode = 0;

																	$myMode = (string) $group['mode'];
																	$myWorkspace = $mysplits[1];

																	if (isset($tt['notbefore'])) {
																		$notBefore = (string) $tt['notbefore'];
																	}
																	if (isset($tt['notafter'])) {
																		$notAfter = (string) $tt['notafter'];
																	}
																	foreach($tt->children() as $b) { 
																		$ttcodesList = [];
																		if (isset($b['codes'])) {
																			$ttcodes = (string) $b['codes'];
																			if (strlen($ttcodes) > 0) {
																				$ttcodesList = explode(' ', $ttcodes);
																			}
																		}
																		if (isset($b['notbefore'])) {
																			$notBefore = (string) $b['notbefore'];
																		}
																		if (isset($b['notafter'])) {
																			$notAfter = (string) $b['notafter'];
																		}
																		array_push($myBooklets, [
																			'id' => (string) $b,
																			'codes' => $ttcodesList,
																			'notbefore' => $notBefore,
																			'notafter' => $notAfter
																		]);
																	}
																}
																break;
															}
														} // xml Logins
													}
												}
												if ($hasfound) {
													break;
												}
											} // xml Groups
										}
									}
									// &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
								}
								if ($hasfound) {
									break;
								}
							} // lesen von Verzeichnisinhalt Testtakers
						}
					}
				}
				if ($hasfound) {
					break;
				}
			} // lesen subdirs von vo_data


			if (strlen($myWorkspace) > 0) {
				$myreturn = $myDBConnection->login(
					$myWorkspace, $myGroup, $myName, $myMode, json_encode($myBooklets));
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