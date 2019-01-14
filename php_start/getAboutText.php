<?php
	// preflight OPTIONS-Request bei CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
  exit();
} else {
  
  $myreturn = "Default text";

  $filename = "./about.txt";

  if (file_exists($filename)) {

    $myreturn = file_get_contents($filename);
  } 

  echo(json_encode($myreturn));

}

unset($myDBConnection);

?>