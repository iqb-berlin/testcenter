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
    $response['downloadPackage'] = '';
    $response['error'] = '';

    /*
    // code used to generate random files
    for ($i = 0; $i <= 13; $i ++) {
        $ts = pow(2, 10 + $i);
        $randomContents = '';
        for ($j = 0; $j <= $ts; $j++) {
            $randomContents .= (string)rand(0, 9);
        }

        $randomContentsBase64 = base64_encode($randomContents);
        
        $finalRandomContents = '';
        if (strlen($randomContentsBase64) > $ts) {
            for ($j = 0; $j <= $ts; $j++) { 
                $finalRandomContents .= $randomContentsBase64[$j];
            }
        }
        file_put_contents('./downloadTestFiles/'.$ts.'.txt',  $finalRandomContents);
    }
    */

    if (isset($_GET['size']))
    {
        $size = intval($_GET['size']);
        $response['downloadPackage'] = '';
        $response['ok'] = true;

        if ($size === 1024) $response['downloadPackage'] = file_get_contents('../vo_config/syscheck/downloadTestFiles/1024.txt');
        else if ($size === 2048) $response['downloadPackage'] = file_get_contents('../vo_config/syscheck/downloadTestFiles/2048.txt');
        else if ($size === 4096) $response['downloadPackage'] = file_get_contents('../vo_config/syscheck/downloadTestFiles/4096.txt');
        else if ($size === 8192) $response['downloadPackage'] = file_get_contents('../vo_config/syscheck/downloadTestFiles/8192.txt');
        else if ($size === 16384) $response['downloadPackage'] = file_get_contents('../vo_config/syscheck/downloadTestFiles/16384.txt');
        else if ($size === 32768) $response['downloadPackage'] = file_get_contents('../vo_config/syscheck/downloadTestFiles/32768.txt');
        else if ($size === 65536) $response['downloadPackage'] = file_get_contents('../vo_config/syscheck/downloadTestFiles/65536.txt');
        else if ($size === 131072) $response['downloadPackage'] = file_get_contents('../vo_config/syscheck/downloadTestFiles/131072.txt');
        else if ($size === 262144) $response['downloadPackage'] = file_get_contents('../vo_config/syscheck/downloadTestFiles/262144.txt');
        else if ($size === 524288) $response['downloadPackage'] = file_get_contents('../vo_config/syscheck/downloadTestFiles/524288.txt');
        else if ($size === 1048576) $response['downloadPackage'] = file_get_contents('../vo_config/syscheck/downloadTestFiles/1048576.txt');
        else if ($size === 2097152) $response['downloadPackage'] = file_get_contents('../vo_config/syscheck/downloadTestFiles/2097152.txt');
        else if ($size === 4194304) $response['downloadPackage'] = file_get_contents('../vo_config/syscheck/downloadTestFiles/4194304.txt');
        else if ($size === 8388608) $response['downloadPackage'] = file_get_contents('../vo_config/syscheck/downloadTestFiles/8388608.txt');
        else 
        {
            $response['ok'] = false;
            $response['error'] = 'Unsupported test size ('.$size.').';
        }
    }
    else {
        $response['ok'] = false;
        $response['error'] = 'Missing size parameter.';
    }

    echo json_encode($response);
}
?>