<?php

use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Http\ServerRequest;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;

class HandleCorsPreflightTest extends TestCase {
  private function request(string $method): ServerRequest {
    return new ServerRequest(
      (new ServerRequestFactory())->createServerRequest($method, 'https://testcenter.example/some/path')
    );
  }

  public function test_answersPreflightItself() {
    $handler = new class implements RequestHandlerInterface {
      public bool $wasCalled = false;

      public function handle(ServerRequestInterface $request): ResponseInterface {
        $this->wasCalled = true;
        return (new ResponseFactory())->createResponse(204);
      }
    };

    $middleware = new HandleCorsPreflight(new ResponseFactory());
    $response = $middleware($this->request('OPTIONS'), $handler);

    $this->assertEquals(200, $response->getStatusCode());
    $this->assertEquals('', (string) $response->getBody());
    // the rest of the application - and with it the router - must not see a preflight request
    $this->assertFalse($handler->wasCalled);
  }

  public function test_passesEveryOtherMethodOn() {
    $handler = new class implements RequestHandlerInterface {
      public bool $wasCalled = false;

      public function handle(ServerRequestInterface $request): ResponseInterface {
        $this->wasCalled = true;
        return (new ResponseFactory())->createResponse(204);
      }
    };

    $middleware = new HandleCorsPreflight(new ResponseFactory());

    foreach (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as $method) {
      $handler->wasCalled = false;
      $response = $middleware($this->request($method), $handler);

      $this->assertTrue($handler->wasCalled, "$method was not passed on");
      $this->assertEquals(204, $response->getStatusCode(), "$method did not get the handler's response");
    }
  }
}
