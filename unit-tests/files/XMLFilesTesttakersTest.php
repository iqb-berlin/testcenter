<?php

use PHPUnit\Framework\TestCase;

require_once "classes/data-collection/DataCollectionTypeSafe.class.php";
require_once "classes/files/File.class.php";
require_once "classes/files/XMLFile.class.php";
require_once "classes/files/XMLFileTesttakers.class.php";
require_once "classes/data-collection/PotentialLogin.class.php";
require_once "classes/data-collection/PotentialLoginArray.class.php";
require_once "classes/data-collection/Group.class.php";

$exampleXML1 = <<<END
<Testtakers>
  <Metadata>
    <Id>example</Id>
  </Metadata>
  
  <CustomTexts>
    <CustomText key="first_key">first_value</CustomText>
    <CustomText key="second_key">second_value</CustomText>
  </CustomTexts>

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


class XMLFileTesttakersExposed extends XMLFileTesttakers {

    public static function collectBookletsPerCode(SimpleXMLElement $element): array {
        return parent::collectBookletsPerCode($element);
    }

    public static function getCodesFromBookletElement(SimpleXMLElement $element): array {
        return parent::getCodesFromBookletElement($element);
    }
};


class XMLFilesTesttakersTest extends TestCase {

    public static function setUpBeforeClass(): void {

        VfsForTest::setUpBeforeClass();
        VfsForTest::setUp();
    }


    // crossValidate is implicitly tested by WorkspaceValidatorTest -> validate


    function test_getMembersOfLogin() {

        $xmlFile = new XMLFileTesttakers(DATA_DIR . '/ws_1/Testtakers/SAMPLE_TESTTAKERS.XML');

        $expected = new PotentialLoginArray(
            new PotentialLogin(
                'unit_test_login',
                'run-hot-return',
                'sample_group',
                [
                    "abc" => [
                        "BOOKLET.SAMPLE",
                        "BOOKLET.SAMPLE-2"
                    ],
                    "def" => [
                        "BOOKLET.SAMPLE",
                        "BOOKLET.SAMPLE-2"
                    ]
                ],
                13,
                0,
                1583053200,
                45,
                (object) ['somestr' => 'string']
            )
        );

        $result = $xmlFile->getMembersOfLogin('unit_test_login-group-monitor', 'unit_test_password', 13);

        $this->assertEquals($expected, $result);
    }


    function test_getLogin() {

        $xmlFile = new XMLFileTesttakers(DATA_DIR . '/ws_1/Testtakers/SAMPLE_TESTTAKERS.XML');

        $result = $xmlFile->getLogin('unit_test_login', 'unit_test_password', 1);
        $expected = new PotentialLogin(
            'unit_test_login',
            'run-hot-return',
            'sample_group',
            [
                "abc" => [
                    "BOOKLET.SAMPLE",
                    "BOOKLET.SAMPLE-2"
                ],
                "def" => [
                    "BOOKLET.SAMPLE",
                    "BOOKLET.SAMPLE-2"
                ]
            ],
            1,
            0,
            1583053200,
            45,
            (object) ['somestr' => 'string']
        );
        $this->assertEquals($expected, $result, "login with password");

        $result = $xmlFile->getLogin('unit_test_login-no-pw', '', 1);
        $expected = new PotentialLogin(
            'unit_test_login-no-pw',
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


        $result = $xmlFile->getLogin('unit_test_login-no-pw-trial', '', 1);
        $expected = new PotentialLogin(
            'unit_test_login-no-pw-trial',
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


        $result = $xmlFile->getLogin('unit_test_login', 'wrong password', 1);
        $this->assertNull($result, "login with wrong password");

        $result = $xmlFile->getLogin('unit_test_login', '', 1);
        $this->assertNull($result, "login with no password");


        $result = $xmlFile->getLogin('wrong username', '__TEST_LOGIN_PASSWORD__', 1);
        $this->assertNull($result, "login with wrong username");


        $result = $xmlFile->getLogin('unit_test_login-no-pw', 'some password', 1);
        $this->assertNull($result, "login with password if none is required (attribute omitted)");


        $result = $xmlFile->getLogin('unit_test_login-no-pw-trial', 'some password', 1);
        $this->assertNull($result, "login with password if none is required (attribute empty)");
    }


    function test_collectBookletsPerCode() {

        $xml = <<<END
<Login name="someName" password="somePass">
    <Booklet codes="aaa bbb">first_booklet</Booklet>
    <Booklet>second_booklet</Booklet>
    <Booklet codes="bbb ccc">third_booklet</Booklet>
    <Booklet codes="will not appear"></Booklet>
    <Will codes="also">not appear</Will>
</Login>
END;

        $result = XMLFileTesttakersExposed::collectBookletsPerCode(new SimpleXMLElement($xml));

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

        $result = XMLFileTesttakersExposed::collectBookletsPerCode(new SimpleXMLElement($xml));

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

        $xml = '<Booklet codes="aaa bbb aaa">first_booklet</Booklet>';
        $expected = ['aaa', 'bbb'];
        $result = XMLFileTesttakersExposed::getCodesFromBookletElement(new SimpleXMLElement($xml));
        $this->assertEquals($expected, $result);

        $xml = '<Booklet codes="">first_booklet</Booklet>';
        $expected = [];
        $result = XMLFileTesttakersExposed::getCodesFromBookletElement(new SimpleXMLElement($xml));
        $this->assertEquals($expected, $result);

        $xml = '<Booklet>first_booklet</Booklet>';
        $expected = [];
        $result = XMLFileTesttakersExposed::getCodesFromBookletElement(new SimpleXMLElement($xml));
        $this->assertEquals($expected, $result);
    }


    function test_getGroups() {

        $xmlFile = new XMLFileTesttakers(DATA_DIR . '/ws_1/Testtakers/SAMPLE_TESTTAKERS.XML');

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
                'A Group for Trials and Demos'
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

        $xmlFile = new XMLFileTesttakers(DATA_DIR . '/ws_1/Testtakers/SAMPLE_TESTTAKERS.XML');

        $expected = [
            new PotentialLogin(
                'unit_test_login',
                'run-hot-return',
                'sample_group',
                ['abc' => ['BOOKLET.SAMPLE', 'BOOKLET.SAMPLE-2'], 'def' => ['BOOKLET.SAMPLE', 'BOOKLET.SAMPLE-2']],
                -1,
                0,
                1583053200,
                45,
                (object) ["somestr" => "string"]
            ),
            new PotentialLogin(
                'unit_test_login-group-monitor',
                'monitor-group',
                'sample_group',
                ['' => []],
                -1,
                0,
                1583053200,
                45,
                (object) ["somestr" => "string"],
            ),
            new PotentialLogin(
                'unit_test_login-review',
                'run-review',
                'review_group',
                ['' => ["BOOKLET.SAMPLE"]],
                -1,
                0,
                0,
                0,
                (object) ["somestr" => "string"]
            ),
            new PotentialLogin(
                'unit_test_login-trial',
                'run-trial',
                'trial_group',
                ['' => ["BOOKLET.SAMPLE"]],
                -1,
                0,
                0,
                0,
                (object) ["somestr" => "string"]
            ),
            new PotentialLogin(
                'unit_test_login-demo',
                'run-demo',
                'trial_group',
                ['' => ["BOOKLET.SAMPLE"]],
                -1,
                0,
                0,
                0,
                (object) ["somestr" => "string"]
            ),
            new PotentialLogin(
                'unit_test_login-no-pw',
                'run-hot-restart',
                'passwordless_group',
                ['' => ["BOOKLET.SAMPLE"]],
                -1,
                0,
                0,
                0,
                (object) ["somestr" => "string"]
            ),
            new PotentialLogin(
                'unit_test_login-no-pw-trial',
                'run-trial',
                'passwordless_group',
                ['' => ["BOOKLET.SAMPLE"]],
                -1,
                0,
                0,
                0,
                (object) ["somestr" => "string"]
            ),
            new PotentialLogin(
                'unit_test_login-expired',
                'run-hot-restart',
                'expired_group',
                ['' => ["BOOKLET.SAMPLE"]],
                -1,
                1583087400,
                0,
                0,
                (object) ["somestr" => "string"]
            ),
            new PotentialLogin(
                'expired-group-monitor',
                'monitor-group',
                'expired_group',
                ['' => []],
                -1,
                1583087400,
                0,
                0,
                (object) ["somestr" => "string"]
            ),
            new PotentialLogin(
                'unit_test_login-future',
                'run-hot-restart',
                'future_group',
                ['' => ["BOOKLET.SAMPLE"]],
                -1,
                0,
                1900742400,
                0,
                (object) ["somestr" => "string"],
            )

        ];

        $result = $xmlFile->getAllTesttakers();

        $this->assertEquals($expected, $result);
    }


    function test_getDoubleLoginNames() {

        global $exampleXML1;
        $xmlFile = new XMLFileTesttakers($exampleXML1, false, true);

        $expected = ['duplicateInSameGroup', 'duplicateInDifferentGroup'];

        $result = $xmlFile->getDoubleLoginNames();

        $this->assertEquals($expected, $result);
    }


    function test_getAllLoginNames() {

        global $exampleXML1;
        $xmlFile = new XMLFileTesttakers($exampleXML1, false, true);

        $expected = [
            'duplicateInSameGroup',
            'duplicateInDifferentGroup',
            'noDuplicate',
            'noDuplicateAgain'
        ];

        $result = $xmlFile->getAllLoginNames();

        $this->assertEquals($expected, $result);
    }


    function test_getCustomTexts() {

        global $exampleXML1;
        $xmlFile = new XMLFileTesttakers($exampleXML1, false, true);

        $expected = (object) [
            'first_key' => 'first_value',
            'second_key' => 'second_value'
        ];

        $result = $xmlFile->getCustomTexts();

        $this->assertEquals($expected, $result);
    }
}


