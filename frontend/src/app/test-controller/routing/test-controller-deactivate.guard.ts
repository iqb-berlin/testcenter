import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { TestControllerComponent } from '../components/test-controller/test-controller.component';
import { TestControllerService } from '../services/test-controller.service';

@Injectable()
export class TestControllerDeactivateGuard implements CanDeactivate<TestControllerComponent> {
  constructor(private tcs: TestControllerService) {}

  canDeactivate() {
    // Actual "should we end the test, and does the user confirm that" logic lives on
    // TestControllerService (confirmEndTestIfNeeded) - this guard is just a thin adapter into it.
    return this.tcs.confirmEndTestIfNeeded();
  }
}
