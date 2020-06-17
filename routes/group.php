<?php

use Slim\App;
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
            throw new HttpError("Group `$groupName` not found.");
        }

        return $response->withJson([ // TODO synchronize terminology in XML, FE and BE
            'id' => $group['name'],
            'name' => $group['label']
        ]);
    });


    $app->get('/test-sessions', function(Request $request, Response $response) use ($adminDAO) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        $sessionChangeMessages = $adminDAO->getTestSessions($authToken->getWorkspaceId(), [$authToken->getGroup()]);

        $bsToken = md5((string)rand(0, 99999999));

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

            $url = str_replace(['http://', 'https://'], ['ws://', 'wss://'], BroadcastService::getUrl()); // TODO right place here?
            $url .= '/' . $bsToken;

            $response = $response->withHeader('SubscribeURI', $url);
        }

        return $response->withJson($sessionChangeMessages->asArray());
    });

})
    ->add(new RequireToken('person'));
