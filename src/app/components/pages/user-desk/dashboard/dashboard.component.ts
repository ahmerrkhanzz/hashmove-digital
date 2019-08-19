import { Component, OnInit, OnDestroy, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { SharedService } from '../../../../services/shared.service';
import { baseExternalAssets } from '../../../../constants/base.url';
import { Router } from '@angular/router';
import { encryptBookingID, isJSON, loading } from '../../../../constants/globalFunctions';
import { DashboardService } from './dashboard.service';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { JsonResponse } from '../../../../interfaces/JsonResponse';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  @Output() activatedTab: EventEmitter<any> = new EventEmitter();
  public providerInfo;
  private dashboardSubscriber;
  public bookings;
  public baseExternalAssets: string = baseExternalAssets;
  public selectedBookingMode = 'CURRENT BOOKINGS';
  public bookingYears: any[] = []
  public selectedYear: string = ''
  constructor(
    private _sharedService: SharedService,
    private _router: Router,
    private _dashboardService: DashboardService,
  ) { }

  ngOnInit() {
    this.dashboardSubscriber = this._sharedService.dashboardDetail.subscribe((state: any) => {
      loading(false)
      if (state) {
        this.providerInfo = state;
        if (this.providerInfo.BookingDetails && this.providerInfo.BookingDetails.length) {
          this.providerInfo.BookingDetails.map(elem => {
            if (elem.CustomerImage && typeof elem.CustomerImage == "string" && elem.CustomerImage != "[]" && isJSON(elem.CustomerImage)) {
              elem.CustomerLogo = JSON.parse(elem.CustomerImage).shift().DocumentFile
            }
            else if (elem.UserImage) {
              elem.CustomerLogo = elem.UserImage;
            }
          })
          this.bookings = this.providerInfo.BookingDetails;
        }
      }
    });

    this._dashboardService.getBookingYears().pipe(untilDestroyed(this)).subscribe((res: JsonResponse) => {
      loading(false)
      if (res.returnId > 0) {
        try {
          this.bookingYears = JSON.parse(res.returnText)
          this.selectedYear = this.bookingYears[0].BookingYear
        } catch (error) {
        }
      }
    })
  }

  onYearSelect($year: any) {
    try {
      if ($year && $year.BookingYear) {
        this.selectedYear = $year.BookingYear
      }
    } catch (error) { }
  }

  ngOnDestroy() {
    this.dashboardSubscriber.unsubscribe();
  }
  viewBookingDetails(bookingId, providerId, shippingModeCode) {
    let id = encryptBookingID(bookingId, providerId, shippingModeCode);
    this._router.navigate(['/provider/booking-detail', id]);
  }

  viewAllBookings() {
    this._router.navigate(['/provider/allbookings']);
  }
  bookingsTabRedirect(tab) {
    this._router.navigate(['/provider/allbookings']);
    this._sharedService.activatedBookingTab.next(tab);
  }
}
