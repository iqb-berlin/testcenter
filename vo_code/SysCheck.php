<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

class SysCheck
{
    public static $configfolder = '../vo_config/syscheck/';

    static function getConfigList() {
        $myreturn = [];
        if (file_exists(SysCheck::$configfolder)) {
            $mydir = opendir(SysCheck::$configfolder);
            while (($entry = readdir($mydir)) !== false) {
                $fullfilename = SysCheck::$configfolder . $entry;
                if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {                
                    $xmlfile = simplexml_load_file($fullfilename);
                    if ($xmlfile == false) {
                        array_push($myreturn, ['id' => $entry, 
                            'label' => 'Fehler: konnte nicht öffnen',
                            'description' => '']);
                    } else {
                        array_push($myreturn, ['id' => strtoupper((string) $xmlfile->Metadata[0]->Id[0]), 
                            'label' => (string) $xmlfile->Metadata[0]->Label[0],
                            'description' => (string) $xmlfile->Metadata[0]->Description[0]]);
                    }
                }
            }
        }
        return $myreturn;
    }

    static function getConfig($cId) {
        if (file_exists(SysCheck::$configfolder)) {
            $mydir = opendir(SysCheck::$configfolder);
            while (($entry = readdir($mydir)) !== false) {
                $fullfilename = SysCheck::$configfolder . $entry;
                if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {                
                    $xmlfile = simplexml_load_file($fullfilename);
                    if ($xmlfile != false) {
                        $myId = strtoupper((string) $xmlfile->Metadata[0]->Id[0]);
                        if ($myId == $cId) {
                            $label = (string) $xmlfile->Metadata[0]->Label[0];
                            $configNode = $xmlfile->Config[0];
                            $email = (string) $configNode['email'];
                            $unit = (string) $configNode['unit'];
                            $questions = [];
                            foreach($configNode->children() as $q) { 
                                array_push($questions, [
                                    'id' => (string) count($questions),
                                    'type' => (string) $q['type'],
                                    'prompt' => (string) $q['prompt'],
                                    'options' => []
                                ]);
                            }
                            return [
                                'id' => $myId,
                                'label' => $label,
                                'email' => strlen($email) > 0,
                                'unit' => $unit,
                                'formdef' => $questions
                            ];
                        }
                    }
                }
            }
        }
        return [];
    }
}
