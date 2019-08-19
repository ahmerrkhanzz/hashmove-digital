import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SeaFreightService } from './sea-freight/sea-freight.service';
import { SharedService } from '../../../../services/shared.service';
import { loading, isJSON, getImagePath, ImageSource, ImageRequiredSize } from '../../../../constants/globalFunctions';
import { ManageRatesService } from './manage-rates.service';
import { HttpErrorResponse } from '@angular/common/http';
import { SettingService } from '../settings/setting.service';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { CommonService } from '../../../../services/common.service';
import { removeDuplicateCurrencies, compareValues } from '../billing/billing.component';

@Component({
  selector: 'app-manage-rates',
  templateUrl: './manage-rates.component.html',
  styleUrls: ['./manage-rates.component.scss']
})
export class ManageRatesComponent implements OnInit, OnDestroy {

  public selectedServices: any[];
  private dashBoardSubscriber: any
  public seaDisabled: boolean = true;
  public airDisabled: boolean = true;
  public groundDisabled: boolean = true;
  public warehouseDisabled: boolean = true;
  public userProfile: any;
  public currencyList: any[] = []
  public additionalCharges: any[] = []
  public allCustomers: any[] = []
  public sharedList: any[] = []

  constructor(
    private _router: Router,
    private _seaFreightService: SeaFreightService,
    private _commonService: CommonService,
    private _sharedService: SharedService,
    private _manageRatesService: ManageRatesService
  ) { }

  ngOnInit() {
    loading(true)
    let userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.returnText) {
      this.userProfile = JSON.parse(userInfo.returnText);
    }
    this.getPortsData();
    this.getContainers();
    this.getDashboardDetail();
    this.getAllCustomers(this.userProfile.ProviderID)
    this.getAllCarriers()
    this.getShippingCategory()
    this._sharedService.currencyList.subscribe((state: any) => {
      if (state) {
        this.currencyList = state;
        this.getUserCurrency();
      } else {
        this._commonService.getAllCurrency(100).subscribe((res: any) => {
          if (res && res.length) {
            let currencyList = res;
            currencyList = removeDuplicateCurrencies(currencyList)
            currencyList.sort(compareValues('title', "asc"));
            this._sharedService.currencyList.next(currencyList);
            this.currencyList = currencyList
            this.getUserCurrency();
          }
        });
      }
    });
  }
  ngOnDestroy() {
    localStorage.removeItem('additionalCharges')
    localStorage.removeItem('customers')
  }


  /**
   *
   * SET ACTIVE AND DISABLED TABS FOR MANAGE RATES
   * @memberof ManageRatesComponent
   */
  getDashboardDetail() {
    this.selectedServices = JSON.parse(localStorage.getItem('selectedServices'))
    if (this.selectedServices && this.selectedServices.length) {
      let indexSEA = this.selectedServices.findIndex(elem => elem.LogServCode == 'SEA_FFDR');
      let indexAIR = this.selectedServices.findIndex(elem => elem.LogServCode == 'AIR_FFDR');
      let indexGround = this.selectedServices.findIndex(elem => elem.LogServCode == 'TRUK');
      let indexWarehouse = this.selectedServices.findIndex(elem => elem.LogServCode == 'WRHS');
      this.seaDisabled = (indexSEA >= 0) ? false : true;
      this.airDisabled = (indexAIR >= 0) ? false : true;
      this.groundDisabled = (indexGround >= 0) ? false : true;
      this.warehouseDisabled = (indexWarehouse >= 0) ? false : true;
    }
  }

  tonavigate(url) {
    this._router.navigate([url]);
  }
  getClass(path): string {
    if (location.pathname === path) {
      return 'active'
    }
  };

  getPortsData() {
    this._manageRatesService.getPortsData().subscribe((res: any) => {
      localStorage.setItem("PortDetails", JSON.stringify(res));
    }, (err: HttpErrorResponse) => {
    })
  }

  getContainers() {
    this._manageRatesService.getContainersMapping().subscribe((res: any) => {
      localStorage.setItem("containers", JSON.stringify(res.returnObject));
    }, (err: HttpErrorResponse) => {
    })
  }

  aitTooltip() {
    return (this.airDisabled) ? this.userProfile.CompanyName + ' does not support Air Freight' : ''
  }
  // Email us your rates at support@hashmove.com


  /**
   *
   * SET USER CURRENCY IN LOCAL STORAGE
   * @memberof ManageRatesComponent
   */
  getUserCurrency() {
    // loading(true);
    const selectedCurrency = this.currencyList.find(
      obj => obj.id === this.userProfile.CurrencyID
    );
    // Object Destructuring to get sub props of object
    const userCurrency = (({ id, imageName, shortName }) => ({ id, imageName, shortName }))(selectedCurrency);
    localStorage.setItem('userCurrency', JSON.stringify(userCurrency))
  }

  /**
   *
   * Getting list of all customers
   * @param {number} ProviderID
   * @memberof ManageRateComponent
   */
  getAllCustomers(ProviderID) {
    this._seaFreightService.getAllCustomers(ProviderID).subscribe((res: any) => {
      if (res.returnId > 0) {
        this.allCustomers = res.returnObject
        this.allCustomers.forEach(e => {
          e.CustomerImageParsed = getImagePath(ImageSource.FROM_SERVER, e.CustomerImage, ImageRequiredSize._48x48)
        })
        localStorage.setItem('customers', JSON.stringify(this.allCustomers))
      }
    }, (err) => {
    })
  }


  /**
   *
   * GET ALL CARRIER'S LIST IN MASTER
   * @memberof ManageRatesComponent
   */
  public carriersList: any[] = []
  getAllCarriers() {
    this._manageRatesService.getAllCarriers().pipe(untilDestroyed(this)).subscribe((res: any) => {
      console.log(res)
      this.carriersList = res
      localStorage.setItem('carriersList', JSON.stringify(res))
    }, (err: any) => {
    })
  }

  /**
   *
   * GET ALL CARGO TYPES
   * @memberof ManageRatesComponent
   */
  public cargoTypes: any[] = []
  getShippingCategory() {
    this._manageRatesService.getShippingCategory().pipe(untilDestroyed(this)).subscribe((res: any) => {
      this.cargoTypes = res
      localStorage.setItem('cargoTypes', JSON.stringify(res))
    }, (err: any) => {
    })
  }

}
