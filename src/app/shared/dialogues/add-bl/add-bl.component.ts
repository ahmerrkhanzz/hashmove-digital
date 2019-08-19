import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ViewBookingService } from '../../../components/pages/user-desk/view-booking/view-booking.service';
import { ToastrService } from 'ngx-toastr';
import { JsonResponse } from '../../../interfaces/JsonResponse';

@Component({
  selector: 'app-add-bl',
  templateUrl: './add-bl.component.html',
  styleUrls: ['./add-bl.component.scss']
})
export class AddBlComponent implements OnInit {
  @Input() data: any
  BLNo
  constructor(
    public _activeModal: NgbActiveModal,
    private _viewBookingService: ViewBookingService,
    private _toastr: ToastrService) { }

  ngOnInit() {
    console.log(this.data)
    this.BLNo = this.data.BLNo
  }

  close(data) {
    this._activeModal.close(data)
    document.getElementsByTagName('html')[0].style.overflowY = 'auto';
  }

  saveBL() {
    if (!this.BLNo) {
      this._toastr.error('Please provider B/L number', 'Error')
      return;
    }
    let obj = {
      bookingID: this.data.BookingID,
      blNo: this.BLNo
    }
    this._viewBookingService.saveBLNumber(obj).subscribe((res: JsonResponse) => {
      if (res.returnId > 0) {
        this._toastr.success('B/L number added successfully', 'Success')
        this.close(this.BLNo)
      } else {
        if (res.returnObject && res.returnObject.length > 0) {
          let newString = ''
          try {
            newString += res.returnText + ' <br>'
            const { returnObject } = res
            returnObject.forEach(str => {
              newString += str + ' <br>'
            });
          } catch (error) {
            newString = res.returnText
          }
          console.log(newString);

          this._toastr.warning(newString, '', { enableHtml: true })
        } else {
          this._toastr.warning(res.returnText)
        }
      }
    }, (err: any) => {
      this._toastr.error('There was a problem while updating, please try again later')
      console.log(err)
    })
  }

}
