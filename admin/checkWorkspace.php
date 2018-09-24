<?php
	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
		require_once('../vo_code/DBConnectionAdmin.php');
		require_once('../vo_code/FilesFactory.php');
		require_once('../vo_code/XMLFile.php');
		require_once('../vo_code/XMLFileBooklet.php');
		require_once('../vo_code/XMLFileUnit.php');
		require_once('../vo_code/XMLFileTesttakers.php');

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
						$validDefinitionTypes = [];
						$testtakerCount = 0;

						// get all resource files
						$myFolder = '../vo_data/ws_' . $wsId . '/Resource';
						if (file_exists($myFolder) && is_dir($myFolder)) {
							$mydir = opendir($myFolder);
							while (($entry = readdir($mydir)) !== false) {
								if (is_file($myFolder . '/' . $entry)) {
									array_push($allResources, strtoupper($entry));
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
									$xFile = new XMLFileUnit($fullfilename, true);
									if ($xFile->isValid()) {
										$rootTagName = $xFile->getRoottagName();
										if ($rootTagName != 'Unit') {
											array_push($myreturn['warnings'], 'invalid root-tag "' . $rootTagName . '" in Unit-XML-file "' . $entry . '"');												// ..........................
										} else {
											$unitId = $xFile->getId();
											if (in_array($unitId, $allUnits)) {
												array_push($myreturn['errors'], 'double unit id "' . $unitId . '" in Unit-XML-file "' . $entry . '"');
											} else {
												$ok = true;
												foreach($xFile->getResourceFilenames() as $r) { 
													if (!in_array(strtoupper($r), $allResources)) {
														array_push($myreturn['errors'], 'resource "' . $r . '" not found (required in Unit-XML-file "' . $entry . '"');
														$ok = false;
													}
												}

												$myDefinitionType = $xFile->getUnitDefinitonType();
												if (strlen($myDefinitionType) > 0) {
													if (!in_array(strtoupper($myDefinitionType), $allResources) and !in_array(strtoupper($myDefinitionType) . '.HTML', $allResources)) {
														array_push($myreturn['errors'], 'unit definition type "' . $myDefinitionType . '" not found (required in Unit-XML-file "' . $entry . '"');
														$ok = false;
													}
												} else {
													array_push($myreturn['errors'], 'no unit definition type defined in Unit-XML-file "' . $entry . '"');
													$ok = false;
												}

												if ($ok == true) {
													array_push($allUnits, $unitId);
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
									$xFile = new XMLFileBooklet($fullfilename, true);
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
												$ok = true;
												foreach($xFile->getResourceFilenames() as $r) { 
													if (!in_array(strtoupper($r), $allResources)) {
														array_push($myreturn['errors'], 'resource "' . $r . '" not found (required in Booklet-XML-file "' . $entry . '" (ignore booklet)');
														$ok = false;
													}
												}
			
												if ($ok == true) {
													foreach($xFile->getAllUnitIds() as $unitId) { 
														if (!in_array($unitId, $allUnits)) {
															array_push($myreturn['errors'], 'unit "' . $unitId . '" not found (required in Booklet-XML-file "' . $entry . '" (ignore booklet)');
															$ok = false;
														}
													}
													if ($ok == true) {
														array_push($allBooklets, $bookletId);
													}
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
									$xFile = new XMLFileTesttakers($fullfilename, true);
									if ($xFile->isValid()) {
										$rootTagName = $xFile->getRoottagName();
										if ($rootTagName != 'Testtakers') {
											array_push($myreturn['warnings'], 'invalid root-tag "' . $rootTagName . '" in Testtakers-XML-file "' . $entry . '"');
										} else {
											// ..........................
											$errorBookletnames = [];
											$myTesttakers = $xFile->getAllTesttakers();
											$testtakerCount = $testtakerCount + count($myTesttakers);
											foreach($myTesttakers as $testtaker) {
												foreach($testtaker['booklets'] as $bookletId) {
													if (!in_array($bookletId, $allBooklets)) {
														if (!in_array($bookletId, $errorBookletnames)) {
															array_push($myreturn['errors'], 'booklet "' . $bookletId . '" not found for login "' . $loginName . '" in Testtakers-XML-file "' . $entry . '"');
															array_push($errorBookletnames, $bookletId);
														}
													}
												}
												if (!in_array($testtaker['loginname'], $allLoginNames)) {
													array_push($allLoginNames, $testtaker['loginname']);
												}
											}
											// ..........................
											$doubleLogins = $xFile->getDoubleLoginNames();
											if (count($doubleLogins) > 0) {
												foreach($doubleLogins as $ln) {
													array_push($myreturn['errors'], 'loginname "' . $ln . '" appears more often then once in Testtakers-XML-file "' . $entry . '"');
												}
											}
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
													$xFile = new XMLFileTesttakers($fullfilename, true);
													if ($xFile->isValid()) {
														foreach($xFile->getAllLoginNames() as $ln) { 
															if (in_array($ln, $allLoginNames)) {
																array_push($myreturn['errors'], 'double login "' . $ln . '" in Testtakers-XML-file "' . $entry . '" (other workspace "' . $wsName . '")');
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
						array_push($myreturn['infos'], strval($testtakerCount) . ' testtakers in ' . strval(count($allLoginNames)) . ' logins found');

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