import { Injectable } from '@angular/core';
import { coerce, gte, satisfies } from 'semver';
import { ResolvedUserAgent, resolveUserAgent } from 'browserslist-useragent';
import UAParser from 'ua-parser-js';
// eslint-disable-next-line import/no-relative-packages
import browsersJson from '../../../../../../definitions/browsers.json';

@Injectable({
  providedIn: 'root'
})
export class UserAgentService {
  // see https://github.com/ai/browserslist#browsers
  static browserNameMap: { [browserlistId: string]: string } = {
    bb: 'BlackBerry',
    and_chr: 'Chrome',
    ChromeAndroid: 'Chrome',
    FirefoxAndroid: 'Firefox',
    ff: 'Firefox',
    ie_mob: 'ExplorerMobile',
    ie: 'Explorer',
    and_ff: 'Firefox',
    ios_saf: 'iOS',
    op_mini: 'OperaMini',
    op_mob: 'OperaMobile',
    and_qq: 'QQAndroid',
    and_uc: 'UCAndroid'
  };

  // we can't use matchesUA from browserslist-useragent because it expects a set of browserslist-queries not an already
  // parsed list of supported browsers. We parse our list once every release to make it more efficient.
  // Apart from that, this function is very similar and inspired by matchesUA.
  // TODO wrap put every usage of userAgent and UAparser into this service
  static userAgentMatches(
    userAgent: ResolvedUserAgent,
    browsersList: string[] = browsersJson.browsers,
    allowHigherVersions: boolean = true
  ): boolean {
    const parsedBrowsers = UserAgentService.parseBrowsersList(browsersList);

    return parsedBrowsers.some(browser => {
      if (!userAgent.family) return false;
      if (!userAgent.version) return false;
      if (!browser.version) return false;

      const allowHigher = allowHigherVersions ? 'major' : null;

      return (browser.family.toLowerCase() === userAgent.family.toLocaleLowerCase() &&
        UserAgentService.versionSatisfies(userAgent.version, browser.version, allowHigher)
      );
    });
  }

  // inspired by resolveUserAgent from browserslist-useragent which is not publicly exported unfortunately
  static resolveUserAgent(UAstring: string = window.navigator.userAgent): ResolvedUserAgent {
    const parsedUA = UAParser(UAstring).browser;

    // https://bugzilla.mozilla.org/show_bug.cgi?id=1805967
    if ((parsedUA.name === 'Firefox') && UAstring.match(/rv:109/)) {
      // eslint-disable-next-line no-param-reassign
      UAstring = UAstring.replace(/rv:109/, `rv:${parsedUA.version}`);
    }

    // https://news.ycombinator.com/item?id=20030340
    if ((parsedUA.name === 'Edge') && UAstring.match(/Edg\//)) {
      // eslint-disable-next-line no-param-reassign
      UAstring = UAstring.replace(/Edg\//, 'Edge/');
    }
    return resolveUserAgent(UAstring);
  }

  static parseBrowsersList(simpleBrowserList: string[]): { family: string; version: string }[] {
    return simpleBrowserList
      .map(browser => {
        const [family, version] = browser.split(' ');
        return { family: UserAgentService.browserNameMap[family] ?? family, version };
      });
  }

  // inspired by compareBrowserSemvers from browserslist-useragent which is not publicly exported unfortunately
  static versionSatisfies(
    testSemver: string,
    constraintSemver: string,
    allowHigher: 'patch' | 'minor' | 'major' | null = null
  ): boolean {
    const semverify = (version: string) => {
      if (!version) {
        return null;
      }
      const coerced = coerce(version, { loose: true });
      if (!coerced) {
        return null;
      }
      return coerced.version;
    };

    const semverifiedA = semverify(testSemver);
    const semverifiedB = semverify(constraintSemver);
    if (!semverifiedA || !semverifiedB) {
      return false;
    }
    let referenceVersion = semverifiedB;
    if (allowHigher === 'patch') {
      referenceVersion = `~${semverifiedB}`;
    }
    if (allowHigher === 'minor') {
      referenceVersion = `^${semverifiedB}`;
    }
    if (allowHigher === 'major') {
      return gte(semverifiedA, semverifiedB);
    }
    return satisfies(semverifiedA, referenceVersion);
  }

  static outputWithOs(UAstring: string = window.navigator.userAgent): string {
    const browser = this.resolveUserAgent(UAstring);
    const os = UAParser(UAstring).os;

    return `${os.name}/${os.version} ${browser.family}/${browser.version}`;
  }
}
