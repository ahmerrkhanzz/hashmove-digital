import { Component, OnInit, ViewEncapsulation, ViewChild, Renderer2, ElementRef, Input, OnDestroy, ɵConsole, Output, EventEmitter } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { NgbActiveModal, NgbDropdownConfig } from "@ng-bootstrap/ng-bootstrap";
import { SharedService } from '../../../services/shared.service';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import {
  NgbDatepicker,
  NgbInputDatepicker,
  NgbDateStruct,
  NgbCalendar,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbModal
} from '@ng-bootstrap/ng-bootstrap';
import { AirFreightService } from '../../../components/pages/user-desk/manage-rates/air-freight/air-freight.service';
import { ToastrService } from 'ngx-toastr';
import { NgbDateFRParserFormatter } from '../../../constants/ngb-date-parser-formatter';
import { JsonResponse } from '../../../interfaces/JsonResponse';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { cloneObject } from '../../../components/pages/user-desk/reports/reports.component';
import { SeaFreightService } from '../../../components/pages/user-desk/manage-rates/sea-freight/sea-freight.service';
import { CommonService } from '../../../services/common.service';
import { getImagePath, ImageSource, ImageRequiredSize, loading } from '../../../constants/globalFunctions';
import * as moment from "moment";
import { ManageRatesService } from '../../../components/pages/user-desk/manage-rates/manage-rates.service';

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
  selector: 'app-air-rate-dialog',
  templateUrl: './air-rate-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter }, NgbDropdownConfig
  ],
  styleUrls: ['./air-rate-dialog.component.scss'],
  host: {
    "(document:click)": "closeDropdown($event)"
  }
})
export class AirRateDialogComponent implements OnInit, OnDestroy {

  @ViewChild("dp") input: NgbInputDatepicker;
  @ViewChild('rangeDp') rangeDp: ElementRef;
  @Input() selectedData: any;
  @ViewChild("originDropdown") originDropdown: any;
  @ViewChild("destinationDropdown") destinationDropdown: any;
  @Output() savedRow = new EventEmitter<any>();

  public allAirLines: any[] = [];
  public allCargoType: any[] = [];
  public allPorts: any[] = [];
  public allCurrencies: any[] = [];
  public allCustomers: any[] = [];
  public filterOrigin: any = {};
  public filterDestination: any = {};
  public userProfile: any;
  public selectedCategory: any = null;
  public selectedAirline: any;
  public minPrice: any;
  public normalPrice: any;
  public plusfortyFivePrice: any;
  public plushundredPrice: any;
  public plusTwoFiftyPrice: any;
  public plusFiveHundPrice: any;
  public plusThousandPrice: any;
  public loading: boolean = false

  public defaultCurrency: any = {
    CurrencyID: 101,
    CurrencyCode: 'AED',
    CountryCode: 'AE',
  }
  public selectedCurrency: any = this.defaultCurrency;


  public startDate: NgbDateStruct;
  public maxDate: NgbDateStruct;
  public minDate: NgbDateStruct;
  public hoveredDate: NgbDateStruct;
  public fromDate: any = {
    day: null,
    month: undefined,
    year: undefined
  };
  public toDate: any = {
    day: undefined,
    month: undefined,
    year: undefined
  };
  public model: any;
  private allRatesFilledData: any[] = [];
  private newProviderPricingDraftID = undefined;

  private newDraftOne = undefined;
  private newDraftTwo = undefined;
  private newDraftThree = undefined;
  private newDraftFour = undefined;
  private newDraftFive = undefined;
  private newDraftSix = undefined;

  public airSlabs: any[] = []
  public slabPrice: any[] = []
  public originSlabPrice: any[] = []
  public destinationSlabPrice: any[] = []
  public selectedOrigins: any = [{}];
  public selectedDestinations: any = [{}];
  public destinationsList = [];
  public originsListSimple: any[] = []
  public destinationsListSimple: any[] = []
  public originsList = [];
  public isDestinationChargesForm: boolean = false;
  public isOriginChargesForm: boolean = false;
  public surchargeBasisValidate: boolean;
  public labelValidate: boolean;
  public lablelName: string = "";
  public lablelNameDed: string = "";
  public surchargeType = "";
  public surchargeTypeDed = "";
  public surchargeBasisValidateDed: boolean = true;
  public isOriginSimplerMethod: boolean = false
  public isDestinationSimplerMethod: boolean = false
  public minTransitDays: number = 0
  public maxTransitDays: number = 0
  public aircraftTypeID: number = 0
  public jsonSurchargeDetail: any[] = []
  public disableFields: boolean = false
  public jsonDepartureDays: string
  public selectedCustomer: any[] = [];
  public disabledCustomers: boolean = false

  isHovered = date =>
    this.fromDate && !this.toDate && this.hoveredDate && after(date, this.fromDate) && before(date, this.hoveredDate)
  isInside = date => after(date, this.fromDate) && before(date, this.toDate);
  isFrom = date => equals(date, this.fromDate);
  isTo = date => equals(date, this.toDate);

  constructor(
    private location: PlatformLocation,
    private _activeModal: NgbActiveModal,
    private _sharedService: SharedService,
    private _parserFormatter: NgbDateParserFormatter,
    private renderer: Renderer2,
    private _airFreightService: AirFreightService,
    private _toast: ToastrService,
    private _seaFreightService: SeaFreightService,
    private config: NgbDropdownConfig,
    private _eref: ElementRef,
    private _commonService: CommonService,
  ) {
    location.onPopState(() => this.closeModal(null));
    config.autoClose = false;
  }

  ngOnInit() {
    let userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.returnText) {
      this.userProfile = JSON.parse(userInfo.returnText);
    }
    this._sharedService.currencyList.subscribe(res => {
      if (res) {
        this.allCurrencies = res;
      }
    });
    this.originsList = this.selectedData.addList.filter(e => !e.isSlabBased);
    this.destinationsList = this.selectedData.addList.filter(e => !e.isSlabBased)
    this.originsListSimple = this.selectedData.addList.filter(e => e.isSlabBased && e.addChrCode === 'ADCH_O');
    this.destinationsListSimple = this.selectedData.addList.filter(e => e.isSlabBased && e.addChrCode === 'ADCH_D')
    if (this.originsListSimple && this.originsListSimple.length) {
      this.originsListSimple[0].jsonSlabDataParsed = JSON.parse(this.originsListSimple[0].jsonSlabData.replace(/\\/g, ""))
    }
    if (this.destinationsListSimple && this.destinationsListSimple.length) {
      this.destinationsListSimple[0].jsonSlabDataParsed = JSON.parse(this.destinationsListSimple[0].jsonSlabData.replace(/\\/g, ""))
    }
    this.setCurrency();
    this.allservicesBySea();
    this.getDropdownLists()
    this.getSurchargeBasis('AIR');
    this.allCustomers = this.selectedData.customers;
    if (this.selectedData.mode === "publish") {
      this.setData(this.selectedData.data[0]);
      this.disableFields = true
    } else if (this.selectedData.mode === "draft" && this.selectedData.data) {
      this.setData(this.selectedData.data);
    }
  }


  allservicesBySea() {
    this.allCargoType = JSON.parse(localStorage.getItem('cargoTypes'))
    this.allAirLines = JSON.parse(localStorage.getItem('carriersList')).filter(e => e.type === 'AIR');
    // this._sharedService.dataLogisticServiceBySea.subscribe(state => {
    //   if (state && state.length) {
    //     for (let index = 0; index < state.length; index++) {
    //       if (state[index].LogServName == "SEA") {
    //         this.allAirLines = state[index].DropDownValues.AirLine;
    //         // this.allCargoType = state[index].DropDownValues.Category;

    //       }
    //     }
    //   }
    // })
  }
  setData(data) {
    console.log(data)
    let parsed = "";
    this.disabledCustomers = true
    this.selectedCategory = data.shippingCatID;
    this.filterOrigin = this.allPorts.find(obj => obj.PortID == data.polID);
    this.filterDestination = this.allPorts.find(obj => obj.PortID == data.podID);
    this.selectedAirline = this.allAirLines.find(obj => obj.id == data.carrierID);
    this.selectedCurrency = this.allCurrencies.find(
      obj => obj.id === data.currencyID
    );
    this.aircraftTypeID = (data.aircraftTypeID) ? data.aircraftTypeID : 0
    this.minPrice = (parseInt(data.minPrice) || parseInt(data.minPrice) !== NaN) ? parseInt(data.minPrice) : 0
    this.minTransitDays = (data.minTransitDays) ? data.minTransitDays : 0
    this.maxTransitDays = (data.maxTransitDays) ? data.maxTransitDays : 0
    this.jsonDepartureDays = data.jsonDepartureDays
    if (data.jsonCustomerDetail && data.CustomerType !== "null") {
      this.selectedCustomer = JSON.parse(data.jsonCustomerDetail);
    }
    if (data.effectiveFrom) {
      this.fromDate.day = new Date(data.effectiveFrom).getDate();
      this.fromDate.year = new Date(data.effectiveFrom).getFullYear();
      this.fromDate.month = new Date(data.effectiveFrom).getMonth() + 1;
    }
    if (data.effectiveTo) {
      this.toDate.day = new Date(data.effectiveTo).getDate();
      this.toDate.year = new Date(data.effectiveTo).getFullYear();
      this.toDate.month = new Date(data.effectiveTo).getMonth() + 1;
    }
    if (this.fromDate && this.fromDate.day) {
      this.model = this.fromDate;
      parsed += this._parserFormatter.format(this.fromDate);
    }
    if (this.toDate && this.toDate.day) {
      parsed += " - " + this._parserFormatter.format(this.toDate);
    }
    this.rangeDp.nativeElement.value = parsed;
    if (!this.selectedCurrency) {
      this.selectedCurrency = this.defaultCurrency;
    }

    if (data.pricingJson) {
      const parsedPricingJSON = JSON.parse(data.pricingJson)
      parsedPricingJSON.forEach(element => {
        for (let index = 0; index < parsedPricingJSON.length; index++) {
          this.slabPrice[element.SlabID - 1] = element.Price
        }
      });
    }
    if (data.jsonSurchargeDetail && data.jsonSurchargeDetail !== '[{},{}]') {
      const parsedjsonSurchargeDetail = JSON.parse(data.jsonSurchargeDetail)
      const originChargesSimple = parsedjsonSurchargeDetail.filter(e => e.Imp_Exp === 'EXPORT' && e.isSlabBased)
      const originChargesAdvanced = parsedjsonSurchargeDetail.filter(e => e.Imp_Exp === 'EXPORT' && !e.isSlabBased)
      const destinationChargesSimple = parsedjsonSurchargeDetail.filter(e => e.Imp_Exp === 'IMPORT' && e.isSlabBased)
      const destinationChargesAdvanced = parsedjsonSurchargeDetail.filter(e => e.Imp_Exp === 'IMPORT' && !e.isSlabBased)
      if (originChargesSimple.length) {
        this.isOriginSimplerMethod = true
        this.baseRateOrigin = originChargesSimple[0].Price
        const parsedjsonSlabData = JSON.parse(originChargesSimple[0].jsonSlabData)
        parsedjsonSlabData.forEach(element => {
          for (let index = 0; index < parsedjsonSlabData.length; index++) {
            this.originSlabPrice[element.SlabID - 1] = element.Price
          }
        });
      } else if (originChargesAdvanced) {
        this.isOriginSimplerMethod = false
        this.setAdvancedChargesData(this.selectedData.mode);
      }

      if (destinationChargesSimple.length) {
        this.isDestinationSimplerMethod = true
        this.baseRateDestination = destinationChargesSimple[0].Price
        const parsedjsonSlabData = JSON.parse(destinationChargesSimple[0].jsonSlabData)
        parsedjsonSlabData.forEach(element => {
          for (let index = 0; index < parsedjsonSlabData.length; index++) {
            this.destinationSlabPrice[element.SlabID - 1] = element.Price
          }
        });
      } else if (destinationChargesAdvanced) {
        this.isDestinationSimplerMethod = false
        this.setAdvancedChargesData(this.selectedData.mode);
      }
    }
  }

  savedraftrow(type) {
    this.loading = true
    if (type === 'saveNadd' || type === 'onlySave') {
      this.saveDraftRate(type)
    } else if (type === 'update') {
      this.updatePublishedRate()
    }
  }


  /**
   *
   * ADD DRAFT ROW
   * @memberof AirRateDialogComponent
   */
  public buttonLoading: boolean = false
  public TotalImportCharges: any
  public TotalExportCharges: any
  public isRateUpdating = false;
  saveDraftRate(type) {
    this.buttonLoading = true;
    let JsonSurchargeDet
    let obj
    try {
      const { filterOrigin, filterDestination } = this;
      if (
        filterOrigin &&
        filterDestination && (filterOrigin === filterDestination)
      ) {
        this._toast.warning(
          "Please select different pickup and drop ariport",
          "Warning"
        );
        this.isRateUpdating = false;
        this.loading = false
        return;
      }

      let totalImp = [];
      let totalExp = [];
      // this.selectedOrigins = this.selectedOrigins.filter(e => e.addChrID)
      // this.selectedDestinations = this.selectedDestinations.filter(e => e.addChrID)
      const expCharges = this.selectedOrigins.filter(
        e => e.Imp_Exp === "EXPORT"
      );
      const impCharges = this.selectedDestinations.filter(
        e => e.Imp_Exp === "IMPORT"
      );

      if (impCharges && impCharges.length) {
        impCharges.forEach(element => {
          totalImp.push(parseFloat(element.Price));
        });
        this.TotalImportCharges = totalImp.reduce((all, item) => {
          return all + item;
        });
      }

      if (expCharges && expCharges.length) {
        expCharges.forEach(element => {
          totalExp.push(parseFloat(element.Price));
        });
        this.TotalExportCharges = totalExp.reduce((all, item) => {
          return all + item;
        });
      }


      this.calculateSlabsPrice()
      this.calculateAdditionalSimpleData()

      if (!this.isOriginSimplerMethod && !this.isDestinationSimplerMethod) {
        JsonSurchargeDet = JSON.stringify(
          this.selectedOrigins.concat(this.selectedDestinations)
        );
      } else if (this.isOriginSimplerMethod && !this.isDestinationSimplerMethod) {
        JsonSurchargeDet = JSON.stringify(
          this.originSimpleCharges.concat(this.selectedDestinations)
        );
      } else if (!this.isOriginSimplerMethod && this.isDestinationSimplerMethod) {
        JsonSurchargeDet = JSON.stringify(
          this.selectedOrigins.concat(this.destinationSimpleCharges)
        );
      } else if (this.isOriginSimplerMethod && this.isDestinationSimplerMethod) {
        JsonSurchargeDet = JSON.stringify(
          this.originSimpleCharges.concat(this.destinationSimpleCharges)
        );
      }

      let customers = [];
      if (this.selectedCustomer.length) {
        this.selectedCustomer.forEach(element => {
          let obj = {
            CustomerID: element.CustomerID,
            CustomerType: element.CustomerType,
            CustomerName: element.CustomerName,
            CustomerImage: element.CustomerImage
          };
          customers.push(obj);
        });
      }

      obj =
        {
          carrierPricingDraftID: this.selectedData.data
            ? this.selectedData.data.carrierPricingDraftID
            : 0,

          carrierID: (this.selectedAirline) ? this.selectedAirline.id : undefined,
          carrierName: (this.selectedAirline) ? this.selectedAirline.title : undefined,
          carrierImage: (this.selectedAirline) ? this.selectedAirline.imageName : undefined,
          containerSpecID: null,
          customerID: this.selectedCustomer.length
            ? this.selectedCustomer[0].CustomerID
            : null,
          customersList: customers.length ? customers : null,
          price: 0,
          fromKg: 0,
          toKg: 0,
          modeOfTrans: "AIR",
          currencyID: (this.selectedCurrency.id) ? this.selectedCurrency.id : 101,
          currencyCode: (this.selectedCurrency.shortName) ? this.selectedCurrency.shortName : 'AED',
          effectiveFrom: (this.fromDate && this.fromDate.month) ? this.fromDate.month + '/' + this.fromDate.day + '/' + this.fromDate.year : null,
          effectiveTo: (this.toDate && this.toDate.month) ? this.toDate.month + '/' + this.toDate.day + '/' + this.toDate.year : null,
          minPrice: (this.minPrice && parseInt(this.minPrice) !== NaN) ? parseInt(this.minPrice) : 0,
          providerID: this.userProfile.ProviderID,
          shippingCatID: (this.selectedCategory == 'null') ? null : this.selectedCategory,
          shippingCatName: (this.selectedCategory) ? this.getShippingName(this.selectedCategory) : undefined,
          polID: (this.filterOrigin && this.filterOrigin.PortID) ? this.filterOrigin.PortID : null,
          polName: (this.filterOrigin && this.filterOrigin.PortID) ? this.filterOrigin.PortName : null,
          polCode: (this.filterOrigin && this.filterOrigin.PortID) ? this.filterOrigin.PortCode : null,
          podID: (this.filterDestination && this.filterDestination.PortID) ? this.filterDestination.PortID : null,
          podName: (this.filterDestination && this.filterDestination.PortID) ? this.filterDestination.PortName : null,
          podCode: (this.filterDestination && this.filterDestination.PortID) ? this.filterDestination.PortCode : null,
          containerSpecShortName: null,
          jsonCustomerDetail: null,
          jsonSurchargeDetail: JsonSurchargeDet === "[{},{}]" ? null : JsonSurchargeDet,
          customerType: null,
          minTransitDays: this.minTransitDays ? this.minTransitDays : 0,
          maxTransitDays: this.maxTransitDays ? this.maxTransitDays : 0,
          jsonDepartureDays: this.jsonDepartureDays,
          aircraftTypeID: this.aircraftTypeID,
          pricingJson: JSON.stringify(this.airSlabs),
          createdBy: this.userProfile.LoginID,
        }

      // VALIDATIONS STARTS HERE
      // this.selectedData.data.UsageType === "SHARED"
      if (
        !obj.carrierID &&
        !obj.effectiveFrom &&
        !obj.effectiveTo &&
        !obj.podID &&
        !obj.polID &&
        !obj.minPrice &&
        !obj.shippingCatID
      ) {
        this._toast.info("Please fill atleast one field to save", "Info");
        this.isRateUpdating = false;
        this.loading = false
        return;
      }

      if (obj.podID && obj.polID && obj.podID === obj.polID) {
        this._toast.error(
          "Source and Destination cannot be same",
          "Error"
        );
        this.isRateUpdating = false;
        loading(false)
        return;
      }


      if (
        !obj.minPrice ||
        !(typeof parseFloat(obj.minPrice) == "number") ||
        parseFloat(obj.minPrice) <= 0
      ) {
        this._toast.error("Minimum Price cannot be zero", "Error");
        this.isRateUpdating = false;
        this.loading = false
        return;
      }


      let duplicateRecord: boolean = false;
      if (this.selectedData.drafts) {
        this.selectedData.drafts.forEach(element => {
          if (
            moment(element.effectiveFrom).format("D MMM, Y") ===
            moment(obj.effectiveFrom).format("D MMM, Y") &&
            moment(element.effectiveTo).format("D MMM, Y") ===
            moment(obj.effectiveTo).format("D MMM, Y") &&
            element.polID === obj.polID &&
            element.polID === obj.polID &&
            element.minPrice === parseFloat(obj.minPrice) &&
            element.shippingCatID === obj.shippingCatID &&
            element.jsonSurchargeDetail === obj.jsonSurchargeDetail
          ) {
            duplicateRecord = true;
          }
        });
      }

      if (
        obj.podType &&
        obj.podType === "Ground" &&
        (obj.polType && obj.polType === "Ground")
      ) {
        this.isRateUpdating = false;
        this._toast.info("Please change origin or destination type", "Info");
        this.loading = false
        return;
      }

      // if (duplicateRecord) {
      //   this.isRateUpdating = false;
      //   this._toast.warning("This record has already been added", "Warning");
      //   this.loading = false
      //   return;
      // }

    } catch (error) {
      this.isRateUpdating = false;
      this.loading = false
      return;
    }

    this._airFreightService.saveDraftRate(obj).subscribe((res: JsonResponse) => {
      this.loading = false
      if (res.returnId > 0) {
        this.buttonLoading = false;
        if (res.returnText && typeof res.returnText === 'string') {
          this._toast.success(res.returnText, "Success");
        } else {
          this._toast.success("Rates added successfully", "Success");
        }
        if (type === "onlySave") {
          this.closePopup(true)
        } else {
          if (this.selectedData.data) {
            this.selectedData.data.CarrierPricingDraftID = 0;
          }
          this.savedRow.emit(res.returnObject);
        }
      }
    })
  }

  numberValidwithDecimal(evt) {
    let charCode = (evt.which) ? evt.which : evt.keyCode;
    if (evt.target.value && evt.target.value[evt.target.value.length - 1] == '.') {
      if (charCode > 31 && (charCode < 48 || charCode > 57))
        return false;

      return true;
    }
    if (charCode != 46 && charCode > 31
      && (charCode < 48 || charCode > 57))
      return false;

    return true;
  }


  getShippingName(id) {
    return this.allCargoType.find(obj => obj.id == id).title;
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
  }
  closePopup(val?) {
    // let object = {
    //   data: this.allRatesFilledData
    // };
    this.closeModal((val) ? val : null);
  }
  closeModal(status) {
    this._sharedService.draftRowAddAir.next(null);
    this._activeModal.close(status);
    document.getElementsByTagName('html')[0].style.overflowY = 'auto';
  }

  airlines = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      map(term => (!term || term.length < 3) ? []
        : this.allAirLines.filter(v => v.title && v.title.toLowerCase().indexOf(term.toLowerCase()) > -1))
    )
  formatter = (x: { title: string }) => x.title;

  ports = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      map(term => (!term || term.length < 3) ? []
        : this.allPorts.filter(v => v.PortName.toLowerCase().indexOf(term.toLowerCase()) > -1))
    )
  portsFormatter = (x: { PortName: string }) => x.PortName;

  currencies = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      map(term =>
        !term || term.length < 3
          ? []
          : this.allCurrencies.filter(
            v =>
              v.shortName &&
              v.shortName.toLowerCase().indexOf(term.toLowerCase()) > -1
          )
      )
    );
  currencyFormatter = x => x.shortName;

  getDropdownLists() {
    this.getDepartureDays()
    this.getAirSlabs()
    this.getAirFreightTypes()
    this.allPorts = JSON.parse(localStorage.getItem('AirPortDetails'))
    setTimeout(() => {
      const carriers = JSON.parse(localStorage.getItem('carriersList'))
      this.allAirLines = carriers.filter(e => e.type === 'AIR');
    }, 500);
  }

  public departureDays: any[] = []
  /**
   * GET DEPARTURE DAYS DROPDOWN
   *
   * @memberof AirRateDialogComponent
   */
  public selectedDepartureDays: any[] = []
  getDepartureDays() {
    this.departureDays = JSON.parse(localStorage.getItem('departureDays'))
    if (this.departureDays) {
      this.createDepartureDaysJSON()
    } else {
      this._commonService.getMstCodeVal('DEPARTURE_DAYS').pipe(untilDestroyed(this)).subscribe((res: any) => {
        this.departureDays = res
        this.departureDays.forEach(e => {
          e.isChecked = false
        })
        localStorage.setItem('departureDays', JSON.stringify(this.departureDays))
        // EDIT DRAFT CASE
        this.createDepartureDaysJSON()
      }, (err: any) => {
        this._toast.error('Error fetching air freight departure days')
      })
    }
  }


  /**
   * SETTING JSON FOR EDIT DEPARTURE DAYS
   *
   * @memberof AirRateDialogComponent
   */
  createDepartureDaysJSON() {
    // EDIT DRAFT CASE
    if (this.selectedData.data && this.selectedData.data.jsonDepartureDays && this.selectedData.mode === 'draft') {
      const parsedDepartureDays = JSON.parse(this.selectedData.data.jsonDepartureDays)
      this.departureDays.forEach(e => {
        if (e.codeVal.includes('D1')) {
          if (parsedDepartureDays.D1 === 1) {
            e.isChecked = true
            e.isDisabled = false
            this.selectedDepartureDays.push(e.codeValDesc)
          }
        }
        if (e.codeVal.includes('D2')) {
          if (parsedDepartureDays.D2 === 1) {
            e.isChecked = true
            e.isDisabled = false
            this.selectedDepartureDays.push(e.codeValDesc)
          }
        }
        if (e.codeVal.includes('D3')) {
          if (parsedDepartureDays.D3 === 1) {
            e.isChecked = true
            e.isDisabled = false
            this.selectedDepartureDays.push(e.codeValDesc)
          }
        }
        if (e.codeVal.includes('D4')) {
          if (parsedDepartureDays.D4 === 1) {
            e.isChecked = true
            e.isDisabled = false
            this.selectedDepartureDays.push(e.codeValDesc)
          }
        }
        if (e.codeVal.includes('D5')) {
          if (parsedDepartureDays.D5 === 1) {
            e.isChecked = true
            e.isDisabled = false
            this.selectedDepartureDays.push(e.codeValDesc)
          }
        }
        if (e.codeVal.includes('D6')) {
          if (parsedDepartureDays.D6 === 1) {
            e.isChecked = true
            e.isDisabled = false
            this.selectedDepartureDays.push(e.codeValDesc)
          }
        }
        if (e.codeVal.includes('D7')) {
          if (parsedDepartureDays.D7 === 1) {
            e.isChecked = true
            e.isDisabled = false
            this.selectedDepartureDays.push(e.codeValDesc)
          }
        }
        if (e.codeVal.includes('DAILY')) {
          if (parsedDepartureDays.DAILY === 1) {
            e.isChecked = true
            e.isDisabled = false
            this.selectedDepartureDays.push(e.codeValDesc)
          }
        }
      })
    } else if (this.selectedData.data && this.selectedData.data.length && this.selectedData.mode === 'publish') {
      const parsedDepartureDays = JSON.parse(this.selectedData.data[0].jsonDepartureDays)
      if (parsedDepartureDays) {
        this.departureDays.forEach(e => {
          // parsedDepartureDays.forEach(element => {
          //   if (e.codeValID === element.codeValID) {
          //     e.isChecked = true
          //     e.isDisabled = false
          //     this.selectedDepartureDays.push(element.codeValDesc)
          //   }
          // });
          if (e.codeVal.includes('D1')) {
            if (parsedDepartureDays.D1 === 1) {
              e.isChecked = true
              e.isDisabled = false
              this.selectedDepartureDays.push(e.codeValDesc)
            }
          }
          if (e.codeVal.includes('D2')) {
            if (parsedDepartureDays.D2 === 1) {
              e.isChecked = true
              e.isDisabled = false
              this.selectedDepartureDays.push(e.codeValDesc)
            }
          }
          if (e.codeVal.includes('D3')) {
            if (parsedDepartureDays.D3 === 1) {
              e.isChecked = true
              e.isDisabled = false
              this.selectedDepartureDays.push(e.codeValDesc)
            }
          }
          if (e.codeVal.includes('D4')) {
            if (parsedDepartureDays.D4 === 1) {
              e.isChecked = true
              e.isDisabled = false
              this.selectedDepartureDays.push(e.codeValDesc)
            }
          }
          if (e.codeVal.includes('D5')) {
            if (parsedDepartureDays.D5 === 1) {
              e.isChecked = true
              e.isDisabled = false
              this.selectedDepartureDays.push(e.codeValDesc)
            }
          }
          if (e.codeVal.includes('D6')) {
            if (parsedDepartureDays.D6 === 1) {
              e.isChecked = true
              e.isDisabled = false
              this.selectedDepartureDays.push(e.codeValDesc)
            }
          }
          if (e.codeVal.includes('D7')) {
            if (parsedDepartureDays.D7 === 1) {
              e.isChecked = true
              e.isDisabled = false
              this.selectedDepartureDays.push(e.codeValDesc)
            }
          }
          if (e.codeVal.includes('DAILY')) {
            if (parsedDepartureDays.DAILY === 1) {
              e.isChecked = true
              e.isDisabled = false
              this.selectedDepartureDays.push(e.codeValDesc)
            }
          }
        })
      }
    }
  }


  /**
   *
   * ON DAYS CHECK
   * @param {string} item
   * @param {number} index
   * @memberof AirRateDialogComponent
   */
  public selectedAircraft: string;
  onDaysCheck(type, item, index) {
    item.isChecked = !item.isChecked
    if (type === 'days') {
      this.selectedDepartureDays = []
      const selectedDepartureDaysArr = []
      const deptDays = { DAILY: 0, D1: 0, D2: 0, D3: 0, D4: 0, D5: 0, D6: 0, D7: 0 }
      this.departureDays.forEach(e => {
        if (item.codeVal === 'DAILY' && item.isChecked) {
          if (e.codeVal !== 'DAILY') {
            e.isChecked = false
            e.isDisabled = true
            deptDays.DAILY = 0
          }
        } else if (item.codeVal === 'DAILY' && !item.isChecked) {
          if (e.codeVal !== 'DAILY') {
            e.isChecked = false
            e.isDisabled = false
            deptDays.DAILY = 0
          }
        }
        if (e.isChecked) {
          this.selectedDepartureDays.push(e.codeVal)
        }
      })

      this.departureDays.forEach(element => {
        if (element.isChecked) {
          if (element.codeVal === "DAILY") { // Daily
            deptDays.DAILY = 1
          }
          if (element.codeVal === "D1") { // Monday - to onwards
            deptDays.D1 = 1
          }
          if (element.codeVal === "D2") {
            deptDays.D2 = 1
          }
          if (element.codeVal === "D3") {
            deptDays.D3 = 1
          }
          if (element.codeVal === "D4") {
            deptDays.D4 = 1
          }
          if (element.codeVal === "D5") {
            deptDays.D5 = 1
          }
          if (element.codeVal === "D6") {
            deptDays.D6 = 1
          }
          if (element.codeVal === "D7") {
            deptDays.D7 = 1
          }
          selectedDepartureDaysArr.push(element.codeVal)
        }
      });
      // this.jsonDepartureDays = JSON.stringify(this.departureDays.filter(e => e.isChecked))
      this.jsonDepartureDays = JSON.stringify(deptDays)

    } else if (type === 'aircraft') {
      this.aircraftTypeID = item.id
      this.selectedAircraft = item.title
    }
  }

  /**
   * GET AIR FREIGHT TYPES DROPDOWN
   *
   * @memberof AirRateDialogComponent
   */
  public airFreightTypes: any[] = []
  getAirFreightTypes() {
    this._airFreightService.getAirFreightTypes().pipe(untilDestroyed(this)).subscribe((res: any) => {
      this.airFreightTypes = res;
      localStorage.setItem('airCrafts', JSON.stringify(this.airFreightTypes))
      this.airFreightTypes.forEach(e => {
        e.isChecked = false
      })

      // EDIT DRAFT CASE
      if (this.selectedData.data && this.selectedData.data.aircraftTypeID) {
        this.airFreightTypes.forEach(e => {
          if (e.id === this.aircraftTypeID) {
            e.isChecked = true
            this.selectedAircraft = e.title
          }
        })
      } else if (this.selectedData.data && this.selectedData.data.length && this.selectedData.mode === 'publish') {
        if (this.selectedData.data[0].aircraftTypeID) {
          this.airFreightTypes.forEach(e => {
            if (e.id === this.aircraftTypeID) {
              e.isChecked = true
              this.selectedAircraft = e.title
            }
          })
        }
      }
    }, (err: any) => {
      this._toast.error('Error fetching air freight types')
    })
  }


  /**
   *
   * GET AIR SLABS
   * @memberof AirRateDialogComponent
   */
  getAirSlabs() {
    this._airFreightService.getGetAirFreightSlab().pipe(untilDestroyed(this)).subscribe((res: any) => {
      this.airSlabs = res.returnObject
    }, (err: any) => {
      this._toast.error('Error fetching air freight slabs')
    })
  }

  public addDestinationActive: boolean = false;
  public addOriginActive: boolean = false;
  public addDestinationDedActive: boolean = false;
  public addOriginDedActive: boolean = false;

  /**
   *
   * 
   * @param {*} event
   * @param {*} type
   * @memberof AirRateDialogComponent
   */
  dropdownToggle(event, type) {
    if (event) {
      this.isDestinationChargesForm = false;
      this.isOriginChargesForm = false;
      this.surchargeBasisValidate = true;
      this.labelValidate = true;
      if (type === "destination") {
        this.addDestinationActive = true;
      } else if (type === "origin") {
        this.addOriginActive = true;
      }
    } else {
      this.addOriginActive = false;
      this.addDestinationActive = false;
    }
  }



  /**
   *
   * ON SELECT CHARGES
   * @param {*} type
   * @param {*} model
   * @param {*} index
   * @memberof AirRateDialogComponent
   */
  selectCharges(type, model, index) {
    model.Imp_Exp = type;
    if (type === "EXPORT") {
      if (
        (Object.keys(this.selectedOrigins[index]).length === 0 &&
          this.selectedOrigins[index].constructor === Object) ||
        !this.selectedOrigins[index].hasOwnProperty("currency")
      ) {
        model.CurrId = this.selectedCurrency.id;
        model.currency = this.selectedCurrency;
      } else {
        model.CurrId = this.selectedOrigins[index].currency.id;
        model.currency = this.selectedOrigins[index].currency;
      }
      const { selectedOrigins } = this;
      selectedOrigins.forEach(element => {
        if (
          Object.keys(element).length === 0 &&
          element.constructor === Object
        ) {
          let idx = selectedOrigins.indexOf(element);
          selectedOrigins.splice(idx, 1);
        }
      });
      if (selectedOrigins[index]) {
        this.originsList.push(selectedOrigins[index]);
        selectedOrigins[index] = model;
      } else {
        selectedOrigins.push(model);
      }
      this.selectedOrigins = cloneObject(selectedOrigins);
      this.originsList = this.originsList.filter(
        e => e.addChrID && e.addChrID !== model.addChrID
      );
    } else if (type === "IMPORT") {
      if (
        (Object.keys(this.selectedDestinations[index]).length === 0 &&
          this.selectedDestinations[index].constructor === Object) ||
        !this.selectedDestinations[index].hasOwnProperty("currency")
      ) {
        model.CurrId = this.selectedCurrency.id;
        model.currency = this.selectedCurrency;
      } else {
        model.CurrId = this.selectedDestinations[index].currency.id;
        model.currency = this.selectedDestinations[index].currency;
      }
      const { selectedDestinations } = this;
      selectedDestinations.forEach(element => {
        if (
          Object.keys(element).length === 0 &&
          element.constructor === Object
        ) {
          let idx = selectedDestinations.indexOf(element);
          selectedDestinations.splice(idx, 1);
        }
      });
      if (selectedDestinations[index]) {
        this.destinationsList.push(selectedDestinations[index]);
        selectedDestinations[index] = model;
      } else {
        selectedDestinations.push(model);
      }
      this.selectedDestinations = cloneObject(selectedDestinations);
      this.destinationsList = this.destinationsList.filter(
        e => e.addChrID && e.addChrID !== model.addChrID
      );
    }
  }


  /**
   *
   * SET THE DEFAULT CURRENCY
   * @memberof AirRateDialogComponent
   */
  setCurrency() {
    this.selectedCurrency = JSON.parse(localStorage.getItem("userCurrency"));
  }

  public surchargesList: any = [];

  /**
   *
   * GET SURCHARGE BASIS DROPDOWN LIST
   * @param {string} containerLoad
   * @memberof AirRateDialogComponent
   */
  getSurchargeBasis(containerLoad) {
    this._seaFreightService.getSurchargeBasis(containerLoad).subscribe(
      res => {
        this.surchargesList = res;
      },
      err => { }
    );
  }


  /**
   *
   * TOGGLE CUSTOM CHARGES FORM
   * @param {string} type
   * @memberof AirRateDialogComponent
   */
  showCustomChargesForm(type) {
    if (type === "origin") {
      this.isOriginChargesForm = !this.isOriginChargesForm;
    } else if (type === "destination") {
      this.isDestinationChargesForm = !this.isDestinationChargesForm;
    }
  }

  closeDropdown(event) {
    if (this.originSimpleCharges || this.destinationSimpleCharges) {
      return;
    }
    let x: any = document.getElementsByClassName("dropdown-menu");
    if (!event.target.className.includes("has-open")) {
      this.originDropdown.close();
      this.destinationDropdown.close();
      // this.transitDropdown.close()
    }
    // if (!this._eref.nativeElement.contains(event.target)) // or some similar check
  }

  public canAddLabel: boolean = true;

  /**
   *
   * SUBMIT CALL FOR CUSTOM LABEL
   * @param {string} type
   * @returns
   * @memberof AirRateDialogComponent
   */
  addCustomLabel(type) {
    this.canAddLabel = true;
    if (!this.lablelName) {
      this.labelValidate = false;
      return;
    }
    if (!this.surchargeType) {
      this.surchargeBasisValidate = false;
      return;
    }
    const selectedSurcharge = this.surchargesList.find(
      obj => obj.codeValID === parseInt(this.surchargeType)
    );
    let obj = {
      addChrID: -1,
      addChrCode: "OTHR",
      addChrName: this.lablelName,
      addChrDesc: this.lablelName,
      modeOfTrans: "air",
      addChrBasis: selectedSurcharge.codeVal,
      createdBy: this.userProfile.PrimaryEmail,
      addChrType: "ADCH",
      providerID: this.userProfile.ProviderID
    };
    this.selectedData.addList.forEach(element => {
      if (element.addChrName === obj.addChrName) {
        this.canAddLabel = false;
      }
    });

    if (!this.canAddLabel) {
      this._toast.info("Already Added, Please try another name", "Info");
      return false;
    }

    this._seaFreightService.addCustomCharge(obj).subscribe(
      (res: any) => {
        this.isOriginChargesForm = false;
        this.isDestinationChargesForm = false;
        if (res.returnId !== -1) {
          let obj = {
            addChrID: res.returnId,
            addChrCode: "OTHR",
            addChrName: this.lablelName,
            addChrDesc: this.lablelName,
            modeOfTrans: "AIR",
            addChrBasis: selectedSurcharge.codeVal,
            createdBy: this.userProfile.PrimaryEmail,
            addChrType: "ADCH",
            providerID: this.userProfile.ProviderID
          };
          this.originsList.push(obj);
          this.destinationsList.push(obj);
          localStorage.removeItem('additionalCharges')
          // if (type === "origin") {
          //   this.originsList.push(obj);
          // } else if (type === "destination") {
          //   this.destinationsList.push(obj);
          // }
          this.lablelName = "";
          this.surchargeType = "";
        }
      },
      err => {
      }
    );
  }

  getVal(idx, event, type) {
    if (typeof event === "object") {
      if (type === "origin") {
        this.selectedOrigins[idx].CurrId = event.id;
      } else if (type === "destination") {
        this.selectedDestinations[idx].CurrId = event.id;
      }
    }
  }


  /**
   *
   * ON ADD MORE CHARGES BUTTON CLICK
   * @param {string} type
   * @returns
   * @memberof AirRateDialogComponent
   */
  addMoreCharges(type) {
    if (type === "origin") {
      if (!this.selectedOrigins[this.selectedOrigins.length - 1].CurrId) {
        this._toast.info("Please select currency", "Info");
        return;
      }
      if (!this.selectedOrigins[this.selectedOrigins.length - 1].Price) {
        this._toast.info("Please add price", "Info");
        return;
      }
      if (!this.selectedOrigins[this.selectedOrigins.length - 1].addChrCode) {
        this._toast.info("Please select any additional charge", "Info");
        return;
      }
      if (
        !(
          Object.keys(this.selectedOrigins[this.selectedOrigins.length - 1])
            .length === 0 &&
          this.selectedOrigins[this.selectedOrigins.length - 1].constructor ===
          Object
        ) &&
        parseFloat(this.selectedOrigins[this.selectedOrigins.length - 1].Price) &&
        this.selectedOrigins[this.selectedOrigins.length - 1].CurrId
      ) {
        this.selectedOrigins.push({
          CurrId: this.selectedOrigins[this.selectedOrigins.length - 1].currency
            .id,
          currency: this.selectedOrigins[this.selectedOrigins.length - 1]
            .currency
        });
      }
    } else if (type === "destination") {
      if (
        !this.selectedDestinations[this.selectedDestinations.length - 1].CurrId
      ) {
        this._toast.info("Please select currency", "Info");
        return;
      }
      if (
        !this.selectedDestinations[this.selectedDestinations.length - 1].Price
      ) {
        this._toast.info("Please add price", "Info");
        return;
      }
      if (
        !this.selectedDestinations[this.selectedDestinations.length - 1]
          .addChrCode
      ) {
        this._toast.info("Please select any additional charge", "Info");
        return;
      }
      if (
        !(
          Object.keys(
            this.selectedDestinations[this.selectedDestinations.length - 1]
          ).length === 0 &&
          this.selectedDestinations[this.selectedDestinations.length - 1]
            .constructor === Object
        ) &&
        parseFloat(
          this.selectedDestinations[this.selectedDestinations.length - 1].Price
        ) &&
        this.selectedDestinations[this.selectedDestinations.length - 1].CurrId
      ) {
        this.selectedDestinations.push({
          CurrId: this.selectedDestinations[
            this.selectedDestinations.length - 1
          ].currency.id,
          currency: this.selectedDestinations[
            this.selectedDestinations.length - 1
          ].currency
        });
      }
    }
  }


  calculateSlabsPrice() {
    let tempPrice: number = 0
    for (let index = 0; index < this.airSlabs.length; index++) {
      this.airSlabs[index].Price = ((this.slabPrice[index] && !isNaN(parseInt(this.slabPrice[index]))) ? parseInt(this.slabPrice[index]) : 0)
      if (this.airSlabs[index].Price > 0) {
        tempPrice = this.airSlabs[index].Price
      }
      this.airSlabs[index].TempPrice = tempPrice
    }
  }


  /**
   *
   * VALIDATION FOR NUMBERIC FIELD
   * @param {object} e
   * @returns // true or false
   * @memberof AirRateDialogComponent
   */
  validateNumber(e) {
    let keycode = (e.which) ? e.which : e.keyCode;
    //comparing pressed keycodes
    if ((keycode < 48 || keycode > 57) && keycode !== 13) {
      e.preventDefault();
      return false;
    }
  }

  /**
   * GET BASE URL FOR UI IMAGES
   *
   * @param {string} $image
   * @returns
   * @memberof AIRRateDialogComponent
   */
  getShippingLineImage($image: string) {
    return getImagePath(
      ImageSource.FROM_SERVER,
      "/" + $image,
      ImageRequiredSize.original
    );
  }


  /**
   * TRANSIT DAYS VALIDATION
   *
   * @param {string} type //minimum or maximum
   * @returns boolean
   * @memberof AirRateDialogComponent
   */
  public isTransitDaysValidated: boolean = true
  validateTransitDays(type) {
    if (type === 'minimum') {
      if ((this.maxTransitDays && this.maxTransitDays) && (this.minTransitDays >= this.maxTransitDays)) {
        this._toast.error('Minimum transit days should be less than maximum transit days', 'Error')
        this.isTransitDaysValidated = false
        return;
      }
      if (!this.minTransitDays) {
        this._toast.error('Please provide minimum transit days', 'Error')
        this.isTransitDaysValidated = false
        return;
      }
    } else if (type === 'maximum') {
      if ((this.minTransitDays && this.maxTransitDays) && (this.minTransitDays >= this.maxTransitDays)) {
        this._toast.error('Maximum transit days should be less than minimum transit days', 'Error')
        this.isTransitDaysValidated = false
        return;
      }
      if (!this.maxTransitDays) {
        this._toast.error('Please provide maximum transit days', 'Error')
        this.isTransitDaysValidated = false
        return;
      }
    }
  }


  /**
   *
   * CALCULATING SIMPLE METHOD ADDTIONAL CHARGES
   * @memberof AirRateDialogComponent
   */
  public baseRateOrigin: any
  public baseRateDestination: any
  public originSimpleCharges: any = []
  public destinationSimpleCharges: any = []
  calculateAdditionalSimpleData() {
    if (this.isOriginSimplerMethod) {
      let tempPrice: number = 0
      for (let index = 0; index < this.originsListSimple[0].jsonSlabDataParsed.length; index++) {
        this.originsListSimple[0].jsonSlabDataParsed[index].Price = (this.originSlabPrice[index] && parseInt(this.originSlabPrice[index]) !== NaN ? parseInt(this.originSlabPrice[index]) : 0)
        this.originsListSimple[0].jsonSlabDataParsed[index].BaseRate = (this.baseRateOrigin) ? parseInt(this.baseRateOrigin) : 0
        if (this.originsListSimple[0].jsonSlabDataParsed[index].Price > 0) {
          tempPrice = this.originsListSimple[0].jsonSlabDataParsed[index].Price
        }
        this.originsListSimple[0].jsonSlabDataParsed[index].TempPrice = tempPrice
      }
      const { addChrID, addChrCode, addChrName, addChrDesc, addChrType, addChrBasis, isSlabBased } = this.originsListSimple[0]
      const originChargeObj = {
        addChrID: addChrID,
        addChrCode: addChrCode,
        addChrName: addChrName,
        addChrDesc: addChrDesc,
        modeOfTrans: 'AIR',
        addChrType: addChrType,
        addChrBasis: addChrBasis,
        isSlabBased: isSlabBased,
        jsonSlabData: JSON.stringify(this.originsListSimple[0].jsonSlabDataParsed),
        Imp_Exp: 'EXPORT',
        CurrId: this.selectedCurrency.id,
        currency: this.selectedCurrency,
        Price: this.baseRateOrigin ? parseInt(this.baseRateOrigin) : 0
      }
      this.originSimpleCharges.push(originChargeObj)
    }

    if (this.isDestinationSimplerMethod) {
      let tempPrice: number = 0
      for (let index = 0; index < this.destinationsListSimple[0].jsonSlabDataParsed.length; index++) {
        this.destinationsListSimple[0].jsonSlabDataParsed[index].Price = (this.destinationSlabPrice[index] && parseInt(this.destinationSlabPrice[index]) !== NaN ? parseInt(this.destinationSlabPrice[index]) : 0)
        this.destinationsListSimple[0].jsonSlabDataParsed[index].BaseRate = this.baseRateOrigin ? parseInt(this.baseRateOrigin) : 0
        if (this.destinationsListSimple[0].jsonSlabDataParsed[index].Price > 0) {
          tempPrice = this.destinationsListSimple[0].jsonSlabDataParsed[index].Price
        }
        this.destinationsListSimple[0].jsonSlabDataParsed[index].TempPrice = tempPrice
      }

      const { addChrID, addChrCode, addChrName, addChrDesc, addChrType, addChrBasis, isSlabBased } = this.destinationsListSimple[0]
      const destinationChargeObj = {
        addChrID: addChrID,
        addChrCode: addChrCode,
        addChrName: addChrName,
        addChrDesc: addChrDesc,
        modeOfTrans: 'AIR',
        addChrType: addChrType,
        addChrBasis: addChrBasis,
        isSlabBased: isSlabBased,
        jsonSlabData: JSON.stringify(this.destinationsListSimple[0].jsonSlabDataParsed),
        Imp_Exp: 'IMPORT',
        CurrId: this.selectedCurrency.id,
        currency: this.selectedCurrency,
        Price: this.baseRateDestination ? parseInt(this.baseRateDestination) : 0
      }
      this.destinationSimpleCharges.push(destinationChargeObj)
    }
  }

  /**
  * [Udpdate Published Record Button Action]
  * @param  type [string]
  * @return [description]
  */
  updatePublishedRate() {
    let rateData = [];
    try {
      if (!this.validateAdditionalCharges()) {
        this.loading = false
        return;
      }
      if (
        this.selectedData.data &&
        this.selectedData.data &&
        this.selectedData.data.length
      ) {
        this.calculateSlabsPrice()
        this.calculateAdditionalSimpleData()
        let JsonSurchargeDet
        if (!this.isOriginSimplerMethod && !this.isDestinationSimplerMethod) {
          JsonSurchargeDet = JSON.stringify(
            this.selectedOrigins.concat(this.selectedDestinations)
          );
        } else if (this.isOriginSimplerMethod && !this.isDestinationSimplerMethod) {
          JsonSurchargeDet = JSON.stringify(
            this.originSimpleCharges.concat(this.selectedDestinations)
          );
        } else if (!this.isOriginSimplerMethod && this.isDestinationSimplerMethod) {
          JsonSurchargeDet = JSON.stringify(
            this.selectedOrigins.concat(this.destinationSimpleCharges)
          );
        } else if (this.isOriginSimplerMethod && this.isDestinationSimplerMethod) {
          JsonSurchargeDet = JSON.stringify(
            this.originSimpleCharges.concat(this.destinationSimpleCharges)
          );
        }
        this.selectedData.data.forEach(element => {
          let AIRObj = {
            carrierPricingID: element.carrierPricingID,
            minPrice: this.minPrice,
            effectiveFrom:
              this.fromDate && this.fromDate.month
                ? this.fromDate.month +
                "/" +
                this.fromDate.day +
                "/" +
                this.fromDate.year
                : null,
            effectiveTo:
              this.toDate && this.toDate.month
                ? this.toDate.month +
                "/" +
                this.toDate.day +
                "/" +
                this.toDate.year
                : null,
            modifiedBy: this.userProfile.LoginID,
            jsonSurchargeDetail: JsonSurchargeDet,
            customerID: element.customerID,
            jsonCustomerDetail:
              JSON.stringify(element.jsonCustomerDetail) === "[{},{}]"
                ? null
                : element.jsonCustomerDetail,
            customerType: element.customerType,
            minTransitDays: this.minTransitDays,
            maxTransitDays: this.maxTransitDays,
            jsonDepartureDays: this.jsonDepartureDays,
            aircraftTypeID: this.aircraftTypeID,
            pricingJson: JSON.stringify(this.airSlabs)
          };
          rateData.push(AIRObj);
        });
      }
    } catch (error) {
      this.isRateUpdating = false;
      this.loading = false
    }
    this._airFreightService.rateValidity(rateData).subscribe(
      (res: any) => {
        loading(false);
        this.isRateUpdating = false;
        this.loading = false
        if (res.returnId > 0) {
          if (res.returnText && typeof res.returnText === 'string') {
            this._toast.success(res.returnText, "Success");
          } else {
            this._toast.success("Rates added successfully", "Success");
          }
          this.closeModal(true);
        } else {
          this._toast.warning(res.returnText);
        }
      },
      error => {
        this.isRateUpdating = false;
        loading(false);
        this.loading = false
        this._toast.error("Error while saving rates, please try later");
      }
    );
  }


  /**
   * VALIDATE ADDITIONAL CHARGES
   *
   * @returns {boolean}
   * @memberof AirRateDialogComponent
   */
  validateAdditionalCharges(): boolean {
    let ADCHValidated: boolean = true;
    // let exportCharges
    // let importCharges
    // if (obj.JsonSurchargeDet) {
    //   const parsedJsonSurchargeDet = JSON.parse(obj.JsonSurchargeDet)
    //   exportCharges = parsedJsonSurchargeDet.filter(e => e.Imp_Exp === 'EXPORT')
    //   importCharges = parsedJsonSurchargeDet.filter(e => e.Imp_Exp === 'IMPORT')
    // }
    if (this.selectedOrigins && this.selectedOrigins.length > 0) {
      this.selectedOrigins.forEach(element => {
        if (
          Object.keys(element).length &&
          (!element.Price ||
            !(typeof parseFloat(element.Price) == "number") ||
            parseFloat(element.Price) <= 0)
        ) {
          this._toast.error("Price is missing for Additional Charge", "Error");
          this.isRateUpdating = false;
          this.loading = false
          ADCHValidated = false;
          return ADCHValidated;
        }
        if (Object.keys(element).length && !element.CurrId) {
          this._toast.error(
            "Currency is missing for Additional Charge",
            "Error"
          );
          this.isRateUpdating = false;
          this.loading = false
          ADCHValidated = false;
          return ADCHValidated;
        }
        if (Object.keys(element).length && (!element.currency || typeof (element.currency) === 'string')) {
          this._toast.error(
            "Currency is missing for Additional Charge",
            "Error"
          );
          this.isRateUpdating = false;
          this.loading = false
          ADCHValidated = false;
          return ADCHValidated;
        }
        if (Object.keys(element).length && !element.addChrID) {
          this._toast.error("Additional Charge is missing", "Error");
          this.isRateUpdating = false;
          this.loading = false
          ADCHValidated = false;
          return ADCHValidated;
        }
      });
    }
    if (this.selectedDestinations && this.selectedDestinations.length > 0) {
      this.selectedDestinations.forEach(element => {
        if (
          Object.keys(element).length &&
          (!element.Price ||
            !(typeof parseFloat(element.Price) == "number") ||
            parseFloat(element.Price) <= 0)
        ) {
          this._toast.error("Price is missing for Additional Charge", "Error");
          this.isRateUpdating = false;
          ADCHValidated = false;
          this.loading = false
          return ADCHValidated;
        }
        if (Object.keys(element).length && !element.CurrId) {
          this._toast.error(
            "Currency is missing for Additional Charge",
            "Error"
          );
          this.isRateUpdating = false;
          ADCHValidated = false;
          this.loading = false
          return ADCHValidated;
        }

        if (Object.keys(element).length && (!element.currency || typeof (element.currency) === 'string')) {
          this._toast.error(
            "Currency is missing for Additional Charge",
            "Error"
          );
          this.isRateUpdating = false;
          ADCHValidated = false;
          this.loading = false
          return ADCHValidated;
        }

        if (Object.keys(element).length && !element.addChrID) {
          this._toast.error("Additional Charge is missing", "Error");
          this.isRateUpdating = false;
          ADCHValidated = false;
          this.loading = false
          return ADCHValidated;
        }
      });
    }
    return ADCHValidated;
  }



  /**
   *
   * SET ADVANCED CHARGES IN EDIT 
   * @param {*} type
   * @memberof AirRateDialogComponent
   */
  setAdvancedChargesData(type) {
    let parsedJsonSurchargeDet;
    if (type === "publish") {
      parsedJsonSurchargeDet = JSON.parse(this.selectedData.data[0].jsonSurchargeDetail);
    } else if (type === "draft") {
      parsedJsonSurchargeDet = JSON.parse(
        this.selectedData.data.jsonSurchargeDetail
      );
    }
    // this.destinationsList = cloneObject(this.selectedData.addList);
    // this.originsList = cloneObject(this.selectedData.addList);
    this.originsList = cloneObject(this.selectedData.addList.filter(e => !e.isSlabBased));
    this.destinationsList = cloneObject(this.selectedData.addList.filter(e => !e.isSlabBased))
    if (parsedJsonSurchargeDet) {
      this.selectedOrigins = parsedJsonSurchargeDet.filter(
        e => e.Imp_Exp === "EXPORT"
      );
      this.selectedDestinations = parsedJsonSurchargeDet.filter(
        e => e.Imp_Exp === "IMPORT"
      );
    }

    if (!this.selectedOrigins.length) {
      this.selectedOrigins = [{}];
    }
    if (!this.selectedDestinations.length) {
      this.selectedDestinations = [{}];
    }
    if (this.selectedDestinations.length) {
      this.selectedDestinations.forEach(element => {
        this.destinationsList.forEach(e => {
          if (e.addChrID === element.addChrID) {
            let idx = this.destinationsList.indexOf(e);
            this.destinationsList.splice(idx, 1);
          }
        });
      });
    }

    if (this.selectedOrigins.length) {
      this.selectedOrigins.forEach(element => {
        this.originsList.forEach(e => {
          if (e.addChrID === element.addChrID) {
            let idx = this.originsList.indexOf(e);
            this.originsList.splice(idx, 1);
          }
        });
      });
    }
  }

  /**
   *
   * Removed added additional charges
   * @param {string} type origin/destination
   * @param {object} obj
   * @memberof AirRateDialogComponent
   */
  removeAdditionalCharge(type, obj) {
    if (type === "origin" && this.selectedOrigins.length > 1) {
      this.selectedOrigins.forEach(element => {
        if (element.addChrID === obj.addChrID) {
          let idx = this.selectedOrigins.indexOf(element);
          this.selectedOrigins.splice(idx, 1);
          if (element.addChrID) {
            this.originsList.push(element);
          }
        }
      });
    } else if (type === "destination" && this.selectedDestinations.length > 1) {
      this.selectedDestinations.forEach(element => {
        if (element.addChrID === obj.addChrID) {
          let idx = this.selectedDestinations.indexOf(element);
          this.selectedDestinations.splice(idx, 1);
          if (element.addChrID) {
            this.destinationsList.push(element);
          }
        }
      });
    }
  }

  switchMethod(type) {
    if (type === 'origin') {
      this.baseRateOrigin = 0
      this.originSlabPrice = []
      this.selectedOrigins = [{}];
    } else if (type === 'destination') {
      this.selectedDestinations = [{}];
      this.baseRateDestination = 0
      this.destinationSlabPrice = []
    }
  }


  ngOnDestroy() {

  }


}
