<?php

use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Exception\HttpForbiddenException;
use Slim\Http\ServerRequest;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;

class MayReviewTest extends TestCase {
  private function request(string $mode): ServerRequest {
    return (new ServerRequest(
      (new ServerRequestFactory())->createServerRequest('PUT', 'https://testcenter.example/test/1/review')
    ))->withAttribute('AuthToken', new AuthToken('p:token', 1, 'person', 1, $mode, 'sample_group'));
  }

  private function handler(): RequestHandlerInterface {
    return new class implements RequestHandlerInterface {
      public bool $wasCalled = false;

      public function handle(ServerRequestInterface $request): ResponseInterface {
        $this->wasCalled = true;
        return (new ResponseFactory())->createResponse(201);
      }
    };
  }

  public function test_passesModesThatCanReview() {
    foreach (['run-review', 'run-trial'] as $mode) {
      $handler = $this->handler();
      $response = (new MayReview())($this->request($mode), $handler);

      $this->assertTrue($handler->wasCalled, $mode);
      $this->assertEquals(201, $response->getStatusCode(), $mode);
    }
  }

  public function test_rejectsModesThatCannotReview() {
    foreach (['run-hot-return', 'run-hot-restart', 'run-demo', 'run-simulation'] as $mode) {
      $handler = $this->handler();
      try {
        (new MayReview())($this->request($mode), $handler);
        $this->fail("`$mode` was let through");
      } catch (HttpForbiddenException) {
        $this->assertFalse($handler->wasCalled, $mode);
      }
    }
  }
}
