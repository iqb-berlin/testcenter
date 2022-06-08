<?php


use Slim\Http\ServerRequest as Request;

abstract class Controller {

    // TODO refactor DAO to be static, than this would not be needed

    protected static $_adminDAO;
    protected static $_superAdminDAO;
    protected static $_sessionDAO;
    protected static $_testDAO;
    protected static $_workspaceDAO;

    protected static function sessionDAO(): SessionDAO {

        if (!self::$_sessionDAO) {
            self::$_sessionDAO = new SessionDAO();
        }

        return self::$_sessionDAO;
    }


    protected static function adminDAO(): AdminDAO {

        if (!self::$_adminDAO) {
            self::$_adminDAO = new AdminDAO();
        }

        return self::$_adminDAO;
    }


    protected static function testDAO(): TestDAO {

        if (!self::$_testDAO) {
            self::$_testDAO = new TestDAO();
        }

        return self::$_testDAO;
    }


    protected static function superAdminDAO(): SuperAdminDAO {

        if (!self::$_superAdminDAO) {
            self::$_superAdminDAO = new SuperAdminDAO();
        }

        return self::$_superAdminDAO;
    }


    protected static function workspaceDAO(): WorkspaceDAO {

        if (!self::$_workspaceDAO) {
            self::$_workspaceDAO = new WorkspaceDAO();
        }

        return self::$_workspaceDAO;
    }


    protected static function authToken(Request $request): AuthToken {

        return $request->getAttribute('AuthToken');
    }
}
