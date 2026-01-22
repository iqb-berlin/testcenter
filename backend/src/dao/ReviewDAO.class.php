<?php

declare(strict_types=1);

class ReviewDAO extends DAO
{

  /**
   * Get reviews for a person, optionally filtered by test
   * @param int $personId Person session ID
   * @param int|null $testId Optional test ID filter
   * @return array Review data in same format as AdminDAO::getReviewReportData()
   */
  public function getReviewsByPerson(int $personId, ?int $testId = null): array {
    $params = [':person_id' => $personId];
    $unitFilter = '';
    $testFilter = '';

    if (!is_null($testId)) {
      $unitFilter = 'and unit_reviews.test_id = :testId';
      $testFilter = 'and test_reviews.booklet_id = :testId';
      $params[':testId'] = $testId;
    }

    return $this->_(
      "
        select
          login_sessions.group_name as groupname,
          login_sessions.name as loginname,
          person_sessions.code,
          tests.name as bookletname,
          unit_reviews.unit_name as unitname,
          unit_reviews.priority,
          unit_reviews.categories,
          unit_reviews.reviewtime,
          unit_reviews.page,
          unit_reviews.pagelabel,
          units.original_unit_id as originalUnitId,
          unit_reviews.user_agent as userAgent,
          unit_reviews.reviewer,
          unit_reviews.entry
        from unit_reviews
          left join units on units.test_id = unit_reviews.test_id and units.name = unit_reviews.unit_name
          left join tests on tests.id = unit_reviews.test_id
          left join person_sessions on person_sessions.id = unit_reviews.person_id
          left join login_sessions on login_sessions.id = person_sessions.login_sessions_id
        where
          unit_reviews.person_id = :person_id
          $unitFilter

        union all

        select
          login_sessions.group_name as groupname,
          login_sessions.name as loginname,
          person_sessions.code,
          tests.name as bookletname,
          '' as unitname,
          test_reviews.priority,
          test_reviews.categories,
          test_reviews.reviewtime,
          null as page,
          null as pagelabel,
          '' as originalUnitId,
          test_reviews.user_agent as userAgent,
          test_reviews.reviewer,
          test_reviews.entry
        from test_reviews
          left join tests on test_reviews.booklet_id = tests.id
          left join person_sessions on person_sessions.id = test_reviews.person_id
          left join login_sessions on login_sessions.id = person_sessions.login_sessions_id
        where
          test_reviews.person_id = :person_id
          $testFilter

        order by reviewtime asc;
      ",
      $params,
      true
    );
  }
}