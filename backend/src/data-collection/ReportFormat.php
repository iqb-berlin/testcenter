<?php

declare(strict_types=1);

enum ReportFormat: string {
  case CSV = 'csv';
  case JSON = 'json';

  private const MEDIA_TYPES = [
    'csv' => 'text/csv',
    'json' => 'application/json'
  ];

  /**
   * Picks the report format an `Accept` header asks for.
   *
   * Such a header lists the media types a client can handle, separated by commas, each optionally
   * followed by `;`-separated parameters - `text/csv;charset=utf-8` - which describe the type
   * rather than select it, and are therefore ignored here. The first listed type we can produce
   * wins. A header naming neither of ours - a wildcard, an unknown type, or nothing at all -
   * yields $default rather than a 406, since a usable default representation serves clients
   * better than an error.
   */
  static function fromAcceptHeader(string $acceptHeader, self $default): self {
    foreach (explode(',', $acceptHeader) as $entry) {
      $mediaType = strtolower(trim(explode(';', $entry)[0]));
      $format = array_search($mediaType, self::MEDIA_TYPES, true);

      if ($format !== false) {
        return self::from($format);
      }
    }

    return $default;
  }
}
