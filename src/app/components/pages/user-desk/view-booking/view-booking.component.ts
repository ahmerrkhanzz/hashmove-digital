import { Component, OnInit, ViewEncapsulation, OnDestroy, trigger, transition, style, animate, ViewChild } from '@angular/core';
import { ToastrService } from "ngx-toastr";
import { ActivatedRoute } from "@angular/router";
import { NgbModal, NgbDateStruct, NgbDateParserFormatter, NgbAccordion, NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { loading, getImagePath, ImageSource, ImageRequiredSize, statusCode, EMAIL_REGEX, isJSON, getLoggedUserData, } from "../../../../constants/globalFunctions";
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BookingDetails } from '../../../../interfaces/bookingDetails';
import { CommonService } from '../../../../services/common.service';
import { ViewBookingService } from './view-booking.service';
import { BookingInvoiceComponent } from '../booking-invoice/booking-invoice.component';
import { ReUploadDocComponent } from '../../../../shared/dialogues/re-upload-doc/re-upload-doc.component';
import { IconSequence } from '@agm/core/services/google-maps-types';
import { baseExternalAssets } from '../../../../constants/base.url';
import { LatLngBounds } from '@agm/core';
import { BookingStatusUpdationComponent } from '../../../../shared/dialogues/booking-status-updation/booking-status-updation.component';
import { SharedService } from '../../../../services/shared.service';
import { UserDocument, DocumentFile, MetaInfoKeysDetail } from '../../../../interfaces/document.interface';
import { cloneObject } from '../reports/reports.component';
import { JsonResponse } from '../../../../interfaces/JsonResponse';
import * as moment from 'moment'
import { DashboardService } from '../dashboard/dashboard.service';
import { BookingDocumentDetail } from '../../../../interfaces/booking.interface';
import { UploadComponent } from '../../../../shared/upload-component/upload-component';
import { VesselScheduleDialogComponent } from '../../../../shared/dialogues/vessel-schedule-dialog/vessel-schedule-dialog.component';
import { Observable } from 'rxjs/Observable';
import { debounceTime, map } from 'rxjs/operators';
import { NgbDateFRParserFormatter } from "../../../../constants/ngb-date-parser-formatter";
import { untilDestroyed } from 'ngx-take-until-destroy';
import { AddContainersComponent } from '../../../../shared/dialogues/add-containers/add-containers.component';
import { AddBlComponent } from '../../../../shared/dialogues/add-bl/add-bl.component';
declare var google: any;

@Component({
  selector: 'app-view-booking',
  templateUrl: './view-booking.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./view-booking.component.scss'],
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({ transform: 'translateY(-20%)', opacity: 0 }),
          animate('300ms', style({ transform: 'translateY(0)', opacity: 1 }))
        ]),
        transition(':leave', [
          style({ transform: 'translateY(0)', opacity: 1 }),
          animate('300ms', style({ transform: 'translateY(-20%)', opacity: 0 }))
        ])
      ]
    )
  ],
  providers: [{ provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter }]
})
export class ViewBookingComponent implements OnInit, OnDestroy {
  @ViewChild('dp') eventDate;
  public readMoreClass = false;
  public readMoreClass2 = false;
  public vendorAboutBtn: any = "Read More";
  public vendorAboutBtn2: any = "Read More";

  public statusCode: any = statusCode;
  public zoomlevel: number = 2;
  public location: any = { lat: undefined, lng: undefined };
  public bookingDetails: BookingDetails;
  public paramSubscriber: any;
  public HelpDataLoaded: boolean;
  // public ProviderEmails: any[];
  public helpSupport: any;
  public baseExternalAssets: string = baseExternalAssets;
  public certOrigin;
  public ladingBill;
  public invoiceDocOrigin;
  public invoiceDocDestination;
  public packingListDocOrigin;
  public packingListDocDestination;
  private userProfile;
  private bookingId;
  public mapOrgiToDest: any = [];
  public icon = {
    url: "../../../../../assets/images/icons/Icons_Location_blue.svg",
    scaledSize: {
      width: 25,
      height: 25
    }
  }
  public polyOptions: IconSequence = {
    icon: {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      scale: 4
    },
    offset: '0',
    repeat: '20px'
  }
  public bookingReasons = [];
  public bookingStatuses = [];
  public countryList: any[] = [];
  public selectedReason: any = {};
  private approvedStatus: any;

  // forms
  public AgentInfoFormOrigin: any;
  public AgentInfoFormDest: any;

  public agentDestphoneCode: string;
  public agentFlagImgDest: string;
  public agentDestCountryId: string;
  public agentOrgphoneCode: string;
  public agentFlagImgOrg: string;
  public agentOrgCountryId: string;

  // togglers
  public editAgentorgToggler: boolean = false
  public editAgentDestToggler: boolean = false

  public wareHouse: any = {};
  public showScheduler: boolean = true
  public searchCriteria: any
  public isTruck: boolean = false;

  constructor(
    private _modalService: NgbModal,
    private _toast: ToastrService,
    private _viewBookingService: ViewBookingService,
    private _router: ActivatedRoute,
    private _commonService: CommonService,
    private _sharedService: SharedService,
    private _dashboardService: DashboardService
  ) { }

  ngOnInit() {
    this.setInit()
    console.log(this.bookingDetails)
    let userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.returnText) {
      this.userProfile = JSON.parse(userInfo.returnText);
    }

    this._commonService.getCountryList().subscribe((res: any) => {
      try {
        let List: any = res;
        List.map(obj => {
          obj.desc = JSON.parse(obj.desc);
        });
        this.countryList = List;
      } catch (error) { }
      this.getParams();
    }, error => {
      this.getParams();
    })

    this.AgentInfoFormOrigin = new FormGroup({
      name: new FormControl(null, [Validators.required, Validators.pattern(/[a-zA-Z-][a-zA-Z -]*$/), Validators.minLength(2), Validators.maxLength(100)]),
      address: new FormControl(null, [Validators.required, Validators.maxLength(200), Validators.minLength(10), Validators.pattern(/^(?=.*?[a-zA-Z])[^%*$=+^<>}{]+$/)]),
      email: new FormControl(null, [
        Validators.required,
        Validators.pattern(EMAIL_REGEX),
        Validators.maxLength(320)
      ]),
      contact: new FormControl(null, [Validators.required, Validators.pattern(/^(?!(\d)\1+(?:\1+){0}$)\d+(\d+){0}$/), Validators.minLength(7), Validators.maxLength(13)]),
    });
    this.AgentInfoFormDest = new FormGroup({
      name: new FormControl(null, [Validators.required, Validators.pattern(/[a-zA-Z-][a-zA-Z -]*$/), Validators.minLength(2), Validators.maxLength(100)]),
      address: new FormControl(null, [Validators.required, Validators.maxLength(200), Validators.minLength(10), Validators.pattern(/^(?=.*?[a-zA-Z])[^%*$=+^<>}{]+$/)]),
      email: new FormControl(null, [
        Validators.required,
        Validators.pattern(EMAIL_REGEX),
        Validators.maxLength(320)
      ]),
      contact: new FormControl(null, [Validators.required, Validators.pattern(/^(?!(\d)\1+(?:\1+){0}$)\d+(\d+){0}$/), Validators.minLength(7), Validators.maxLength(13)]),
    });

    this._commonService.getHelpSupport(true).subscribe((res: any) => {
      if (res.returnId > 0) {
        this.helpSupport = JSON.parse(res.returnText)
        this.HelpDataLoaded = true
      }
    })
  }
  getParams() {
    this.paramSubscriber = this._router.params.pipe(untilDestroyed(this)).subscribe(params => {
      this.bookingId = params['id'];
      // (+) converts string 'id' to a number
      if (this.bookingId) {
        this.getBookingDetail(this.bookingId);
        this.getdocStatus();
      }
    });
  }

  setAgentOrgInfo() {
    this.editAgentorgToggler = false;
    if (this.bookingDetails.JsonAgentOrgInfo.Name) {
      this.AgentInfoFormOrigin.controls['name'].setValue(this.bookingDetails.JsonAgentOrgInfo.Name);
    }
    if (this.bookingDetails.JsonAgentOrgInfo.Email) {
      this.AgentInfoFormOrigin.controls['email'].setValue(this.bookingDetails.JsonAgentOrgInfo.Email);
    }
    if (this.bookingDetails.JsonAgentOrgInfo.Address) {
      this.AgentInfoFormOrigin.controls['address'].setValue(this.bookingDetails.JsonAgentOrgInfo.Address);
    }
    if (this.bookingDetails.JsonAgentOrgInfo.PhoneNumber) {
      this.AgentInfoFormOrigin.controls['contact'].setValue(this.bookingDetails.JsonAgentOrgInfo.PhoneNumber);
    }
    if (this.bookingDetails.JsonAgentOrgInfo.PhoneCountryID) {
      let object = this.countryList.find(obj => obj.id == this.bookingDetails.JsonAgentOrgInfo.PhoneCountryID);
      this.agentFlagImgOrg = object.code;
      let description = object.desc;
      this.agentOrgphoneCode = description[0].CountryPhoneCode;
      this.agentOrgCountryId = object.id
    }

  }
  setAgentDestInfo() {
    this.editAgentDestToggler = false;
    if (this.bookingDetails.JsonAgentDestInfo.Name) {
      this.AgentInfoFormDest.controls['name'].setValue(this.bookingDetails.JsonAgentDestInfo.Name);
    }
    if (this.bookingDetails.JsonAgentDestInfo.Email) {
      this.AgentInfoFormDest.controls['email'].setValue(this.bookingDetails.JsonAgentDestInfo.Email);
    }
    if (this.bookingDetails.JsonAgentDestInfo.Address) {
      this.AgentInfoFormDest.controls['address'].setValue(this.bookingDetails.JsonAgentDestInfo.Address);
    }
    if (this.bookingDetails.JsonAgentDestInfo.PhoneNumber) {
      this.AgentInfoFormDest.controls['contact'].setValue(this.bookingDetails.JsonAgentDestInfo.PhoneNumber);
    }
    if (this.bookingDetails.JsonAgentDestInfo.PhoneCountryID) {
      let object = this.countryList.find(obj => obj.id == this.bookingDetails.JsonAgentDestInfo.PhoneCountryID);
      this.agentFlagImgDest = object.code;
      let description = object.desc;
      this.agentDestphoneCode = description[0].CountryPhoneCode;
      this.agentDestCountryId = object.id
    }

  }
  updateAgentInfoOrig() {
    let obj = {
      BookingNature: (this.bookingDetails.ShippingModeCode == "WAREHOUSE") ? 'WH' : "SEA",
      BookingID: this.bookingDetails.BookingID,
      LoginUserID: this.userProfile.LoginID,
      PortNature: 'Origin',
      ContactInfoFor: 'Agent',
      BookingSupDistInfo: {
        BookingID: this.bookingDetails.BookingID,
        Name: this.AgentInfoFormOrigin.value.name,
        Address: this.AgentInfoFormOrigin.value.address,
        Email: this.AgentInfoFormOrigin.value.email,
        PhoneNumber: this.AgentInfoFormOrigin.value.contact,
        PhoneCountryCode: this.agentOrgphoneCode,
        PhoneCountryID: this.agentOrgCountryId,
        InfoFor: "Agent"
      }
    }
    this._viewBookingService.updateAgentInfo(obj).subscribe((res: any) => {
      if (res.returnStatus == "Success") {
        this._toast.success('Agent information is updated', '');
        this.editAgentorgToggler = true;
        if (res.returnText && isJSON(res.returnText)) {
          this.bookingDetails.JsonAgentOrgInfo = JSON.parse(res.returnText);
        }
      }
    })


  }

  updateAgentInfoDest() {
    let obj = {
      BookingNature: (this.bookingDetails.ShippingModeCode == "WAREHOUSE") ? 'WH' : "SEA",
      BookingID: this.bookingDetails.BookingID,
      LoginUserID: this.userProfile.LoginID,
      PortNature: 'Destination',
      ContactInfoFor: 'Agent',
      BookingSupDistInfo: {
        BookingID: this.bookingDetails.BookingID,
        Name: this.AgentInfoFormDest.value.name,
        Address: this.AgentInfoFormDest.value.address,
        Email: this.AgentInfoFormDest.value.email,
        PhoneNumber: this.AgentInfoFormDest.value.contact,
        PhoneCountryCode: this.agentDestphoneCode,
        PhoneCountryID: this.agentDestCountryId,
        InfoFor: "Agent"
      }
    }
    this._viewBookingService.updateAgentInfo(obj).subscribe((res: any) => {
      if (res.returnStatus == "Success") {
        this._toast.success('Agent information is updated', '');
        this.editAgentDestToggler = true;
        if (res.returnText && isJSON(res.returnText)) {
          this.bookingDetails.JsonAgentDestInfo = JSON.parse(res.returnText);
        }
      }
    })


  }
  selectPhoneCode(list, type) {
    if (type == 'origin') {
      this.agentFlagImgOrg = list.code;
      let description = list.desc;
      this.agentOrgphoneCode = description[0].CountryPhoneCode;
      this.agentOrgCountryId = list.id
    }
    else if (type == 'destination') {
      this.agentFlagImgDest = list.code;
      let description = list.desc;
      this.agentDestphoneCode = description[0].CountryPhoneCode;
      this.agentDestCountryId = list.id
    }
  }

  mapInit(map) {
    const bounds: LatLngBounds = new google.maps.LatLngBounds();
    for (const mm of this.mapOrgiToDest) {
      bounds.extend(new google.maps.LatLng(mm.lat, mm.lng));
    }
    map.fitBounds(bounds);
  }

  ngOnDestroy() {
    // this.paramSubscriber.unsubscribe();
  }
  getBookingDetail(bookingId) {
    loading(true);
    this._viewBookingService.getBookingDetails(bookingId).subscribe((res: any) => {
      loading(false);
      if (res.returnId > 0) {
        this.bookingDetails = JSON.parse(res.returnText);
        this.getCarrierSchedule('summary')
        this.bookingDetails.BookingContainerDetail.forEach(e => {
          e.parsedJsonContainerInfo = JSON.parse(e.JsonContainerInfo)
        })
        if (this.bookingDetails.CarrierName) {
          this.showScheduler = false
        }
        // this.bookingDetails.ProviderDisplayImage = getImagePath(ImageSource.FROM_SERVER, this.bookingDetails.ProviderImage[0].ProviderLogo, ImageRequiredSize._48x48)
        // this.bookingDetails.CarrierDisplayImage = getImagePath(ImageSource.FROM_SERVER, this.bookingDetails.CarrierImage, ImageRequiredSize._48x48)
        // this.bookingDetails.ProviderDisplayImage = baseExternalAssets + JSON.parse(this.bookingDetails.ProviderImage)[0].ProviderLogo;
        // this.ProviderEmails = this.bookingDetails.ProviderEmail.split(',');
        this.searchCriteria = JSON.parse(this.bookingDetails.JsonSearchCriteria)
        if (this.bookingDetails.BookingUserInfo.UserImage && this.bookingDetails.BookingUserInfo.UserImage != "[]" && isJSON(this.bookingDetails.BookingUserInfo.UserImage)) {
          this.bookingDetails.BookingUserInfo.UserImage = JSON.parse(this.bookingDetails.BookingUserInfo.UserImage)[0].DocumentFile;
        }

        if (this.bookingDetails.ShippingModeCode.toLowerCase() === 'truck') {
          this.isTruck = true
        }
        if (this.bookingDetails.ShippingModeCode != 'WAREHOUSE') {

          try {
            const { BookingDocumentDetail } = this.bookingDetails
            if (BookingDocumentDetail && BookingDocumentDetail.length > 0) {

              const add_docs_cust: any = BookingDocumentDetail.filter(doc => doc.BusinessLogic === 'BOOKING_ADD_DOC' && doc.DocumentSubProcess !== 'PROVIDER')[0]
              // const add_docs_prov: any = BookingDocumentDetail.filter(doc => doc.BusinessLogic === 'BOOKING_ADD_DOC' && doc.DocumentSubProcess === 'PROVIDER')[0]

              const adDocCustomers: any = BookingDocumentDetail.filter(doc => doc.BusinessLogic === 'BOOKING_ADD_DOC' && doc.DocumentSubProcess !== 'PROVIDER' && doc.DocumentID > 0) as any
              adDocCustomers.forEach(doc => {
                doc.ShowUpload = false;
                doc.DateModel = ''
              })
              this.additionalDocumentsCustomers = adDocCustomers
              console.log(this.additionalDocumentsCustomers);

              const adDocProviders: any = BookingDocumentDetail.filter(doc => doc.BusinessLogic === 'BOOKING_ADD_DOC' && doc.DocumentSubProcess === 'PROVIDER' && doc.DocumentID > 0) as any
              adDocProviders.forEach(doc => {
                doc.ShowUpload = false;
                doc.DateModel = ''
              })
              this.additionalDocumentsProviders = adDocProviders
              this.add_docs_cust = add_docs_cust
              // this.add_docs_prov = add_docs_prov
              try {
                this.resetAccordian()
              } catch (error) {
                console.warn(error)
              }
            }
          } catch (error) {
            console.warn(error)
          }

          if (this.bookingDetails.JsonShippingDestInfo && isJSON(this.bookingDetails.JsonShippingDestInfo)) {
            this.bookingDetails.JsonShippingDestInfo = JSON.parse(this.bookingDetails.JsonShippingDestInfo)
          }
          if (this.bookingDetails.JsonShippingOrgInfo && isJSON(this.bookingDetails.JsonShippingOrgInfo)) {
            this.bookingDetails.JsonShippingOrgInfo = JSON.parse(this.bookingDetails.JsonShippingOrgInfo)
          }
          if (this.bookingDetails.JsonAgentOrgInfo && isJSON(this.bookingDetails.JsonAgentOrgInfo)) {
            this.bookingDetails.JsonAgentOrgInfo = JSON.parse(this.bookingDetails.JsonAgentOrgInfo);
            this.editAgentorgToggler = true;
          } else if (!this.bookingDetails.JsonAgentOrgInfo) {
            let object = this.countryList.find(obj => obj.title == this.bookingDetails.PolCountry);
            this.agentFlagImgOrg = object.code;
            let description = object.desc;
            this.agentOrgphoneCode = description[0].CountryPhoneCode;
            this.agentOrgCountryId = object.id
          }

          if (this.bookingDetails.JsonAgentDestInfo && isJSON(this.bookingDetails.JsonAgentDestInfo)) {
            this.bookingDetails.JsonAgentDestInfo = JSON.parse(this.bookingDetails.JsonAgentDestInfo);
            this.editAgentDestToggler = true;
          } else if (!this.bookingDetails.JsonAgentDestInfo) {
            let object = this.countryList.find(obj => obj.title == this.bookingDetails.PodCountry);
            console.log(this.agentFlagImgDest);

            this.agentFlagImgDest = object.code;
            let description = object.desc;
            this.agentDestphoneCode = description[0].CountryPhoneCode;
            this.agentDestCountryId = object.id
          }

          this.bookingDetails.origin = this.bookingDetails.PolCode.split(' ')[0];
          this.bookingDetails.destination = this.bookingDetails.PodCode.split(' ')[0];
          this.bookingDocs();
          this.mapOrgiToDest.push(
            { lat: Number(this.bookingDetails.PolLatitude), lng: Number(this.bookingDetails.PolLongitude) },
            { lat: Number(this.bookingDetails.PodLatitude), lng: Number(this.bookingDetails.PodLongitude) });
        }
        else if (this.bookingDetails.ShippingModeCode == 'WAREHOUSE') {
          this.mapOrgiToDest.push(
            { lat: Number(this.bookingDetails.WHLatitude), lng: Number(this.bookingDetails.WHLongitude) });
          if (this.bookingDetails.WHCityName && this.bookingDetails.WHCountryName) {
            this.wareHouse.Location = this.bookingDetails.WHCityName + ', ' + this.bookingDetails.WHCountryName;
          }
          if (this.bookingDetails.WHMedia && this.bookingDetails.WHMedia != "[]" && isJSON(this.bookingDetails.WHMedia)) {
            this.bookingDetails.WHMedia = JSON.parse(this.bookingDetails.WHMedia);
            const albumArr = [];
            this.bookingDetails.WHMedia.forEach((elem) => {
              const album = {
                src: baseExternalAssets + elem.DocumentFile,
                // caption: elem.DocumentFileName,
                thumb: baseExternalAssets + elem.DocumentFile,
                DocumentUploadedFileType: elem.DocumentUploadedFileType
              };
              albumArr.push(album);
            })
            this.wareHouse.parsedGallery = albumArr;
          }
          if (this.bookingDetails.ActualScheduleDetail && isJSON(this.bookingDetails.ActualScheduleDetail)) {
            let facilities = JSON.parse(
              this.bookingDetails.ActualScheduleDetail
            ).WHFacilities;
            if (facilities && isJSON(facilities)) {
              this.wareHouse.FacilitiesProviding = JSON.parse(facilities);
            }
          }
          if (this.bookingDetails.BookingJsonDetail && this.bookingDetails.BookingJsonDetail != "[]" && isJSON(this.bookingDetails.BookingJsonDetail)) {
            let wareHouseDetail = JSON.parse(
              this.bookingDetails.BookingJsonDetail
            );
            this.wareHouse.WHName = wareHouseDetail.WHName;
            this.wareHouse.WHDesc = wareHouseDetail.WHDesc;
            this.wareHouse.TotalCoveredArea = wareHouseDetail.AvailableSQFT;
          }
          if (this.bookingDetails.JsonSearchCriteria) {
            let searchCriteria = JSON.parse(
              this.bookingDetails.JsonSearchCriteria
            );

            this.wareHouse.storageType = searchCriteria.storageType;
            if (this.wareHouse.storageType !== "full") {
              this.wareHouse.StoreFrom = searchCriteria.StoreFrom;
              this.wareHouse.StoreUntill = searchCriteria.StoreUntill;
              if (searchCriteria.searchBy == "by_area") {
                this.wareHouse.TotalCoveredAreaUnit = "sqft";
                this.wareHouse.bookedArea = searchCriteria.SQFT;
              } else if (searchCriteria.searchBy == "by_pallet") {
                this.wareHouse.TotalCoveredAreaUnit = "PLT";
                this.wareHouse.bookedArea = searchCriteria.PLT
              } else {
                this.wareHouse.TotalCoveredAreaUnit = "cbm";
                this.wareHouse.bookedArea = searchCriteria.CBM
              }
            } else {
              this.wareHouse.minimumLeaseTerm = searchCriteria.minimumLeaseTermString;
              this.wareHouse.spaceReqWarehouse = searchCriteria.spaceReqString
              this.wareHouse.TotalCoveredAreaUnit = "sqft";
            }
          }
        }
        // this.mapInit();
      } else {
        this._toast.error('Unable to find this booking. Please check the link and try again', 'Failed to Fetch Data')
      }
    }, (err: HttpErrorResponse) => {
      loading(false);
      console.log(err);
    })
  }

  bookingDocs() {
    this.bookingDetails.BookingDocumentDetail.forEach((obj) => {
      if (obj.DocumentNature == "CERTIFICATE") {
        this.certOrigin = obj;
      }
      else if (obj.DocumentNature == "CUSTOM_DOC") {
        this.ladingBill = obj;
      }
      else if (obj.DocumentNature == "CUSTOM_DOC") {
        this.ladingBill = obj;
      }
      else if (obj.DocumentNature == "INVOICE") {
        if (obj.DocumentSubProcess == "ORIGIN") {
          this.invoiceDocOrigin = obj;
        }
        else {
          this.invoiceDocDestination = obj;
        }
      }
      else if (obj.DocumentNature == "PACKING_LIST") {
        if (obj.DocumentSubProcess == "ORIGIN") {
          this.packingListDocOrigin = obj;
        }
        else {
          this.packingListDocDestination = obj;
        }
      }
    })
  }
  viewInvoice() {
    const modalRef = this._modalService.open(BookingInvoiceComponent, {
      size: 'lg',
      centered: true,
      windowClass: 'small-modal',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.BookingInvoiceDet = this.bookingDetails;
    setTimeout(() => {
      if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
        document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
      }
    }, 0);
  }
  downloadDoc(object, event) {
    if (object && object.DocumentFileName && object.IsDownloadable) {
      if (object.DocumentFileName.startsWith("[{")) {
        let document = JSON.parse(object.DocumentFileName)
        window.open(baseExternalAssets + document[0].DocumentFile, '_blank');
      } else {
        window.open(baseExternalAssets + object.DocumentFileName, '_blank');
      }
    }
    else {
      event.preventDefault();
    }
  }

  reuploadDoc(data, acc?, $id?) {
    if (acc) {
      console.log(acc, $id)
      try {
        acc.toggle($id)
      } catch (error) {
        console.warn(error)
      }
    }

    const modalRef = this._modalService.open(ReUploadDocComponent, {
      size: 'lg',
      centered: true,
      windowClass: 'medium-modal',
      backdrop: 'static',
      keyboard: false
    });
    let obj = {
      docTypeID: data.DocumentTypeID,
      docID: data.DocumentID,
      userID: this.userProfile.UserID,
      createdBy: this.userProfile.LoginID,
      bookingData: this.bookingDetails
    }
    modalRef.result.then((result) => {
      if (result.resType == "Success") {
        data.DocumentLastStatus = result.status;
      }
    });
    modalRef.componentInstance.documentObj = obj;

    setTimeout(() => {
      if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
        document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
      }
    }, 0);
  }

  printDetail() {
    let doc = window as any;
    doc.print()
  }

  openDialogue(type) {
    const modalRef = this._modalService.open(BookingStatusUpdationComponent, {
      size: 'lg',
      windowClass: 'medium-modal',
      centered: true,
      backdrop: 'static',
      keyboard: false
    }
    );
    modalRef.result.then((res) => {
      if (res && res === 'notify') {
        this._toast.success('Successfully notified to customer', 'Success')
      } else if (res && res !== 'notify') {
        if (res.modalType === 'sub-status') {
          this.bookingDetails.LastActivity = res.activityStatus;
        } else {
          this.bookingDetails.BookingStatus = res.bookingStatus;
          this.bookingDetails.ShippingStatus = res.shippingStatus;
          this.bookingDetails.StatusID = res.statusID
        }
      }
    });
    modalRef.componentInstance.modalData = {
      type: type,
      bookingID: this.bookingDetails.BookingID,
      bookingStatus: this.bookingDetails.BookingStatus,
      loginID: this.userProfile.LoginID,
      providerID: this.userProfile.ProviderID,
      booking: this.bookingDetails
    }
  }

  approvedDoc(data, acc?, $id?) {
    if (acc) {
      console.log(acc, $id)
      try {
        acc.toggle($id)
      } catch (error) {
        console.warn(error)
      }
    }

    loading(true)

    if (data.DocumentLastStatus.toLowerCase() == 'approved' || data.DocumentLastStatus.toLowerCase() == 're-upload') return;
    let obj = {
      documentStatusID: 0,
      documentStatusCode: '',
      documentStatus: this.approvedStatus[0].StatusName,
      documentStatusRemarks: "",
      documentLastApproverID: this.userProfile.ProviderID,
      documentID: data.DocumentID,
      createdBy: this.userProfile.LoginID,
      modifiedBy: "",
      approverIDType: "PROVIDER"
    }
    this._viewBookingService.approvedDocx(obj).subscribe((res: any) => {
      loading(false)
      if (res.returnStatus == "Success") {
        data.DocumentLastStatus = this.approvedStatus[0].StatusName;
        this._toast.success('Document has been approved', '')
      } else {
        this._toast.error('There was an error while processing your request. Please try later', 'Failed')
      }
    }, error => {
      loading(false)
      this._toast.error('There was an error while processing your request. Please try later', 'Failed')
    })
  }


  getdocStatus() {
    this._viewBookingService.getDocStatuses().subscribe((res: any) => {
      if (res.returnStatus == "Success") {
        this.approvedStatus = res.returnObject.filter(elem => elem.BusinessLogic == "APPROVED");
      }
    })
  }


  // Document Work

  public displayMonths = 1;
  public navigation = 'select';
  public showWeekNumbers = false;
  public outsideDays = 'visible';
  public uploadToggleBTn = true;
  public uploadToggleBTn2 = true;
  public uploadToggleBTn3 = true;
  public currentDocObject: UserDocument

  //Document Upload Stuff
  // public fileIsOver: boolean = false;
  // public tradeFile: DocumentFile
  // public optionss = {
  //   readAs: 'DataURL'
  // };

  public uploadForm: FormGroup
  public dateModel: NgbDateStruct
  public minDate
  public loading: boolean;
  public loginUser: any
  public additionalDocumentsCustomers: UserDocument[] = []
  public additionalDocumentsProviders: UserDocument[] = []

  public add_docs_cust: UserDocument
  public add_docs_prov: UserDocument

  setInit() {
    try {
      this.loginUser = getLoggedUserData()
      let date = new Date();
      this.resetAccordian()

      this.minDate = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      };
    } catch (error) { }
  }


  customDragCheck($fileEvent: DocumentFile) {
    let selectedFile: DocumentFile = $fileEvent
    let docCopy = cloneObject(this.currentDocObject)
    docCopy.DocumentName = selectedFile.fileName
    docCopy.DocumentFileContent = selectedFile.fileBaseString
    docCopy.DocumentUploadedFileType = selectedFile.fileType
    this.currentDocObject = docCopy

  }



  fileSelectFailedEvent($message: string) {
    this._toast.error($message, 'Error')
  }


  onDocumentClick($newDocument: UserDocument, index: number) {
    let newDoc: UserDocument = $newDocument
    this.currentDocObject = $newDocument
    newDoc.MetaInfoKeysDetail.forEach((element: MetaInfoKeysDetail) => {
      if (element.DataType.toLowerCase() === 'datetime') {
        if (element.KeyValue) {
          element.DateModel = this.generateDateStructure(element.KeyValue)
        }
      }
    })
    this.resetAccordian(index, 'customer')
  }
  generateDateStructure(strDate: string): NgbDateStruct {
    let arr: Array<string> = strDate.split('/');
    let dateModel: NgbDateStruct = {
      day: parseInt(arr[1]),
      month: parseInt(arr[0]),
      year: parseInt(arr[2])
    }
    return dateModel
  }
  progress: number = 0

  uploadDocument(acc: any, acc_name: string, index: number, type, document) {
    this.loading = true
    loading(true)
    let toSend: UserDocument = cloneObject(document)
    const { currentDocObject } = this
    toSend.DocumentName = currentDocObject.DocumentName;
    toSend.DocumentFileContent = currentDocObject.DocumentFileContent;
    toSend.DocumentUploadedFileType = currentDocObject.DocumentUploadedFileType;
    console.log(toSend);

    let docName: string = ''
    try {
      docName = toSend.MetaInfoKeysDetail.filter(meta => meta.KeyName === 'DOCNAME')[0].KeyValue
    } catch (error) {
      docName = 'ADD-DOC'
    }
    toSend.DocumentName = docName


    if (!toSend.DocumentFileContent && !toSend.DocumentFileName) {
      this._toast.error('Please select a file to upload', 'Invalid Operation')
      this.loading = false
      loading(false)
      return
    }

    let emptyFieldFlag: boolean = false
    let hasInvalidLength: boolean = false
    let invalidLength: any
    let emptyFieldName: string = ''


    toSend.MetaInfoKeysDetail.forEach((element: MetaInfoKeysDetail) => {
      if (element.IsMandatory && !element.KeyValue) {
        emptyFieldFlag = true
        emptyFieldName = element.KeyNameDesc
        return;
      }

      if (element.IsMandatory && element.KeyValue && element.KeyValue.length > element.FieldLength) {
        hasInvalidLength = true
        invalidLength = element.FieldLength
        emptyFieldName = element.KeyNameDesc
        return;
      }
    })

    if (hasInvalidLength) {
      this._toast.error(`${emptyFieldName} field is empty`, 'Invalid Operation')
      this.loading = false
      loading(false)
      return
    }

    if (emptyFieldFlag) {
      this._toast.error(`${emptyFieldName} field length should be less or equal to ${invalidLength} charaters`, 'Invalid Operation')
      this.loading = false
      loading(false)
      return
    }

    toSend.DocumentID = (toSend.DocumentID) ? toSend.DocumentID : -1;
    toSend.UserID = this.loginUser.UserID

    for (let ind = 0; ind < this.additionalDocumentsCustomers.length; ind++) {
      if (ind === index) {
        this.additionalDocumentsCustomers[index].ShowUpload = false
      }

    }

    // const uploadReq = new HttpRequest('POST', baseApi + `Document/Post`, toSend, {
    //   reportProgress: true,
    // });

    // this._http.request(uploadReq).subscribe(event => {
    //   if (event.type === HttpEventType.UploadProgress)
    //     this.progress = Math.round(100 * event.loaded / event.total);
    //   else if (event.type === HttpEventType.Response)
    //     loading(false)
    // });

    if (toSend.DocumentID > 0 && toSend.DocumentFileName) {
      toSend.DocumentLastStatus = 'RESET'
    } else {
      toSend.DocumentLastStatus = ''
    }
    toSend.IsApprovalRequired = false;
    this._dashboardService.saveUserDocument(toSend).subscribe((res: JsonResponse) => {
      if (res.returnId > 0) {
        this.loading = false
        loading(false)
        console.log(acc_name + index);
        try {
          acc.toggle(acc_name + index)
        } catch (error) {
          console.log(error);
          this.resetAccordian()
        }

        // setTimeout(() => {
        //   acc.toggle(acc_name + index)
        // }, 0);
        // this.resetAccordian()
        this.getBookingDetail(this.bookingId)
        if (toSend.DocumentID > 0) {
          this._toast.success('Document Updated Successfully', res.returnStatus)
        } else {
          this._toast.success('Document Saved Successfully', res.returnStatus)
        }
        // this.refetchUserDocsData(toSend.UserID, type)
      } else {
        this.loading = false
        loading(false)
        this._toast.error(res.returnStatus)
      }
    }, (err: HttpErrorResponse) => {
      this.loading = false
      loading(false)
      this._toast.error('An unexpected error occurred. Please try again later.', 'Failed')
    })
  }

  onKeyPress($event, index: number, length: number) {
    return true;
    // if ($event.target.value.length > length) {
    //   return
    // }
    // console.log('yolo');

    // let selectedValue = $event.target.value
    // if ($event.target.value) {
    //   this.currentDocObject.MetaInfoKeysDetail[index].KeyValue = selectedValue
    // }
  }

  dateChangeEvent($event: NgbDateStruct, index: number) {
    let selectedDate = new Date($event.year, $event.month - 1, $event.day);
    let formattedDate = moment(selectedDate).format('L');
    this.currentDocObject.MetaInfoKeysDetail[index].KeyValue = formattedDate
  }

  acDownloadAction($url: string, acc: any, acc_name: string, index: number, type: string) {
    if ($url && $url.length > 0) {
      if ($url.startsWith("[{")) {
        let document = JSON.parse($url)
        window.open(baseExternalAssets + document[0].DocumentFile, '_blank');
      } else {
        window.open(baseExternalAssets + $url, '_blank');
      }
      // window.open(baseExternalAssets + $url, '_blank');
      acc.toggle(acc_name + index)
      this.resetAccordian(index, type)
    }
  }

  async resetAccordian(index?: number, type?: string) {
    if (index) {
      if (type === 'customer') {
        this.additionalDocumentsCustomers[index].ShowUpload = !this.additionalDocumentsCustomers[index].ShowUpload
      } else {
        this.additionalDocumentsProviders[index].ShowUpload = !this.additionalDocumentsProviders[index].ShowUpload
      }
    }
    for (let i = 0; i < this.additionalDocumentsCustomers.length; i++) {
      if (i !== index) {
        this.additionalDocumentsCustomers[i].ShowUpload = false
      }
    }
    for (let i = 0; i < this.additionalDocumentsProviders.length; i++) {
      if (i !== index) {
        this.additionalDocumentsProviders[i].ShowUpload = false
      }
    }
  }


  addDocument($type: string) {
    if (this.bookingDetails.BookingStatus.toLowerCase() === 'cancelled') {
      return
    }
    if ($type === 'customer') {
      const { add_docs_cust, additionalDocumentsCustomers } = this
      const _existDoc = additionalDocumentsCustomers.filter(doc => doc.DocumentID === -1)
      if (_existDoc && _existDoc.length > 0) {
        return;
      }
      let _cpy_add_docs_cust = cloneObject(add_docs_cust)
      _cpy_add_docs_cust.DocumentID = -1
      _cpy_add_docs_cust.DocumentName = 'ADDITIONAL DOCUMENT'
      _cpy_add_docs_cust.DocumentTypeDesc = 'ADDITIONAL DOCUMENT'
      _cpy_add_docs_cust.DocumentTypeName = null
      _cpy_add_docs_cust.DocumentStausRemarks = ''
      _cpy_add_docs_cust.DocumentUploadDate = ''
      _cpy_add_docs_cust.DocumentFileName = null
      _cpy_add_docs_cust.IsDownloadable = false
      _cpy_add_docs_cust.DocumentUploadedFileType = null
      _cpy_add_docs_cust.DocumentLastStatus = ''

      try {
        _cpy_add_docs_cust.MetaInfoKeysDetail.forEach(inp => {
          inp.KeyValue = ''
        })
      } catch (error) {

      }
      _cpy_add_docs_cust.BookingID = this.bookingDetails.BookingID
      this.additionalDocumentsCustomers.push(_cpy_add_docs_cust)
    }
  }

  onDocInputChange($event: any) {
  }


  readMore() {
    this.readMoreClass = !this.readMoreClass;
    if (this.readMoreClass)
      this.vendorAboutBtn = 'Read Less'
    else
      this.vendorAboutBtn = 'Read More'
  }

  textValidation(event) {
    try {
      const pattern = /[a-zA-Z-][a-zA-Z -]*$/;
      const inputChar = String.fromCharCode(event.charCode);
      if (!pattern.test(inputChar)) {

        if (event.charCode == 0) {
          return true;
        }

        if (event.target.value) {
          const end = event.target.selectionEnd;
          if ((event.which == 32 || event.keyCode == 32) && (event.target.value[end - 1] == " " || event.target.value[end] == " ")) {
            event.preventDefault();
            return false;
          }
        }
        else {
          event.preventDefault();
          return false;
        }
      } else {
        return true;
      }
    } catch (error) {
      return false
    }

  }

  NumberValid(evt) {
    let charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode != 37 && charCode != 39 && charCode > 31 && (charCode < 48 || charCode > 57))
      return false;
    return true;
  }

  //Form Validation Work
  sup_origin_name_error: boolean = false
  sup_origin_address_error: boolean = false
  sup_origin_contact_error: boolean = false
  sup_origin_email_error: boolean = false

  sup_dest_name_error: boolean = false
  sup_dest_address_error: boolean = false
  sup_dest_contact_error: boolean = false
  sup_dest_email_error: boolean = false

  errorMessages($from: string) {
    if ($from === 'origin') {
      if (this.AgentInfoFormOrigin.controls.name.status === "INVALID" && this.AgentInfoFormOrigin.controls.name.touched) {
        this.sup_origin_name_error = true;
      }
      if (this.AgentInfoFormOrigin.controls.address.status === "INVALID" && this.AgentInfoFormOrigin.controls.address.touched) {
        this.sup_origin_address_error = true;
      }
      if (this.AgentInfoFormOrigin.controls.contact.status === "INVALID" && this.AgentInfoFormOrigin.controls.contact.touched) {
        this.sup_origin_contact_error = true;
      }
      if (this.AgentInfoFormOrigin.controls.email.status === "INVALID" && this.AgentInfoFormOrigin.controls.email.touched) {
        this.sup_origin_email_error = true;
      }
    } else {
      if (this.AgentInfoFormDest.controls.name.status === "INVALID" && this.AgentInfoFormDest.controls.name.touched) {
        this.sup_dest_name_error = true;
      }
      if (this.AgentInfoFormDest.controls.address.status === "INVALID" && this.AgentInfoFormDest.controls.address.touched) {
        this.sup_dest_address_error = true;
      }
      if (this.AgentInfoFormDest.controls.contact.status === "INVALID" && this.AgentInfoFormDest.controls.contact.touched) {
        this.sup_dest_contact_error = true;
      }
      if (this.AgentInfoFormDest.controls.email.status === "INVALID" && this.AgentInfoFormDest.controls.email.touched) {
        this.sup_dest_email_error = true;
      }
    }
  }

  readMore2() {
    this.readMoreClass2 = !this.readMoreClass2;
    if (this.readMoreClass2)
      this.vendorAboutBtn2 = 'Read Less'
    else
      this.vendorAboutBtn2 = 'Read More'
  }

  @ViewChild("acc1") acc1: NgbAccordion;
  public activePanelId = ''

  uploadDoc(doc: BookingDocumentDetail, type?: string) {
    const modalRef = this._modalService.open(UploadComponent, { size: 'lg', centered: true, windowClass: 'small-modal', backdrop: 'static' })
    if (type === 'reupload') {
      if (doc.DocumentLastStatus.toLowerCase() === 'approved') {
        doc.DocumentLastStatus = 'RESET'
      }
    }

    try {
      console.log(this.activePanelId)
      this.acc1.toggle(this.activePanelId)
      if (this.activePanelId && this.activePanelId.length > 1) {
        this.activePanelId = ''
      }
    } catch { }

    doc.BookingID = this.bookingDetails.BookingID
    modalRef.componentInstance.passedData = doc
    modalRef.componentInstance.bookingData = this.bookingDetails
    modalRef.result.then((result) => {
      if (result === 'success') {
        this.getBookingDetail(this.bookingId)
      }
    })
  }

  openVesselSchedule(data) {
    const modalRef = this._modalService.open(VesselScheduleDialogComponent, {
      size: 'lg',
      centered: true,
      windowClass: 'large-modal',
      backdrop: 'static',
      keyboard: false
    })
    modalRef.componentInstance.data = {
      bookingID: this.bookingDetails.BookingID,
      date: this.departureDate,
      schedules: data
    }
    modalRef.result.then(result => {
      if (result) {
        try {
          this.selectedShipping = null
          this.departureDate = ''
          this.showScheduler = false;
          this.bookingDetails.VoyageRefNum = result.voyageRefNo
          this.bookingDetails.VesselName = result.vesselName
          this.bookingDetails.VesselCode = result.vesselCode
          this.bookingDetails.CarrierName = result.carrierName
          this.bookingDetails.CarrierImage = result.carrierImage
          this.bookingDetails.PortCutOffLcl = result.portCutOffDate
          this.bookingDetails.EtdLcl = result.etdDate
        } catch  { }
      }
    })
  }

  public carriersList: any[] = []
  public selectedShipping: any;
  public departureDate: any
  public selectedDate: string;

  /**
   *
   * Getting Shipping Lines
   * @param {object} reason
   * @memberof ViewBookingComponent
   */
  getCarrierSchedule(reason) {
    let data = {
      BookingID: this.bookingDetails.BookingID,
      PolID: this.bookingDetails.PolID,
      PodID: this.bookingDetails.PodID,
      ContainerLoadType: this.bookingDetails.ContainerLoad,
      ResponseType: reason,
      CarrierID: 0,
      fromEtdDate: this.bookingDetails.EtdUtc,
      toEtdDate: this.bookingDetails.EtdUtc,
    }
    if (reason === 'details') {
      data.CarrierID = this.selectedShipping.carrierID
      data.fromEtdDate = moment.utc(this.selectedDate).format()
      data.toEtdDate = moment.utc(this.selectedDate).format()
    }
    this._viewBookingService.getCarrierSchedule(data).subscribe((res: any) => {
      console.log(res)
      if (reason === 'details') {
        this.openVesselSchedule(res.returnObject)
      } else {
        this.carriersList = res.returnObject;
      }
    }, (err: any) => {
      console.log(err)
    })
  }

  shippings = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      map(term =>
        !term || term.length < 3
          ? []
          : this.carriersList.filter(
            v =>
              v.carrierName &&
              v.carrierName.toLowerCase().indexOf(term.toLowerCase()) > -1
          )
      )
    );
  formatter = (x: { carrierName: string; carrierImage: string }) =>
    x.carrierName;


  /**
   *
   * Getting Shiiping Line Image
   * @param {string} $image
   * @returns
   * @memberof ViewBookingComponent
   */
  getShippingLineImage($image: string) {
    return getImagePath(
      ImageSource.FROM_SERVER,
      "/" + $image,
      ImageRequiredSize.original
    );
  }


  /**
   *
   * Get Schedule List
   * @memberof ViewBookingComponent
   */
  viewSchedule() {
    let pickupDate = new Date(
      this.departureDate.year,
      this.departureDate.month - 1,
      this.departureDate.day
    );
    this.selectedDate = moment(pickupDate).format("L");
    this.getCarrierSchedule('details')
  }


  resetForm($type: string) {
    if ($type === 'origin') {
      this.AgentInfoFormOrigin.reset()
      this.sup_origin_name_error = false
      this.sup_origin_address_error = false
      this.sup_origin_contact_error = false
      this.sup_origin_email_error = false
    } else if ('destin') {
      this.AgentInfoFormDest.reset()
      this.sup_dest_name_error = false
      this.sup_dest_address_error = false
      this.sup_dest_contact_error = false
      this.sup_dest_email_error = false
    }
  }

  //Toogle work

  originToggle: boolean = false
  originToggleClass: string = 'Hide'
  destinToggle: boolean = false
  destinToggleClass: string = 'Hide'

  toggleInfoSection($type: string) {
    if ($type === 'origin') {
      this.originToggle = !this.originToggle;
      this.originToggleClass = (!this.originToggle) ? "Hide" : "Show";
    } else if ($type === 'destin') {
      this.destinToggle = !this.destinToggle;
      this.destinToggleClass = (!this.destinToggle) ? "Hide" : "Show";
    }
  }

  closeFix(event, datePicker) {
    if (event.target.offsetParent == null)
      datePicker.close();
    else if (event.target.offsetParent.nodeName != "NGB-DATEPICKER")
      datePicker.close();
  }

  getCustomerImage($image: string) {
    if (isJSON($image)) {
      const providerImage = JSON.parse($image)
      return baseExternalAssets + '/' + providerImage[0].DocumentFile
    } else {
      return getImagePath(ImageSource.FROM_SERVER, $image, ImageRequiredSize.original)
    }
  }


  /**
   * ADD CONTAINER DETAILS
   *
   * @memberof ViewBookingComponent
   */
  openAddContainer() {
    const modalRef = this._modalService.open(AddContainersComponent, {
      size: 'lg',
      centered: true,
      windowClass: 'large-modal',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.containerDetails = this.bookingDetails;
    setTimeout(() => {
      if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
        document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
      }
    }, 0);
  }

  /**
   * ADD B/L DETAILS
   *
   * @memberof ViewBookingComponent
   */
  openAddBL() {
    const modalRef = this._modalService.open(AddBlComponent, {
      size: 'sm',
      centered: true,
      windowClass: 'small-modal',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.data = this.bookingDetails;
    modalRef.result.then((result) => {
      if (result) {
         this.bookingDetails.BLNo = result;
      }
    });
    setTimeout(() => {
      if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
        document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
      }
    }, 0);
  }

  onAccordChange(changes) {
    console.log(changes);
    try {
      this.activePanelId = changes.panelId
    } catch { }
  }
}
