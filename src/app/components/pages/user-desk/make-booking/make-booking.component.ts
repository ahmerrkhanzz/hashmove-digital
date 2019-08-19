import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-make-booking',
  templateUrl: './make-booking.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./make-booking.component.scss']
})
export class MakeBookingComponent implements OnInit {

  [x: string]: any; //temporary

  constructor() { }

  ngOnInit() {
  }

}
