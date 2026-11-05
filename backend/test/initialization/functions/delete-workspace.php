<?php
declare(strict_types=1);
require_once "cli.php";

runCli(function() {
  $wsId = getopt("", ['ws_id::'])['ws_id'];
  $dao = new SuperAdminDAO();
  $dao->deleteWorkspaces([(int) $wsId]);
  $workspace = new Workspace((int) $wsId);
  $workspace->delete();
});
