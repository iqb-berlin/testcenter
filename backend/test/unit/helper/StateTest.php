<?php

declare(strict_types=1);


use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class StateTest extends TestCase {
  function test_blub() {
    $input = '[
      {
        "key": "TESTLETS_TIMELEFT",
        "content": "{\\"Tslt1\\":0}",
        "timeStamp": 1731064086148
      },
      {
        "key": "TESTLETS_TIMELEFT",
        "content": "{\\"Tslt1\\":0.75}",
        "timeStamp": 1731064071064
      },
      {
        "key": "FOCUS",
        "content": "HAS",
        "timeStamp": 1731064082010
      },
      {
        "key": "FOCUS",
        "content": "HAS_NOT",
        "timeStamp": 1731064084062
      },
      {
        "key": "FOCUS",
        "content": "HAS",
        "timeStamp": 1731064085291
      },
      {
        "key": "TESTLETS_TIMELEFT",
        "content": "{\\"Tslt1\\":0.5}",
        "timeStamp": 1731064086068
      },

      {
        "key": "CONTROLLER",
        "content": "TERMINATED",
        "timeStamp": 1731064087942
      }
    ]';
    $inputParsed = JSON::decode($input, true);
    $output = State::applyPatch($inputParsed);
    $expectation = [
      'newState' => [
        'TESTLETS_TIMELEFT' => '{"Tslt1":0}',
        'FOCUS' => 'HAS',
        'CONTROLLER' => 'TERMINATED'
      ],
      'updateTs' => [
        'TESTLETS_TIMELEFT' => 1731064086148,
        'FOCUS' => 1731064085291,
        'CONTROLLER' => 1731064087942
      ]
    ];
    $this->assertEquals($expectation, $output);
  }


  function test_blub2() {
    $input = [
      [
        'key' => 'B',
        'content' => 'B:α',
        'timeStamp' => 1
      ],
      [
        'key' => 'A',
        'content' => 'A:α',
        'timeStamp' => 5
      ],
      [
        'key' => 'B',
        'content' => 'B:β',
        'timeStamp' => 0
      ],
      [
        'key' => 'A',
        'content' => 'A:β',
        'timeStamp' => 4
      ],
      [
        'key' => 'B',
        'content' => 'B:γ',
        'timeStamp' => 2
      ],
      [
        'key' => 'B',
        'content' => 'B:δ',
        'timeStamp' => 3
      ],
    ];
    $state = State::applyPatch($input);
    $expectation = [
      'newState' => [
          'A' => 'A:α',
          'B' => 'B:δ'
        ],
      'updateTs' => [
          'A' => 5,
          'B' => 3
        ]
      ];
    $this->assertEquals($expectation, $state);

    $secondInput = [
      [
        'key' => 'A',
        'content' => 'ignore me',
        'timeStamp' => 3
      ],
      [
        'key' => 'B',
        'content' => 'apply me',
        'timeStamp' => 7
      ],
    ];
    $state2 = State::applyPatch($secondInput, $state['newState'], $state['updateTs']);
    $expectation = [
      'newState' =>  [
        'A' => 'A:α',
        'B' => 'apply me'
      ],
      'updateTs' => [
        'A' => 5,
        'B' => 7
      ]
    ];
    $state = array_merge($state, $state2);
    $this->assertEquals($expectation, $state);
  }
}
