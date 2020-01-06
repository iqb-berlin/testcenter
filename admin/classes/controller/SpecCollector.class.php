<?php

class SpecCollector {

    static function collect($dir) {

        $routes = array();

        foreach (glob($dir . '/*.spec.yml') as $file) {

            $data = file_get_contents($file);
            preg_match_all('#^\s\s(\/\S+)\:\n\s\s\s\s(\w+)\:#m', $data, $matches, PREG_SET_ORDER, 0);

//            $routes = array_merge(
//                $routes,
//                array_map(
//                    function($item){
//                        return '[' . strtoupper($item[2]) . '] ' . $item[1];
//                    },
//                    $matches
//                )
//            );
            foreach ($matches as $item) {
                $route = '[' . strtoupper($item[2]) . '] ' . $item[1];
                $routes[$route] = $file;

            }
        }

        return $routes;
    }

}
