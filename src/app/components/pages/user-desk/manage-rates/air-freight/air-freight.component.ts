import { Component, OnInit, ViewChild, ViewEncapsulation, ElementRef, Renderer2, QueryList, AfterViewInit, OnDestroy } from '@angular/core';
import {
  NgbDatepicker,
  NgbInputDatepicker,
  NgbDateStruct,
  NgbCalendar,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbModal
} from '@ng-bootstrap/ng-bootstrap';
import { trigger, state, animate, transition, style } from '@angular/animations';
import { DiscardDraftComponent } from '../../../../../shared/dialogues/discard-draft/discard-draft.component';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { AirFreightService } from './air-freight.service';
import { getJwtToken } from '../../../../../services/jwt.injectable';
import { SharedService } from '../../../../../services/shared.service';
import { baseExternalAssets } from '../../../../../constants/base.url';
import { ConfirmDeleteDialogComponent } from '../../../../../shared/dialogues/confirm-delete-dialog/confirm-delete-dialog.component';
// import { NgModel } from '@angular/forms';
import * as moment from 'moment';
// import { DataTableDirective } from 'angular-datatables';
import { AirRateDialogComponent } from '../../../../../shared/dialogues/air-rate-dialog/air-rate-dialog.component';
import { NgbDateFRParserFormatter } from '../../../../../constants/ngb-date-parser-formatter';
import { ManageRatesService } from '../manage-rates.service';
import { ToastrService } from 'ngx-toastr';
import { FormControl, FormGroup, Validators, FormArray } from '@angular/forms';
import { RateValidityComponent } from '../../../../../shared/dialogues/rate-validity/rate-validity.component';
import { RateHistoryComponent } from '../../../../../shared/dialogues/rate-history/rate-history.component';
import { loading, changeCase, getImagePath, ImageSource, ImageRequiredSize } from '../../../../../constants/globalFunctions';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonService } from '../../../../../services/common.service';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { cloneObject } from '../../reports/reports.component';
import { SeaFreightService } from '../sea-freight/sea-freight.service';


declare var $;
const now = new Date();
const equals = (one: NgbDateStruct, two: NgbDateStruct) =>
  one && two && two.year === one.year && two.month === one.month && two.day === one.day;

const before = (one: NgbDateStruct, two: NgbDateStruct) =>
  !one || !two ? false : one.year === two.year ? one.month === two.month ? one.day === two.day
    ? false : one.day < two.day : one.month < two.month : one.year < two.year;

const after = (one: NgbDateStruct, two: NgbDateStruct) =>
  !one || !two ? false : one.year === two.year ? one.month === two.month ? one.day === two.day
    ? false : one.day > two.day : one.month > two.month : one.year > two.year;

@Component({
  selector: 'app-air-freight',
  templateUrl: './air-freight.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./air-freight.component.scss'],
  providers: [{ provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter }],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [   // :enter is alias to 'void => *'
        style({ opacity: 0 }),
        animate(500, style({ opacity: 1 }))
      ]),
      transition(':leave', [   // :leave is alias to '* => void'
        animate(500, style({ opacity: 0 }))
      ])
    ])
  ]
})
export class AirFreightComponent implements OnInit, OnDestroy {

  private draftRates: any;
  public rateValidityText = "Edit Rate / Validity";
  public dtOptionsByAir: DataTables.Settings | any = {};
  public dtOptionsByAirDraft: DataTables.Settings | any = {};
  @ViewChild('draftBYair') tabledraftByAir;
  @ViewChild('publishByair') tablepublishByAir;
  @ViewChild("dp") input: NgbInputDatepicker;
  // @ViewChild(NgModel) datePick: NgModel;
  @ViewChild('rangeDp') rangeDp: ElementRef;
  // @ViewChild(DataTableDirective) dtElement: DataTableDirective;

  public dataTablepublishByAir: any;
  public datatabledraftByAir: any;
  public allRatesList: any;
  public publishloading: boolean;
  public draftloading: boolean = true;
  public allAirLines: any[] = [];
  public allCargoType: any[] = []
  public allPorts: any[] = [];
  public allCurrencies: any[] = [];
  public allDraftRatesByAIR: any[] = [];
  public draftDataBYAIR: any[] = [];
  public draftslist: any[] = [];
  public delPublishRates: any[] = [];
  public publishRates: any[] = [];
  public filterOrigin: any = {};
  public filterDestination: any = {};
  public startDate: NgbDateStruct;
  public maxDate: NgbDateStruct;
  public minDate: NgbDateStruct;
  public hoveredDate: NgbDateStruct;
  public fromDate: any;
  public toDate: any;
  public model: any;

  private _subscription: Subscription;
  private _selectSubscription: Subscription;

  public userProfile: any;

  // filterartion variable;

  public filterbyAirLine;
  public filterbyCargoType;
  public checkedallpublishRates: boolean = false;
  public checkedalldraftRates: boolean = false;
  // term and condition

  isHovered = date =>
    this.fromDate && !this.toDate && this.hoveredDate && after(date, this.fromDate) && before(date, this.hoveredDate)
  isInside = date => after(date, this.fromDate) && before(date, this.toDate);
  isFrom = date => equals(date, this.fromDate);
  isTo = date => equals(date, this.toDate);


  public disable: boolean = false;
  public editorContent: any;
  private toolbarOptions = [
    ['bold', 'italic', 'underline'],        // toggled buttons

    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
    [{ 'direction': 'rtl' }],                         // text direction

    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    [{ 'align': [] }],

    ['clean']                                         // remove formatting button
  ];
  public editorOptions = {
    placeholder: "insert content...",
    modules: {
      toolbar: this.toolbarOptions
    }
  };


  // AIR NEW WORKING
  public airCharges: any[] = []
  public allCustomers: any[] = []
  public isCustomer: boolean = false
  public isMarketplace: boolean = false
  public filterbyCustomer;



  constructor(
    private modalService: NgbModal,
    private _airFreightService: AirFreightService,
    private _sharedService: SharedService,
    private element: ElementRef,
    private renderer: Renderer2,
    private _parserFormatter: NgbDateParserFormatter,
    private _manageRatesService: ManageRatesService,
    private _toast: ToastrService,
    private _commonService: CommonService,
    private _seaFreightService: SeaFreightService
  ) {
  }

  ngOnInit() {
    let userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.returnText) {
      this.userProfile = JSON.parse(userInfo.returnText);
    }

    this.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    this.maxDate = { year: now.getFullYear() + 1, month: now.getMonth() + 1, day: now.getDate() };
    this.minDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    const carriers = JSON.parse(localStorage.getItem('carriersList'))
    this.allAirLines = carriers.filter(e => e.type === 'AIR');
    this.getAllPublishRates(1);
    this.getAllDrafts()
    if (localStorage.getItem('AirPortDetails')) {
      this.allPorts = JSON.parse(localStorage.getItem('AirPortDetails'))
    } else {
      this.getPortsData()
    }
    this._sharedService.draftRowAddAir.pipe(untilDestroyed(this)).subscribe(state => {
      if (state && Object.keys(state).length) {
        this.setRowinDraftTable(state, 'popup not open');
      }
    })
    this._sharedService.termNcondAir.subscribe(state => {
      if (state) {
        this.editorContent = state;
      }
    })
  }


  onEditorBlured(quill) {
  }

  onEditorFocused(quill) {
  }

  onEditorCreated(quill) {
  }

  onContentChanged({ quill, html, text }) {
    this.editorContent = html
  }

  isEmpty(htmlString) {
    if (htmlString) {
      const parser = new DOMParser();
      const { textContent } = parser.parseFromString(htmlString, "text/html").documentElement;
      return !textContent.trim();
    } else {
      return true;
    }
  };

  ngOnDestroy() {

  }

  clearFilter(event) {
    event.preventDefault();
    event.stopPropagation();
    if ((this.filterbyAirLine && this.filterbyAirLine != 'undefined') ||
      (this.filterbyCargoType && this.filterbyCargoType != 'undefined') ||
      (this.filterDestination && Object.keys(this.filterDestination).length) ||
      (this.filterOrigin && Object.keys(this.filterOrigin).length) ||
      (this.fromDate && Object.keys(this.fromDate).length) ||
      (this.toDate && Object.keys(this.toDate).length)
    ) {
      this.model = null;
      this.fromDate = null;
      this.toDate = null;
      this.filterbyAirLine = 'undefined';
      this.filterbyCargoType = 'undefined';
      this.filterDestination = {};
      this.filterOrigin = {};
      this.filterbyCustomer = null;
      this.isMarketplace = false
      this.isCustomer = false
      this.getAllPublishRates(1)
    }
  }
  filter() {
    this.getAllPublishRates(1)
  }
  addRatesManually() {
    this.updatePopupRates(0, 'AIR');
  }

  setRowinDraftTable(obj, type) {
    if (typeof obj.slab == "string") {
      obj.slab = JSON.parse(obj.slab);
    }
    this.draftDataBYAIR.unshift(obj);
    if (this.allDraftRatesByAIR && this.allDraftRatesByAIR.length) {
      this.draftslist = this.allDraftRatesByAIR.concat(this.draftDataBYAIR);
    } else {
      this.draftslist = this.draftDataBYAIR;
    }
    if (type == 'openPopup') {
      this.updatePopupRates(obj.CarrierPricingSetID, 'AIR');
    }
    this._sharedService.updatedDraftsAir.next(this.draftslist)
  }

  updatePopupRates(rowId, type) {
    this.getAdditionalData()
    this.allCustomers = JSON.parse(localStorage.getItem('customers'))
    let obj
    if (rowId > 0) {
      obj = this.draftslist.find(obj => obj.carrierPricingDraftID == rowId);
    } else {
      obj = null
    }
    const modalRef = this.modalService.open(AirRateDialogComponent, {
      size: 'lg',
      centered: true,
      windowClass: 'large-modal',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.savedRow.subscribe((emmitedValue) => {
      console.log(emmitedValue)
      this.setAddDraftData(emmitedValue);
      this.getAllDrafts()
    });
    modalRef.result.then((result) => {
      const additionalChargesChanges = JSON.parse(localStorage.getItem('additionalChargesChange'))
      if(additionalChargesChanges && parseInt(additionalChargesChanges) === 1) {
        
      }
      if (result) {
        this.getAllDrafts()
        this.getAllPublishRates(1);
      }
    }, (reason) => {
    });

    let object = {
      forType: type,
      data: obj,
      addList: this.airCharges,
      mode: 'draft',
      customers: this.allCustomers,
      drafts: this.draftslist
    }
    modalRef.componentInstance.selectedData = object;
    setTimeout(() => {
      if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
        document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
      }
    }, 0);

  }

  setAddDraftData(data) {
    console.log(data)
    if (data) {
      data.forEach(element => {
        if (element.JsonSurchargeDet) {
          let importCharges = []
          let exportCharges = []
          let parsedJsonSurchargeDet = JSON.parse(element.JsonSurchargeDet)
          importCharges = parsedJsonSurchargeDet.filter(e => e.Imp_Exp === 'IMPORT');
          exportCharges = parsedJsonSurchargeDet.filter(e => e.Imp_Exp === 'EXPORT');
          element.parsedJsonSurchargeDet = importCharges.concat(exportCharges)
        }
        let dataObj = changeCase(element, 'pascal')
        this.draftslist.forEach(e => {
          if (e.CarrierPricingDraftID === element.carrierPricingDraftID) {
            let idx = this.draftslist.indexOf(e)
            this.draftslist.splice(idx, 1)
          }
        })
        this.draftslist.unshift(dataObj)
      });
    }
  }
  addAnotherRates() {
    this.addRatesManually();
  }
  addRatesByAirManually() {
    if ((!this.allDraftRatesByAIR || (this.allDraftRatesByAIR && !this.allDraftRatesByAIR.length)) && (!this.draftDataBYAIR || (this.draftDataBYAIR && !this.draftDataBYAIR.length))) {
      this.addRatesManually();
    }
  }
  filterBydate(date, type) {
    if (!date && this.fromDate && this.toDate) {
      this.fromDate = null;
      this.toDate = null;
      this.getAllPublishRates(1);
    }
    else {
      return;
    }
  }

  onDateSelection(date: NgbDateStruct) {
    let parsed = '';
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && after(date, this.fromDate)) {
      this.toDate = date;
      // this.model = `${this.fromDate.year} - ${this.toDate.year}`;
      this.input.close();
    } else {
      this.toDate = null;
      this.fromDate = date;
    }
    if (this.fromDate) {
      parsed += this._parserFormatter.format(this.fromDate);
    }
    if (this.toDate) {
      parsed += ' - ' + this._parserFormatter.format(this.toDate);
    }

    this.renderer.setProperty(this.rangeDp.nativeElement, 'value', parsed);
    if (this.fromDate && this.fromDate.month && this.toDate && this.toDate.month) {
      this.getAllPublishRates(1);
    }
  }

  allservicesByAir() {
    loading(true)
    this._sharedService.dataLogisticServiceBySea.subscribe(state => {
      if (state && state.length) {
        loading(false)
        for (let index = 0; index < state.length; index++) {
          if (state[index].LogServName == "SEA") {
            this.allAirLines = state[index].DropDownValues.AirLine;
            this.allCargoType = state[index].DropDownValues.Category;
            // this.allPorts = state[index].DropDownValues.AirPort;
            // this.allCurrencies = state[index].DropDownValues.UserCurrency;
            if (state[index].TCAIR) {
              this.editorContent = state[index].TCAIR;
              this.disable = true;
            } else {
              this.disable = false;
            }
            // this._sharedService.updatedDraftsAir.pipe(untilDestroyed(this)).subscribe((res: any) => {
            //   if (!res) {
            //     if (state[index].DraftDataAir && state[index].DraftDataAir.length) {
            //       state[index].DraftDataAir.map(elem => {
            //         if (typeof elem.slab == "string") {
            //           elem.slab = JSON.parse(elem.slab)
            //         }
            //       });
            //       this.allDraftRatesByAIR = state[index].DraftDataAir;
            //       // this.draftslist = this.allDraftRatesByAIR;
            //     }
            //   }
            //   else if (res && res.length) {
            //     // this.draftslist = res;
            //   }
            // })
            // this.generateDraftTable();
            // this.draftloading = true;
          }
        }
      }
    })
  }

  filterByroute(obj) {
    if (typeof obj == 'object') {
      this.getAllPublishRates(1);
    }
    else if (!obj) {
      this.getAllPublishRates(1);
    }
    else {
      return;
    }
  }

  filtertionPort(obj) {
    if ((typeof obj == "object" && Object.keys(obj).length) || (typeof obj == "string" && obj)) this.getAllPublishRates();
  }

  public filteredRecords: number;
  public pageSize: number = 5;
  public sortColumn: string = 'RecentUpdate'
  public sortColumnDirection: string = 'ASC'
  getAllPublishRates(pageNo?) {
    loading(true)
    this.publishloading = true;
    let obj = {
      pageNo: pageNo ? pageNo : this.pageNo,
      pageSize: this.pageSize,
      providerID: this.userProfile.ProviderID,
      carrierID: (this.filterbyAirLine == 'undefined') ? null : this.filterbyAirLine,
      shippingCatID: (this.filterbyCargoType == 'undefined') ? null : this.filterbyCargoType,
      polID: this.orgfilter(),
      podID: this.destfilter(),
      effectiveFrom: (this.fromDate && this.fromDate.month) ? this.fromDate.month + '/' + this.fromDate.day + '/' + this.fromDate.year : null,
      effectiveTo: (this.toDate && this.toDate.month) ? this.toDate.month + '/' + this.toDate.day + '/' + this.toDate.year : null,
      sortColumn: this.sortColumn,
      sortColumnDirection: this.sortColumn === 'RecentUpdate' ? 'DESC' : this.sortColumnDirection,
      customerID: (this.filterbyCustomer ? parseInt(this.filterbyCustomer) : null),
      customerType: (this.isCustomer ? 'CUSTOMER' : (this.isMarketplace ? 'MARKETPLACE' : null)),
      aircraftTypeID: null,
    }
    this._airFreightService.getAllrates(obj).subscribe((res: any) => {
      this.publishloading = false;
      loading(false)
      if (res.returnId > 0) {
        this.totalPublishedRecords = res.returnObject.recordsTotal
        this.filteredRecords = res.returnObject.recordsFiltered
        this.allRatesList = cloneObject(res.returnObject.data);
        this.checkedallpublishRates = false;
      }
    })
  }


  /**
     *
     * Emitter for sorting columns
     * @param {*} type
     * @param {*} event
     * @memberof AIRTransportComponent
     */
  sortedFilters(type, event) {
    this.sortColumn = event.column
    this.sortColumnDirection = event.direction
    this.getAllPublishRates(1)
  }


  selectedItem(type, alltableOption) {
    if (type == 'add') {
      alltableOption.rows().every(function (rowIdx, tableLoop, rowLoop) {
        var data = this.node();
        data.classList.add('selected');
        // ... do something with data(), or this.node(), etc
      });
    }
    else {
      alltableOption.rows().every(function (rowIdx, tableLoop, rowLoop) {
        var node = this.node();
        node.classList.remove('selected');
        node.children[0].children[0].children[0].checked = false;
        // ... do something with data(), or this.node(), etc
      });
    }
  }
  orgfilter() {
    if (this.filterOrigin && typeof this.filterOrigin == "object" && Object.keys(this.filterOrigin).length) {
      return this.filterOrigin.PortID;
    }
    else if (this.filterOrigin && typeof this.filterOrigin == "string") {
      return -1;
    }
    else if (!this.filterOrigin) {
      return null;
    }

  }
  destfilter() {
    if (this.filterDestination && typeof this.filterDestination == "object" && Object.keys(this.filterDestination).length) {
      return this.filterDestination.PortID;
    }
    else if (this.filterDestination && typeof this.filterDestination == "string") {
      return -1;
    }
    else if (!this.filterDestination) {
      return null;
    }

  }

  discardDraft() {
    let discardarr = [];
    this.draftslist.forEach(elem => {
      discardarr.push(elem.carrierPricingDraftID)
    })
    const modalRef = this.modalService.open(DiscardDraftComponent, {
      size: 'lg',
      centered: true,
      windowClass: 'small-modal',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.result.then((result) => {
      if (result == "Success") {
        this.draftslist = [];
        this.allDraftRatesByAIR = [];
        this.draftDataBYAIR = [];
        this.publishRates = [];
        this._sharedService.updatedDraftsAir.next(this.draftslist)
        this.getAllDrafts();
      }
    }, (reason) => {
    });
    let obj = {
      data: discardarr,
      type: "draftAirRate"
    }
    modalRef.componentInstance.deleteIds = obj;
    setTimeout(() => {
      if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
        document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
      }
    }, 0);
  }


  delPubRecord() {
    if (!this.delPublishRates.length) return;
    const modalRef = this.modalService.open(ConfirmDeleteDialogComponent, {
      size: 'lg',
      centered: true,
      windowClass: 'small-modal',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.result.then((result) => {
      if (result == "Success") {
        this.checkedallpublishRates = false;
        if (this.allRatesList.length == this.delPublishRates.length) {
          this.allRatesList = [];
          this.delPublishRates = [];
        }
        else {
          for (var i = 0; i < this.delPublishRates.length; i++) {
            for (let y = 0; y < this.allRatesList.length; y++) {
              if (this.delPublishRates[i] == this.allRatesList[y].carrierPricingID) {
                this.allRatesList.splice(y, 1);
              }
            }
          }
          if (i == this.delPublishRates.length) {
            this.delPublishRates = [];
          }
        }
        // this.getAllPublishRates('fcl', 1)
        this.paging(1, 'publish')
        this.pageNo = 1
        this.draftPageNo = 1
      }
    }, (reason) => {
    });
    let obj = {
      data: this.delPublishRates,
      type: "publishAirRate"
    }
    modalRef.componentInstance.deleteIds = obj;
    setTimeout(() => {
      if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
        document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
      }
    }, 0);
  }

  deletepublishRecord() {
    this.delPubRecord()
  }

  // publishRate() {
  //   this._airFreightService.publishDraftRate(this.publishRates).subscribe((res: any) => {
  //     if (res.returnStatus == "Success") {
  //       for (var i = 0; i < this.publishRates.length; i++) {
  //         for (let y = 0; y < this.draftslist.length; y++) {
  //           if (this.draftslist[y].CarrierPricingSetID == this.publishRates[i]) {
  //             this.draftslist.splice(y, 1);
  //           }
  //         }
  //       }
  //       if (this.publishRates.length == i) {
  //         this.checkedalldraftRates = false;
  //         this.publishRates = [];
  //         this.generateDraftTable();
  //         this.getAllPublishRates();
  //       }
  //     }
  //   })
  // }

  publishRate() {
    let param;
    loading(true)
    try {
      param = {
        pricingIDList: (this.draftslist.length === this.publishRates.length) ? [-1] : this.publishRates,
        providerID: this.userProfile.ProviderID
      }
    } catch (error) {
      loading(false)
    }

    this._airFreightService.publishDraftRate(param).subscribe((res: any) => {
      loading(false)
      if (res.returnStatus == "Success") {
        for (var i = 0; i < this.publishRates.length; i++) {
          for (let y = 0; y < this.draftslist.length; y++) {
            if (this.draftslist[y].ProviderPricingDraftID == this.publishRates[i]) {
              this.draftslist.splice(y, 1);
            }
          }
        }
        this._toast.success(res.returnText, 'Success')
        this.checkedalldraftRates = false;
        this.publishRates = [];
        this.getAllPublishRates(1);
        this.getAllDrafts() // todo remove is when we get the mechanism for transfer data between components
      } else {
        this._toast.error(res.returnText, 'Publish Failed')
      }
    }, error => {
      loading(false)
    })
  }

  ports = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      map(term => (!term || term.length < 3) ? []
        : this.allPorts.filter(v => v.PortName.toLowerCase().indexOf(term.toLowerCase()) > -1))
    )
  formatter = (x: { PortName: string }) => x.PortName;



  /**
   *
   * RATE HISTORY DETAILS OF PUBLISHED RATES
   * @param {number} recId
   * @param {string} fortype
   * @memberof AirFreightComponent
   */
  rateHistory(recId, fortype) {
    const modalRef = this.modalService.open(RateHistoryComponent, {
      size: 'lg',
      centered: true,
      windowClass: 'upper-medium-modal-history',
      backdrop: 'static',
      keyboard: false
    });
    console.log(this.allAirLines)
    let obj = {
      id: recId,
      type: fortype,
      shippingLines: this.allAirLines,
      customers: this.allCustomers,
      ports: this.allPorts
    }
    modalRef.componentInstance.getRecord = obj;
    setTimeout(() => {
      if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
        document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
      }
    }, 0);
  }

  // rateValidity() {
  //   if (!this.delPublishRates.length) return;
  //   let updateValidity = [];
  //   for (let i = 0; i < this.allRatesList.length; i++) {
  //     for (let y = 0; y < this.delPublishRates.length; y++) {
  //       if (this.allRatesList[i].carrierPricingSetID == this.delPublishRates[y]) {
  //         updateValidity.push(this.allRatesList[i])
  //       }
  //     }
  //   }
  //   const modalRef = this.modalService.open(RateValidityComponent, {
  //     size: 'lg',
  //     centered: true,
  //     windowClass: 'upper-medium-modal',
  //     backdrop: 'static',
  //     keyboard: false
  //   });
  //   modalRef.result.then((result) => {
  //     if (result == 'Success') {
  //       this.getAllPublishRates();
  //       this.checkedallpublishRates = false
  //       this.delPublishRates = [];
  //     }
  //   });
  //   let obj = {
  //     data: updateValidity,
  //     type: "rateValidityAIR"
  //   }
  //   modalRef.componentInstance.validityData = obj;
  //   setTimeout(() => {
  //     if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
  //       document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
  //     }
  //   }, 0);
  // }

  /**
   *
   * EDIT PUBLISH RATE POPUP MODAL ACTION
   * @param {string} type //fcl or lcl
   * @returns
   * @memberof SeaFreightComponent
   */
  rateValidity() {
    if (!this.delPublishRates.length) return;
    let updateValidity = [];
    for (let i = 0; i < this.allRatesList.length; i++) {
      for (let y = 0; y < this.delPublishRates.length; y++) {
        if (this.allRatesList[i].carrierPricingID == this.delPublishRates[y]) {
          updateValidity.push(this.allRatesList[i])
        }
      }
    }
    if (updateValidity && updateValidity.length > 1) {
      const modalRef = this.modalService.open(RateValidityComponent, {
        size: 'lg',
        centered: true,
        windowClass: 'upper-medium-modal',
        backdrop: 'static',
        keyboard: false
      });
      modalRef.result.then((result) => {
        if (result) {
          this.getAllPublishRates(1);
          this.checkedallpublishRates = false
          this.delPublishRates = [];
        }
      });
      let obj = {
        data: updateValidity,
        type: 'rateValidityAIR'
      }
      modalRef.componentInstance.validityData = obj;
    } else if (updateValidity && updateValidity.length === 1) {
      this.getAdditionalData()
      const modalRef2 = this.modalService.open(AirRateDialogComponent, {
        size: 'lg',
        centered: true,
        windowClass: 'large-modal',
        backdrop: 'static',
        keyboard: false
      });
      modalRef2.result.then((result) => {
        if (result) {
          this.getAllPublishRates(1);
          this.checkedallpublishRates = false
          this.delPublishRates = [];
        }
      });
      let object = {
        forType: 'AIR',
        data: updateValidity,
        addList: this.airCharges,
        customers: this.allCustomers,
        mode: 'publish'
      }
      modalRef2.componentInstance.selectedData = object;
    }
    setTimeout(() => {
      if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
        document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
      }
    }, 0);
  }



  saveTermNcond() {
    let obj = {
      providerID: this.userProfile.ProviderID,
      termsAndConditions: this.editorContent,
      transportType: "AIR",
      modifiedBy: this.userProfile.LoginID
    }
    this._manageRatesService.termNCondition(obj).subscribe((res: any) => {
      if (res.returnStatus == "Success") {
        this._toast.success("Term and Condition saved Successfully", "");
        this._sharedService.termNcondAir.next(this.editorContent);
        this.disable = true;
      }
    })
  }


  /**
   *
   * Get Airports Dropdown List
   * @memberof AirFreightComponent
   */
  getPortsData() {
    loading(true)
    this._commonService.getPortsData('Airports').subscribe((res: any) => {
      this.allPorts = res
      localStorage.setItem("AirPortDetails", JSON.stringify(res));
      loading(false)
    }, (err: HttpErrorResponse) => {
      loading(false)
    })
  }

  /**
   *
   * Get Additional Port Charges
   * @memberof AirFreightComponent
   */
  getAdditionalData() {
    loading(true)
    const additionalCharges = (localStorage.hasOwnProperty('additionalCharges')) ? JSON.parse(localStorage.getItem('additionalCharges')) : null
    if (additionalCharges) {
      this.airCharges = additionalCharges.filter(e => e.modeOfTrans === 'AIR' && e.addChrType === 'ADCH')
    } else {
      this._seaFreightService.getAllAdditionalCharges(this.userProfile.ProviderID).subscribe((res: any) => {
        this.airCharges = res.filter(e => e.modeOfTrans === 'AIR' && e.addChrType === 'ADCH')
        localStorage.setItem('additionalCharges', JSON.stringify(res.filter(e => e.addChrType === 'ADCH')))
        loading(false)
      }, (err) => {
        loading(false)
      })
    }
    loading(false)
  }


  /**
   *
   * GET ALL DRAFT RATES FOR AIR
   * @memberof AirFreightComponent
   */
  getAllDrafts() {
    loading(true)
    this._airFreightService.getAirDraftRates(this.userProfile.ProviderID).pipe(untilDestroyed(this)).subscribe((res: any) => {
      loading(false)
      this.draftslist = res.returnObject
    }, (err: any) => {
      loading(false)
    })
  }

  /**
   * PAGING EVENT EMITTER OBSERVABLE FOR UI TABLE
   *
   * @param {string} type //fcl or lcl
   * @param {number} event //page number 0,1,2...
   * @memberof AirFreightComponent
   */
  public pageNo: number = 1
  public draftPageNo: any
  public totalPublishedRecords: number;
  paging(event: any, tableType: string) {
    if (tableType === 'publish') {
      this.pageNo = event;
      this.getAllPublishRates(event)
    } else {
      this.draftPageNo = event;
    }
  }

  /**
   *
   * EVENT EMITTER OBSERVABLE FOR UI TABLE COMPONENT
   * @param {object} event
   * @memberof AIRFreightComponent
   */
  tableCheckedRows(event) {
    if (event.type === 'publishFCL') {
      if (typeof event.list[0] === 'object') {
        if (event.list[0].type === 'history') {
          if (event.list[0].load === 'FCL') {
            this.rateHistory(event.list[0].id, 'Rate_FCL')
          } else if (event.list[0].load === 'LCL') {
            this.rateHistory(event.list[0].id, 'Rate_LCL')
          } else if (event.list[0].load === 'Rate_AIR') {
            this.rateHistory(event.list[0].id, 'Rate_AIR')
          }
        }
      } else {
        this.delPublishRates = event.list
      }
    } else if (event.type === 'draftFCL') {
      if (typeof event.list[0] === 'object') {
        if (event.list[0].type === 'delete') {
          if (event.list[0].load === 'LCL') {
            this.deleteRow(event.list[0].id)
          } else if (event.list[0].load === 'FCL') {
            this.deleteRow(event.list[0].id)
          }
        } else if (event.list[0].type === 'edit') {
          this.updatePopupRates(event.list[0].id, event.list[0].load)
        }
      } else {
        this.publishRates = event.list;
      }
    }
  }

  /**
   *
   * DELETE ROWM FROM DRAFTS TABLE FOR AIR
   * @param {number} id //row identifier
   * @memberof AIRFreightComponent
   */
  deleteRow(id) {
    const modalRef = this.modalService.open(ConfirmDeleteDialogComponent, {
      size: 'lg',
      centered: true,
      windowClass: 'small-modal',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.result.then((result) => {
      if (result) {
        this.getAllDrafts()
        this.pageNo = 1
      }
    }, (reason) => {
    });
    let obj = {
      data: [id],
      type: "draftAirRate"
    }
    modalRef.componentInstance.deleteIds = obj;
    setTimeout(() => {
      if (document.getElementsByTagName('body')[0].classList.contains('modal-open')) {
        document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
      }
    }, 0);
  }

}
