<?php

use Slim\App;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpNotFoundException;
use Slim\Http\Request;
use Slim\Http\Response;

$app->group('/monitor', function(App $app) {

    $adminDAO = new AdminDAO();

    $app->get('/group/{group_name}', function(Request $request, Response $response) use ($adminDAO) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $groupName = $request->getAttribute('group_name');

        $testtakersFolder = new TesttakersFolder($authToken->getWorkspaceId());

        $group = $testtakersFolder->findGroup($groupName);

        if (!$group) {

            throw new HttpNotFoundException($request, "Group `$groupName` not found.");
        }

        // currently a group-monitor can always only monitor it's own group
        if ($groupName !== $authToken->getGroup()) {

            throw new HttpForbiddenException($request,"Group `$groupName` not allowed.");
        }

        return $response->withJson($group);
    });


    $app->get('/test-sessions', function(Request $request, Response $response) use ($adminDAO) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        // currently a group-monitor can always only monitor it's own group
        $groupNames = [$authToken->getGroup()];

        $sessionChangeMessages = $adminDAO->getTestSessions($authToken->getWorkspaceId(), $groupNames);

        $bsToken = md5((string) rand(0, 99999999));

        $broadcastServiceOnline =
            BroadcastService::push(
                "monitor/register",
                json_encode([
                    "token" => $bsToken,
                    "groups" => [$authToken->getGroup()]
                ]
            )) !== null;

        if ($broadcastServiceOnline) {

            foreach ($sessionChangeMessages as $sessionChangeMessage) {

                BroadcastService::sessionChange($sessionChangeMessage);
            }

            $url = str_replace(['http://', 'https://'], ['ws://', 'wss://'], BroadcastService::getUrl());
            $url .= '/' . $bsToken;

            $response = $response->withHeader('SubscribeURI', $url);
        }

        return $response->withJson($sessionChangeMessages->asArray());
    });

})
    ->add(new IsGroupMonitor())
    ->add(new RequireToken('person'));
