import {
  Component, Input, OnDestroy, OnInit, ViewChild
} from '@angular/core';
import { SysCheckDataService } from '../sys-check-data.service';
import { BackendService } from '../backend.service';
import {
  DetectedNetworkInformation,
  NetworkRating, NetworkRequestTestResult
} from '../sys-check.interfaces';
import { TcSpeedChartComponent, TcSpeedChartSettings } from './tc-speed-chart.component';

@Component({
    styleUrls: ['../sys-check.component.css'],
    templateUrl: './network-check.component.html',
    standalone: false
})

export class NetworkCheckComponent implements OnInit, OnDestroy {
  constructor(
    public sysCheckDataService: SysCheckDataService,
    private backendService: BackendService
  ) {}

  @ViewChild('downloadChart', { static: true }) downloadPlotter!: TcSpeedChartComponent;
  @ViewChild('uploadChart', { static: true }) uploadPlotter!: TcSpeedChartComponent;

  @Input() measureNetwork: boolean = false;
  private networkStatsDownload: number[] = [];
  private networkStatsUpload: number[] = [];

  networkRating: NetworkRating = {
    downloadRating: 'N/A',
    uploadRating: 'N/A',
    overallRating: 'N/A'
  };

  detectedNetworkInformation: DetectedNetworkInformation = {
    downlinkMegabitPerSecond: null,
    effectiveNetworkType: null,
    roundTripTimeMs: null,
    networkType: null,
    available: false
  };

  private static humanReadableMilliseconds =
    (milliseconds: number): string => `${(milliseconds / 1000).toString()} sec`;

  private static calculateAverageSpeedBytePerSecond(testResults: Array<NetworkRequestTestResult>): number {
    return testResults.reduce((sum, result) => sum + (result.size / (result.duration / 1000)), 0) / testResults.length;
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.sysCheckDataService.setNewCurrentStep('n');
      if (this.sysCheckDataService.checkConfig && this.sysCheckDataService.networkReports.length === 0) {
        this.startCheck();
      }
      this.readExperimentalNetworkInfosIfAvailable();
    });
  }

  private readExperimentalNetworkInfosIfAvailable(): void {
    //  lib.dom.d.ts doesn't not have those types atm
    interface NetworkInformation {
      downlink?: number;
      effectiveType?: string;
      rtt?: number
      saveData?: boolean;
      type?: string;
    }
    type ExtendedNavigator = Navigator & {
      connection?: NetworkInformation;
      mozConnection?: NetworkInformation;
      webkitConnection?: NetworkInformation;
    };
    const connection =
      (navigator as ExtendedNavigator).connection ||
      (navigator as ExtendedNavigator).mozConnection ||
      (navigator as ExtendedNavigator).webkitConnection;
    if (connection) {
      this.detectedNetworkInformation = {
        available: true,
        downlinkMegabitPerSecond: connection.downlink || null,
        effectiveNetworkType: connection.effectiveType || null,
        roundTripTimeMs: connection.rtt || null,
        networkType: connection.type || null
      };
    }
  }

  startCheck(): void {
    this.sysCheckDataService.networkReports = [];
    this.sysCheckDataService.networkCheckStatus = {
      done: false,
      message: 'Netzwerk-Analyse wird gestartet',
      avgUploadSpeedBytesPerSecond: -1,
      avgDownloadSpeedBytesPerSecond: -1
    };

    this.plotPrepare(true);
    this.plotPrepare(false);

    this.loopBenchmarkSequence(true)
      .then(() => this.loopBenchmarkSequence(false))
      .then(() => this.reportResults())
      .catch(() => this.reportResults(true));
  }

  private plotPrepare(isDownloadPart: boolean) {
    if (!this.sysCheckDataService.checkConfig) {
      return;
    }
    const testSizes = (isDownloadPart) ?
      this.sysCheckDataService.checkConfig.downloadSpeed.sequenceSizes :
      this.sysCheckDataService.checkConfig.uploadSpeed.sequenceSizes;
    const plotterSettings: TcSpeedChartSettings = {
      axisColor: '',
      gridColor: '',
      labelFont: '',
      css: 'border: 1px solid silver; margin: 2px; width: 100%;',
      width: 800,
      height: 240,
      labelPadding: 4,
      xAxisMaxValue: 16 + Math.max(...testSizes),
      xAxisMinValue: Math.min(...testSizes),
      yAxisMaxValue: (isDownloadPart) ? 1200 : 5000,
      yAxisMinValue: (isDownloadPart) ? 20 : 0,
      xAxisStepSize: 4,
      yAxisStepSize: (isDownloadPart) ? 50 : 100,
      lineWidth: 5,
      xProject: (x: number) => ((x === 0) ? 0 : Math.sign(x) * Math.log2(Math.abs(x))),
      yProject: (y: number) => ((y === 0) ? 0 : Math.sign(y) * Math.log(Math.abs(y))),
      xAxisLabels: (x: number) => ((testSizes.indexOf(x) > -1) ? this.humanReadableBytes(x, false, true) : ''),
      yAxisLabels: (y: number, i: number) => ((i < 10) ? NetworkCheckComponent.humanReadableMilliseconds(y) : ' ')
    };
    if (isDownloadPart) {
      this.downloadPlotter.reset(plotterSettings);
    } else {
      this.uploadPlotter.reset(plotterSettings);
    }
  }

  private loopBenchmarkSequence(isDownloadPart: boolean): Promise<void> {
    if (isDownloadPart) {
      this.sysCheckDataService.networkCheckStatus.message = `Benchmark Loop Download nr.: ${this.networkStatsDownload.length}`;
    } else {
      this.sysCheckDataService.networkCheckStatus.message = `Benchmark Loop Upload nr.: ${this.networkStatsUpload.length}`;
    }
    const benchmarkDefinition = (isDownloadPart) ? this.sysCheckDataService.checkConfig.downloadSpeed : this.sysCheckDataService.checkConfig.uploadSpeed;
    return new Promise((resolve, reject) => {
      this.benchmarkSequence(isDownloadPart)
        .then(results => {
          const averageBytesPerSecond = NetworkCheckComponent.calculateAverageSpeedBytePerSecond(results);
          const averageOfPreviousLoops = this.getAverageNetworkStat(isDownloadPart);
          const errors = results.reduce((a, r) => a + ((r.error !== null) ? 1 : 0), 0);
          let statsLength;
          if (isDownloadPart) {
            this.networkStatsDownload.push(averageBytesPerSecond);
            statsLength = this.networkStatsDownload.length;
          } else {
            this.networkStatsUpload.push(averageBytesPerSecond);
            statsLength = this.networkStatsUpload.length;
          }
          this.showBenchmarkSequenceResults(isDownloadPart, this.getAverageNetworkStat(isDownloadPart), results);

          if (errors > benchmarkDefinition.maxErrorsPerSequence) {
            console.warn('network check: some errors occurred during', results);
            return reject(errors);
          }

          if (statsLength > benchmarkDefinition.maxSequenceRepetitions) {
            console.warn(`network check: looped ${benchmarkDefinition.maxSequenceRepetitions} times, 
              but could not get reliable average`);
            return resolve();
          }

          if (
            (statsLength < 3) ||
            (Math.abs(averageOfPreviousLoops - averageBytesPerSecond) > benchmarkDefinition.maxDevianceBytesPerSecond)
          ) {
            return this.loopBenchmarkSequence(isDownloadPart).then(resolve).catch(reject);
          }

          return resolve();
        });
    });
  }

  private getAverageNetworkStat(isDownloadPart: boolean): number {
    return (isDownloadPart) ?
      (this.networkStatsDownload.reduce((a, x) => a + x, 0) / this.networkStatsDownload.length) :
      (this.networkStatsUpload.reduce((a, x) => a + x, 0) / this.networkStatsUpload.length);
  }

  private benchmarkSequence(isDownloadPart: boolean): Promise<Array<NetworkRequestTestResult>> {
    const benchmarkDefinition = (isDownloadPart) ? this.sysCheckDataService.checkConfig.downloadSpeed : this.sysCheckDataService.checkConfig.uploadSpeed;

    return benchmarkDefinition.sequenceSizes.reduce(
      (sequence, testSize) => sequence
        .then(results => this.benchmark(isDownloadPart, testSize)
          .then(result => {
            results.push(result);
            return results;
          })),
      Promise.resolve(new Array<NetworkRequestTestResult>())
    );
  }

  private benchmark(isDownloadPart: boolean, requestSize: number): Promise<NetworkRequestTestResult> {
    const testRound = (isDownloadPart) ? (this.networkStatsDownload.length + 1) : (this.networkStatsUpload.length + 1);
    const testPackage = this.humanReadableBytes(requestSize);
    if (isDownloadPart) {
      this.sysCheckDataService.networkCheckStatus.message =
        `Downloadgeschwindigkeit Testrunde ${testRound} - Testgröße: ${testPackage} bytes`;
      return this.backendService.benchmarkDownloadRequest(requestSize);
    }
    this.sysCheckDataService.networkCheckStatus.message = `Uploadgeschwindigkeit Testrunde ${testRound} - Testgröße: ${testPackage})`;
    return this.backendService.benchmarkUploadRequest(requestSize);
  }

  // eslint-disable-next-line max-len
  private showBenchmarkSequenceResults(isDownloadPart: boolean, avgBytesPerSecond: number, results: Array<NetworkRequestTestResult> = []) {
    if (isDownloadPart) {
      this.sysCheckDataService.networkCheckStatus.avgDownloadSpeedBytesPerSecond = avgBytesPerSecond;
    } else {
      this.sysCheckDataService.networkCheckStatus.avgUploadSpeedBytesPerSecond = avgBytesPerSecond;
    }

    this.plotStatistics(isDownloadPart, results);
  }

  private plotStatistics(isDownloadPart: boolean, benchmarkSequenceResults: Array<NetworkRequestTestResult>) {
    const datapoints: Array<[number, number]> = benchmarkSequenceResults
      .filter(measurement => (measurement.error === null))
      .map(measurement => ([measurement.size, measurement.duration]));

    if (isDownloadPart) {
      this.downloadPlotter.plotData(datapoints, null, 'dots');
    } else {
      this.uploadPlotter.plotData(datapoints, null, 'dots');
    }

    return benchmarkSequenceResults;
  }

  private reportResults(isInstable: boolean = false): void {
    if (!isInstable) {
      this.updateNetworkRating();
    } else {
      this.networkRating = {
        downloadRating: 'unstable',
        uploadRating: 'unstable',
        overallRating: 'unstable'
      };
    }
    this.sysCheckDataService.networkCheckStatus.message = 'Die folgenden Netzwerkeigenschaften wurden festgestellt:';
    this.sysCheckDataService.networkCheckStatus.done = true;

    const downAvg = this.getAverageNetworkStat(true);
    const upAvg = this.getAverageNetworkStat(false);

    this.sysCheckDataService.networkReports.push({
      id: 'nw-download',
      type: 'network',
      label: 'Downloadgeschwindigkeit',
      warning: false,
      value: `${this.humanReadableBytes(downAvg, true)}/s`
    });
    this.sysCheckDataService.networkReports.push({
      id: 'nw-download-needed',
      type: 'network',
      label: 'Downloadgeschwindigkeit benötigt',
      warning: false,
      value: `${this.humanReadableBytes(this.sysCheckDataService.checkConfig.downloadSpeed.min, true)}/s`
    });
    this.sysCheckDataService.networkReports.push({
      id: 'nw-download-evaluation',
      type: 'network',
      label: 'Downloadbewertung',
      warning: this.networkRating.downloadRating === 'insufficient',
      value: this.networkRating.downloadRating
    });
    this.sysCheckDataService.networkReports.push({
      id: 'nw-upload',
      type: 'network',
      label: 'Uploadgeschwindigkeit',
      warning: false,
      value: `${this.humanReadableBytes(upAvg, true)}/s`
    });
    this.sysCheckDataService.networkReports.push({
      id: 'nw-upload-needed',
      type: 'network',
      label: 'Uploadgeschwindigkeit benötigt',
      warning: false,
      value: `${this.humanReadableBytes(this.sysCheckDataService.checkConfig.uploadSpeed.min, true)}/s`
    });
    this.sysCheckDataService.networkReports.push({
      id: 'nw-upload-evaluation',
      type: 'network',
      label: 'Uploadbewertung',
      warning: this.networkRating.uploadRating === 'insufficient',
      value: this.networkRating.uploadRating
    });
    this.sysCheckDataService.networkReports.push({
      id: 'nw-overall',
      type: 'network',
      label: 'Gesamtbewertung',
      warning: this.networkRating.overallRating === 'insufficient',
      value: this.networkRating.overallRating
    });

    if (this.detectedNetworkInformation.available) {
      if (this.detectedNetworkInformation.roundTripTimeMs) {
        this.sysCheckDataService.networkReports.push({
          id: 'bnni-roundtrip',
          type: 'network',
          label: 'RoundTrip in Ms',
          warning: false,
          value: this.detectedNetworkInformation.roundTripTimeMs.toString()
        });
      }
      if (this.detectedNetworkInformation.effectiveNetworkType) {
        this.sysCheckDataService.networkReports.push({
          id: 'bnni-effective-network-type',
          type: 'network',
          label: 'Netzwerktyp nach Leistung',
          warning: false,
          value: this.detectedNetworkInformation.effectiveNetworkType
        });
      }
      if (this.detectedNetworkInformation.networkType) {
        this.sysCheckDataService.networkReports.push({
          id: 'bnni-network-type',
          type: 'network',
          label: 'Netzwerktyp',
          warning: false,
          value: this.detectedNetworkInformation.networkType
        });
      }
      if (this.detectedNetworkInformation.downlinkMegabitPerSecond) {
        this.sysCheckDataService.networkReports.push({
          id: 'bnni-downlink',
          type: 'network',
          label: 'Downlink MB/s',
          warning: false,
          value: this.detectedNetworkInformation.downlinkMegabitPerSecond.toString()
        });
      }
    } else {
      this.sysCheckDataService.networkReports.push({
        id: 'bnni-fail',
        type: 'network',
        label: 'Netzwerkprofil des Browsers',
        warning: true,
        value: 'nicht verfügbar'
      });
    }
  }

  updateNetworkRating(): void {
    const networkRating: NetworkRating = {
      downloadRating: 'N/A',
      uploadRating: 'N/A',
      overallRating: 'N/A'
    };

    const nd = {
      avgDownloadSpeed: this.getAverageNetworkStat(true),
      avgUploadSpeed: this.getAverageNetworkStat(false)
    };

    // the ratings are calculated individually, by a "how low can you go" approach

    networkRating.downloadRating = 'good';
    if (nd.avgDownloadSpeed < this.sysCheckDataService.checkConfig.downloadSpeed.good) {
      networkRating.downloadRating = 'ok';
    }
    if (nd.avgDownloadSpeed < this.sysCheckDataService.checkConfig.downloadSpeed.min) {
      networkRating.downloadRating = 'insufficient';
    }

    networkRating.uploadRating = 'good';
    if (nd.avgUploadSpeed < this.sysCheckDataService.checkConfig.uploadSpeed.good) {
      networkRating.uploadRating = 'ok';
    }
    if (nd.avgUploadSpeed < this.sysCheckDataService.checkConfig.uploadSpeed.min) {
      networkRating.uploadRating = 'insufficient';
    }

    networkRating.overallRating = 'good';
    if (networkRating.downloadRating === 'ok' || networkRating.uploadRating === 'ok') {
      networkRating.overallRating = 'ok';
    }

    if (networkRating.downloadRating === 'insufficient' || networkRating.uploadRating === 'insufficient') {
      networkRating.overallRating = 'insufficient';
    }

    this.networkRating = networkRating;
  }

  // eslint-disable-next-line class-methods-use-this
  humanReadableBytes(bytes: number, useBits: boolean = false, base1024: boolean = false): string {
    const suffix = {
      B: {
        1000: ['B', 'kB', 'MB', 'GB', 'TB'],
        1024: ['B', 'KiB', 'MiB', 'GiB', 'TiB']
      },
      bit: {
        1000: ['bit', 'kbit', 'Mbit', 'Gbit', 'Tbit'],
        1024: ['bit', 'kibit', 'Mibit', 'Gibit', 'Tibit']
      }
    };
    if (useBits) {
      // eslint-disable-next-line no-param-reassign
      bytes *= 8;
    }
    const base = base1024 ? 1024 : 1000;
    const i = Math.floor(Math.log(bytes) / Math.log(base));
    return !bytes && '0' || (bytes / Math.pow(base, i)).toFixed(2) + ' ' + suffix[!useBits ? 'B' : 'bit'][base][i];
  }

  // eslint-disable-next-line class-methods-use-this
  ngOnDestroy(): void {
    // TODO: destroy network testing promises
  }
}
