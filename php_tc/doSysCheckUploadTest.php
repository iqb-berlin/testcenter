<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

// preflight OPTIONS-Request bei CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	exit();
} else {
    $response = Array();
    $response['ok'] = false;
    $response['packageReceivedSize'] = 0;
    $response['error'] = '';

    if (isset($_POST['package']))
    {
        $package = (string)$_POST['package'];
        $response['packageReceivedSize']  = strlen($package);
        $response['ok'] = true;
    }
    else
    {
        $response['error'] = 'No package received.';
    }
    echo json_encode($response);
}
?>