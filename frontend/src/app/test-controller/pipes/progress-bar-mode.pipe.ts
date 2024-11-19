import { Pipe, PipeTransform } from '@angular/core';
import { LoadingProgress } from '../interfaces/test-controller.interfaces';

@Pipe({
  name: 'progressbarmode'
})
export class PogressBarModePipe implements PipeTransform {
  // eslint-disable-next-line class-methods-use-this
  transform(loadingProgress: LoadingProgress): 'determinate' | 'indeterminate' | 'buffer' | 'query' {
    if (loadingProgress.progress === 'UNKNOWN') {
      return 'indeterminate';
    }
    if (loadingProgress.progress === 'PENDING') {
      return 'query';
    }
    return 'determinate';
  }
}
