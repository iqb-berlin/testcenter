<?php

use PHPUnit\Framework\TestCase;
use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpNotFoundException;
use Slim\Factory\AppFactory;
use Slim\Http\ServerRequest;
use Slim\Psr7\Factory\ServerRequestFactory;

class ErrorHandlerTest extends TestCase {
  private ErrorHandler $errorHandler;
  private ServerRequest $request;

  public function setUp(): void {
    // the handler takes the response factory from the running application
    $GLOBALS['app'] = AppFactory::create();
    $this->errorHandler = new ErrorHandler();
    $this->request = new ServerRequest(
      (new ServerRequestFactory())->createServerRequest('PUT', 'https://testcenter.example/workspace')
    );
  }

  public function test_keepsCodeAndMessageOfHttpError() {
    $response = ($this->errorHandler)(
      $this->request,
      new HttpError('Workspace with name `sample_workspace` already exists!', 409)
    );

    $this->assertEquals(409, $response->getStatusCode());
    $this->assertEquals('Workspace with name `sample_workspace` already exists!', (string) $response->getBody());
  }

  public function test_keepsCodeAndMessageOfSlimException() {
    $response = ($this->errorHandler)(
      $this->request,
      new HttpBadRequestException($this->request, 'New workspace name missing')
    );

    $this->assertEquals(400, $response->getStatusCode());
    $this->assertEquals('New workspace name missing', (string) $response->getBody());
  }

  public function test_answersAnyOtherThrowableWithServerError() {
    $response = ($this->errorHandler)($this->request, new Exception('Something went wrong'));

    $this->assertEquals(500, $response->getStatusCode());
    $this->assertEquals('Something went wrong', (string) $response->getBody());
  }

  public function test_escapesTheMessage() {
    $response = ($this->errorHandler)($this->request, new HttpError('Invalid root-tag: `<Invalid>`', 400));

    $this->assertEquals('Invalid root-tag: `&lt;Invalid&gt;`', (string) $response->getBody());
  }

  // this is what the api-docs promise for every error response, see docs/api/components.spec.yml
  public function test_answersEveryErrorAsTextWithMessageAndErrorId() {
    $errors = [
      'error with a code of its own' => new HttpError('Workspace with id `13` does not exist!', 400),
      'error without a message' => new HttpNotFoundException($this->request),
      'unexpected error' => new Exception('Something went wrong')
    ];

    foreach ($errors as $case => $error) {
      $response = ($this->errorHandler)($this->request, $error);

      $this->assertEquals('text/html', $response->getHeaderLine('Content-Type'), $case);
      $this->assertNotEmpty($response->getHeaderLine('Error-ID'), $case);
      $this->assertNotEmpty((string) $response->getBody(), $case);
    }
  }
}
