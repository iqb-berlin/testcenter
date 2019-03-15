<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Mechtel
// 2018, 2019
// license: MIT
// ...................................................

$allResources = [];
$allVersionnedResources = [];
$allUsedResources = [];
$allUsedVersionnedResources = [];
$allUnits = [];
$allUsedUnits = [];
$allBooklets = [];
$allUsedBooklets = [];

$allResourceFilesWithSize = [];
$allUnitsWithPlayer = [];
$allUnitsOnlyFilesize = [];
$allBookletsFilesize = [];

// ...................................................
function normaliseFileName($fn, $v) {
    $myreturn = strtoupper($fn);
    if ($v) {
        $firstDotPos = strpos($myreturn, '.');
        if ($firstDotPos) {
            $lastDotPos = strrpos($myreturn, '.');
            if ($lastDotPos > $firstDotPos) {
                $myreturn = substr($myreturn, 0, $firstDotPos) . substr($myreturn, $lastDotPos);
            }
        }
    }
    return $myreturn;
}

// ...................................................
function resourceExists($r, $v) {
	global $allResources;
	global $allVersionnedResources;
	global $allUsedResources;
	global $allUsedVersionnedResources;

	$myExistsReturn = false;
	$rNormalised1 = normaliseFileName($r, false);
	$rNormalised2 = normaliseFileName($r, true);
	if (in_array($rNormalised1, $allResources)) {
		if (!in_array($rNormalised1, $allUsedResources)) {
			array_push($allUsedResources, $rNormalised1);
		}
		$myExistsReturn = true;
	} elseif ($v && in_array($rNormalised2, $allVersionnedResources)) {
		if (!in_array($rNormalised2, $allUsedVersionnedResources)) {
			array_push($allUsedVersionnedResources, $rNormalised2);
		}
		$myExistsReturn = true;
	}
	return $myExistsReturn;
}

// ...................................................
function unitExists($u) {
	global $allUnits;
	global $allUsedUnits;

	$myExistsReturn = false;
	if (in_array(strtoupper($u), $allUnits)) {
		if (!in_array(strtoupper($u), $allUsedUnits)) {
			array_push($allUsedUnits, strtoupper($u));
		}
		$myExistsReturn = true;
	}
	return $myExistsReturn;
}

// ...................................................
function bookletExists($b) {
	global $allBooklets;
	global $allUsedBooklets;

	$myExistsReturn = false;
	if (in_array(strtoupper($b), $allBooklets)) {
		if (!in_array(strtoupper($b), $allUsedBooklets)) {
			array_push($allUsedBooklets, strtoupper($b));
		}
		$myExistsReturn = true;
	}
	return $myExistsReturn;
}


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// preflight OPTIONS-Request bei CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	exit();
} else {
	require_once('../../vo_code/DBConnectionAdmin.php');
	require_once('../../vo_code/FilesFactory.php');
	require_once('../../vo_code/XMLFile.php');
	require_once('../../vo_code/XMLFileBooklet.php');
	require_once('../../vo_code/XMLFileUnit.php');
	require_once('../../vo_code/XMLFileTesttakers.php');
	require_once('../../vo_code/XMLFileSysCheck.php');

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
			if ($myDBConnection->hasAdminAccessToWorkspace($myToken, $wsId)) {

				// **********************************************************
				$myerrorcode = 0;
				$allLoginNames = [];
				$validDefinitionTypes = [];
				$testtakerCount = 0;

				// get all resource files
				$myFolder = '../../vo_data/ws_' . $wsId . '/Resource';
				if (file_exists($myFolder) && is_dir($myFolder)) {
					$mydir = opendir($myFolder);
					while (($entry = readdir($mydir)) !== false) {
						if (is_file($myFolder . '/' . $entry)) {
							$myFilesize = filesize($myFolder . '/' . $entry);
							array_push($allResources, normaliseFileName($entry, false));
							$allResourceFilesWithSize[normaliseFileName($entry, false)] = $myFilesize;
							array_push($allVersionnedResources, normaliseFileName($entry, true));
							$allResourceFilesWithSize[normaliseFileName($entry, true)] = $myFilesize;
						}
					}
				}
				array_push($myreturn['infos'], strval(count($allResources)) . ' resource files found');

				// get all units and check resources
				$myFolder = '../../vo_data/ws_' . $wsId . '/Unit';
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
										$filesizeTotal = filesize($fullfilename);

										foreach($xFile->getResourceFilenames() as $r) { 
											if (resourceExists($r, false)) {
												$filesizeTotal += $allResourceFilesWithSize[normaliseFileName($r, false)];
											} else {
												array_push($myreturn['errors'], 'resource "' . $r . '" not found (required in Unit-XML-file "' . $entry . '"');
												$ok = false;
											}
										}

										$myPlayer = strtoupper($xFile->getPlayer());
										if (strlen($myPlayer) > 0) {
											if (substr($myPlayer, -5) != '.HTML') {
												$myPlayer = $myPlayer . '.HTML';
											}
											if (!resourceExists($myPlayer, true)) {
												array_push($myreturn['errors'], 'unit definition type "' . $myPlayer . '" not found (required in Unit-XML-file "' . $entry . '")');
												$ok = false;
											}
										} else {
											array_push($myreturn['errors'], 'no player defined in Unit-XML-file "' . $entry . '"');
											$ok = false;
										}

										if ($ok == true) {
											array_push($allUnits, $unitId);
											$allUnitsOnlyFilesize[$unitId] = $filesizeTotal;
											$allUnitsWithPlayer[$unitId] = $myPlayer;
										}
									}
								}
							} else {
								foreach($xFile->getErrors() as $e) {
									array_push($myreturn['errors'], 'Unit "' . $entry . '" is not valid vo-XML: ' . $e);
								}
							}
						}
					}
				}
				array_push($myreturn['infos'], strval(count($allUnits)) . ' valid units found');

				// get all booklets and check units and resources
				$myFolder = '../../vo_data/ws_' . $wsId . '/Booklet';
				if (file_exists($myFolder) && is_dir($myFolder)) {
					$mydir = opendir($myFolder);
					while (($entry = readdir($mydir)) !== false) {
						$fullfilename = $myFolder . '/' . $entry;
						if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {
							$xFile = new XMLFileBooklet($fullfilename, true);
							if (!$xFile->isValid()) {
								foreach($xFile->getErrors() as $r) {
									array_push($myreturn['errors'], 'error reading Booklet-XML-file "' . $entry . '": ' . $r);
								}
							} else {
								$rootTagName = $xFile->getRoottagName();
								if ($rootTagName != 'Booklet') {
									array_push($myreturn['errors'], 'invalid root-tag "' . $rootTagName . '" in Booklet-XML-file "' . $entry . '"');
								} else {
									// ..........................
									$bookletLoad = filesize($fullfilename);
									$bookletPlayers = [];
									$bookletId = $xFile->getId();
									if (in_array($bookletId, $allBooklets)) {
										array_push($myreturn['errors'], 'double booklet id "' . $bookletId . '" in Booklet-XML-file "' . $entry . '"');
									} else {
										$ok = true;
										foreach($xFile->getResourceFilenames() as $r) { 
											if (!resourceExists($r, false)) {
												array_push($myreturn['errors'], 'resource "' . $r . '" not found (required in Booklet-XML-file "' . $entry . '" (ignore booklet)');
												$ok = false;
											}
										}
	
										if ($ok == true) {
											foreach($xFile->getAllUnitIds() as $unitId) { 
												if (unitExists($unitId)) {
													$bookletLoad += $allUnitsOnlyFilesize[$unitId];
													$myPlayer = $allUnitsWithPlayer[$unitId];
													if (!in_array($myPlayer, $bookletPlayers)) {
														if (isset($allResourceFilesWithSize[$myPlayer])) {
															$bookletLoad += $allResourceFilesWithSize[$myPlayer];
														} else {
															$myPlayer = normaliseFileName($myPlayer, true);
															if (isset($allResourceFilesWithSize[$myPlayer])) {
																$bookletLoad += $allResourceFilesWithSize[$myPlayer];
															} else {
																array_push($myreturn['warnings'], 'resource "' . $myPlayer . '" not found in filesize-list');
															}
														}
														array_push($bookletPlayers, $myPlayer);
													}
												} else {
													array_push($myreturn['errors'], 'unit "' . $unitId . '" not found (required in Booklet-XML-file "' . $entry . '" (ignore booklet)');
													$ok = false;
												}
											}
											if ($ok == true) {
												array_push($allBooklets, $bookletId);
												$allBookletsFilesize[$bookletId] = $bookletLoad;
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

				// get all syschecks and check units
				$myFolder = '../../vo_data/ws_' . $wsId . '/SysCheck';
				$validSysCheckCount = 0;
				if (file_exists($myFolder) && is_dir($myFolder)) {
					$mydir = opendir($myFolder);
					while (($entry = readdir($mydir)) !== false) {
						$fullfilename = $myFolder . '/' . $entry;
						if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {
							$xFile = new XMLFileSysCheck($fullfilename, true);
							if (!$xFile->isValid()) {
								foreach($xFile->getErrors() as $r) {
									array_push($myreturn['errors'], 'error reading SysCheck-XML-file "' . $entry . '": ' . $r);
								}
							} else {
								$rootTagName = $xFile->getRoottagName();
								if ($rootTagName != 'SysCheck') {
									array_push($myreturn['warnings'], 'invalid root-tag "' . $rootTagName . '" in SysCheck-XML-file "' . $entry . '"');
								} else {
									// ..........................
									$unitId = $xFile->getUnitId();
									if (strlen($unitId) > 0) {
										if (!unitExists($unitId)) {
											array_push($myreturn['errors'], 'unit "' . $unitId . '" not found (required in SysCheck-XML-file "' . $entry . '")');
										} else {
											$validSysCheckCount = $validSysCheckCount + 1;
										}
									} else {
										$validSysCheckCount = $validSysCheckCount + 1;
									}
								// ..........................
								}
							}		
						}
					}
				}
				array_push($myreturn['infos'], strval($validSysCheckCount) . ' valid syschecks found');
				

				// get all logins and check booklets
				$myFolder = '../../vo_data/ws_' . $wsId . '/Testtakers';
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
											if (!bookletExists($bookletId)) {
												if (!in_array($bookletId, $errorBookletnames)) {
													array_push($myreturn['errors'], 'booklet "' . $bookletId . '" not found for login "' . $testtaker['loginname'] . '" in Testtakers-XML-file "' . $entry . '"');
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
								foreach($xFile->getErrors() as $r) {
									array_push($myreturn['errors'], 'error reading Testtakers-XML-file "' . $entry . '": ' . $r);
								}
							}
						}
					}
				}

				// check wether a login is used in another workspace
				// get all resource files
				$myFolder = '../../vo_data';
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

				// unused
				foreach($allResources as $r) {
					if (!in_array($r, $allUsedResources) && !in_array(normaliseFileName($r, true), $allUsedVersionnedResources)) {
						array_push($myreturn['warnings'], 'Resource "' . $r . '" never used');
					}
				}
				foreach($allUnits as $u) {
					if (!in_array($u, $allUsedUnits)) {
						array_push($myreturn['warnings'], 'Unit "' . $u . '" not used in booklets');
					}
				}
				foreach($allBooklets as $b) {
					if (!in_array($b, $allUsedBooklets)) {
						array_push($myreturn['warnings'], 'Booklet "' . $b . '" not used by testtakers');
					}
				}

				foreach(array_keys($allBookletsFilesize) as $b) {
					array_push($myreturn['infos'], 'booklet load for ' . $b . ': ' .  number_format($allBookletsFilesize[$b], 0, "," , "." ));
				}

				// **********************************************************
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