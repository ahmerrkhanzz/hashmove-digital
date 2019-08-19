import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MakeBookingAirComponent } from './make-booking-air.component';

describe('MakeBookingAirComponent', () => {
  let component: MakeBookingAirComponent;
  let fixture: ComponentFixture<MakeBookingAirComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MakeBookingAirComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MakeBookingAirComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
