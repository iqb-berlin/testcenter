import { TestBed } from '@angular/core/testing';
import {
  defer, lastValueFrom, of, throwError
} from 'rxjs';
import { BackendService } from './backend.service';
import { WidgetDeliveryService } from './widget-delivery.service';

describe('WidgetDeliveryService', () => {
  let service: WidgetDeliveryService;
  let getResource: jasmine.Spy;

  beforeEach(() => {
    getResource = jasmine.createSpy('getResource')
      .and.returnValue(of({ progress: 0 }, { progress: 50 }, { content: '<html>periodic</html>' }));
    TestBed.configureTestingModule({
      providers: [{ provide: BackendService, useValue: { getResource } }]
    });
    service = TestBed.inject(WidgetDeliveryService);
    service.setWidgets(3, {
      PERIODIC_TABLE: { path: 'Resource/periodic-1.1.html', label: 'Periodensystem' }
    });
  });

  it('should find the widget for a model, titled by its label', () => {
    expect(service.findWidget('PERIODIC_TABLE')?.title).toBe('Periodensystem');
  });

  it('should find nothing for an unknown model', () => {
    expect(service.findWidget('CALCULATOR')).toBeUndefined();
    expect(service.findWidget('toString')).toBeUndefined();
  });

  it('should download the widget only once its HTML is needed, delivering only the content', async () => {
    let downloads = 0;
    getResource.and.returnValue(defer(() => {
      downloads += 1;
      return of({ progress: 50 }, { content: '<html>periodic</html>' });
    }));
    const widget = service.findWidget('PERIODIC_TABLE');
    expect(downloads).toBe(0);

    expect(await lastValueFrom(widget!.html)).toBe('<html>periodic</html>');
    expect(downloads).toBe(1);
    expect(getResource).toHaveBeenCalledOnceWith(3, 'Resource/periodic-1.1.html');
  });

  it('should keep a downloaded widget', async () => {
    await lastValueFrom(service.findWidget('PERIODIC_TABLE')!.html);

    expect(await lastValueFrom(service.findWidget('PERIODIC_TABLE')!.html)).toBe('<html>periodic</html>');
    expect(getResource).toHaveBeenCalledTimes(1);
  });

  it('should download again after a failed download', async () => {
    getResource.and.returnValue(throwError(() => new Error('offline')));
    await expectAsync(lastValueFrom(service.findWidget('PERIODIC_TABLE')!.html)).toBeRejected();

    getResource.and.returnValue(of({ content: '<html>periodic</html>' }));
    expect(await lastValueFrom(service.findWidget('PERIODIC_TABLE')!.html)).toBe('<html>periodic</html>');
    expect(getResource).toHaveBeenCalledTimes(2);
  });

  it('should replace the widgets and forget downloads with the next test', async () => {
    await lastValueFrom(service.findWidget('PERIODIC_TABLE')!.html);

    service.setWidgets(4, {
      PERIODIC_TABLE: { path: 'Resource/periodic-1.2.html', label: 'Periodensystem' }
    });
    await lastValueFrom(service.findWidget('PERIODIC_TABLE')!.html);
    expect(getResource).toHaveBeenCalledWith(4, 'Resource/periodic-1.2.html');
    expect(getResource).toHaveBeenCalledTimes(2);
  });
});
