import { Component, OnInit, Input } from '@angular/core';
import { statusCode, isJSON, getImagePath, ImageRequiredSize, ImageSource, encryptBookingID } from '../../../../constants/globalFunctions';
import { Router } from '@angular/router';
import { baseExternalAssets } from '../../../../constants/base.url';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UpdatePriceComponent } from '../../../../shared/dialogues/update-price/update-price.component';
import { PriceLogsComponent } from '../../../../shared/dialogues/price-logs/price-logs.component';
import { CargoDetailsComponent } from '../../../../shared/dialogues/cargo-details/cargo-details.component';

@Component({
  selector: 'app-bookings-card',
  templateUrl: './bookings-card.component.html',
  styleUrls: ['./bookings-card.component.scss']
})
export class BookingsCardComponent implements OnInit {
  public baseExternalAssets: string = baseExternalAssets;
  public statusCode: any = statusCode;
  constructor(private _router: Router, private modalService: NgbModal) { }
  @Input() booking: any
  ngOnInit() {
    // console.log(this.booking)
  }

  getCustomerImage($image: string) {
    if (isJSON($image)) {
      const providerImage = JSON.parse($image)
      return baseExternalAssets + '/' + providerImage[0].DocumentFile
    } else {
      return getImagePath(ImageSource.FROM_SERVER, $image, ImageRequiredSize.original)
    }
  }

  viewBookingDetails() {
    if (this.booking.BookingTab.toLowerCase() === 'saved' || this.booking.BookingTab.toLowerCase() === 'specialrequest') {
      return;
    }
    console.log(this.booking.BookingID, this.booking.ProviderID, this.booking.ShippingModeCode)
    let id = encryptBookingID(this.booking.BookingID, this.booking.ProviderID, this.booking.ShippingModeCode);
    this._router.navigate(['/provider/booking-detail', id]);
  }

  public cachedLogs: any[] = []
  updatePrice() {
    const modalRef = this.modalService.open(UpdatePriceComponent, {
      size: 'lg',
      centered: true,
      windowClass: 'mid-size-popup',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.result.then((result) => {
      if (result) {
        console.log(result)
        this.booking.BookingSpecialAmount = result.price;
        this.booking.SpecialRequestStatus = result.status
        this.cachedLogs = result.logs
      }
    });
    modalRef.componentInstance.data = this.booking;
    setTimeout(() => {
      if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
        document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
      }
    }, 0);
  }

  viewLogs() {
    const modalRef = this.modalService.open(PriceLogsComponent, {
      size: 'lg',
      centered: true,
      windowClass: 'mid-size-popup',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.result.then((result) => {
      if (result) {
        console.log(result)
        // this.booking.BookingSpecialAmount = result;
      }
    });
    modalRef.componentInstance.data = {
      booking: this.booking,
      logs: this.cachedLogs
    }
    setTimeout(() => {
      if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
        document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
      }
    }, 0);
  }

  openCargoDetails() {
    const modalRef = this.modalService.open(CargoDetailsComponent, {
      size: 'lg',
      centered: true,
      windowClass: 'carge-detail',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.result.then((result) => {
      if (result) {
        console.log(result)
        // this.booking.BookingSpecialAmount = result;
      }
    });
    modalRef.componentInstance.data = this.booking
    setTimeout(() => {
      if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
        document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
      }
    }, 0);
  }

  // getUIImage($image: string) {
  //   return getImagePath(ImageSource.FROM_SERVER, $image, ImageRequiredSize.original)
  // }

  // getProviderImage($image: string) {
  //   const providerImage = getProviderImage($image)
  //   return getImagePath(ImageSource.FROM_SERVER, providerImage, ImageRequiredSize.original)
  // }
}
