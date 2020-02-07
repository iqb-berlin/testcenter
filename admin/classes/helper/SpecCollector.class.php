<?php

class SpecCollector {

    static function collectSpecs($dir) {

        $routes = array();

        foreach (glob($dir . '/*.spec.yml') as $file) {

            $data = file_get_contents($file);
            preg_match_all('#^\s\s(\/\S+)\:\n\s\s\s\s(\w+)\:(\s\s\s\s\s\s.+)+#m', $data, $matches, PREG_SET_ORDER, 0);

            foreach ($matches as $item) {
                $route = '[' . strtoupper($item[2]) . '] ' . $item[1];
                $routes[$route] = $file;

                preg_match_all('#^\s\s\s\s(\w+)\:#m', $item[0], $subMatches, PREG_SET_ORDER, 0);

                if (count($subMatches) > 1) {
                    array_shift($subMatches);
                    foreach ($subMatches as $otherVerb) {
                        $route = '[' . strtoupper($otherVerb[1]) . '] ' . $item[1];
                        $routes[$route] = $file;
                    }
                }
            }
        }
        return $routes;
    }

    static function collectRoutes($dir) {

        $routes = array();

        foreach (glob($dir . '/*.php') as $file) {
            $fp = fopen($file, "r+");
            $currentGroup = "";
            while ($line = fgets($fp)) {
                if (preg_match('#^\s*?\$app->(\w+)\(\s*[\\\'\"]([^\\\'\"]*)[\\\'\"]#', $line, $matches)) {
                    if ($matches[1] == 'group') {
                        $currentGroup = $matches[2];
                    } else {
                        $route = '[' . strtoupper($matches[1]) . '] ' . $currentGroup . $matches[2];
                        $routes[$route] = $file;
                    }

                }

            }
            fclose($fp);

        }
        return $routes;
    }


}
