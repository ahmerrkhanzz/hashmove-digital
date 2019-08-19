import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  Renderer2,
  ViewEncapsulation,
  Input
} from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import {
  NgbDatepicker,
  NgbInputDatepicker,
  NgbDateStruct,
  NgbCalendar,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbModal
} from "@ng-bootstrap/ng-bootstrap";
import { NgbDateFRParserFormatter } from "../../../constants/ngb-date-parser-formatter";
import { PlatformLocation } from "@angular/common";
import { SeaFreightService } from "../../../components/pages/user-desk/manage-rates/sea-freight/sea-freight.service";
import { SharedService } from "../../../services/shared.service";
import { Observable, Subject, Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged, map } from "rxjs/operators";
import { ToastrService } from "ngx-toastr";
import { GroundTransportService } from "../../../components/pages/user-desk/manage-rates/ground-transport/ground-transport.service";
import { AirFreightService } from "../../../components/pages/user-desk/manage-rates/air-freight/air-freight.service";
import { JsonResponse } from "../../../interfaces/JsonResponse";
import { isNumber } from "../sea-rate-dialog/sea-rate-dialog.component";

const now = new Date();
const equals = (one: NgbDateStruct, two: NgbDateStruct) =>
  one &&
  two &&
  two.year === one.year &&
  two.month === one.month &&
  two.day === one.day;

const before = (one: NgbDateStruct, two: NgbDateStruct) =>
  !one || !two
    ? false
    : one.year === two.year
      ? one.month === two.month
        ? one.day === two.day
          ? false
          : one.day < two.day
        : one.month < two.month
      : one.year < two.year;

const after = (one: NgbDateStruct, two: NgbDateStruct) =>
  !one || !two
    ? false
    : one.year === two.year
      ? one.month === two.month
        ? one.day === two.day
          ? false
          : one.day > two.day
        : one.month > two.month
      : one.year > two.year;

@Component({
  selector: "app-rate-validity",
  templateUrl: "./rate-validity.component.html",
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter }
  ],
  styleUrls: ["./rate-validity.component.scss"]
})
export class RateValidityComponent implements OnInit {
  @Input() validityData: any;
  @ViewChild("dp") input: NgbInputDatepicker;
  @ViewChild("rangeDp") rangeDp: ElementRef;

  private allCurrencies: any[] = [];
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
  private userProfile: any;
  public price: any;
  public selectedCurrency: any;
  public minPrice: any;
  public normalPrice: any;
  public plusfortyFivePrice: any;
  public plushundredPrice: any;
  public plusTwoFiftyPrice: any;
  public plusFiveHundPrice: any;
  public plusThousandPrice: any;
  isHovered = date =>
    this.fromDate &&
    !this.toDate &&
    this.hoveredDate &&
    after(date, this.fromDate) &&
    before(date, this.hoveredDate);
  isInside = date => after(date, this.fromDate) && before(date, this.toDate);
  isFrom = date => equals(date, this.fromDate);
  isTo = date => equals(date, this.toDate);

  constructor(
    calendar: NgbCalendar,
    private location: PlatformLocation,
    private _activeModal: NgbActiveModal,
    private _parserFormatter: NgbDateParserFormatter,
    private renderer: Renderer2,
    private _seaFreightService: SeaFreightService,
    private _groundTransportService: GroundTransportService,
    private _airFreightService: AirFreightService,
    private _sharedService: SharedService,
    private _toast: ToastrService
  ) {
    location.onPopState(() => this.closeModal(null));
  }

  ngOnInit() {
    let userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo && userInfo.returnText) {
      this.userProfile = JSON.parse(userInfo.returnText);
    }
    this.allservicesBySea();
  }
  allservicesBySea() {
    this._sharedService.dataLogisticServiceBySea.subscribe(state => {
      this.loading = false
      if (state && state.length) {
        for (let index = 0; index < state.length; index++) {
          if (state[index].LogServName == "SEA") {
            this.allCurrencies = state[index].DropDownValues.UserCurrency;
            if (
              this.allCurrencies.length &&
              this.validityData &&
              this.validityData.data &&
              this.validityData.data.length &&
              this.validityData.data.length == 1
            ) {
              this.setData();
            }
          }
        }
      }
    });
  }
  setData() {
    let parsed = "";
    if (this.validityData.data[0].effectiveFrom) {
      this.fromDate.day = new Date(
        this.validityData.data[0].effectiveFrom
      ).getDate();
      this.fromDate.year = new Date(
        this.validityData.data[0].effectiveFrom
      ).getFullYear();
      this.fromDate.month =
        new Date(this.validityData.data[0].effectiveFrom).getMonth() + 1;
    }
    if (this.validityData.data[0].effectiveTo) {
      this.toDate.day = new Date(
        this.validityData.data[0].effectiveTo
      ).getDate();
      this.toDate.year = new Date(
        this.validityData.data[0].effectiveTo
      ).getFullYear();
      this.toDate.month =
        new Date(this.validityData.data[0].effectiveTo).getMonth() + 1;
    }
    if (this.fromDate && this.fromDate.day) {
      this.model = this.fromDate;
      parsed += this._parserFormatter.format(this.fromDate);
    }
    if (this.toDate && this.toDate.day) {
      parsed += " - " + this._parserFormatter.format(this.toDate);
    }
    this.rangeDp.nativeElement.value = parsed;
    this.selectedCurrency = this.allCurrencies.find(
      obj => obj.currencyID == this.validityData.data[0].currencyID
    );
    if (this.validityData.type != "rateValidityAIR") {
      this.price = this.validityData.data[0].price;
    } else if (this.validityData.type == "rateValidityAIR") {
      let minPrice = this.validityData.data[0].slab.minPrice1.split(" ").pop();
      this.minPrice = Math.ceil(minPrice) ? Number(minPrice).toFixed(2) : null;
      this.normalPrice = Math.ceil(this.validityData.data[0].slab.price1)
        ? Number(this.validityData.data[0].slab.price1).toFixed(2)
        : null;
      this.plusfortyFivePrice = Math.ceil(this.validityData.data[0].slab.price2)
        ? Number(this.validityData.data[0].slab.price2).toFixed(2)
        : null;
      this.plushundredPrice = Math.ceil(this.validityData.data[0].slab.price3)
        ? Number(this.validityData.data[0].slab.price3).toFixed(2)
        : null;
      this.plusTwoFiftyPrice = Math.ceil(this.validityData.data[0].slab.price4)
        ? Number(this.validityData.data[0].slab.price4).toFixed(2)
        : null;
      this.plusFiveHundPrice = Math.ceil(this.validityData.data[0].slab.price5)
        ? Number(this.validityData.data[0].slab.price5).toFixed(2)
        : null;
      this.plusThousandPrice = Math.ceil(this.validityData.data[0].slab.price6)
        ? Number(this.validityData.data[0].slab.price6).toFixed(2)
        : null;
    }
  }
  onDateSelection(date: NgbDateStruct) {
    let parsed = "";
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
      parsed += " - " + this._parserFormatter.format(this.toDate);
    }

    this.renderer.setProperty(this.rangeDp.nativeElement, "value", parsed);
  }
  closePopup(val?) {
    this.closeModal((val)?val:null);
  }
  closeModal(status) {
    this._activeModal.close(status);
    document.getElementsByTagName("html")[0].style.overflowY = "auto";
  }

  numberValid(evt) {
    let charCode = evt.which ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) return false;
    return true;
  }
  public loading: boolean = true
  updateRates() {
    this.loading = true
    if (!this.fromDate || this.fromDate === null) {
      this._toast.warning("Please enter a valid date range for this rate");
      this.loading = false
      return;
    }

    if (!this.toDate || this.toDate === null) {
      this._toast.warning("Please enter a valid date range for this rate");
      this.loading = false
      return;
    }
    if (this.validityData.type == "fcl") {
      this.updateRatesfcl("fcl");
    } else if (this.validityData.type == "lcl") {
      this.updateRatesfcl("lcl");
    } else if (this.validityData.type == "rateValidityGROUND") {
      this.updateRatesGround();
    } else if (this.validityData.type == "rateValidityAIR") {
      this.updateRatesAir();
    } else if (this.validityData.type == "warehouse") {
      this.updateRatesfcl("warehouse");
    }
  }

  updateRatesfcl(type) {
    let rateData = [];
    if (
      this.validityData &&
      this.validityData.data &&
      this.validityData.data.length
    ) {
      this.validityData.data.forEach(element => {
        if (type === "fcl") {
          let FCLObj = {
            carrierPricingID: element.carrierPricingID,
            rate: this.price,
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
            modifiedBy: this.userProfile.LoginID
          };
          rateData.push(FCLObj);
        } else if (type === "lcl") {
          let LCLObj = {
            consolidatorPricingID: element.consolidatorPricingID,
            rate: this.price,
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
            modifiedBy: this.userProfile.LoginID
          };
          rateData.push(LCLObj);
        } else if (type === "warehouse") {
          let WHObj = {
            whPricingID: element.whPricingID,
            pricingJson: element.pricingJson,
            rate: this.price,
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
            modifiedBy: this.userProfile.LoginID
          };
          rateData.push(WHObj);
        }
      });
    }

    this._seaFreightService.rateValidityFCL(type, rateData).subscribe(
      (res: any) => {
        this.loading = false
        if (res.returnId > 0) {
          this._toast.success("Record successfully updated", "");
          this.closeModal(res.returnStatus);
        } else {
          this._toast.error(res.returnText, "");
        }
      },
      error => {
        this.loading = false
        this._toast.error("Unable to update Rates, please try Later", "");
      }
    );
  }
  updateRateslcl() {
    let rateData = [];
    if (
      this.validityData &&
      this.validityData.data &&
      this.validityData.data.length
    ) {
      this.validityData.data.forEach(element => {
        rateData.push({
          consolidatorPricingID: element.consolidatorPricingID,
          rate: this.price,
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
          modifiedBy: this.userProfile.LoginID
        });
      });
    }

    this._seaFreightService.rateValidityLCL(rateData).subscribe((res: any) => {
      this.loading = false
      if (res.returnStatus == "Success") {
        this._toast.success("Record successfully updated", "");
        this.closeModal(res.returnStatus);
      } else {
        this._toast.error(res.returnText, "");
      }
    });
  }

  updateRatesGround() {
    let rateData = [];
    if (
      this.validityData &&
      this.validityData.data &&
      this.validityData.data.length
    ) {
      this.validityData.data.forEach(element => {
        rateData.push({
          pricingID: element.id,
          transportType: element.transportType,
          rate: this.price,
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
          modifiedBy: this.userProfile.LoginID
        });
      });
    }

    this._groundTransportService
      .rateValidity(rateData)
      .subscribe((res: any) => {
        this.loading = false
        if (res.returnStatus == "Success") {
          this._toast.success("Record successfully updated", "");
          this.closeModal(res.returnStatus);
        } else {
          this._toast.error(res.returnText, "");
        }
      });
  }

  updateRatesAir() {
    let rateData = [];
    if (
      this.validityData &&
      this.validityData.data &&
      this.validityData.data.length
    ) {
      this.validityData.data.forEach(element => {
        rateData.push({
          carrierPricingID: element.carrierPricingID,
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
          modifiedBy: this.userProfile.LoginID
        });
      });
    }

    this._airFreightService.rateValidity(rateData).subscribe((res: any) => {
      this.loading = false
      if (res.returnStatus == "Success") {
        this._toast.success("Record successfully updated", "");
        this.closeModal(true);
      } else {
        this._toast.error(res.returnText, "");
      }
    });
  }

  currencies = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      map(term =>
        !term || term.length < 3
          ? []
          : this.allCurrencies.filter(
            v =>
              v.CurrencyCode &&
              v.CurrencyCode.toLowerCase().indexOf(term.toLowerCase()) > -1
          )
      )
    );
  currencyFormatter = (x: { CurrencyCode: string }) => x.CurrencyCode;
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  getDateStr($date) {

    const strMonth = isNumber($date.month) ? this.months[$date.month - 1] + "" : "";
    return $date.day + '-' + strMonth + '-' + $date.year
  }
}
