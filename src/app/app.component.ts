import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'gauge';
  ranges1 = [-100, -80, -20, 0, 15];
  colors1 = ['green', 'orange', 'red', 'blue'];

  ranges2 = [7,10,20,30,40];
  colors2 = ['green', 'orange', 'red', 'darkred'];

  ranges3 = [-100, -80, -20, 0, 10];
  colors3 = ['green', 'orange', 'red', 'darkred'];
  public needleValue = 23;
}
