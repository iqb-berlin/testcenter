<?php
require_once "cli.php";

runCli(function() {
  $wsName = getopt("", ['ws_name::'])['ws_name'];
  $dao = new SuperAdminDAO();
  // the path the UI takes: the ID is assigned by the database, not by the caller
  echo $dao->createWorkspace($wsName)['id'];
});
