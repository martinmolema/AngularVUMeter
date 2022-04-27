import {AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {Rectangle, SVGElementType, SVGFactory} from "../classes/s-v-g-factory";

@Component({
  selector: 'app-vu-meter',
  templateUrl: './vu-meter.component.html',
  styleUrls: ['./vu-meter.component.css']
})
export class VuMeterComponent implements OnInit, AfterViewInit, OnChanges {

  @ViewChild('generatedContent') elGeneratedContent: ElementRef | undefined;

  /** The width of the drawing area of the VU-meter  */
  @Input() width: number;
  /**  The height of the drawing area of the VU-meter */
  @Input() height: number;
  /** The current needle value to display  */
  @Input() needleValue: number;
  /** an array of numbers for the ranges. min and max value must be present  */
  @Input() ranges: number[];
  /**  the colors in order of the sorted range-parts. the number of colors is always 2 smaller than the number of ranges */
  @Input() colors: string[];
  /** the stroke-width of the SVG arcs being drawn  */
  @Input() strokeWidth: number;
  /**  the number of pixels reserved in the drawing area so text labels can be printed */
  @Input() marginBottom: number;
  /**  the number of pixels reserved on the top of the drawing area */
  @Input() marginTop: number;
  /**  the number of pixels reserved on the left and right side of the drawing area */
  @Input() marginSide: number;
  /** the width of the needle at the base (where it rotates) */
  @Input() needleBaseWidth = 1;
  /** the needle length in percentage of the length of the distance between the needle's pin and the arcs */
  @Input() needleLengthPercentage = 90;
  /** Should the current value be displayed? */
  @Input() showNeedleValueAsText = false;
  /** Show minimal and maximal value at the left and right base (below the start/finish of the arcs) */
  @Input() showRangeLabels = true;
  /** Is the value of the current needle value a percentage? (if not: the value is interpreted as being in the range
   * of given numbers (see [needleValue]{@link VuMeterComponent#needleValue} )*/
  @Input() needleValueIsPercentage = false;
  /** The radius in pixels of the pin. set to zero to make it disappear or use a class (:host ::ng-deep ) */
  @Input() needlePinRadius = 2;
  /** the number of whitespace degrees between each arc */
  @Input() arcSpacing = 1;
  /** the caption above the VU-meter */
  @Input() caption = '';
  /** the caption below the VU-meter */
  @Input() footer = '';
  /** an extra class added to each SVG-object and/or HTML element to be able to influence styling */
  @Input() extraClass = '';
  /** should an adaptive shadow be displayed? */
  @Input() showNeedleShadow = false;
  /** at what maximum angle should the needle shadow be displayed? */
  @Input() needleShadowOffsetInDegrees = 2;
  /** use an SVG-filter to draw shadows below the arcs */
  @Input() useArcShadows = false;
  /** the shadow depth of the arcs */
  @Input() arcShadowDepth = -3;
  /** the time out duration in milliseconds to animate changes */
  @Input() timeOutduration = 500;


  private internalNeedleValue = 0;
  private radius = 1;
  private circumference: number;

  /** the X position of (cx,cy) position of the needle and arcs */
  public cx = 0;
  /** the Y position of  (cx,cy) position of the needle and arcs */
  public cy = 0;
  /** The X-position of the left label */
  public labelLeftX = 0;
  /** The Y-position of the left label */
  public labelLeftY = 0;
  /** The X-position of the right label */
  public labelRightX = 0;
  /** The Y-position of the right label */
  public labelRightY = 0;
  /** The X-position of the center label */
  public labelCenterX = 0;
  /** The Y-position of the center label */
  public labelCenterY = 0;

  /**  */
  public needleRotation =  '';
  /**  */
  public needlePolygonPoints = '';
  /**  */
  public needleTransformOrigin = '';
  /**  */
  public needleTextValue = '';
  /**  */
  public needleMaxValue: number;
  /**  */
  public needleMinValue: number;
  /**  */
  public needleValueRange: number;
  /**  */
  public needleRotationShadow = '';

  /**  */
  public svgViewBox = '';
  /**  */
  public backgroundPath = '';

  private drawingBox: Rectangle;
  private textBox: Rectangle;
  private circleBoundingBox: Rectangle;
  private timerRef: any;

  public labelTextLeft = '';
  public labelTextRight = '';

  constructor() {
    this.needleValue = 0;
    this.ranges = [];
    this.colors = [];
    this.circumference = 0;
    this.strokeWidth = 10;
    this.width  = 2;
    this.height = 2;
    this.marginBottom = 0;
    this.marginSide = 0;
    this.marginTop = 0;
    this.drawingBox = new Rectangle(0, 0, 0, 0);
    this.textBox = new Rectangle(0, 0, 0, 0);
    this.circleBoundingBox = new Rectangle(0, 0, 0, 0);
    this.needleMaxValue = 0;
    this.needleMinValue = 0;
    this.needleValueRange = 0;
    this.needlePinRadius = 2;
  }

  ngOnInit(): void {
    this.setupConfig();
  }

  ngAfterViewInit(): void {
    this.update();
  }// ngAfterViewInit

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['needleValue']) {
      // first check for valid number coming in. if not: do nothing
      if (
        isNaN(changes['needleValue'].currentValue) ||
        changes['needleValue'].currentValue === undefined ||
        changes['needleValue'].currentValue === null
      ) { return ; }

      // check if there is already an animation running; if so, cancel it, so we can start again continuing from the
      // current version
      if (this.timerRef) {
        window.clearInterval(this.timerRef);
      }
      if (changes['needleValue'].isFirstChange()) {
        this.internalNeedleValue = changes['needleValue'].currentValue;
        this.update();
      }
      else {
        const startValue = changes['needleValue'].previousValue;
        const endValue   = changes['needleValue'].currentValue;

        let   numberOfTimeOutSteps = 10; // maximum number of steps
        const timeOutStepDuration  = this.timeOutduration / numberOfTimeOutSteps;
        let animationStepper = 0;
        const easeInStepValue = 1 / (numberOfTimeOutSteps - 1);

        this.internalNeedleValue = startValue;
        this.update();
        this.timerRef = window.setInterval(()=> {
          // see https://css-tricks.com/emulating-css-timing-functions-javascript/
          const factor = 0.5*(Math.sin((animationStepper - 0.5)*Math.PI) + 1); // ease-in-out function
          this.internalNeedleValue = startValue + (endValue - startValue ) * factor;
          this.update(false);

          numberOfTimeOutSteps--;
          animationStepper += easeInStepValue;

          if (numberOfTimeOutSteps === 0) {
            window.clearInterval(this.timerRef);
            this.internalNeedleValue = endValue;
            this.update();
          }
        }, timeOutStepDuration);
      }
    }
    this.update();
  }// ngOnChanges


  private setupConfig(): void {
    this.needleMaxValue   = Math.max(...this.ranges);
    this.needleMinValue   = Math.min(...this.ranges);
    this.needleValueRange = Math.abs(this.needleMaxValue - this.needleMinValue);

    this.drawingBox.update(
      this.marginSide,
      this.marginTop,
      this.width - this.marginSide,
      this.height - this.marginBottom - this.needleBaseWidth
    );
    if (this.drawingBox.ratioWH < 2.1) {
      this.radius = this.drawingBox.w / 2;
    }
    else {
      this.radius = this.drawingBox.h;
    }

    this.circumference = 2 * Math.PI * this.radius;
    this.svgViewBox = `0 0 ${this.width} ${this.height}`;

    const needleWidth = this.needleBaseWidth;
    const needleLength = (this.radius) * (this.needleLengthPercentage / 100);

    this.cx = this.drawingBox.x1 + this.drawingBox.w / 2;
    this.cy = this.drawingBox.y2;

    this.circleBoundingBox.x1 = this.cx - this.radius;
    this.circleBoundingBox.y1 = this.drawingBox.y1;
    this.circleBoundingBox.x2 = this.cx + this.radius;
    this.circleBoundingBox.y2 = this.cy;

    this.backgroundPath = `
    M ${this.circleBoundingBox.x1},${this.circleBoundingBox.y2}
    A 1 1 0 1 1 ${this.circleBoundingBox.x2} ${this.circleBoundingBox.y2}
    `;
    this.textBox.update(
      this.circleBoundingBox.x1,
      this.height - this.marginBottom,
      this.circleBoundingBox.x2,
      this.height
    );

    this.labelLeftX = this.textBox.x1;
    this.labelLeftY = this.textBox.y2;

    this.labelRightX = this.textBox.x2;
    this.labelRightY = this.textBox.y2;

    if (this.showRangeLabels) {
      if (this.needleValueIsPercentage){
        this.labelTextLeft = '0%';
        this.labelTextRight = '100%';
      }
      else{
        this.labelTextLeft = this.ranges[0].toString(10);
        this.labelTextRight = this.needleMaxValue.toString(10);
      }

    }

    this.labelCenterX = this.textBox.x1 + this.textBox.w / 2;
    this.labelCenterY = this.textBox.y2;
    this.needlePolygonPoints   = `${this.cx - needleWidth},${this.cy} ${this.cx},${this.cy - needleLength} ${this.cx + needleWidth},${this.cy}`;
    this.needleTransformOrigin = `${this.cx},${this.cy}`;

  }

  private update(updateText: boolean = true): void {
    this.createArcs();
    this.updateNeedle();
    if (updateText) {
      this.updateNeedleText();
    }
  }

  private createArcs(): void {
    const svgParent = this.elGeneratedContent?.nativeElement;
    this.clearArcs();
    if (svgParent === undefined) { return ; }
    if (this.ranges.length < 2 ) { console.error('VuMeterComponent::Need minimal 2 ranges.'); return ; }
    if (this.colors.length !== this.ranges.length - 1 ) {
      console.error('VuMeterComponent::Number of colors and ranges do not match.');
      return ;
    }

    for (let segmentNr = 0; segmentNr < this.ranges.length - 1; segmentNr++) {
      const newCircle = this.createOneArc(segmentNr);
      svgParent.appendChild(newCircle);
    }
  }// createLineSegments

  private clearArcs(): void {
    const svgParent = this.elGeneratedContent?.nativeElement;
    if (svgParent === undefined) { return ; }
    while (svgParent.children.length > 0) {
      svgParent.firstChild.remove();
    }
  }

  private updateNeedle(): void {
    const needlePercentage = this.adjustedNeedleValue(this.needleValueIsPercentage);
    const needleAngle = needlePercentage * 180 / 100;

    // 50% means shadow is cast directly under the needle; < 50% = left ; >50% is right
    const shadowOffset = (-50 + needlePercentage) / 100 * this.needleShadowOffsetInDegrees;

    this.needleRotation = `rotate(${-90 + needleAngle},${this.cx},${this.cy})`;
    this.needleRotationShadow = `rotate(${-90 + needleAngle + shadowOffset},${this.cx},${this.cy})`;
  }

  private adjustedNeedleValue(needleValueIsPercentage: boolean): number {
    let needleRecalculatedValue;
    if (needleValueIsPercentage) {
      needleRecalculatedValue = this.internalNeedleValue;
      needleRecalculatedValue = Math.min(needleRecalculatedValue, 100);
      needleRecalculatedValue = Math.max(needleRecalculatedValue, 0);
    }
    else{
      needleRecalculatedValue = this.mapValueToPercentage(this.needleMinValue, this.needleMaxValue, this.internalNeedleValue) * 100;
      needleRecalculatedValue = Math.min(needleRecalculatedValue, 100);
      needleRecalculatedValue = Math.max(needleRecalculatedValue, 0);
    }
    return needleRecalculatedValue;
  }

  private updateNeedleText(): void {
    if (this.showNeedleValueAsText) {
      if (this.needleValueIsPercentage) {
        this.needleTextValue = this.adjustedNeedleValue(this.needleValueIsPercentage).toFixed(0) + '%';
      } else {
        this.needleTextValue = this.internalNeedleValue.toString(10);
      }
    }
  }

  private createOneArc(rangePosition: number): SVGElement {
    const newCircle = SVGFactory.createElement(SVGElementType.Circle) as SVGElement;
    newCircle.setAttribute('r' , this.radius.toFixed(2));
    newCircle.setAttribute('cx' , `${this.cx}`);
    newCircle.setAttribute('cy' , `${this.cy}`);
    newCircle.setAttribute('stroke-width' , `${this.strokeWidth}`);
    newCircle.setAttribute('stroke' , this.colors[rangePosition]);
    newCircle.setAttribute('fill' , 'none');
    newCircle.setAttribute('class' , `gauge arc ${this.extraClass}`);
    if (this.useArcShadows) {
      newCircle.setAttribute('filter', 'url(#shadow-arc');
    }

    const startPos = this.mapValueToPercentage(this.needleMinValue, this.needleMaxValue, this.ranges[rangePosition]);
    const endPos   = this.mapValueToPercentage(this.needleMinValue, this.needleMaxValue, this.ranges[rangePosition + 1]);
    const length   = (endPos - startPos) * (this.circumference / 2) - this.arcSpacing;

    const rotationAngle = -180 + (startPos * 180);

    newCircle.setAttribute('transform' , `rotate(${rotationAngle}  ${this.cx} ${this.cy})`);
    const dashArray = `${length},${this.circumference * 2}`;

    const dashOffset = `0`;
    newCircle.setAttribute('stroke-dasharray' , dashArray);
    newCircle.setAttribute('stroke-dashoffset' , dashOffset );

    return newCircle;
  }

  /**
   * maps a value between min and max to a percentage between 0 and 1
   */
  private mapValueToPercentage(min: number, max: number, value: number): number {
    const range = max - min;
    const shift = 0 - min;  // direction to shift ; [-4,8] => [0, 12] => shift = +4
    value += shift;

    return value / range;
  }
}// class
