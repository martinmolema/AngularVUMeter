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

  /** Depending on the font, the text below the pin of the needle must be shifted */
  @Input() centralValueTextVerticalCorrection = 15;

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

  /** Whether or not to show the unit markers. These are css-stylable lines  */
  @Input() showUnitMarkers = true;

  /** The unit of the small unit markers. This is tested using the MODULO operator */
  @Input() markerSmallUnit = 1;
  /** The length of the line for a small marker */
  @Input() markerSmallLength = 5;
  /** A small marker line can be shifted to the inside (negative value) of further out (positive value) */
  @Input() markerSmallOffset = 5;

  /** The unit of the small unit markers. This is tested using the MODULO operator */
  @Input() markerLargeUnit = 10;
  /** The length of the line for a large marker */
  @Input() markerLargeLength = 15;
  /** A large marker line can be shifted to the inside (negative value) of further out (positive value) */
  @Input() markerLargeOffset = 5;

  /** Whether or not to show the marker value in text for large values (e.g. every 10th value) */
  @Input() showMarkerTextLarge = true;
  /** Whether or not to show the marker value in text for small values (e.g. every even value) */
  @Input() showMarkerTextSmall = false;
  /** The amount to shift/offset the text for markers. negative values will push the marker text outside the arcs */
  @Input() markerTextOffset = 10;

  /** The total degrees the arc spans. So 360 degrees is a full circle, 180 degrees is half a circle*/
  @Input() arcSpanDegrees = 180;

  @Input() valuePrefix: string  = '';
  @Input() valueSuffix: string  = '';

  private arcSpanGapDegrees = 0;
  private needleLeftAngle = 0;

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

  /* obsolete now that markers are introduced
    public labelLeftRotate = 'rotate(0)';
    public labelRightRotate = 'rotate(0)';
  */

  /**  */
  public needleRotation = '';
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

  /** the distance between the minimal needle value and maximal needle value */
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

  private correctedNeedleMinValue: number = 0;
  private correctedNeedleMaxValue: number = 0;

  constructor() {
    this.needleValue = 0;
    this.ranges = [];
    this.colors = [];
    this.circumference = 0;
    this.strokeWidth = 10;
    this.width = 2;
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

  drawGauge(): void {
    this.clearGeneratedContent();
    this.createArcs();
    this.createMarkerTexts();
    this.createMarkers();
    this.update();

  }

  ngAfterViewInit(): void {
    this.drawGauge();
  }// ngAfterViewInit

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['needleValue']) {
      // first check for valid number coming in. if not: do nothing
      if (
        isNaN(changes['needleValue'].currentValue) ||
        changes['needleValue'].currentValue === undefined ||
        changes['needleValue'].currentValue === null
      ) {
        return;
      }

      // check if there is already an animation running; if so, cancel it, so we can start again continuing from the
      // current version
      if (this.timerRef) {
        window.clearInterval(this.timerRef);
      }
      if (changes['needleValue'].isFirstChange()) {
        this.internalNeedleValue = changes['needleValue'].currentValue;
        this.update();
      } else {
        const startValue = changes['needleValue'].previousValue;
        const endValue = changes['needleValue'].currentValue;

        let numberOfTimeOutSteps = 10; // maximum number of steps
        const timeOutStepDuration = this.timeOutduration / numberOfTimeOutSteps;
        let animationStepper = 0;
        const easeInStepValue = 1 / (numberOfTimeOutSteps - 1);

        this.internalNeedleValue = startValue;
        this.update();
        this.timerRef = window.setInterval(() => {
          // see https://css-tricks.com/emulating-css-timing-functions-javascript/
          const factor = 0.5 * (Math.sin((animationStepper - 0.5) * Math.PI) + 1); // ease-in-out function
          this.internalNeedleValue = startValue + (endValue - startValue) * factor;
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
    this.needleMaxValue = Math.max(...this.ranges);
    this.needleMinValue = Math.min(...this.ranges);

    this.correctedNeedleMinValue = this.needleValueIsPercentage ? 0 : this.needleMinValue;
    this.correctedNeedleMaxValue = this.needleValueIsPercentage ? 100 : this.needleMaxValue;

    this.needleValueRange = Math.abs(this.correctedNeedleMinValue - this.correctedNeedleMaxValue);

    this.arcSpanGapDegrees = 360 - this.arcSpanDegrees;

    // if the needle angle is zero, then the needle is pointing upward!
    this.needleLeftAngle = 0 - (this.arcSpanDegrees / 2);

    this.drawingBox.update(
      this.marginSide,
      this.marginTop,
      this.width - this.marginSide,
      this.height - this.marginBottom - this.needleBaseWidth
    );
    if (this.drawingBox.ratioWH < 2.1) {
      this.radius = this.drawingBox.w / 2;
    } else {
      this.radius = this.drawingBox.h;
    }

    this.circumference = 2 * Math.PI * this.radius;
    this.svgViewBox = `0 0 ${this.width} ${this.height}`;

    const needleWidth = this.needleBaseWidth;
    const needleLength = (this.radius) * (this.needleLengthPercentage / 100);

    let centerYCorrection = 0;
    if (this.arcSpanDegrees > 180) {
      // raise the center so the bottom half is visible
      centerYCorrection = Math.abs(Math.sin(90 + this.arcSpanDegrees / 2) * this.radius);
    }

    this.cx = this.drawingBox.x1 + this.drawingBox.w / 2;
    this.cy = this.drawingBox.y2 - centerYCorrection;

    this.circleBoundingBox.x1 = this.cx - this.radius;
    this.circleBoundingBox.y1 = this.drawingBox.y1;
    this.circleBoundingBox.x2 = this.cx + this.radius;
    this.circleBoundingBox.y2 = this.cy + centerYCorrection;

    this.textBox.update(
      this.circleBoundingBox.x1,
      this.height - this.marginBottom,
      this.circleBoundingBox.x2,
      this.height
    );

    const angleOfHalfArcInDegrees = (90 - (this.arcSpanDegrees / 2));
    const angleOfHalfArcInRadians = (angleOfHalfArcInDegrees / 360) * (2 * Math.PI);
    const distanceXOfHalfArc = Math.cos(angleOfHalfArcInRadians) * (this.radius + this.strokeWidth);
    const distanceYOfHalfArc = Math.sin(angleOfHalfArcInRadians) * (this.radius + this.strokeWidth);

    const circleStartX = this.cx - Math.cos(angleOfHalfArcInRadians) * this.radius;
    const circleEndX = this.cx + Math.cos(angleOfHalfArcInRadians) * this.radius;
    const circleStartY = this.cy - Math.sin(angleOfHalfArcInRadians) * this.radius;
    const circleEndY = circleStartY;
    let sweepflag = this.arcSpanDegrees < 180 ? 0 : 1;

    //https://www.w3.org/TR/SVG/images/paths/arcs02.svg for last 2 parameters
//     A 1 1 0 1 1 ${this.circleBoundingBox.x2} ${this.circleBoundingBox.y2}
    this.backgroundPath = `
    M ${this.cx},${this.cy}
    L  ${circleStartX}, ${circleStartY}
    A ${this.radius} ${this.radius} 0 ${sweepflag} 1 ${circleEndX} ${circleEndY}
    L  ${circleEndX}, ${circleEndY}
    Z
    `;

    /* calculate rotation of labels */
    this.labelLeftX = this.cx - distanceXOfHalfArc;
    this.labelRightX = this.cx + distanceXOfHalfArc;

    this.labelLeftY = this.cy - distanceYOfHalfArc;
    this.labelRightY = this.labelLeftY;
    this.labelCenterX = this.cx;
    this.labelCenterY = this.cy + this.needlePinRadius + this.centralValueTextVerticalCorrection;
    this.needlePolygonPoints = `${this.cx - needleWidth},${this.cy} ${this.cx},${this.cy - needleLength} ${this.cx + needleWidth},${this.cy}`;
    this.needleTransformOrigin = `${this.cx},${this.cy}`;
  }//setupConfig

  private update(updateText: boolean = true): void {
    this.updateNeedle();
    if (updateText) {
      this.updateNeedleText();
    }
  }

  private createArcs(): void {
    const svgParent = this.elGeneratedContent?.nativeElement;
    if (svgParent === undefined) {
      return;
    }
    if (this.ranges.length < 2) {
      console.error('VuMeterComponent::Need minimal 2 ranges.');
      return;
    }
    if (this.colors.length !== this.ranges.length - 1) {
      console.error('VuMeterComponent::Number of colors and ranges do not match.');
      return;
    }

    for (let segmentNr = 0; segmentNr < this.ranges.length - 1; segmentNr++) {
      const newCircle = this.createOneArc(segmentNr);
      svgParent.appendChild(newCircle);
    }
  }// createArcs

  private createMarkers(): void {
    console.log('createMarkers');
    if (!this.showUnitMarkers) { return ;}

    const svgParent = this.elGeneratedContent?.nativeElement;
    for (let m = this.correctedNeedleMinValue; m <= this.correctedNeedleMaxValue; m++) {
      let markerLength = 0;
      let markerOffset = 0;
      let classname = '';
      let showMarker = false;

      if (m % this.markerLargeUnit === 0) {
        markerLength = this.markerLargeLength;
        markerOffset = this.markerLargeOffset;
        classname = 'large';
        showMarker = true;
      }
      else if (m % this.markerSmallUnit === 0) {
        markerLength = this.markerSmallLength;
        markerOffset = this.markerSmallOffset;
        classname = 'large';
        showMarker = true;
      }
      if (showMarker) {
        const x1 = this.cx - (this.radius + markerOffset);
        const y1 = this.cy;
        const x2 = this.cx - (this.radius + markerOffset - markerLength);
        const y2 = this.cy;

        const pos = (m - this.correctedNeedleMinValue) / (this.needleValueRange);
        const rotation = 90 - (this.arcSpanDegrees / 2) + (pos * this.arcSpanDegrees);

        const markerLine = SVGFactory.createElement(SVGElementType.Line) as SVGElement;
        markerLine.setAttribute('x1', `${x1}`);
        markerLine.setAttribute('y1', `${y1}`);
        markerLine.setAttribute('x2', `${x2}`);
        markerLine.setAttribute('y2', `${y2}`);
        markerLine.setAttribute('stroke-width', '1');
        markerLine.setAttribute('stroke', 'black');
        markerLine.setAttribute('fill', 'none');
        markerLine.setAttribute('class', `gauge marker ${classname} ${this.extraClass}`);
        markerLine.setAttribute('transform', `rotate(${rotation},${this.cx},${this.cy})`);

        svgParent.appendChild(markerLine);
      }

    }
  }//createMarkers

  createMarkerTexts(): void {
    const svgParent = this.elGeneratedContent?.nativeElement;
    if (!this.showMarkerTextLarge && !this.showMarkerTextSmall) { return ; }

    if (this.showMarkerTextSmall && !this.showMarkerTextLarge){
      if (this.correctedNeedleMinValue % this.markerSmallUnit !== 0) {
        this.addMarkerText(svgParent, 'minval', this.correctedNeedleMinValue, this.correctedNeedleMinValue);
      }

      if (this.correctedNeedleMaxValue % this.markerSmallUnit !== 0 ) {
        this.addMarkerText(svgParent, 'maxval', this.correctedNeedleMaxValue, this.correctedNeedleMaxValue);
      }
    }
    if (this.showMarkerTextLarge && !this.showMarkerTextSmall) {
      if (this.correctedNeedleMinValue % this.markerLargeUnit !== 0) {
        this.addMarkerText(svgParent, 'minval', this.correctedNeedleMinValue, this.correctedNeedleMinValue);
      }

      if (this.correctedNeedleMaxValue % this.markerLargeUnit !== 0 ) {
        this.addMarkerText(svgParent, 'maxval', this.correctedNeedleMaxValue, this.correctedNeedleMaxValue);
      }
    }


    for (let m = this.correctedNeedleMinValue; m <= this.correctedNeedleMaxValue; m++) {
      let value;
      value = m;

      if (value % this.markerLargeUnit === 0 && this.showMarkerTextLarge) {
        this.addMarkerText(svgParent,'large', m, value);
      }
      else if (value % this.markerSmallUnit === 0 && this.showMarkerTextSmall) {
        this.addMarkerText(svgParent, 'small', m, value);
      }
    }
  }// createMarkerTexts

  addMarkerText(parent: any, classname: string, value: number, captionValue: number):void {
    let angleInDegreesForPosition;
    let textRotateAngleInDegrees;

    const percentage = ((value - this.correctedNeedleMinValue) / this.correctedNeedleMaxValue);
    const positionInDegrees = percentage * this.arcSpanDegrees;

    // calculate angle of rotation to calculate the position of the text
    angleInDegreesForPosition = -90 - (this.arcSpanDegrees / 2) + positionInDegrees;

    // calculate how the text itself should be rotated
    textRotateAngleInDegrees  = -90 - (this.arcSpanDegrees / 2) + positionInDegrees + 90;

    const angleInRadians = (angleInDegreesForPosition / 360) * (Math.PI * 2)
    const tx = this.cx + Math.cos(angleInRadians) * (this.radius - this.markerTextOffset);
    const ty = this.cy + Math.sin(angleInRadians) * (this.radius - this.markerTextOffset);

    const text1 = SVGFactory.createElement(SVGElementType.Text) as SVGElement;
    const text2 = SVGFactory.createElement(SVGElementType.Text) as SVGElement;
    text1.setAttribute('x', `${tx}`);
    text1.setAttribute('y', `${ty}`);
    text1.setAttribute('text-anchor', `middle`);
    text1.setAttribute('class', `gauge marker text ${classname} ${this.extraClass}`);
    text1.setAttribute('transform', `rotate(${textRotateAngleInDegrees} ${tx} ${ty})`);

    text2.setAttribute('x', `${tx}`);
    text2.setAttribute('y', `${ty}`);
    text2.setAttribute('text-anchor', `middle`);
    text2.setAttribute('class', `gauge marker text shadow ${classname}  ${this.extraClass}`);
    text2.setAttribute('transform', `rotate(${textRotateAngleInDegrees} ${tx} ${ty}) translate(1,1)`);

    if (this.needleValueIsPercentage) {
      text1.textContent = `${captionValue}%`;
      text2.textContent = `${captionValue}%`;
    }
    else {
      text1.textContent = `${captionValue}`;
      text2.textContent = `${captionValue}`;
    }

    parent.appendChild(text2);
    parent.appendChild(text1);
  }//createMarkerText

  /**
   * Removes all generated contents for the visible arcs
   * @private
   */
  private clearGeneratedContent(): void {
    const svgParent = this.elGeneratedContent?.nativeElement;
    if (svgParent === undefined) {
      return;
    }
    while (svgParent.children.length > 0) {
      svgParent.firstChild.remove();
    }
  }

  private updateNeedle(): void {
    const needlePercentage = this.adjustedNeedleValue();
    const needleAngle = this.needleLeftAngle + (needlePercentage / 100) * this.arcSpanDegrees;

    // 50% means shadow is cast directly under the needle; < 50% = left ; >50% is right
    const shadowOffset = (-50 + needlePercentage) / 100 * this.needleShadowOffsetInDegrees;

    this.needleRotation = `rotate(${needleAngle},${this.cx},${this.cy})`;
    this.needleRotationShadow = `rotate(${needleAngle + shadowOffset},${this.cx},${this.cy})`;
  }

  private adjustedNeedleValue(): number {
    let needleRecalculatedValue;
    if (this.needleValueIsPercentage) {
      needleRecalculatedValue = this.internalNeedleValue;
      needleRecalculatedValue = Math.min(needleRecalculatedValue, 100);
      needleRecalculatedValue = Math.max(needleRecalculatedValue, 0);
    } else {
      needleRecalculatedValue = this.mapValueToPercentage(this.needleMinValue, this.needleMaxValue, this.internalNeedleValue) * 100;
      needleRecalculatedValue = Math.min(needleRecalculatedValue, 100);
      needleRecalculatedValue = Math.max(needleRecalculatedValue, 0);
    }
    return needleRecalculatedValue;
  }

  private updateNeedleText(): void {
    if (this.showNeedleValueAsText) {
      if (this.needleValueIsPercentage) {
        this.needleTextValue = this.adjustedNeedleValue().toFixed(0) + '%';
      } else {
        this.needleTextValue = this.valuePrefix + this.internalNeedleValue.toString(10) + this.valueSuffix;
      }
    }
  }

  private createOneArc(rangePosition: number): SVGElement {
    const newCircle = SVGFactory.createElement(SVGElementType.Circle) as SVGElement;
    newCircle.setAttribute('r', this.radius.toFixed(2));
    newCircle.setAttribute('cx', `${this.cx}`);
    newCircle.setAttribute('cy', `${this.cy}`);
    newCircle.setAttribute('stroke-width', `${this.strokeWidth}`);
    newCircle.setAttribute('stroke', this.colors[rangePosition]);
    newCircle.setAttribute('fill', 'none');
    newCircle.setAttribute('class', `gauge arc ${this.extraClass}`);
    if (this.useArcShadows) {
      newCircle.setAttribute('filter', 'url(#shadow-arc');
    }

    const startPos = this.mapValueToPercentage(this.needleMinValue, this.needleMaxValue, this.ranges[rangePosition]);
    const endPos = this.mapValueToPercentage(this.needleMinValue, this.needleMaxValue, this.ranges[rangePosition + 1]);
    const length = (endPos - startPos) * this.circumference * (this.arcSpanDegrees / 360) - this.arcSpacing;

    const halfGapBelow = (180 - this.arcSpanGapDegrees) / 2;
    const rotationAngle = -(180 + halfGapBelow) + (startPos * this.arcSpanDegrees);

    newCircle.setAttribute('transform', `rotate(${rotationAngle}  ${this.cx} ${this.cy})`);
    const dashArray = `${length},${this.circumference * 2}`;

    const dashOffset = `0`;
    newCircle.setAttribute('stroke-dasharray', dashArray);
    newCircle.setAttribute('stroke-dashoffset', dashOffset);

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
