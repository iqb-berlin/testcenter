<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
<title>VERA online Testcenter starter</title>
<style>
		body {
			font-family: Helvetica;
			font-size: 1em;
			margin: 0;
			padding-left: 30px;
			padding-right: 10px;
			padding-top: 10px;
		}
		h1 {
			background-color: darkgreen;
			color: lightyellow;
			padding: 5px;
		}
</style>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
</head>
<body>
<h1>VERA online Testcenter starter</h1>
<p>
<?php 
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

// this function is to be placed into the root of the server
// it creates one account in the database with flag 'superadmin'
// please remove it from the server as soon as possible for
// security reasons

require_once('../vo_code/DBConnection.php');

class DBConnectionStarter extends DBConnection {
	public function addSuperuser($username, $userpassword) {
		$myreturn = '?';
		$sql = $this->pdoDBhandle->prepare(
			'SELECT users.name FROM users');
			
		if ($sql -> execute()) {
				
			$data = $sql -> fetchAll(PDO::FETCH_ASSOC);
			if (($data == false) || (count($data) === 0)) {

				$sql = $this->pdoDBhandle->prepare(
					'INSERT INTO users (name, password, is_superadmin) VALUES (:user_name, :user_password, True)');
					
				if ($sql -> execute(array(
					':user_name' => $username,
					':user_password' => $this->encryptPassword($userpassword)))) {
						
					$myreturn = 'Superuser "' . $username . '" angelegt.';
				} else {
					$myreturn = 'Anlegen des Superusers fehlgeschlagen (execute insert).';
				}
			} else {
				$myreturn = 'Ausführung nur möglich, wenn keine anderen User in der Datenbank vorhanden sind.';
			}
		} else {
			$myreturn = 'Anlegen des Superusers fehlgeschlagen (execute select).';
		}
		return $myreturn;
	}
}

// call: https://www.blah.de/create?n=super&p=user123

$myDBConnection = new DBConnectionStarter();
if ($myDBConnection->isError()) {
	echo 'Fehler beim Herstellen der Datenbankverbindung: ' . $myDBConnection->$errorMsg;
} else {
	$username = $_GET['n'];
	$userpassword = $_GET['p'];

	if (isset($username) && isset($userpassword)) {
		echo $myDBConnection->addSuperuser($username, $userpassword);
	} else {
		echo 'Unvollständige Parameter. Aufruf:<br/>';
		echo 'www.blah.de/create?n=super&p=user123';
	}
}
unset($myDBConnection);

?>
</p>
</body>