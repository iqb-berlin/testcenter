import { TestBed, inject } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { MainDataService } from './maindata.service';

describe('MainDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MainDataService],
      imports: [HttpClientModule]
    });
  });

  it('should be created', inject([MainDataService], (service: MainDataService) => {
    expect(service).toBeTruthy();
  }));
});
