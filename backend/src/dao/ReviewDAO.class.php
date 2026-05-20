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
      $unitFilter = 'AND unit_reviews.test_id = :testId';
      $testFilter = 'AND test_reviews.booklet_id = :testId';
      $params[':testId'] = $testId;
    }

    return $this->_(
      "
        SELECT
          login_sessions.group_name AS groupname,
          login_sessions.name AS loginname,
          person_sessions.code,
          tests.name AS bookletname,
          unit_reviews.unit_name AS unitname,
          unit_reviews.priority,
          unit_reviews.categories,
          unit_reviews.reviewtime,
          unit_reviews.page,
          unit_reviews.pagelabel,
          units.original_unit_id AS originalUnitId,
          unit_reviews.user_agent AS userAgent,
          unit_reviews.reviewer,
          unit_reviews.entry
        FROM unit_reviews
          LEFT JOIN units ON units.test_id = unit_reviews.test_id AND units.name = unit_reviews.unit_name
          LEFT JOIN tests ON tests.id = unit_reviews.test_id
          LEFT JOIN person_sessions ON person_sessions.id = unit_reviews.person_id
          LEFT JOIN login_sessions ON login_sessions.id = person_sessions.login_sessions_id
        WHERE
          unit_reviews.person_id = :person_id
          $unitFilter

        UNION ALL

        SELECT
          login_sessions.group_name AS groupname,
          login_sessions.name AS loginname,
          person_sessions.code,
          tests.name AS bookletname,
          '' AS unitname,
          test_reviews.priority,
          test_reviews.categories,
          test_reviews.reviewtime,
          NULL AS page,
          NULL AS pagelabel,
          '' AS originalUnitId,
          test_reviews.user_agent AS userAgent,
          test_reviews.reviewer,
          test_reviews.entry
        FROM test_reviews
          LEFT JOIN tests ON test_reviews.booklet_id = tests.id
          LEFT JOIN person_sessions ON person_sessions.id = test_reviews.person_id
          LEFT JOIN login_sessions ON login_sessions.id = person_sessions.login_sessions_id
        WHERE
          test_reviews.person_id = :person_id
          $testFilter

        ORDER BY reviewtime ASC;
      ",
      $params,
      true
    );
  }
}
