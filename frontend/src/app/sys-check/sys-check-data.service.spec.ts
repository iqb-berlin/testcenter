import { TestBed, inject } from '@angular/core/testing';
import { SysCheckDataService } from './sys-check-data.service';

describe('SyscheckDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SysCheckDataService]
    });
  });

  it('should be created', inject([SysCheckDataService], (service: SysCheckDataService) => {
    expect(service).toBeTruthy();
  }));
});
