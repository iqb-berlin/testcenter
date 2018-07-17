<?php 
	// require_once('tc_code/XMLFile.php');
	// require_once('tc_code/DBConnectionAdmin.php');

	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {

		require_once('../tc_code/DBConnectionAdmin.php');


		// Authorisation
		$myerrorcode = 503;
		$myreturn = '';

		$myDBConnection = new DBConnectionAdmin();
		if (!$myDBConnection->isError()) {
			// Achtung: Wenn Datei zu groß, dann ist $_POST nicht gesetzt
			$myToken = $_POST['at'];
			$wsId = $_POST['ws'];

			if (isset($myToken) and isset($wsId)) {
				$myerrorcode = 401;
				foreach($myDBConnection->getWorkspaces($myToken) as $ws) {
					if ($ws['id'] == $wsId) {
						$myerrorcode = 0;
					}
				}

				if ($myerrorcode == 0) {
					$myreturn = 'ok';

					// check if folder exists -> create
					$myWorkspaceFolder = '../tc_data/ws_' . $wsId;
					if (!file_exists($myWorkspaceFolder)) {
						if (!mkdir($myWorkspaceFolder)) {
							$wsId = 0;
							$myreturn = 'e:Interner Fehler: Konnte Verzeichnis für Workspace nicht anlegen.';
						}
					}

					if ($wsId > 0) {
						$myreturn = 'e:Interner Fehler: Dateiname oder Formularelement-Name nicht im Request gefunden.';
						$originalTargetFilename = $_FILES['fileforopencba']['name'];
						if (isset($originalTargetFilename) and strlen($originalTargetFilename) > 0) {
							$originalTargetFilename = basename($originalTargetFilename);
							$tempPrefix = '../tc_data/' . uniqid('t', true) . '_';
							$tempFilename = $tempPrefix . $originalTargetFilename;

							// +++++++++++++++++++++++++++++++++++++++++++++++++++++++
							// move file from php-server-tmp folder to testcenter-tmp-folder
							if (move_uploaded_file($_FILES['fileforopencba']['tmp_name'], $tempFilename)) {
								$targetFolder = $myWorkspaceFolder . '/Resource';

								// if XML then validate and change targetfolder
								if (strtoupper(substr($tempFilename, -4)) == '.XML') {
									$myreturn = 'OK (valide)';

									require_once('../tc_code/XMLFile.php'); // // // // ========================
									$xFile = new XMLFile($tempFilename);
									if ($xFile->isValid()) {
										$targetFolder = $myWorkspaceFolder . '/' . $xFile->getRoottagName();
									} else {
										$myreturn = 'e:XML nicht erkannt oder nicht valide';
										foreach($xFile->getErrors() as $errormsg) {
											$myreturn = $myreturn . '; ' . $errormsg;
										}
										$targetFolder = '';
									}
								} else {
									$myreturn = 'OK';
								}

								if (strlen($targetFolder) == 0) {
									if (!unlink($tempFilename)) {
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
										$targetFilename = $targetFolder . '/' . $originalTargetFilename;
										if (file_exists($targetFilename)) {
											if (!unlink($targetFilename)) {
												$myreturn = 'e:Interner Fehler: Konnte alte Datei nicht löschen.';
												$targetFilename = '';
											}
										}
										if (strlen($targetFilename) > 0) {
											if (!rename($tempFilename, $targetFilename)) {
												$myreturn = 'e:Interner Fehler: Konnte Datei nicht in Zielordner verschieben.';
											}
										}
									}
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
