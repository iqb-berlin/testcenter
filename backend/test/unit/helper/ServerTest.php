<?php

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class ServerTest extends TestCase {
  function test_getUrl() {
    // a scenario like most local installations with one vhost, vhost base dir is /var/www
    $expected = 'http' . (SystemConfig::$system_secureSiteScheme ? 's' : '') . '://localhost/a-sub-folder/another-sub-folder';
    $actual = Server::getUrl([
      "REDIRECT_STATUS" => "200",
      "SERVER_SOFTWARE" => "Apache/2.4.38 (Debian)",
      "SERVER_NAME" => "localhost",
      "SERVER_ADDR" => " => =>1",
      "SERVER_PORT" => "80",
      "REMOTE_ADDR" => " => =>1",
      "REQUEST_SCHEME" => "http",
      "REMOTE_PORT" => "51286",
      "REDIRECT_URL" => "/a-sub-folder/another-sub-folder/system/config",
      "REQUEST_METHOD" => "GET",
      "QUERY_STRING" => "",
      "REQUEST_URI" => "/a-sub-folder/another-sub-folder/system/config",
      "SCRIPT_NAME" => "/a-sub-folder/another-sub-folder/index.php",
      "PHP_SELF" => "/a-sub-folder/another-sub-folder/index.php",
    ]);
    $this->assertEquals($expected, $actual);
  }

  function test_getUrlWithRedirect() {
    // a scenario like in the docker-setup, an external proxy (traefik) does a redirection
    $expected = 'http' . (SystemConfig::$system_secureSiteScheme ? 's' : '') . '://testcenter.iqb.hu-berlin.de/api';
    $actual = Server::getUrl([
      "REDIRECT_STATUS" => "200",
      "HTTP_HOST" => "testcenter.iqb.hu-berlin.de",
      "HTTP_X_FORWARDED_FOR" => "172.18.232.15",
      "HTTP_X_FORWARDED_HOST" => "testcenter.iqb.hu-berlin.de",
      "HTTP_X_FORWARDED_PORT" => "80",
      "HTTP_X_FORWARDED_PREFIX" => "/api",
      "HTTP_X_FORWARDED_SERVER" => "7e128516da62",
      "HTTP_X_REAL_IP" => "5.6.7.8",
      "SERVER_NAME" => "testcenter.iqb.hu-berlin.de",
      "SERVER_ADDR" => "1.2.3.4",
      "SERVER_PORT" => "80",
      "REQUEST_SCHEME" => "http",
      "CONTEXT_PREFIX" => "",
      "CONTEXT_DOCUMENT_ROOT" => "/var/www/html",
      "SCRIPT_FILENAME" => "/var/www/html/index.php",
      "REMOTE_PORT" => "47282",
      "REDIRECT_URL" => "/system/config",
      "REDIRECT_QUERY_STRING" => "what=ever",
      "REQUEST_METHOD" => "GET",
      "QUERY_STRING" => "",
      "REQUEST_URI" => "/system/config?what=ever",
      "SCRIPT_NAME" => "/index.php",
      "PHP_SELF" => "/index.php",
    ]);
    $this->assertEquals($expected, $actual);
  }

  function test_getUrlWithHTTPS() {
    // a scenario https is enabled, vhost base dir is /var/www/testcenter-dir
    $expected = 'http' . (SystemConfig::$system_secureSiteScheme ? 's' : '') . '://a-nice-testcenter.de';
    $actual = Server::getUrl([
      "CRIPT_URL" => "/index.php",
      "SCRIPT_URI" => "https://a-nice-testcenter.de/index.php",
      "HTTPS" => "on",
      "SSL_TLS_SNI" => "a-nice-testcenter.de",
      "HTTP_HOST" => "a-nice-testcenter.de",
      "SERVER_SOFTWARE" => "Apache/2.4.38 (Debian)",
      "SERVER_NAME" => "a-nice-testcenter.de",
      "SERVER_ADDR" => "1.2.3.4",
      "SERVER_PORT" => "443",
      "DOCUMENT_ROOT" => "/var/www/testcenter-dir",
      "REQUEST_SCHEME" => "https",
      "CONTEXT_PREFIX" => "no value",
      "CONTEXT_DOCUMENT_ROOT" => "/var/www/testcenter-dir",
      "SCRIPT_FILENAME" => "/var/www/testcenter-dir/index.php",
      "REMOTE_PORT" => "60952",
      "REQUEST_METHOD" => "GET",
      "QUERY_STRING" => "",
      "REQUEST_URI" => "/index.php",
      "SCRIPT_NAME" => "/index.php"
    ]);
    $this->assertEquals($expected, $actual);
  }
}
