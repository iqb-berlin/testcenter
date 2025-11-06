import { Component, ElementRef, ViewChild } from '@angular/core';

export interface TcSpeedChartSettings {
  lineWidth: number;
  css: string;
  height: number;
  width: number;
  gridColor: string;
  axisColor: string;
  labelFont: string;
  labelPadding: number;
  xAxisMaxValue: number;
  xAxisMinValue: number;
  yAxisMaxValue: number;
  yAxisMinValue: number;
  xAxisStepSize: number;
  yAxisStepSize: number;
  xAxisLabels: (x: number, col: number) => string;
  yAxisLabels: (y: number, col: number) => string;
  xProject(x: number): number;
  yProject(y: number): number;
}

@Component({
    selector: 'tc-speed-chart',
    template: '<canvas #speedChart></canvas>',
    standalone: false
})
export class TcSpeedChartComponent {
  @ViewChild('speedChart') private canvas!: ElementRef;
  private context: CanvasRenderingContext2D | null = null;
  private xScale: number = -1;
  private yScale: number = -1;

  private config: TcSpeedChartSettings = {
    css: 'border: 1px solid black',
    lineWidth: 5,
    width: 800,
    height: 400,
    gridColor: 'silver',
    axisColor: 'red',
    labelFont: '20 pt Verdana',
    labelPadding: 4,
    xAxisMaxValue: 200,
    xAxisMinValue: -10,
    yAxisMaxValue: 300,
    yAxisMinValue: -10,
    xAxisStepSize: 20,
    yAxisStepSize: 10,
    xAxisLabels: x => Math.round(x).toString(10),
    yAxisLabels: y => Math.round(y).toString(10),
    xProject: x => x,
    yProject: y => y
  };

  reset(config: TcSpeedChartSettings): void {
    this.context = this.canvas.nativeElement.getContext('2d');
    this.config = { ...this.config, ...config };
    this.canvas.nativeElement.setAttribute('style', this.config.css);
    this.canvas.nativeElement.setAttribute('height', `${this.config.height.toString()}px`);
    // this.canvas.setAttribute('width', this.config.width);

    if (!this.context) {
      throw new Error('context not found');
    }
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.context.font = this.config.labelFont;

    const xAxisMinValue = this.config.xProject(this.config.xAxisMinValue);
    const xAxisMaxValue = this.config.xProject(this.config.xAxisMaxValue);
    const yAxisMinValue = this.config.yProject(this.config.yAxisMinValue);
    const yAxisMaxValue = this.config.yProject(this.config.yAxisMaxValue);

    this.xScale = this.canvas.nativeElement.width / (xAxisMaxValue - xAxisMinValue);
    this.yScale = this.canvas.nativeElement.height / (yAxisMaxValue - yAxisMinValue);

    this.drawGridColumns();
    this.drawGridRows();

    this.context.lineWidth = this.config.lineWidth;
  }

  plotData(dataPoints: [number, number][], color: string | null = null, style: 'line' | 'dots' = 'line'): void {
    if (!dataPoints.length) {
      return;
    }
    if (!this.context) {
      throw new Error('context not found');
    }
    const coordinates = this.dataPointsToCoordinates(dataPoints);
    const newColor = color || TcSpeedChartComponent.randomColor();
    const oldStrokeColor = this.context.strokeStyle;
    const oldFillColor = this.context.fillStyle;
    this.context.strokeStyle = newColor;
    this.context.fillStyle = newColor;
    if (style === 'line') {
      this.paintLine(coordinates);
    }
    if (style === 'dots') {
      this.paintDots(coordinates);
    }
    this.context.strokeStyle = oldStrokeColor;
    this.context.fillStyle = oldFillColor;
  }

  private dataPointsToCoordinates(dataPoints: Array<[number, number]>): Array<[number, number]> {
    return dataPoints
      .map((xy): [number, number] => [ // apply projection
        this.config.xProject(xy[0]),
        this.config.yProject(xy[1])
      ])
      .map((xy): [number, number] => [ // apply viewport
        xy[0] - this.config.xProject(this.config.xAxisMinValue),
        xy[1] - this.config.yProject(this.config.yAxisMinValue)
      ])
      .map((xy): [number, number] => [ // scale to image size
        xy[0] * this.xScale,
        this.canvas.nativeElement.height - xy[1] * this.yScale
      ]);
  }

  private paintLine(plotCoordinates: Array<[number, number]>) {
    this.context?.beginPath();
    this.context?.moveTo(plotCoordinates[0][0], plotCoordinates[0][1]);
    plotCoordinates.forEach(xy => {
      this.context?.lineTo(xy[0], xy[1]);
    });
    this.context?.stroke();
  }

  private paintDots(plotCoordinates: Array<[number, number]>) {
    plotCoordinates.forEach(xy => {
      this.context?.beginPath();
      this.context?.arc(xy[0], xy[1], this.config.lineWidth, 0, 2 * Math.PI);
      this.context?.fill();
    });
  }

  private drawGridColumns() {
    const firstCol = Math.floor(this.config.xAxisMinValue / this.config.xAxisStepSize) * this.config.xAxisStepSize;
    for (
      let x = firstCol, count = 1;
      x < this.config.xAxisMaxValue;
      // eslint-disable-next-line no-plusplus
      x = firstCol + count++ * this.config.xAxisStepSize
    ) {
      const transformedX = this.config.xProject(x);
      const scaledX = this.xScale * (transformedX - this.config.xProject(this.config.xAxisMinValue));
      const label = this.config.xAxisLabels(x, count);
      if (label === '') {
        // eslint-disable-next-line no-continue
        continue;
      }
      if (this.context) {
        this.context.fillText(label, scaledX, this.canvas.nativeElement.height - this.config.labelPadding);
        this.context.strokeStyle = (x === 0) ? this.config.axisColor : this.config.gridColor;
        this.context.beginPath();
        this.context.moveTo(scaledX, 0);
        this.context.lineTo(scaledX, this.canvas.nativeElement.height);
        this.context.stroke();
      }
    }
  }

  private drawGridRows(): void {
    const firstRow = Math.floor(this.config.yAxisMinValue / this.config.yAxisStepSize) * this.config.yAxisStepSize;
    for (
      let y = firstRow, count = 1;
      y < this.config.yAxisMaxValue;
      // eslint-disable-next-line no-plusplus
      y = firstRow + count++ * this.config.yAxisStepSize
    ) {
      const transformedY = this.config.yProject(y);
      const scaledY =
        this.canvas.nativeElement.height - this.yScale * (transformedY - this.config.yProject(this.config.yAxisMinValue));
      const label = this.config.yAxisLabels(y, count);
      if (label === '') {
        // eslint-disable-next-line no-continue
        continue;
      }
      if (this.context) {
        this.context.fillText(label, this.config.labelPadding, scaledY);
        this.context.strokeStyle = (y === 0) ? this.config.axisColor : this.config.gridColor;
        this.context.beginPath();
        this.context.moveTo(0, scaledY);
        this.context.lineTo(this.canvas.nativeElement.width, scaledY);
        this.context.stroke();
      }
    }
  }

  // eslint-disable-next-line max-len
  private static randomColor =
    (): string => `rgb(${(new Array(3).fill(0).map(() => Math.round(256 * Math.random())).join(', '))})`;
}
