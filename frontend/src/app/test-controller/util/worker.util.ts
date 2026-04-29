import { interval, Observable } from 'rxjs';

export function createTicker(): Observable<number> {
  if (typeof Worker === 'undefined') {
    return interval(1000);
  }
  // Stringified via .toString() and run inside a Blob worker. Must be self-contained:
  // no closures, no imports, no references to outer-scope identifiers.
  const workerFunction = (): void => {
    let tickerTimer: ReturnType<typeof setInterval>;
    let startTime = 0;
    onmessage = (message: MessageEvent<'on' | 'off'>) => {
      switch (message.data) {
      case 'on':
        startTime = Date.now();
        postMessage(0);
        tickerTimer = setInterval(() => {
          postMessage(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        break;
      case 'off':
        clearInterval(tickerTimer);
        break;
      default:
      }
    };
  };
  const blob = new Blob(
  // Take the function, convert it to text, wrap it as an expression, and generate code that calls it inside the worker.
  // [workerFunction()] would not work, as it would execute the function and send its return value to the worker, instead of the source code of the function
    [`(${workerFunction.toString()})();`],
    { type: 'application/javascript' }
  );
  const blobUrl = URL.createObjectURL(blob);
  const workerTimer = new Worker(blobUrl);

  return new Observable(subscriber => {
    const eventHandler = (event: MessageEvent<number>) => {
      subscriber.next(event.data);
    };

    workerTimer.addEventListener('message', eventHandler);
    workerTimer.postMessage('on');

    return function unsubscribe() {
      workerTimer.postMessage('off');
      workerTimer.removeEventListener('message', eventHandler);
      workerTimer.terminate();
      URL.revokeObjectURL(blobUrl);
    };
  });
}
