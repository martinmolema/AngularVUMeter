import {ElementRef} from '@angular/core';

export enum SVGElementType {
  SVG,
  Rect,
  Circle,
  Line,
  Group,
  Text,
  Polyline,
  Polygon
}


export class SVGFactory {
  private static svgNS = 'http://www.w3.org/2000/svg';

  public static createElement(type: SVGElementType, ...args: any[]): Node | undefined {
    switch (type) {
      case SVGElementType.SVG:
        return document.createElementNS(this.svgNS, 'svg');
      case SVGElementType.Circle:
        return document.createElementNS(this.svgNS, 'circle');
      case SVGElementType.Line:
        return document.createElementNS(this.svgNS, 'line');
      case SVGElementType.Rect:
        return document.createElementNS(this.svgNS, 'rect');
      case SVGElementType.Text:
        return document.createElementNS(this.svgNS, 'text');
      case SVGElementType.Group:
        return document.createElementNS(this.svgNS, 'g');
      case SVGElementType.Polyline:
        return document.createElementNS(this.svgNS, 'polyline');
      case SVGElementType.Polygon:
        return document.createElementNS(this.svgNS, 'polygon');
      default:
        console.error('#Error request SVG Factory type');
        break;
    }
    return undefined;
  }

}


export class Dimensions {
  private Width: number;
  private Height: number;

  constructor(w: number, h: number) {
    this.Width = 0;
    this.Height = 0;
    this.update(w, h);
  }

  get h(): number  { return this.Height; }
  set h(v: number) { this.Height = v; }
  get w(): number  { return this.Width; }
  set w(v: number) { this.Width = v; }

  update(w: number, h: number): void {
    this.Width  = w;
    this.Height = h;
  }

  updateFromSVGElement(svg: ElementRef): Dimensions {
    const svgBBox = svg.nativeElement.getBoundingClientRect();
    this.update(svgBBox.width, svgBBox.height);
    return this;
  }
}

export class Line {
  constructor(public x1: number, public y1: number, public x2: number, public y2: number) {
  }

  get w(): number {
    return Math.abs(this.x2 - this.x1);
  }

  get h(): number {
    return Math.abs(this.y2 - this.y1);
  }
}

export class Rectangle {
  public dimensions: Dimensions;
  public ratioWH: number;
  public ratioHW: number;
  public X1: number;
  public X2: number;
  public Y1: number;
  public Y2: number;

  constructor(x1: number, y1: number, x2: number, y2: number) {
    this.ratioHW = 0;
    this.ratioWH = 0;
    this.X1 = 0;
    this.X2 = 0;
    this.Y1 = 0;
    this.Y2 = 0;
    this.dimensions = new Dimensions(0, 0);
    this.update(x1, y1, x2, y2);
  }

  update(x1: number, y1: number, x2: number, y2: number): Rectangle {
    this.X1 = x1;
    this.X2 = x2;
    this.Y1 = y1;
    this.Y2 = y2;
    this.internalUpdate();
    return this;
  }

  /**
   * First resizes, then moves by a given factor in the horizontal direction
   * @param factor  a multiplication factor (so use numbers smaller than zero for division)
   */
  moveAndScaleHorizontal(factor: number): Rectangle {
    this.scaleWidth(factor).moveByFactorHorizontal(factor);
    return this;
  }

  moveAndScaleVertical(factor: number): Rectangle {
    this.scaleHeight(factor).moveByFactorVertical(factor);
    return this;
  }

  /**
   * Resizes by a certain factor in the horizontal direction
   * @param factor a multiplication factor (so use numbers smaller than zero for division)
   */
  scaleWidth(factor: number): Rectangle {
    this.w *= factor;
    return this;
  }

  /**
   * Resizes by a given factor in the vertical direction
   * @param factor a multiplication factor (so use numbers smaller than zero for division)
   */
  scaleHeight(factor: number): Rectangle {
    this.h *= factor;
    return this;
  }

  moveByFactorHorizontal(factor: number): Rectangle {
    this.X1 *= factor;
    this.X2 = this.X1 + this.w;
    return this;
  }

  moveByFactorVertical(factor: number): Rectangle {
    this.Y1 *= factor;
    this.Y2 += this.Y1 + this.w;
    this.internalUpdate();
    return this;
  }

  setWidth(w: number): Rectangle {
    this.X2 = this.X1 + w;
    this.internalUpdate();
    return this;
  }

  moveAbsoluteHorizontal(newX1: number): Rectangle {
    this.X1 = newX1;
    this.X2 = this.X1 + this.w;
    this.internalUpdate();
    return this;
  }

  moveDeltaHorizontal(delta: number): Rectangle {
    this.X1 += delta;
    this.X2 += delta;
    this.internalUpdate();
    return this;
  }

  moveAbsoluteVertical(newY1: number): Rectangle {
    this.Y1 = newY1;
    this.Y2 += this.h;
    this.internalUpdate();
    return this;
  }

  moveDeltaVertical(delta: number): Rectangle {
    this.Y1 += delta;
    this.Y2 += delta;
    this.internalUpdate();
    return this;
  }

  setHeight(h: number): Rectangle {
    this.Y2 = this.Y1 + h;
    this.internalUpdate();
    return this;
  }

  setDimensions(dim: Dimensions): Rectangle {
    this.setHeight(dim.h);
    this.setWidth(dim.w);
    return this;
  }

  setWidthHeight(w: number, h: number): Rectangle {
    this.setWidth(w);
    this.setHeight(h);
    return this;
  }

  private internalUpdate(): void {
    this.dimensions.w = Math.abs(this.x2 - this.x1);
    this.dimensions.h = Math.abs(this.y2 - this.y1);

    this.ratioWH = this.dimensions.w / this.dimensions.h;
    this.ratioHW = this.dimensions.h / this.dimensions.w;
  }

  clone(): Rectangle {
    return new Rectangle(this.x1, this.y1, this.x2, this.y2);
  }

  updateFromRect(rect: Rectangle): Rectangle {
    this.update(rect.x1, rect.y1, rect.x2, rect.y2);
    return this;
  }

  /**
   * Convenience method to growFromTopLeft so no negative values have to be supplied
   * @param shrinkWidthBy number of pixels to shrink horizontally
   * @param shrinkHeightBy number of pixels to shrink vertically
   */
  shrinkFromTopLeft(shrinkWidthBy: number, shrinkHeightBy: number): Rectangle {
    this.growFromTopLeft(-shrinkWidthBy, -shrinkHeightBy);
    return this;
  }

  /**
   * Will increase the size of the rectangle by moving the (x2,y2) coordinates with a given amount.
   * (x1,y1) will remain the same
   * @param growWidthBy number of pixels to grow horizontally
   * @param growHeightBy number of pixels to grow vertically
   */
  growFromTopLeft(growWidthBy: number, growHeightBy: number): Rectangle {
    this.w += growWidthBy;
    this.h += growHeightBy;
    return this;
  }

  /**
   * Moves the top of the rectangle down so that the Y2-coordinate will remain the same, and the height is adjusted
   * @param shrinkToHeight remaining height after call
   * @return self
   */
  shrinkToHeightFromBottom(shrinkToHeight: number): Rectangle {
    this.y1 = this.y2 - shrinkToHeight;
    return this;
  }

  /**
   * Will shrink the rectangle by a given amount and move it to a certain location. This way a
   * rectangle can be shrunk on four sides while the center remains the same.
   * @param moveX1 delta value to move x1-coordinate
   * @param moveY1 delta value to move y1-coordinate
   * @param shrinkWidthBy delta value to shrink the width
   * @param shrinkHeightBy delta value to shrink the height
   */
  shrinkAndMove(moveX1: number, moveY1: number, shrinkWidthBy: number, shrinkHeightBy: number): Rectangle {
    this.X1 += moveX1;
    this.Y1 += moveY1;
    this.internalUpdate();

    this.shrinkFromTopLeft(shrinkWidthBy , shrinkHeightBy );
    return this;
  }

  set x1(v: number) { this.X1 = v; this.internalUpdate(); }
  get x1(): number  { return this.X1; }
  set x2(v: number) { this.X2 = v; this.internalUpdate(); }
  get x2(): number  { return this.X2; }
  set y1(v: number) { this.Y1 = v; this.internalUpdate(); }
  get y1(): number  { return this.Y1; }
  set y2(v: number) { this.Y2 = v; this.internalUpdate(); }
  get y2(): number  { return this.Y2; }

  get w(): number  { return this.dimensions.w; }
  set w(v: number) { this.setWidth(v); }
  get h(): number  { return this.dimensions.h; }
  set h(v: number) { this.setHeight(v); }

}// Rectangle

