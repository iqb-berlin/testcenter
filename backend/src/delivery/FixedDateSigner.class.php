<?php
declare(strict_types=1);

use AsyncAws\Core\Credentials\Credentials;
use AsyncAws\Core\Request;
use AsyncAws\Core\RequestContext;
use AsyncAws\Core\Signer\Signer;

/**
 * Presigns with a signing date given from outside instead of the current time, which the wrapped signer supports but
 * async-aws's `presign()` does not pass on. Signing of normal requests is left as it is.
 */
class FixedDateSigner implements Signer {
  /** @param Closure(): ?DateTimeImmutable $getSigningDate null for the current time */
  function __construct(
    private readonly Signer $signer,
    private readonly Closure $getSigningDate
  ) {
  }

  public function presign(Request $request, Credentials $credentials, RequestContext $context): void {
    $this->signer->presign(
      $request,
      $credentials,
      new RequestContext([
        'expirationDate' => $context->getExpirationDate(),
        'currentDate' => ($this->getSigningDate)()
      ])
    );
  }

  public function sign(Request $request, Credentials $credentials, RequestContext $context): void {
    $this->signer->sign($request, $credentials, $context);
  }
}
