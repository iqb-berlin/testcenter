<?php

class XFileFactory {


    static function getBookletName($workspaceId, $bookletId) {
        $myreturn = '';

        $lookupFolder = '../vo_data/ws_' . $workspaceId . '/Booklet';
        if (file_exists($lookupFolder)) {
            $lookupDir = opendir($lookupFolder);
            if ($lookupDir !== false) {

                while (($entry = readdir($lookupDir)) !== false) {
                    $fullfilename = $lookupFolder . '/' . $entry;
                    if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {

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
