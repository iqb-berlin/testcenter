<?php
ignore_user_abort(true);
session_write_close();

use Slim\Http\Request;
use Slim\Http\Response;



function getBookletsStarted() {

    $adminDAO = new AdminDAO();
    $bookletsStarted = [];
    foreach($adminDAO->getBookletsStarted(1) as $booklet) {
        $booklet['locked'] = ($booklet['locked'] == '1');
        array_push($bookletsStarted, $booklet);
    }
    return $bookletsStarted;
}


$app->get('/blah', function(Request $request, Response $response) use ($app) {

    $stream = new CallbackStream(function() {
        // Watchdog | Semaphore ?
        while (true) {
            if (connection_aborted()) {
                file_put_contents("ng-sse-exit.txt", date('r'));
                exit();
            } else {
                //do db stuff
                $time = date('r');
                echo "event:registeredclients\n";
                echo "data:" . json_encode(getBookletsStarted()) . "\n\n";
                ob_flush();
                flush();
                sleep(2); //SLEEPTIME -> can also set by request
            }
        }
        echo "event:stopped\n";
        echo "data: END-OF-STREAM\n\n"; // Give browser a signal to stop re-opening connection
        ob_get_flush();
        flush();
        sleep(1); // give browser enough time to close connection

    });
    return $response->withHeader('Content-Type', 'text/event-stream')
        ->withHeader('Cache-Control', 'no-cache')
        ->withBody($stream);

});
