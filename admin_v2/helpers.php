<?php

use Slim\Http\Request as Request;
use Slim\Http\Response;

/**
 * a set of recurrent helper functions
 */


function jsonencode($obj) {
    return json_encode($obj, JSON_UNESCAPED_UNICODE);
}



/**
 * Provisional: a generic exeception handler. will be removed, slim app is defined globally once
 * renderer are used.
 * TODO make this unnecessary
 *
 * @param Request $request
 * @param Response $response
 * @param Throwable $ex
 * @return Response
 */
function errorOut(Slim\Http\Request $request, Slim\Http\Response $response, Throwable $ex) : Slim\Http\Response {

    error_log("[Error: " . $ex->getCode() . "]". $ex->getMessage());
    error_log("[Error: " . $ex->getCode() . "]".  $ex->getFile() . ' | line ' . $ex->getLine());

    if (!is_a($ex, "Slim\Exception\HttpException")) {
        $ex = new \Slim\Exception\HttpException($request, $ex->getMessage(), 500, $ex);
    }

    error_log("[Error: " . $ex->getCode() . "]". $ex->getTitle());
    error_log("[Error: " . $ex->getCode() . "]". $ex->getDescription());

    return $response
        ->withStatus($ex->getCode())
        ->withHeader('Content-Type', 'text/html')
        ->write($ex->getMessage() ? $ex->getMessage() : $ex->getDescription());
}



/**
 * TODO find better place for this, maybe in DBconnector?
 *
 * @param $workspaceId
 */
function getAssembledResults($workspaceId) {

    global $dbConnectionAdmin; // TODO better solution for global

    $keyedReturn = [];

    foreach($dbConnectionAdmin->getResultsCount($workspaceId) as $resultSet) {
        // groupname, loginname, code, bookletname, num_units
        if (!isset($keyedReturn[$resultSet['groupname']])) {
            $keyedReturn[$resultSet['groupname']] = [
                'groupname' => $resultSet['groupname'],
                'bookletsStarted' => 1,
                'num_units_min' => $resultSet['num_units'],
                'num_units_max' => $resultSet['num_units'],
                'num_units_total' => $resultSet['num_units'],
                'lastchange' => $resultSet['lastchange']
            ];
        } else {
            $keyedReturn[$resultSet['groupname']]['bookletsStarted'] += 1;
            $keyedReturn[$resultSet['groupname']]['num_units_total'] += $resultSet['num_units'];
            if ($resultSet['num_units'] > $keyedReturn[$resultSet['groupname']]['num_units_max']) {
                $keyedReturn[$resultSet['groupname']]['num_units_max'] = $resultSet['num_units'];
            }
            if ($resultSet['num_units'] < $keyedReturn[$resultSet['groupname']]['num_units_min']) {
                $keyedReturn[$resultSet['groupname']]['num_units_min'] = $resultSet['num_units'];
            }
            if ($resultSet['lastchange'] > $keyedReturn[$resultSet['groupname']]['lastchange']) {
                $keyedReturn[$resultSet['groupname']]['lastchange'] = $resultSet['lastchange'];
            }
        }
    }

    $returner = array();

    // get rid of the key and calculate mean
    foreach($keyedReturn as $group => $groupData) {
        $groupData['num_units_mean'] = $groupData['num_units_total'] / $groupData['bookletsStarted'];
        array_push($returner, $groupData);
    }

    return $returner;
}

