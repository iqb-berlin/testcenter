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

    static function getUnitData($unitId) {
        $myreturn = [
            'id' => $unitId,
            'key' => '',
            'label' => '',
            'def' => '',
            'player' => ''
        ];        
        if (file_exists(SysCheck::$configfolder)) {
            $mydir = opendir(SysCheck::$configfolder);
            while (($entry = readdir($mydir)) !== false) {
                $fullfilename = SysCheck::$configfolder . $entry;
                if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {                
                    $xmlfile = simplexml_load_file($fullfilename);
                    if ($xmlfile != false) {
                        $myId = strtoupper((string) $xmlfile->Metadata[0]->Id[0]);
                        if ($myId == $unitId) {
                            $myreturn['key'] = $unitId;
                            $myreturn['label'] = (string) $xmlfile->Metadata[0]->Label[0];
                            $definitionNode = $xmlfile->Definition[0];
                            if (isset($definitionNode)) {
                                $typeAttr = $definitionNode['type'];
                                if (isset($typeAttr)) {
                                    $myreturn['player_id'] = (string) $typeAttr;
                                    $myreturn['def'] = (string) $definitionNode;
                                }
                            } else {
                                $definitionNode = $xmlfile->DefinitionRef[0];
                                if (isset($definitionNode)) {
                                    $typeAttr = $definitionNode['type'];
                                    if (isset($typeAttr)) {
                                        $myreturn['player_id'] = (string) $typeAttr;
                                        $unitfilename = strtoupper((string) $definitionNode);
                                        while (($anyfile = readdir($mydir)) !== false) {
                                            if (strtoupper($anyfile) == $unitfilename) {
                                                $fullanyfilename = SysCheck::$configfolder . '/' . $anyfile;
                                                $myerrorcode = 0;
                                                $myreturn['def'] = file_get_contents($fullanyfilename);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }            
                            break;
                        }
                    }
                }
            }
            if (isset($myreturn['player_id'])) {
                $myFile = SysCheck::$configfolder . '/' . $myreturn['player_id'] . '.html';
                if (file_exists($myFile)) {
                    $myreturn['player'] = file_get_contents($myFile);
                }
            }
   
        }
        return $myreturn;
    }

    static function getItemPlayerById($pId) {

    }
}
