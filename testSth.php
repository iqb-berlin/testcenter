<?php
require_once "vendor/autoload.php";

use org\bovigo\vfs\vfsStream;
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);


$vfs = vfsStream::setup('root', 0777);
$configDir = vfsStream::newDirectory('config', 0777)->at($vfs);
$vfsData = vfsStream::newDirectory('vo_data', 0777)->at($vfs);
file_put_contents(vfsStream::url('root/config/DBConnectionData.json'), '{"type" => "test"}');
file_put_contents(vfsStream::url('root/config/customTexts.json'), '{"aCustomText_key" => "a Custom Text Value"}');



print_r(listDir(vfsStream::url('root')));

function listDir($path): array {

    $list = [];

    if ($handle = opendir($path)) {
        while (false !== ($entry = readdir($handle))) {
            if ($entry != "." && $entry != "..") {
                if (is_file("$path/$entry")) {
                    $list[] = $entry;
                }
                if (is_dir("$path/$entry")) {
                    $list[$entry] = listDir("$path/$entry");
                }
            }
        }
        closedir($handle);
    }

    return $list;
}

echo "\n-----------------------\n";

echo vfsStream::url('root/config');
echo vfsStream::url('root/vo_data');

