<?php
	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
		require_once('../vo_code/DBConnectionAdmin.php');
		require_once('../vo_code/FilesFactory.php');
		require_once('../vo_code/XMLFile.php');

		// *****************************************************************

		$myreturn = ['errors' => [], 'warnings' => [], 'infos' => []];

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
						$allResources = [];
						$allUnits = [];
						$allBooklets = [];
						$allLoginNames = [];

						// get all resource files
						$myFolder = '../vo_data/ws_' . $wsId . '/Resource';
						if (file_exists($myFolder) && is_dir($myFolder)) {
							$mydir = opendir($myFolder);
							while (($entry = readdir($mydir)) !== false) {
								if (is_file($myFolder . '/' . $entry)) {
									array_push($allResources, $entry);
								}
							}
						}
						array_push($myreturn['infos'], strval(count($allResources)) . ' resource files found');

						// get all units and check resources
						$myFolder = '../vo_data/ws_' . $wsId . '/Unit';
						if (file_exists($myFolder) && is_dir($myFolder)) {
							$mydir = opendir($myFolder);
							while (($entry = readdir($mydir)) !== false) {
								$fullfilename = $myFolder . '/' . $entry;
								if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {
									$xFile = new XMLFile($fullfilename);
									if ($xFile->isValid()) {
										$rootTagName = $xFile->getRoottagName();
										if ($rootTagName != 'Unit') {
											array_push($myreturn['warnings'], 'invalid root-tag "' . $rootTagName . '" in Unit-XML-file "' . $entry . '"');												// ..........................
										} else {
											$unitId = $xFile->getId();
											if (in_array($unitId, $allUnits)) {
												array_push($myreturn['errors'], 'double unit id "' . $unitId . '" in Unit-XML-file "' . $entry . '"');
											} else {
			
												$resourcesElement = $xFile->xmlfile->Resources[0];
												if (isset($resourcesElement)) {

													$itemplayerFound = false;
													foreach($resourcesElement->children() as $r) { 
														$rType = (string) $r['type'];
														if (isset($rType)) {
															if (in_array((string) $r, $allResources)) {
																if ($rType == 'itemplayer_html') {
																	$itemplayerFound = true;
																}
															} else {
																array_push($myreturn['errors'], 'resource "' . (string) $r . '" not found (required in Unit-XML-file "' . $entry . '"');
															}
														} else {
															array_push($myreturn['errors'], 'invalid resource found in Unit-XML-file "' . $entry . '" (no type)');
														}
													}
													if ($itemplayerFound == true) {
														array_push($allUnits, $unitId);
													} else {
														array_push($myreturn['errors'], 'no itemplayer defined in Unit-XML-file "' . $entry . '"');
													}
												} else {
													array_push($myreturn['errors'], 'no resources found in Unit-XML-file "' . $entry . '"');
												}
											}
										}
									} else {
										array_push($myreturn['warnings'], 'Unit "' . $entry . '" is not valid vo-XML');
									}
								}
							}
						}
						array_push($myreturn['infos'], strval(count($allUnits)) . ' valid units found');

						// get all booklets and check units and resources
						$myFolder = '../vo_data/ws_' . $wsId . '/Booklet';
						if (file_exists($myFolder) && is_dir($myFolder)) {
							$mydir = opendir($myFolder);
							while (($entry = readdir($mydir)) !== false) {
								$fullfilename = $myFolder . '/' . $entry;
								if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {
									$xFile = new XMLFile($fullfilename);
									if (!$xFile->isValid()) {
										array_push($myreturn['warnings'], 'error reading Booklet-XML-file "' . $entry . '"');
									} else {
										$rootTagName = $xFile->getRoottagName();
										if ($rootTagName != 'Booklet') {
											array_push($myreturn['warnings'], 'invalid root-tag "' . $rootTagName . '" in Booklet-XML-file "' . $entry . '"');
										} else {
											// ..........................
											$bookletId = $xFile->getId();
											if (in_array($bookletId, $allBooklets)) {
												array_push($myreturn['errors'], 'double booklet id "' . $bookletId . '" in Booklet-XML-file "' . $entry . '"');
											} else {
												$resourcesOK = true;
			
												$resourcesElement = $xFile->xmlfile->Resources[0];
												if (isset($resourcesElement)) {
													foreach($resourcesElement->children() as $r) { 
														$rType = (string) $r['type'];
														if (isset($rType)) {
															if (!in_array((string) $r, $allResources)) {
																array_push($myreturn['errors'], 'resource "' . (string) $r . '" not found (required in Booklet-XML-file "' . $entry . '" (ignore booklet)');
																$resourcesOK = false;
															}
														} else {
															array_push($myreturn['errors'], 'invalid resource found in Booklet-XML-file "' . $entry . '" (no type; ignore booklet)');
															$resourcesOK = false;
														}
													}
												}
												if ($resourcesOK == true) {
													// ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
													$unitsElement = $xFile->xmlfile->Units[0];
													if (isset($unitsElement)) {
														if ($unitsElement->count() > 0) {
															$unitsOK = true;
															foreach($unitsElement->children() as $u) { 
																$unitId = (string) $u['id'];
																if (isset($unitId)) {
																	$unitId = strtoupper($unitId);
																	if (!in_array($unitId, $allUnits)) {
																		array_push($myreturn['errors'], 'unit "' . $unitId . '" not found (required in Booklet-XML-file "' . $entry . '" (ignore booklet)');
																		$unitsOK = false;
																	}
																}
															}
															if ($unitsOK == true) {
																array_push($allBooklets, $bookletId);
															}
														} else {
															array_push($myreturn['errors'], 'no units defined in Booklet-XML-file "' . $entry . '" (ignore booklet)');
														}
													} else {
														array_push($myreturn['errors'], 'no units defined in Booklet-XML-file "' . $entry . '" (ignore booklet)');
													}
													// ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
												}
											}
											// ..........................
										}
									}		
								}
							}
						}
						array_push($myreturn['infos'], strval(count($allBooklets)) . ' valid booklets found');

						// get all logins and check booklets
						$myFolder = '../vo_data/ws_' . $wsId . '/Testtakers';
						if (file_exists($myFolder) && is_dir($myFolder)) {
							$mydir = opendir($myFolder);
							while (($entry = readdir($mydir)) !== false) {
								$fullfilename = $myFolder . '/' . $entry;
								if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {
									$xFile = new XMLFile($fullfilename);
									if ($xFile->isValid()) {
										$xFile->getRoottagName();
										if ($rootTagName != 'Testtakers') {
											array_push($myreturn['warnings'], 'invalid root-tag "' . $rootTagName . '" in Testtakers-XML-file "' . $entry . '"');
										} else {
											// ..........................
											foreach($xFile->xmlfile->children() as $group) { 
												if ($group->getName() == 'Group') {
													foreach($group->children() as $login) {
														$loginName = (string) $login['name'];
														if (in_array($loginName, $allLoginNames)) {
															array_push($myreturn['errors'], 'double login "' . $loginName . '" in Testtakers-XML-file "' . $entry . '"');
														} else {
															array_push($allLoginNames, $loginName);
															if ($login->count() > 0) {
																foreach($login->children() as $b) {
																	$bookletId = strtoupper((string) $b);
																	if (!in_array($bookletId, $allBooklets)) {
																		array_push($myreturn['errors'], 'booklet "' . $bookletId . '" not found for login "' . $loginName . '" in Testtakers-XML-file "' . $entry . '"');
																	}
																}
															} else {
																array_push($myreturn['errors'], 'no booklets defined for login "' . $loginName . '" in Testtakers-XML-file "' . $entry . '"');
															}
														}
													}
												}
											}
											// ..........................
										}
									} else {
										array_push($myreturn['warnings'], 'Testtakers-XML-File "' . $entry . '" is not valid vo-XML');
									}
								}
							}
						}

						// check wether a login is used in another workspace
						// get all resource files
						$myFolder = '../vo_data';
						if (file_exists($myFolder) && is_dir($myFolder)) {
							$mydir = opendir($myFolder);
							while (($wsdirname = readdir($mydir)) !== false) {
								if (is_dir($myFolder . '/' . $wsdirname) && (substr($wsdirname, 0, 3) == 'ws_')) {
									$wsIdOther = intval(substr($wsdirname, 3));
									if (($wsIdOther > 0) && ($wsIdOther <> $wsId)) {
										$myTesttakersFolder = $myFolder . '/' . $wsdirname . '/Testtakers';
										if (file_exists($myTesttakersFolder) && is_dir($myTesttakersFolder)) {
											$ttdir = opendir($myTesttakersFolder);
											$wsName = $myDBConnection->getWorkspaceName($wsIdOther);

											while (($entry = readdir($ttdir)) !== false) {

												$fullfilename = $myTesttakersFolder . '/' . $entry;
												if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {
													$xFile = new XMLFile($fullfilename);
													if ($xFile->isValid()) {
														$rootTagName = $xFile->getRoottagName();
														if ($rootTagName == 'Testtakers') {
															foreach($xFile->xmlfile->children() as $group) { 
																if ($group->getName() == 'Group') {
																	foreach($group->children() as $login) {
																		$loginName = (string) $login['name'];
																		if (in_array($loginName, $allLoginNames)) {
																			array_push($myreturn['errors'], 'double login "' . $loginName . '" in Testtakers-XML-file "' . $entry . '" (other workspace "' . $wsName . '")');
																		}
																	}
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
						array_push($myreturn['infos'], strval(count($allLoginNames)) . ' logins found');

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