<?php

class XFileFactory {

    // __________________________
    static function getBookletName($workspaceId, $bookletId) {
        $myreturn = '';

        $lookupFolder = '../vo_data/ws_' . $workspaceId . '/Booklet';
        if (file_exists($lookupFolder)) {
            $lookupDir = opendir($lookupFolder);
            if ($lookupDir !== false) {
                require_once('XMLFile.php');

                while (($entry = readdir($lookupDir)) !== false) {
                    $fullfilename = $lookupFolder . '/' . $entry;
                    if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {
                        // &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
                        $xFile = new XMLFile($fullfilename);

                        if ($xFile->isValid()) {
                            if ($xFile->getRoottagName()  == 'Booklet') {
                                $myBookletId = $xFile->getId();
                                if ($myBookletId === $bookletId) {
                                    $myreturn = $xFile->getLabel();
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
        return $myreturn;
    }
}
