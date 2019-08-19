import { Component, OnInit, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons, NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { DashboardService } from '../../../components/pages/user-desk/dashboard/dashboard.service';
import { encryptBookingID, feet2String, loading } from '../../../constants/globalFunctions';
import { Observable } from 'rxjs';
import { SharedService } from '../../../services/shared.service';
import { ToastrService } from 'ngx-toastr';
import { CurrencyControl } from '../../../services/currency.service';
import { JsonResponse } from '../../../interfaces/JsonResponse';
import { CommonService } from '../../../services/common.service';


@Component({
  selector: "app-update-price",
  templateUrl: "./update-price.component.html",
  styleUrls: ["./update-price.component.scss"]
})
export class UpdatePriceComponent implements OnInit {
  @Input() data: any;
  public containers: any[] = []
  public specialRequestComments: string = ""
  public selectedCurrency: any = {};
  public actualIndividualPrice;
  public userInfo: any = {}
  public loading: boolean = false
  constructor(
    private _modalService: NgbModal,
    private _dashboardService: DashboardService,
    public _activeModal: NgbActiveModal,
    private _sharedService: SharedService,
    private _toast: ToastrService,
    private _currencyService: CurrencyControl,
    private _commonService: CommonService
  ) { }

  ngOnInit() {
    this.userInfo = JSON.parse(localStorage.getItem('userInfo'))
    this.getContainerDetails()
    this._sharedService.currencyList.subscribe((state: any) => {
      if (state) {
        this.currencyList = state;
        this.selectedCurrency = this.currencyList.find(e => e.id === this.data.CurrencyID)
      }
    });
  }

  open(content) {
    this._modalService.open(content, {
      windowClass: "update-price-modal upper-medium-modal-history",
      size: "sm",
      centered: true
    });
  }

  closeModal() {
    this._activeModal.close(false)
  }

  getContainerDetails() {
    let id = encryptBookingID(this.data.BookingID, this.data.ProviderID, this.data.ShippingModeCode);
    this._dashboardService.getContainerDetails(id, 'PROVIDER').subscribe((res: any) => {
      this.containers = res.returnObject
    }, (err) => {
      console.log(err)
    })
  }

  public currencyList: any[] = [];
  getContainerInfo(container) {
    let containerInfo = {
      containerSize: undefined,
      containerWeight: undefined
    };
    containerInfo.containerWeight = container.MaxGrossWeight;
    containerInfo.containerSize =
      feet2String(container.containerLength) +
      ` x ` +
      feet2String(container.containerWidth) +
      ` x ` +
      feet2String(container.containerHeight);
    return containerInfo;
  }

  currency = (text$: Observable<string>) =>
    text$
      .debounceTime(200)
      .map(term => (!term || term.length < 3) ? []
        : this.currencyList.filter(v => v.shortName.toLowerCase().indexOf(term.toLowerCase()) > -1));
  formatterCurrency = (x: { title: string, code: string, imageName: string, shortName: string, id: number, desc: string, type: string, lastUpdate: string, webURL: string, sortingOrder: string }) => {
    this.selectedCurrency.id = x.id
    this.selectedCurrency.imageName = x.imageName;
    this.selectedCurrency.title = x.title;
    this.selectedCurrency.code = x.code;
    this.selectedCurrency.name = x.title;
    this.selectedCurrency.desc = x.desc;
    this.selectedCurrency.shortName = x.shortName;
    this.selectedCurrency.type = x.type
    this.selectedCurrency.webURL = x.webURL
    this.selectedCurrency.lastUpdate = x.lastUpdate
    this.selectedCurrency.sortingOrder = x.sortingOrder
    return x.shortName
  };

  spaceHandler(event) {
    if (event.charCode == 32) {
      event.preventDefault();
      return false;
    }
  }

  numberValidwithDecimal(evt) {
    let charCode = (evt.which) ? evt.which : evt.keyCode;
    if (evt.target.value && evt.target.value[evt.target.value.length - 1] == '.') {
      if (charCode > 31
        && (charCode < 48 || charCode > 57))
        return false;

      return true;
    }
    if (charCode != 46 && charCode > 31
      && (charCode < 48 || charCode > 57))
      return false;

    return true;
  }

  async submitPrice() {
    if (this.actualIndividualPrice >= this.data.BookingTotalAmount) {
      this._toast.warning('Special price should be less than original price', 'Warning')
      return;
    }
    if (this.actualIndividualPrice <= 0) {
      this._toast.warning('Special price cannot be zero', 'Warning')
      return;
    }
    this.loading = true
    const baseCurr = JSON.parse(localStorage.getItem('CURR_MASTER'))
    const res2: JsonResponse = await this._commonService.getExchangeRateList(baseCurr.fromCurrencyID).toPromise()
    let exchangeData = res2.returnObject
    let exchangeRate = exchangeData.rates.filter(rate => rate.currencyID === this.selectedCurrency.id)[0]

    let obj: any
    let userID: any
    let discountedPrice = this.data.BookingTotalAmount - this.actualIndividualPrice
    try {
      obj = {
        bookingID: this.data.BookingID,
        currencyID: this.selectedCurrency.id,
        actualIndividualPrice: discountedPrice,
        baseIndividualPrice: this._currencyService.getPriceToBase((discountedPrice), true, exchangeRate.rate),
        exchangeRate: exchangeRate.rate,
        specialRequestComments: this.specialRequestComments,
        userID: this.data.ProviderID,
        requestStatus: 'PRICE SENT'
      }
      userID = JSON.parse(this.userInfo.returnText)
    } catch (error) {

    }
    userID = JSON.parse(this.userInfo.returnText)

    this._dashboardService.updateSpecialPrice(this.data.BookingID, userID.LoginID, obj).subscribe((res: JsonResponse) => {
      this.loading = false
      if (res.returnId > 0) {
        let response = JSON.parse(res.returnText)
        let obj = {
          price: this.actualIndividualPrice,
          status: response.SpecialRequestStatus,
          logs: JSON.parse(response.JSONSpecialRequestLogs)
        }
        this._toast.success('Price updated successfully', 'Success')
        this._activeModal.close(obj)
      } else {
        this._toast.error(res.returnText, 'Failed')
      }
    }, (err: any) => {
      this.loading = false
      console.log(err);
    })
  }
}
