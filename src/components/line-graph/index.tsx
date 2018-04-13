import * as React from 'react';
import './line-graph.scss';
import * as moment from 'moment';

export type Point = [number, number, number];

interface Props {
  id: string;
  data: Point[];
  width?: number;
  height?: number;
}

interface State {
  hoverLocation: number | null;
  closestPoint: Point | null;
}

export class LineGraph extends React.Component<Props, State> {
  public static defaultProps: Partial<Props> = {
    width: 300,
    height: 150
  };

  public state = {
    hoverLocation: null,
    closestPoint: null
  };

  public getX = () => {
    const { data } = this.props;
    return {
      min: data[0][0],
      max: data[data.length - 1][0]
    };
  };
  public getY = () => {
    const { data, height } = this.props;
    // (+/- svgHeight! * 0.015) is appended to add a bit of padding to the graph
    return {
      min: data.reduce((min, p) => (p[1] < min ? p[1] : min), data[0][1]) - height! * 0.025,
      max: data.reduce((max, p) => (p[1] > max ? p[1] : max), data[0][1]) + height! * 0.025
    };
  };

  public getSvgX = (x: number) => {
    const { width } = this.props;
    const X = this.getX();
    return x / X.max * width!;
  };
  public getSvgY = (y: number) => {
    const { height } = this.props;
    const Y = this.getY();
    return (height! * Y.max - height! * y) / (Y.max - Y.min);
  };

  public makePath = () => {
    const { data } = this.props;
    let pathD = 'M ' + this.getSvgX(data[0][0]) + ' ' + this.getSvgY(data[0][1]) + ' ';
    pathD += data.map((point: Point) => {
      const x = this.getSvgX(point[0]);
      const y = this.getSvgY(point[1]);
      return 'L ' + x + ' ' + y + ' ';
    });

    return <path className="linechart-path" d={pathD} />;
  };

  public makeArea = () => {
    const { data } = this.props;
    let pathD = 'M ' + this.getSvgX(data[0][0]) + ' ' + this.getSvgY(data[0][1]) + ' ';

    pathD += data
      .map(point => {
        return 'L ' + this.getSvgX(point[0]) + ' ' + this.getSvgY(point[1]) + ' ';
      })
      .join('');

    const x = this.getX();
    const y = this.getY();
    pathD +=
      'L ' +
      this.getSvgX(x.max) +
      ' ' +
      this.getSvgY(y.min) +
      ' ' +
      'L ' +
      this.getSvgX(x.min) +
      ' ' +
      this.getSvgY(y.min) +
      ' ';

    return <path className="linechart-area" d={pathD} style={{ fill: 'url(#Gradient)' }} />;
  };

  public getCoords = (e: any) => {
    const { id, width, data } = this.props;
    const svgLocation = document.getElementById(id)!.getBoundingClientRect();
    const adjustment = (svgLocation.width - width!) / 2; //takes padding into consideration
    const hoverLocation = e.clientX - svgLocation.left - adjustment;
    const dataToWidthRatio = data.length / width!;
    const closestPoint = data[Math.round(hoverLocation * dataToWidthRatio)];

    this.setState({
      hoverLocation,
      closestPoint
    });
  };

  public makeLine = (hoverLocation: number) => {
    const { height } = this.props;
    return (
      <line className="linechart-line" x1={hoverLocation} y1={0} x2={hoverLocation} y2={height} />
    );
  };

  public makeActivePoint = (closestPoint: Point, hoverLocation: number) => (
    <circle
      className="linechart-point"
      r="4"
      cx={hoverLocation}
      cy={this.getSvgY(closestPoint[1])}
    />
  );

  public getDate = (point: Point) => {
    return moment(point[2]).format('MMM DD, LT');
  };

  public render() {
    const { width, height, id } = this.props;
    const { hoverLocation, closestPoint } = this.state;

    return (
      <div className="linechart">
        {closestPoint && (
          <>
            <div
              className="linechart-tooltip top"
              style={{ transform: `translateX(calc(${hoverLocation + 'px'} - 50%))` }}
            >
              <p>
                {(closestPoint as Point)[1].toLocaleString('us-EN', {
                  style: 'currency',
                  currency: 'USD'
                })}
              </p>
            </div>
            <div
              className="linechart-tooltip bottom"
              style={{
                transform: `translate(calc(${hoverLocation + 'px'} - 50%), 50%)`,
                bottom: `${0 - height! * 0.025}`
              }}
            >
              <p>{this.getDate(closestPoint)}</p>
            </div>
          </>
        )}
        <svg
          id={id}
          className="linechart-svg"
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          onMouseMove={this.getCoords}
        >
          <defs>
            <linearGradient id="Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#77BDF7" stopOpacity={0.75} />
              <stop offset="100%" stopColor="#77BDF7" stopOpacity={0.25} />
            </linearGradient>
          </defs>
          {this.makePath()}
          {this.makeArea()}
          {hoverLocation ? this.makeLine(hoverLocation) : null}
          {closestPoint && hoverLocation ? this.makeActivePoint(closestPoint, hoverLocation) : null}
        </svg>
      </div>
    );
  }
}
