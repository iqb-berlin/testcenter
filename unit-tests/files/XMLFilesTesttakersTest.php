<?php

use PHPUnit\Framework\TestCase;
require_once "classes/files/XMLFile.php";
require_once "classes/files/XMLFileTesttakers.php";
require_once "classes/data-collection/PotentialLogin.class.php";
require_once "classes/data-collection/PotentialLoginArray.class.php";
require_once "classes/data-collection/Group.class.php";

define('ROOT_DIR', realpath('../..'));

$ExampleXml1 = <<<END
<Testtakers>
  <Metadata>
    <Id>example</Id>
  </Metadata>

  <Group name="first_group">
    <Login mode="run-hot-return" name="duplicateInSameGroup" pw="one" />
    <Login mode="run-hot-return" name="duplicateInDifferentGroup" pw="two" />
    <Login mode="run-hot-return" name="duplicateInDifferentGroup" pw="three" />
    <Login mode="run-hot-return" name="noDuplicate" pw="four" />
  </Group>

  <Group name="second_group">
    <Login mode="run-hot-return" name="duplicateInSameGroup" pw="two" />
    <Login mode="run-hot-return" name="noDuplicateAgain" pw="four" />
    <Login mode="omit-login-without-name" pw="eight" /> 
    <Login mode="omit-login-without-name" pw="duplicate-but-still-omitted" /> 
  </Group>
</Testtakers>
END;


class XMLFilesTesttakersTest extends TestCase {

    function test_getLogin() {

        $xmlFile = new XMLFileTesttakers('sampledata/Testtakers.xml');

        $result = $xmlFile->getLogin('__TEST_LOGIN_NAME__', '__TEST_LOGIN_PASSWORD__', 1);
        $expected = new PotentialLogin(
            '__TEST_LOGIN_NAME__',
            'run-hot-return',
            'sample_group',
            ['__TEST_PERSON_CODES__' => ['BOOKLET.SAMPLE', 'BOOKLET.SAMPLE-2']], // TODO fix sample file !!!!!
            1,
            0,
            1583053200,
            45,
            (object) ['somestr' => 'string']
        );
        $this->assertEquals($expected, $result, "login with password");


        $result = $xmlFile->getLogin('__TEST_LOGIN_NAME__-no-pw', '', 1);
        $expected = new PotentialLogin(
            '__TEST_LOGIN_NAME__-no-pw',
            'run-hot-restart',
            'passwordless_group',
            ['' => ['BOOKLET.SAMPLE']],
            1,
            0,
            0,
            0,
            (object) ['somestr' => 'string']
        );
        $this->assertEquals($expected, $result, "login without password (attribute omitted)");


        $result = $xmlFile->getLogin('__TEST_LOGIN_NAME__-no-pw-trial', '', 1);
        $expected = new PotentialLogin(
            '__TEST_LOGIN_NAME__-no-pw-trial',
            'run-trial',
            'passwordless_group',
            ['' => ['BOOKLET.SAMPLE']],
            1,
            0,
            0,
            0,
            (object) ['somestr' => 'string']
        );
        $this->assertEquals($expected, $result, "login without password (attribute empty)");


        $result = $xmlFile->getLogin('__TEST_LOGIN_NAME__', 'wrong passowrd', 1);
        $this->assertNull($result, "login with wrong password");


        $result = $xmlFile->getLogin('wrong username', '__TEST_LOGIN_PASSWORD__', 1);
        $this->assertNull($result, "login with wrong username");


        $result = $xmlFile->getLogin('__TEST_LOGIN_NAME__-no-pw', 'some password', 1);
        $this->assertNull($result, "login with password if none is required (attribute omitted)");


        $result = $xmlFile->getLogin('__TEST_LOGIN_NAME__-no-pw-trial', 'some password', 1);
        $this->assertNull($result, "login with password if none is required (attribute empty)");
    }


    function test_collectBookletsPerCode() {

        $xmlFile = new XMLFileTesttakers('sampledata/Testtakers.xml');

        $xml = <<<END
<Login name="someName" password="somePass">
    <Booklet codes="aaa bbb">first_booklet</Booklet>
    <Booklet>second_booklet</Booklet>
    <Booklet codes="bbb ccc">third_booklet</Booklet>
    <Booklet codes="will not appear"></Booklet>
    <Will codes="also">not appear</Will>
</Login>
END;

        $result = $xmlFile->collectBookletsPerCode(new SimpleXMLElement($xml));

        //print_r($result);

        $expected = [
            'aaa' => [
                'FIRST_BOOKLET',
                'SECOND_BOOKLET'
            ],
            'bbb' => [
                'FIRST_BOOKLET',
                'THIRD_BOOKLET',
                'SECOND_BOOKLET'
            ],
            'ccc' => [
                'THIRD_BOOKLET',
                'SECOND_BOOKLET'
            ]
        ];

        $this->assertEquals($expected, $result, 'code-using and non-code-unsing logins present');




        $xml = <<<END
<Login name="someName" password="somePass">
    <Booklet>first_booklet</Booklet>
    <Booklet>second_booklet</Booklet>
    <Will>not appear</Will>
</Login>
END;

        $result = $xmlFile->collectBookletsPerCode(new SimpleXMLElement($xml));

        //print_r($result);

        $expected = [
            '' => [
                'FIRST_BOOKLET',
                'SECOND_BOOKLET'
            ]
        ];

        $this->assertEquals($expected, $result, 'no code-using booklets present');
    }


    function test_getCodesFromBookletElement() {

        $xmlFile = new XMLFileTesttakers('sampledata/Testtakers.xml');

        $xml = '<Booklet codes="aaa bbb aaa">first_booklet</Booklet>';
        $expected = ['aaa', 'bbb'];
        $result = $xmlFile->getCodesFromBookletElement(new SimpleXMLElement($xml));
        $this->assertEquals($expected, $result);

        $xml = '<Booklet codes="">first_booklet</Booklet>';
        $expected = [];
        $result = $xmlFile->getCodesFromBookletElement(new SimpleXMLElement($xml));
        $this->assertEquals($expected, $result);

        $xml = '<Booklet>first_booklet</Booklet>';
        $expected = [];
        $result = $xmlFile->getCodesFromBookletElement(new SimpleXMLElement($xml));
        $this->assertEquals($expected, $result);
    }


    function test_getGroups() {

        $xmlFile = new XMLFileTesttakers('sampledata/Testtakers.xml');

        $expected = [
            'sample_group' => new Group(
                'sample_group',
                'Primary Sample Group'
            ),
            'review_group' => new Group(
                'review_group',
                'A Group of Reviewers'
            ),
            'trial_group' => new Group(
                'trial_group',
                'A Group for Trails'
            ),
            'passwordless_group' => new Group(
                'passwordless_group',
                'A group of persons without password'
            ),
            'expired_group' => new Group(
                'expired_group',
                'An already expired group'
            ),
            'future_group' => new Group(
                'future_group',
                'An not yet active group'
            ),
        ];

        $result = $xmlFile->getGroups();

        $this->assertEquals($expected, $result);
    }


    function test_getAllTesttakers() {

        $xmlFile = new XMLFileTesttakers('sampledata/Testtakers.xml');

        $expected = [
            [
                "groupname" => "sample_group",
                "loginname" => "__TEST_LOGIN_NAME__",
                "code" => "__TEST_PERSON_CODES__",
                "booklets" => [
                    "BOOKLET.SAMPLE",
                    "BOOKLET.SAMPLE-2",
                ]

            ],
            [
                "groupname" => "review_group",
                "loginname" => "__TEST_LOGIN_NAME__-review",
                "code" => "",
                "booklets" => [
                    "BOOKLET.SAMPLE",
                ],
            ],
            [
                "groupname" => "trial_group",
                "loginname" => "__TEST_LOGIN_NAME__-trial",
                "code" => "",
                "booklets" => [
                    "BOOKLET.SAMPLE",
                ]

            ],
            [
                "groupname" => "passwordless_group",
                "loginname" => "__TEST_LOGIN_NAME__-no-pw",
                "code" => "",
                "booklets" => [
                    "BOOKLET.SAMPLE",
                ]
            ],
            [
                "groupname" => "passwordless_group",
                "loginname" => "__TEST_LOGIN_NAME__-no-pw-trial",
                "code" => "",
                "booklets" => [
                    "BOOKLET.SAMPLE",
                ]
            ],
            [
                "groupname" => "expired_group",
                "loginname" => "test-expired",
                "code" => "",
                "booklets" => [
                    "BOOKLET.SAMPLE",
                ],
            ],
            [
                "groupname" => "future_group",
                "loginname" => "test-future",
                "code" => "",
                "booklets" => [
                  "BOOKLET.SAMPLE",
                ]
            ]
        ];


        $result = $xmlFile->getAllTesttakers();

        $this->assertEquals($expected, $result);
    }


    function test_getDoubleLoginNames() {

        global $ExampleXml1;

        $xmlFile = new XMLFileTesttakers($ExampleXml1, false, true);

        $expected = ['duplicateInSameGroup', 'duplicateInDifferentGroup'];

        $result = $xmlFile->getDoubleLoginNames();

        $this->assertEquals($expected, $result);
    }

    function test_getAllLoginNames() {

        global $ExampleXml1;

        $xmlFile = new XMLFileTesttakers($ExampleXml1, false, true);

        $expected = [
            'duplicateInSameGroup',
            'duplicateInDifferentGroup',
            'noDuplicate',
            'noDuplicateAgain'
        ];

        $result = $xmlFile->getAllLoginNames();

        $this->assertEquals($expected, $result);
    }


    function test_getMembersOfLogin() {

        $xmlFile = new XMLFileTesttakers('sampledata/Testtakers.xml');

        $expected = new PotentialLoginArray(
            new PotentialLogin(
                '__TEST_LOGIN_NAME__',
                'run-hot-return',
                'sample_group',
                ['__TEST_PERSON_CODES__' => ['BOOKLET.SAMPLE', 'BOOKLET.SAMPLE-2']], // TODO fix sample file !!!!!
                13,
                0,
                1583053200,
                45,
                (object) ['somestr' => 'string']
            )
        );

        $result = $xmlFile->getMembersOfLogin('__TEST_LOGIN_NAME__-group-monitor', 'user123', 13);

        $this->assertEquals($expected, $result);
    }

}


