import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'gauge';
  ranges1 = [0, 2, 4, 5];
  colors1 = ['green', 'orange', 'red'];

  ranges2 = [-100, -80, -20, 0, 15];
  colors2 = ['green', 'orange', 'red', 'blue'];

  ranges3 = [7,10,20,30,40];
  colors3 = ['green', 'orange', 'red', 'darkred'];

  ranges4 = [0, 10, 20, 30, 50];
  colors4 = ['green', 'orange', 'red', 'darkred'];

  ranges5 = [0, 10, 20, 30, 50];
  colors5 = ['green', 'orange', 'red', 'darkred'];

  public needleValue1 = this.ranges1[0];
  public needleValue2 = this.ranges2[0];
  public needleValue3 = 50; // this range is a percentage input
  public needleValue4 = this.ranges4[0];
  public needleValue5 = this.ranges5[0];
}
