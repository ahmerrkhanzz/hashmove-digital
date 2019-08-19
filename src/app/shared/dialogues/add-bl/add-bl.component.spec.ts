import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBlComponent } from './add-bl.component';

describe('AddBlComponent', () => {
  let component: AddBlComponent;
  let fixture: ComponentFixture<AddBlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddBlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddBlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
