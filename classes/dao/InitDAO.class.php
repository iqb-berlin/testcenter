<?php
declare(strict_types=1);
// TODO unit tests

class InitDAO extends SuperAdminDAO {


    public function createSampleLoginsReviewsLogs(string $loginCode): void {

        $timestamp = microtime(true) * 1000; // TODO use TimeStamp helper for this

        $sessionDAO = new SessionDAO();
        $testDAO = new TestDAO();

        $testSession = new LoginData(
            [
                'groupName' => 'sample_group',
                'mode' => 'run-hot-return',
                'workspaceId' => 1,
                'name' => 'sample_user',
                'booklets' => [$loginCode => ['BOOKLET.SAMPLE']],
                '_validTo' => TimeStamp::fromXMLFormat('1/1/2030 12:00')
            ]
        );
        $login = $sessionDAO->getOrCreateLogin($testSession);
        $login->_validTo = TimeStamp::fromXMLFormat('1/1/2030 12:00');
        $person = $sessionDAO->getOrCreatePerson($login, $loginCode);
        $test = $testDAO->getOrCreateTest($person['id'], 'BOOKLET.SAMPLE', "sample_booklet_label");
        $testDAO->addTestReview((int) $test['id'], 1, "", "sample booklet review");
        $testDAO->addUnitReview((int) $test['id'], "UNIT.SAMPLE", 1, "", "this is a sample unit review");
        $testDAO->addUnitLog((int) $test['id'], 'UNIT.SAMPLE', "sample unit log", $timestamp);
        $testDAO->addBookletLog((int) $test['id'], "sample log entry", $timestamp);
        $testDAO->addResponse((int) $test['id'], 'UNIT.SAMPLE', "{\"name\":\"Sam Sample\",\"age\":34}", "", $timestamp);
        $testDAO->updateUnitLastState((int) $test['id'], "UNIT.SAMPLE", "PRESENTATIONCOMPLETE", "yes");
    }

    /**
     * @param string $loginCode
     * @throws HttpError
     */
    public function createSampleExpiredLogin(string $loginCode): void {

        $sessionDAO = new SessionDAO();
        $adminDAO = new AdminDAO();

        $testSession = new LoginData(
            [
                'groupName' => 'sample_group',
                'mode' => 'run-hot-return',
                'workspaceId' => 1,
                'name' => 'expired_user',
                'booklets' => [$loginCode => ['BOOKLET.SAMPLE']],
                '_validTo' => TimeStamp::fromXMLFormat('1/1/2000 12:00')
            ]
        );

        $login = $sessionDAO->createLogin($testSession, true);
        $sessionDAO->createPerson($login, $loginCode, true);

        $this->createUser("expired_user", "whatever", true);
        $adminDAO->createAdminToken("expired_user", "whatever", TimeStamp::fromXMLFormat('1/1/2000 12:00'));
    }
}
