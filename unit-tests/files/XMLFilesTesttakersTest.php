<?php

use PHPUnit\Framework\TestCase;
require_once "classes/files/XMLFile.php";
require_once "classes/files/XMLFileTesttakers.php";
require_once "classes/data-collection/PotentialLogin.class.php";

define('ROOT_DIR', realpath('../..'));

class XMLFilesTesttakersTest extends TestCase {

    function test_getLoginData() {

        $xmlFile = new XMLFileTesttakers('sampledata/Testtakers.xml');

        $result = $xmlFile->getLoginData('__TEST_LOGIN_NAME__', '__TEST_LOGIN_PASSWORD__', 1);

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

        $this->assertEquals($expected, $result, "login with codes");




        $result = $xmlFile->getLoginData('__TEST_LOGIN_NAME__-no-pw', '', 1);

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

        $this->assertEquals($expected, $result, "login without codes");




        $result = $xmlFile->getLoginData('__TEST_LOGIN_NAME__', 'wrong passowrd', 1);

        $this->assertNull($result, "login with wrong password");




        $result = $xmlFile->getLoginData('wrong username', '__TEST_LOGIN_PASSWORD__', 1);

        $this->assertNull($result, "login with wrong username");
    }


    function test_isMatchingLogin() {

        $xmlFile = new XMLFileTesttakers('sampledata/Testtakers.xml');

        $normal = new SimpleXMLElement('<Login name="myName" pw="myPassword">some content</Login>');

        $this->assertTrue($xmlFile->isMatchingLogin($normal, 'myName', 'myPassword'),
            'given: name, password | searched: name, password');
        $this->assertFalse($xmlFile->isMatchingLogin($normal, 'myName', 'wrongPassword'),
            'given: name, password | searched: name, wrong password');
        $this->assertFalse($xmlFile->isMatchingLogin($normal, 'wrongName', 'myPassword'),
            'given: name, password | searched: wrong name, password');
        $this->assertFalse($xmlFile->isMatchingLogin($normal, 'wrongName', 'wrongPassword'),
            'given: name, password | searched: wrong name, wrong password');

        $noPassword = new SimpleXMLElement('<Login name="myName">some content</Login>');

        $this->assertTrue($xmlFile->isMatchingLogin($noPassword, 'myName'),
            'given: name | searched: name');
        $this->assertFalse($xmlFile->isMatchingLogin($noPassword, 'wrongName'),
            'given: name | searched: wrongName');
        $this->assertFalse($xmlFile->isMatchingLogin($noPassword, 'myName', 'wrongPassword'),
            'given: name | searched: name, wrongPassword');

        $justCodes = new SimpleXMLElement('<Login name="myName"><Booklet codes="abc">B1</Booklet><Booklet codes="def">B2</Booklet></Login>');

        $this->assertTrue($xmlFile->isMatchingLogin($justCodes, 'myName', '', 'abc'),
            'given: name, codes | searched: name, code');
        $this->assertFalse($xmlFile->isMatchingLogin($justCodes, 'myName', 'somePassword', 'def'),
            'given: name, codes | searched: name, password, code');
        $this->assertFalse($xmlFile->isMatchingLogin($justCodes, 'myName', '', 'non'),
            'given: name, codes | searched: name, code');

        $pwAndCodes = new SimpleXMLElement('<Login name="myName" pw="myPw"><Booklet codes="abc">B1</Booklet><Booklet codes="def">B2</Booklet></Login>');

        $this->assertTrue($xmlFile->isMatchingLogin($pwAndCodes, 'myName', 'myPw', 'abc'),
            'given: name, pw, codes | searched: name, pw, code');
        $this->assertFalse($xmlFile->isMatchingLogin($pwAndCodes, 'myName', 'myPw', 'non'),
            'given: name, pw, codes | searched: name, pw, wrong code');
        $this->assertFalse($xmlFile->isMatchingLogin($pwAndCodes, 'myName', 'wrongPw', 'abc'),
            'given: name, pw, codes | searched: name, wrong pw, code');
        $this->assertFalse($xmlFile->isMatchingLogin($pwAndCodes, 'myName', 'wrongPw', 'non'),
            'given: name, pw, codes | searched: name, wrong pw, wrong code');
        $this->assertFalse($xmlFile->isMatchingLogin($pwAndCodes, 'wrongName', 'myPw', 'abc'),
            'given: name, pw, codes | searched: wrong name, pw, code');
        $this->assertFalse($xmlFile->isMatchingLogin($pwAndCodes, 'wrongName', 'myPw', 'non'),
            'given: name, pw, codes | searched: wrong name, pw, wrong code');
        $this->assertFalse($xmlFile->isMatchingLogin($pwAndCodes, 'wrongName', 'wrongPw', 'abc'),
            'given: name, pw, codes | searched: name, wrong pw, wrong code');
        $this->assertFalse($xmlFile->isMatchingLogin($pwAndCodes, 'wrongName', 'wrongPw', 'non'),
            'given: name, pw, codes | searched: wrong name, wrong pw, wrong code');
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

}


