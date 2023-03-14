<?php

class TestDB {
  static function setUp(): void {
    require_once "src/dao/SessionDAO.class.php";
    require_once "src/dao/InitDAO.class.php";
    require_once "src/helper/JSON.class.php";
    require_once "src/helper/Token.class.php";
    define("ROOT_DIR", REAL_ROOT_DIR);
    $prodDBName = DB::connectToTestDB();
    $initDao = new InitDAO();
    $initDao->cloneDB($prodDBName);
  }
}


