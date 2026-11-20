import { TestBed } from '@angular/core/testing';
import { FileServerService } from './file-server.service';
import { MainDataService } from './maindata/maindata.service';

describe('FileServerService', () => {
  const createService = (fileServiceUri: string): FileServerService => {
    TestBed.configureTestingModule({
      providers: [
        { provide: 'FILE_SERVER_URL', useValue: '/fs/' },
        { provide: 'BACKEND_URL', useValue: '/api/' },
        { provide: MainDataService, useValue: { appConfig: { fileServiceUri } } }
      ]
    });
    return TestBed.inject(FileServerService);
  };

  it('should load files from the file-server when there is one', () => {
    expect(createService('http://file-server:8080/').getBaseUrl()).toBe('/fs/');
  });

  it('should load files from the backend when there is no file-server', () => {
    expect(createService('').getBaseUrl()).toBe('/api/');
  });
});
