<?php
declare(strict_types=1);

use Slim\Http\Response;

interface DeliveryMethod {
  public function deliver(Response $response, StoragePath $path): Response;
}
