import { interval, Observable } from 'rxjs';

export function createTicker(): Observable<number> {
  if (typeof Worker !== 'undefined') {
  // Stringified via .toString() and run inside a Blob worker. Must be self-contained:
  // no closures, no imports, no references to outer-scope identifiers.
    const tickerWorker = (): void => {
      let timer: ReturnType<typeof setInterval>;
      let secondsPassed = 0;
      self.onmessage = (message: MessageEvent<'on' | 'off'>) => {
        console.log('webworker');
        switch (message.data) {
        case 'on':
          postMessage(secondsPassed++);
          timer = setInterval(() => postMessage(secondsPassed++), 1000);
          break;
        case 'off':
          clearInterval(timer);
          break;
        default:
        }
      };
    };
    const blob = new Blob(
    // Take the function, convert it to text, wrap it as an expression, and generate code that calls it inside the worker.
    // [tickerWorker()] would not work, as it would execute the function and send its return value to the worker, instead of the source code of the function
      [`(${tickerWorker.toString()})();`],
      { type: 'application/javascript' }
    );
    const workerTimer = new Worker(URL.createObjectURL(blob));
    return new Observable(subscriber => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
      const eventHandler = event => {
        subscriber.next(event.data);
      };

      workerTimer.addEventListener('message', eventHandler);
      workerTimer.postMessage('on');

      return function unsubscribe() {
        workerTimer.postMessage('off');
        workerTimer.removeEventListener('message', eventHandler);
      };
    });
  }
  return interval(1000);
}
