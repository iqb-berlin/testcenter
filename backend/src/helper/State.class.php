<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class State {
  static function applyPatch(array $statePatch, array $oldState = [], array $updateTs = []): array {
    $newState = $oldState;
    foreach ($statePatch as $stateEntry) {
      if (!isset($updateTs[$stateEntry['key']])) {
        $updateTs[$stateEntry['key']] = 0;
      }
      if ($updateTs[$stateEntry['key']] < $stateEntry['timeStamp']) {
        $updateTs[$stateEntry['key']] = $stateEntry['timeStamp'];
        $newState[$stateEntry['key']] = is_object($stateEntry['content'])
          ? json_encode($stateEntry['content'])
          : $stateEntry['content'];
      }
    }
    return [
      'newState' => $newState,
      'updateTs' => $updateTs
    ];
  }
}