import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { getImagePath, ImageSource, ImageRequiredSize } from '../../../constants/globalFunctions';
import { ViewBookingService } from '../../../components/pages/user-desk/view-booking/view-booking.service';
import * as moment from 'moment';
import { JsonResponse } from '../../../interfaces/JsonResponse';
import { ToastrService } from 'ngx-toastr';



@Component({
  selector: 'app-vessel-schedule-dialog',
  templateUrl: './vessel-schedule-dialog.component.html',
  styleUrls: ['./vessel-schedule-dialog.component.scss'],
})
export class VesselScheduleDialogComponent implements OnInit {
  @Input() data: any;
  public selectedSchedule: any
  constructor(
    private activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private _viewBookingService: ViewBookingService,
    private _toastr: ToastrService
  ) {
  }

  ngOnInit() {
    console.log(this.data)
    if (this.data.bookingID > -1) {
      this.data.date.month = this.data.date.month - 1
      this.data.date = moment(this.data.date).format('D MMM, Y')
    }
  }

  closeModal() {
    this.activeModal.close();
    document.getElementsByTagName('html')[0].style.overflowY = 'auto';
  }


  /**
   *
   * Get Imgages for Shipping Lines
   * @param {string} $image
   * @returns
   * @memberof VesselScheduleDialogComponent
   */
  getShippingLineImage($image: string) {
    return getImagePath(
      ImageSource.FROM_SERVER,
      "/" + $image,
      ImageRequiredSize.original
    );
  }

  selectSchedule(item) {
    this.selectedSchedule = item;
  }

  confirmSchedule() {
    this.selectedSchedule.bookingID = this.data.bookingID
    this._viewBookingService.saveCarrierSchedule(this.selectedSchedule).subscribe((res: JsonResponse) => {
      console.log(res)
      const { returnId, returnObject, returnText } = res
      if (returnId > 0) {
        this.activeModal.close(returnObject);
      } else {
        this._toastr.error(returnText)
      }
    }, (err: any) => {
      this._toastr.error('There was an error while processing your request, Please try again later.', 'Error')
      console.log(err)
    })
  }

}

