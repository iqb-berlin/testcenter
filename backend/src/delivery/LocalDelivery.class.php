<?php
declare(strict_types=1);

use Slim\Http\Response;

/** The backend sends the file itself. */
class LocalDelivery implements DeliveryMethod {
  public function deliver(Response $response, StoragePath $path): Response {
    return FileResponse::stream($response, $path);
  }
}
