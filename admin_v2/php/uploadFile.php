<?php 
// www.IQB.hu-berlin.de
// Bărbulescu, Mechtel
// 2018, 2019
// license: MIT

	function moveAndCheck($sourceFileName, $wsFolder, $targetFilename) {
		$myreturn = '';

		$targetFolder = $wsFolder . '/Resource';

		// if XML then validate and change targetfolder
		if (strtoupper(substr($sourceFileName, -4)) == '.XML') {
			$myreturn = 'OK (valide)';

			require_once('../../vo_code/XMLFile.php'); // // // // ========================
			$xFile = new XMLFile($sourceFileName, true);
			if ($xFile->isValid()) {
				$targetFolder = $wsFolder . '/' . $xFile->getRoottagName();
			} else {
				$myreturn = 'e: "' . $targetFilename . '" XML nicht erkannt oder nicht valide';
				foreach($xFile->getErrors() as $errormsg) {
					$myreturn = $myreturn . '; ' . $errormsg;
				}
				$targetFolder = '';
			}
		} else {
			$myreturn = 'OK';
		}

		if (strlen($targetFolder) == 0) {
			if (!unlink($sourceFileName)) {
				$myreturn = $myreturn . '; konnte temporäre Datei nicht löschen.';
			}
		} else {

			// move file from testcenter-tmp-folder to targetfolder
			if (!file_exists($targetFolder)) {
				if (!mkdir($targetFolder)) {
					$targetFolder = '';
					$myreturn = 'e:Interner Fehler: Konnte Unterverzeichnis nicht anlegen.';
				}
			}
			if (strlen($targetFolder) > 0) {																	
				$targetFilename = $targetFolder . '/' . $targetFilename;
				if (file_exists($targetFilename)) {
					if (!unlink($targetFilename)) {
						$myreturn = 'e:Interner Fehler: Konnte alte Datei nicht löschen.';
						$targetFilename = '';
					}
				}
				if (strlen($targetFilename) > 0) {
					if (!rename($sourceFileName, $targetFilename)) {
						$myreturn = 'e:Interner Fehler: Konnte Datei nicht in Zielordner verschieben.';
					}
				}
			}
		}
		return $myreturn;
	} // 77777777777777777777777777777777777777777777777777777777777777777777777777777777

	function emptyAndDeleteFolder($folder) {
		if (file_exists($folder)) {
			$folderDir = opendir($folder);
			if ($folderDir !== false) {
				while (($entry = readdir($folderDir)) !== false) {
					if (($entry !== '.') && ($entry !== '..')) {
						$fullname = $folder . '/' .  $entry;
						if (is_dir($fullname)) {
							emptyAndDeleteFolder($fullname);
						} else {
							unlink($fullname);
						}
					}
				}
				rmdir($folder);
			}
		}
	} // 77777777777777777777777777777777777777777777777777777777777777777777777777777777


	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {

		require_once('../../vo_code/DBConnectionAdmin.php');


		// Authorisation
		$myerrorcode = 503;
		$myreturn = '';

		$myDBConnection = new DBConnectionAdmin();
		if (!$myDBConnection->isError()) {
			// Achtung: Wenn Datei zu groß, dann ist $_POST nicht gesetzt
			try {
				$authToken = json_decode($_SERVER['HTTP_AUTHTOKEN'], true);
				$myToken = $authToken['at'];
				$wsId = $authToken['ws'];
			} catch (Exception $ex) {
				$errorcode = 500;
				$myreturn = 'e: ' . $ex->getMessage();
			}
	
			if (isset($myToken) and isset($wsId)) {
				$myerrorcode = 401;
				if ($myDBConnection->hasAdminAccessToWorkspace($myToken, $wsId)) {
					$myerrorcode = 0;
					$myreturn = 'ok';

					// check if folder exists -> create
					$myWorkspaceFolder = '../../vo_data/ws_' . $wsId;
					if (!file_exists($myWorkspaceFolder)) {
						if (!mkdir($myWorkspaceFolder)) {
							$wsId = 0;
							$myreturn = 'e:Interner Fehler: Konnte Verzeichnis für Workspace nicht anlegen.';
						}
					}

					if ($wsId > 0) {
						$myreturn = 'e:Interner Fehler: Dateiname oder Formularelement-Name nicht im Request gefunden.';
						$originalTargetFilename = $_FILES['fileforvo']['name'];
						if (isset($originalTargetFilename) and strlen($originalTargetFilename) > 0) {
							$originalTargetFilename = basename($originalTargetFilename);
							$tempPrefix = '../../vo_data/' . uniqid('t', true) . '_';
							$tempFilename = $tempPrefix . $originalTargetFilename;

							// +++++++++++++++++++++++++++++++++++++++++++++++++++++++
							// move file from php-server-tmp folder to testcenter-tmp-folder
							if (move_uploaded_file($_FILES['fileforvo']['tmp_name'], $tempFilename)) {
								if (strtoupper(substr($tempFilename, -4)) == '.ZIP') {
									$tmpZipExtractToFolder = $tempFilename . '_Extract';
									if (!mkdir($tmpZipExtractToFolder)) {
										$myreturn = 'e:Interner Fehler: Konnte Verzeichnis für ZIP-Ziel nicht anlegen.';
									} else {
										$myreturn = 'ungültige ZIP-Datei';

										$zip = new ZipArchive;
										if ($zip->open($tempFilename) === TRUE) {
											$zip->extractTo($tmpZipExtractToFolder . '/');
											$zip->close();

											$zipFolderDir = opendir($tmpZipExtractToFolder);
											if ($zipFolderDir !== false) {
												$myreturn = 'gültige ZIP-Datei';
												while (($entry = readdir($zipFolderDir)) !== false) {
													$fullname = $tmpZipExtractToFolder . '/' .  $entry;
													if (is_file($fullname)) {
														$myreturn = $myreturn . '; ' . moveAndCheck($fullname, $myWorkspaceFolder, $entry);
													}
												}
											}
								
										} else {
											$myreturn = 'e:Interner Fehler: Konnte ZIP-Datei nicht entpacken.';
										}
										emptyAndDeleteFolder($tmpZipExtractToFolder);
										unlink($tempFilename);
									}								
								} else {
									$myreturn = moveAndCheck($tempFilename, $myWorkspaceFolder, $originalTargetFilename);
								}
							} else {
								$myreturn = 'e:Datei abgelehnt (Sicherheitsrisiko?)';
							}
							// +++++++++++++++++++++++++++++++++++++++++++++++++++++++
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
