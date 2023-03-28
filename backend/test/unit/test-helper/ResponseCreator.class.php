<?php

use Slim\Http\Response;
use Slim\Psr7\Factory\StreamFactory;
use Slim\Psr7\Response as psr7Response;

class ResponseCreator {
  static function createEmpty(): Response {
    return new Response(new psr7Response(), new StreamFactory());
  }
}