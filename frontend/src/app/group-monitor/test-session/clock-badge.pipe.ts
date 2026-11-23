import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomtextPipe } from '../../shared/pipes/customtext/customtext.pipe';

interface ClockBadge {
  icon: 'timer' | 'timer_off';
  tooltip$: Observable<string>;
}

@Pipe({ name: 'clockBadge' })
export class ClockBadgePipe implements PipeTransform {
  constructor(private customtext: CustomtextPipe) {}

  transform(timeLeft: number | null | undefined, limit: number): ClockBadge {
    if (timeLeft == null) {
      return {
        icon: 'timer',
        tooltip$: this.customtext.transform('Zeitgesteuerter Block: %s Minute(n)', 'gm_timemax_tooltip', limit)
      };
    }

    if (timeLeft === 0) {
      return {
        icon: 'timer_off',
        tooltip$: this.customtext.transform('Zeit abgelaufen', 'gm_timeup_tooltip')
      };
    }

    return {
      icon: timeLeft < 0 ? 'timer_off' : 'timer',
      tooltip$: this.customtext.transform('Verbleibende Zeit: %s/%s', 'gm_timeleft_tooltip', Math.abs(timeLeft), limit)
    };
  }
}
