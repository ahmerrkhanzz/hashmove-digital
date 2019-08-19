import { Component, OnInit, Input } from '@angular/core';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ViewBookingService } from '../../../components/pages/user-desk/view-booking/view-booking.service';
import { Reasons } from '../../../interfaces/reasons';
import { HttpErrorResponse } from '@angular/common/http';
import { loading } from '../../../constants/globalFunctions';
import { ToastrService } from "ngx-toastr";
import { PlatformLocation } from '@angular/common';
import { CommonService } from '../../../services/common.service';
import { JsonResponse } from '../../../interfaces/JsonResponse';

@Component({
  selector: 'app-booking-status-updation',
  templateUrl: './booking-status-updation.component.html',
  styleUrls: ['./booking-status-updation.component.scss']
})
export class BookingStatusUpdationComponent implements OnInit {
  @Input() modalData: any;
  public label: string;
  public description: string;
  public bookingReasons: BookingReason[] = [];
  public notifyReasons: any[] = [];
  public bookingStatuses: BookingStatus[] = [];
  public activityStatus: ActivityStatus[] = [];
  public actionObj: Reasons;
  public notifyActionObj: any;
  public cancelledStatus: any;
  public selectPlaceholder: string;
  public selectedReason = {
    remarks: '',
    status: '',
    id: 0
  };
  public userInfo: any

  constructor(
    private modalService: NgbModal,
    private _viewBookingService: ViewBookingService,
    private _toast: ToastrService,
    private location: PlatformLocation,
    private _commonService: CommonService,
    public _activeModal: NgbActiveModal) { location.onPopState(() => this.closeModal(null)); }



  ngOnInit() {
    console.log(this.modalData);
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.returnText) {
      this.userInfo = JSON.parse(userInfo.returnText);
    }
    if (this.modalData.type === 'cancel') {
      this.label = 'Cancel Booking'
      this.description = 'Please provide the reason of cancellation.'
      this.selectPlaceholder = 'Select Reason';
      this.getBookingReasons();
    } else if (this.modalData.type === 'notify') {
      this.label = 'Notify Customer'
      this.description = 'Please provide the reason of notification.'
      this.selectPlaceholder = 'Select Reason';
      this.getNotifyReasons();
    } else if (this.modalData.type === 'updated') {
      this.label = 'Update Status'
      this.description = "Where's the Shipment?"
      this.selectPlaceholder = 'Select Status';
      this.getBookingStatuses('status');
    } else if (this.modalData.type === 'sub-status') {
      this.label = 'Update Status'
      this.description = "Where's the Shipment?"
      this.selectPlaceholder = 'Select Status';
      this.getBookingStatuses('sub-status');
    }
  }



  getBookingReasons() {
    this._viewBookingService.getBookingReasons().subscribe((res: any) => {
      if (res.returnStatus == "Success") {
        this.bookingReasons = res.returnObject
      }
    }, (err: HttpErrorResponse) => {
      console.log(err);
    })
  }

  getNotifyReasons() {
    this._commonService.getMstCodeVal('NOTIFY_REASON').subscribe((res: any) => {
      console.log(res)
      this.notifyReasons = res
    }, (err: any) => {
      console.log(err)
    })
  }

  getBookingStatuses(status) {
    if (status === 'status') {
      const toSend: string = (this.modalData.booking.ShippingModeCode === 'WAREHOUSE') ? 'WAREHOUSE' : 'BOOKING'
      this._viewBookingService.getBookingStatuses(toSend).subscribe((res: any) => {
        if (res.returnStatus == "Success") {
          let data = res.returnObject.filter(e => e.BusinessLogic.toLowerCase() !== 'cancelled' && e.BusinessLogic.toLowerCase() !== 'draft');
          this.bookingStatuses = data.filter(e => e.BusinessLogic.toLowerCase() !== this.modalData.bookingStatus.toLowerCase())
        }
      }, (err: HttpErrorResponse) => {
        loading(false);
        console.log(err);
      })
    } else if ('sub-status') {
      this._viewBookingService.getBookingSubStatuses('BOOKING', this.modalData.booking.StatusID).subscribe((res: JsonResponse) => {
        const { returnId, returnStatus, returnObject } = res
        if (returnStatus == "Success") {
          this.activityStatus = returnObject
        }
      }, (err: HttpErrorResponse) => {
        loading(false);
        console.log(err);
      })
    }
  }

  onModelChange(model: any) {
    console.log(model.target.value);
    if (model) {
      this.selectedReason.id = parseInt(model.target.value)
      if (this.modalData.type === 'updated') {
        const status = this.bookingStatuses.filter(s => s.StatusID == this.selectedReason.id)[0]
        const { StatusName, StatusID } = status
        this.selectedReason = {
          id: StatusID,
          remarks: '',
          status: StatusName
        }
        console.log(this.selectedReason);
      } else if (this.modalData.type === 'sub-status') {
        const status = this.activityStatus.filter(s => s.ActivityID == this.selectedReason.id)[0]
        const { ActivityName, ActivityID } = status
        this.selectedReason = {
          id: ActivityID,
          remarks: '',
          status: ActivityName
        }
        console.log(this.selectedReason);
      } else if (this.modalData.type === 'notify') {
        const status = this.notifyReasons.filter(s => s.codeValID == this.selectedReason.id)[0]
        const { codeValID, codeValDesc } = status
        this.selectedReason = {
          id: codeValID,
          remarks: '',
          status: codeValDesc
        }
        console.log(this.selectedReason);
      } else {
        const status = this.bookingReasons.filter(s => s.ReasonID == this.selectedReason.id)[0]
        const { ReasonID, ReasonName } = status
        this.selectedReason = {
          id: ReasonID,
          remarks: '',
          status: ReasonName
        }
        console.log(this.selectedReason);
      }
    }
  }

  submit() {
    if (this.modalData.type === 'cancel') {
      const { id, remarks, status } = this.selectedReason;
      if (id && remarks) {
        this.actionObj = {
          bookingID: this.modalData.bookingID,
          bookingStatus: "CANCELLED",
          bookingStatusRemarks: remarks,
          createdBy: this.modalData.loginID,
          modifiedBy: this.modalData.loginID,
          approverID: this.modalData.providerID,
          approverType: 'PROVIDER',
          reasonID: id,
          reasonText: status,
          providerName: this.modalData.booking.ProviderName,
          emailTo: (this.modalData.booking && this.modalData.booking.BookingUserInfo && this.modalData.booking.BookingUserInfo.PrimaryEmail) ? this.modalData.booking.BookingUserInfo.PrimaryEmail : '',
          phoneTo: (this.modalData.booking && this.modalData.booking.BookingUserInfo && this.modalData.booking.BookingUserInfo.PrimaryPhone) ? this.modalData.booking.BookingUserInfo.PrimaryPhone : '',
          userName: this.modalData.booking.UserName,
          hashMoveBookingNum: this.modalData.booking.HashMoveBookingNum,
          userCountryPhoneCode: this.modalData.booking.UserCountryPhoneCodeID
        }
        this._viewBookingService.cancelBooking(this.actionObj).subscribe((res: any) => {
          if (res.returnId > 0) {
            this._toast.success(res.returnText, 'Success');
            let obj = {
              bookingStatus: res.returnObject.bookingStatus,
              shippingStatus: res.returnObject.shippingStatus,
              resType: res.returnStatus
            }
            this.closeModal(obj);
          } else {
            this._toast.error(res.returnText, 'Failed');
          }
        }, (err: HttpErrorResponse) => {
          console.log(err);
        })
      }
    } else if (this.modalData.type === 'updated') {
      const { status, id } = this.selectedReason;
      if (status && id) {
        this.actionObj = {
          bookingID: this.modalData.bookingID,
          bookingStatus: status,
          bookingStatusRemarks: "",
          createdBy: this.modalData.loginID,
          modifiedBy: this.modalData.loginID,
          approverID: this.modalData.providerID,
          approverType: 'PROVIDER',
          reasonID: id,
          reasonText: status,
          providerName: this.modalData.booking.ProviderName,
          emailTo: (this.modalData.booking && this.modalData.booking.BookingUserInfo && this.modalData.booking.BookingUserInfo.PrimaryEmail) ? this.modalData.booking.BookingUserInfo.PrimaryEmail : '',
          phoneTo: (this.modalData.booking && this.modalData.booking.BookingUserInfo && this.modalData.booking.BookingUserInfo.PrimaryPhone) ? this.modalData.booking.BookingUserInfo.PrimaryPhone : '',
          userName: this.modalData.booking.UserName,
          hashMoveBookingNum: this.modalData.booking.HashMoveBookingNum,
          userCountryPhoneCode: this.modalData.booking.UserCountryPhoneCodeID
        }
        this._viewBookingService.updateBookingStatus(this.actionObj).subscribe((res: any) => {
          if (res.returnId > 0) {
            this._toast.success(res.returnText, 'Success');
            let obj = {
              bookingStatus: res.returnObject.bookingStatus,
              shippingStatus: res.returnObject.shippingStatus,
              statusID: res.returnObject.statusID,
              resType: res.returnStatus,
            }
            this.closeModal(obj);
          } else {
            this._toast.error(res.returnText, 'Failed');
          }
        }, (err: HttpErrorResponse) => {
          console.log(err);
        })
      }
    } else if (this.modalData.type === 'notify') {
      const { id, remarks, status } = this.selectedReason;
      if (id && remarks) {
        this.notifyActionObj = {
          bookingID: this.modalData.bookingID,
          userID: this.modalData.booking.UserID,
          providerID: this.userInfo.ProviderID,
          userName: this.modalData.booking.UserName,
          userCompanyName: this.modalData.booking.BookingUserInfo.CompanyName,
          providerName: this.userInfo.FirstNameBL + ' ' + this.userInfo.LastNameBL,
          providerCompanyName: this.modalData.booking.ProviderName,
          hashMoveBookingNum: this.modalData.booking.HashMoveBookingNum,
          reasonText: status,
          reasonRemarks: remarks,
          userEmail: (this.modalData.booking && this.modalData.booking.BookingUserInfo && this.modalData.booking.BookingUserInfo.PrimaryEmail) ? this.modalData.booking.BookingUserInfo.PrimaryEmail : '',
          providerEmail: this.modalData.booking.ProviderEmail
        }
        this._viewBookingService.notifyCustomer(this.notifyActionObj).subscribe((res: any) => {
          if (res.returnId > 0) {
            this.closeModal('notify');
          } else {
            this._toast.error(res.returnText, 'Failed');
          }
        }, (err: HttpErrorResponse) => {
          console.log(err);
        })
      }
    } else if (this.modalData.type === 'sub-status') {
      const { status, id, remarks } = this.selectedReason;
      if (status && id) {
        const toSend = {
          bookingID: this.modalData.bookingID,

          activityBy: "PROVIDER",
          activityByID: this.modalData.providerID,
          statusID: this.modalData.booking.StatusID, //booking status
          activityID: id,
          bookingActivity: status,
          bookingActivityDate: "2019-08-07T10:46:37.616Z",
          bookingActivityRemarks: remarks,
          createdBy: this.modalData.loginID,
          modifiedBy: this.modalData.loginID,
          approverID: this.modalData.providerID,
          approverType: 'PROVIDER',
          providerName: this.modalData.booking.ProviderName,
          emailTo: (this.modalData.booking && this.modalData.booking.BookingUserInfo && this.modalData.booking.BookingUserInfo.PrimaryEmail) ? this.modalData.booking.BookingUserInfo.PrimaryEmail : '',
          phoneTo: (this.modalData.booking && this.modalData.booking.BookingUserInfo && this.modalData.booking.BookingUserInfo.PrimaryPhone) ? this.modalData.booking.BookingUserInfo.PrimaryPhone : '',
          userName: this.modalData.booking.UserName,
          hashMoveBookingNum: this.modalData.booking.HashMoveBookingNum,
          userCountryPhoneCode: this.modalData.booking.UserCountryPhoneCodeID,

        }
        this._viewBookingService.updateBookingActivity(toSend).subscribe((res: any) => {
          if (res.returnId > 0) {
            this._toast.success(res.returnText, 'Success');
            const prasedObject = JSON.parse(res.returnObject)
            let obj = {
              activityStatus: prasedObject.BookingActivity,
              resType: res.returnStatus,
              modalType: this.modalData.type
            }
            this.closeModal(obj);
          } else {
            this._toast.error(res.returnText, 'Failed');
          }
        }, (err: HttpErrorResponse) => {
          console.log(err);
        })
      }
    }
  }
  closeModal(resType) {
    this._activeModal.close(resType);
    document.getElementsByTagName('html')[0].style.overflowY = 'auto';

  }


}

export interface BookingStatus {
  BusinessLogic?: string;
  StatusCode?: string;
  StatusID?: number;
  StatusName?: string;
}

export interface ActivityStatus {
  ActivityID: 106;
  ActivityCode: string;
  ActivityName: string;
  BusinessLogic: string;
}

export interface BookingReason {
  BusinessLogic?: string;
  ReasonCode?: string;
  ReasonID?: number;
  ReasonName?: string;
  SortingOrder?: string;
}
