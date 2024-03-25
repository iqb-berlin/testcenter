import { UserAgentService } from '../../shared.module';

const supportedBrowsers = [
  'chrome 121', 'chrome 120', 'firefox 122', 'firefox 121',
  'firefox 115', 'ios_saf 17.3', 'ios_saf 17.2', 'safari 17.3', 'safari 17.2'
];

const UASamples = {
  supported: {
    currentIpad: 'Mozilla/5.0 (iPad; CPU OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/122.0.2365.56 Version/17.0 Mobile/15E148 Safari/604.1',
    currentFirefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
    currentChrome: 'Mozilla/5.0 (Windows NT 5.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.9.3281.78 Safari/537.36',
    FirefoxLTSWindows: 'Mozilla/5.0 (Windows NT 6.3; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0'
  },
  outdated: {
    oldIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.7 Mobile/15E148 Safari/604.1',
    oldFirefox: 'Mozilla/5.0 (Android 13; Mobile; rv:102.0) Gecko/102.0 Firefox/102.0',
    unknownBrowserVivaldi: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36 Vivaldi/3.7',
    browserFromTheGoodTimes: 'NCSA Mosaic/3.0 (Windows 95)',
    nightmareBrowser: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; Touch; rv:11.0) like Gecko'
  },
  future: {
    newIpad: 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    futureOSX: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.234 Safari/537.36'
  }
};

describe('UserAgentService', () => {
  describe('.versionSatisfies', () => {
    it('should compare SemVers correctly', () => {
      expect(UserAgentService.versionSatisfies('120.0.0', '120', 'major')).toBeTrue();
      expect(UserAgentService.versionSatisfies('120.0.5', '120', 'major')).toBeTrue();
      expect(UserAgentService.versionSatisfies('120.5.0', '120', 'major')).toBeTrue();
      expect(UserAgentService.versionSatisfies('121.0.0', '120', 'major')).toBeTrue();
      expect(UserAgentService.versionSatisfies('119.5.0', '120', 'major')).toBeFalse();
      expect(UserAgentService.versionSatisfies('119.0.0', '120', 'major')).toBeFalse();

      expect(UserAgentService.versionSatisfies('120.0.0', '120', 'minor')).toBeTrue();
      expect(UserAgentService.versionSatisfies('120.0.5', '120', 'minor')).toBeTrue();
      expect(UserAgentService.versionSatisfies('120.5.0', '120', 'minor')).toBeTrue();
      expect(UserAgentService.versionSatisfies('121.0.0', '120', 'minor')).toBeFalse();
      expect(UserAgentService.versionSatisfies('119.5.0', '120', 'minor')).toBeFalse();
      expect(UserAgentService.versionSatisfies('119.0.0', '120', 'minor')).toBeFalse();

      expect(UserAgentService.versionSatisfies('120.0.0', '120', 'patch')).toBeTrue();
      expect(UserAgentService.versionSatisfies('120.0.5', '120', 'patch')).toBeTrue();
      expect(UserAgentService.versionSatisfies('120.5.0', '120', 'patch')).toBeFalse();
      expect(UserAgentService.versionSatisfies('121.0.0', '120', 'patch')).toBeFalse();
      expect(UserAgentService.versionSatisfies('119.5.0', '120', 'patch')).toBeFalse();
      expect(UserAgentService.versionSatisfies('119.0.0', '120', 'patch')).toBeFalse();

      expect(UserAgentService.versionSatisfies('120.0.0', '120')).toBeTrue();
      expect(UserAgentService.versionSatisfies('120.0.5', '120')).toBeFalse();
      expect(UserAgentService.versionSatisfies('120.5.0', '120')).toBeFalse();
      expect(UserAgentService.versionSatisfies('121.0.0', '120')).toBeFalse();
      expect(UserAgentService.versionSatisfies('119.5.0', '120')).toBeFalse();
      expect(UserAgentService.versionSatisfies('119.0.0', '120')).toBeFalse();
    });
  });
  describe('.userAgentMatches', () => {
    it('should accept supported browsers and newer ones', () => {
      Object.entries(UASamples.supported)
        .forEach(entry => {
          expect(
            UserAgentService.userAgentMatches(
              UserAgentService.resolveUserAgent(entry[1]),
              supportedBrowsers
            )
          )
            .withContext(entry[0])
            .toBeTrue();
        });
    });
    it('should reject future browsers when allowNewVersion is set to false', () => {
      Object.entries(UASamples.future)
        .forEach(entry => {
          expect(
            UserAgentService.userAgentMatches(
              UserAgentService.resolveUserAgent(entry[1]),
              supportedBrowsers,
              false
            )
          )
            .withContext(entry[0])
            .toBeFalse();
        });
    });
  });
  it('should reject outdated browsers', () => {
    Object.entries(UASamples.outdated)
      .forEach(entry => {
        expect(
          UserAgentService.userAgentMatches(
            UserAgentService.resolveUserAgent(entry[1]),
            supportedBrowsers
          )
        )
          .withContext(entry[0])
          .toBeFalse();
      });
  });
});
