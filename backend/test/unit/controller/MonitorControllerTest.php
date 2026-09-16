<?php /** @noinspection PhpUnhandledExceptionInspection */

declare(strict_types=1);

use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use Mockery\MockInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Slim\Exception\HttpNotFoundException;
use Slim\Http\Response;

class MonitorControllerInjector extends MonitorController {
  public static function injectAdminDAO(AdminDAO $adminDAO): void {
    MonitorController::$_adminDAO = $adminDAO;
  }
}

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class MonitorControllerTest extends TestCase {
  use MockeryPHPUnitIntegration;

  private BroadcastService|MockInterface $broadcastServiceMock;

  function setUp(): void {
    require_once "test/unit/test-helper/RequestCreator.class.php";
    require_once "test/unit/test-helper/ResponseCreator.class.php";

    $this->broadcastServiceMock = Mockery::mock('overload:' . BroadcastService::class);
  }

  private function putCommand(string $testIds, AdminDAO|MockObject $adminDAO): Response {
    MonitorControllerInjector::injectAdminDAO($adminDAO);

    return MonitorController::putCommand(
      RequestCreator::create(
        'PUT',
        '/monitor/command',
        '{"keyword":"pause","timestamp":1597905000,"testIds":' . $testIds . '}'
      )->withAttribute(
        'AuthToken',
        new AuthToken('monitor_token', 7, 'person', 1, 'monitor-group', 'sample_group')
      ),
      ResponseCreator::createEmpty()
    );
  }

  private function mockAdminDAO(?array $test = ['id' => 1]): AdminDAO|MockObject {
    $adminDAO = $this->createMock('AdminDAO');
    $adminDAO
      ->method('getTest')
      ->willReturn($test);

    return $adminDAO;
  }

  function test_putCommand_storesAllTestsOfOneCommandAtOnce(): void {
    $this->broadcastServiceMock->expects('send')->times(1)->andReturn(null);

    $adminDAO = $this->mockAdminDAO();
    $adminDAO
      ->expects($this->once())
      ->method('storeCommand')
      ->with(7, [12, 14], $this->isInstanceOf(Command::class))
      ->willReturn(42);

    $response = $this->putCommand('[12,14]', $adminDAO);

    $this->assertEquals(201, $response->getStatusCode());
  }

  function test_putCommand_dropsDuplicatedTestIdsAndCastsThem(): void {
    $this->broadcastServiceMock->expects('send')->times(1)->andReturn(null);

    $adminDAO = $this->mockAdminDAO();
    $adminDAO
      ->expects($this->once())
      ->method('storeCommand')
      ->with(7, [12, 14], $this->isInstanceOf(Command::class))
      ->willReturn(42);

    $response = $this->putCommand('[12,"12",14]', $adminDAO);

    $this->assertEquals(201, $response->getStatusCode());
  }

  function test_putCommand_broadcastsCommandIdAndTestIdsAsJsonArray(): void {
    $message = '';
    $this->broadcastServiceMock
      ->expects('send')
      ->times(1)
      ->andReturnUsing(function(string $endpoint, string $payload) use (&$message): ?string {
        $message = $payload;
        return null;
      });

    $adminDAO = $this->mockAdminDAO();
    $adminDAO
      ->method('storeCommand')
      ->willReturn(42);

    $this->putCommand('[12,"12",14]', $adminDAO);

    // dropping the duplicate leaves a gap in the keys, and json_encode turns an array with gaps into an
    // object - which the broadcaster rejects as `no testIds given`
    $this->assertStringContainsString('"testIds":[12,14]', $message);
    $this->assertSame(42, json_decode($message, true)['command']['id']);
  }

  function test_putCommand_storesNothingForAnUnknownTest(): void {
    $this->broadcastServiceMock->expects('send')->never();

    $adminDAO = $this->mockAdminDAO(null);
    $adminDAO
      ->expects($this->never())
      ->method('storeCommand');

    $this->expectException(HttpNotFoundException::class);

    $this->putCommand('[12,14]', $adminDAO);
  }

  function test_putCommand_storesNothingWithoutTests(): void {
    $this->broadcastServiceMock->expects('send')->times(1)->andReturn(null);

    $adminDAO = $this->mockAdminDAO();
    $adminDAO
      ->expects($this->never())
      ->method('storeCommand');

    $response = $this->putCommand('[]', $adminDAO);

    $this->assertEquals(201, $response->getStatusCode());
  }
}
