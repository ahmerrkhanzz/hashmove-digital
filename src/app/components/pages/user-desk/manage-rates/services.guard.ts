import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, NavigationStart, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { SharedService } from '../../../../services/shared.service';
import { isJSON, loading } from '../../../../constants/globalFunctions';
import { DashboardService } from '../dashboard/dashboard.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ManageRatesService } from './manage-rates.service';

@Injectable()
export class ServicesGuard implements CanActivate {

  private islogOut: boolean;
  private previousUrl: string = undefined;
  private selectedServices: any[];
  private userProfile: any;
  private hasAccess: boolean = false
  private apiLoaded: boolean = false;
  constructor(
    private router: Router,
    private _sharedService: SharedService,
    private _dashboardService: DashboardService,
    private _manageRatesService: ManageRatesService
  ) {
    loading(true)
  }


  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    this.getloginStatus();
    // if user go to manage rates sea page
    if (state.url == '/provider/manage-rates/sea') {
      if (!this.islogOut) {
        if (this.previousUrl && this.previousUrl.includes('manage-rates') && location.pathname.includes('manage-rates')) {
          if (this.selectedServices && this.selectedServices.length) {
            let index = this.selectedServices.findIndex(obj => obj.LogServCode == "SEA_FFDR");
            if (index >= 0) {
              this.hasAccess = true
              return this.hasAccess;
            }
          }
        }
        else {
          this.selectedServices = JSON.parse(localStorage.getItem('selectedServices'))
          if (this.selectedServices && this.selectedServices.length) {
            if (this.selectedServices && this.selectedServices.length) {
              let index = this.selectedServices.findIndex(obj => obj.LogServCode == "SEA_FFDR");
              if (index >= 0) {
                this.previousUrl = state.url;
                return true
              }
            }
          } else {
            return this.getProviderLogisticService(this.userProfile.ProviderID, 'SEA')
          }
        }
      }
      else {
        this.router.navigate(['registration']);
      }
    }

    if (state.url == '/provider/manage-rates/air') {
      if (!this.islogOut) {
        if (this.previousUrl && this.previousUrl.includes('manage-rates') && location.pathname.includes('manage-rates')) {
          if (this.selectedServices && this.selectedServices.length) {
            let index = this.selectedServices.findIndex(obj => obj.LogServCode == "AIR_FFDR");
            if (index >= 0) {
              return true; //@todo move to true for enable on condition basis
            }
          }
        } else {
          this.selectedServices = JSON.parse(localStorage.getItem('selectedServices'))
          if (this.selectedServices && this.selectedServices.length) {
            if (this.selectedServices && this.selectedServices.length) {
              let index = this.selectedServices.findIndex(obj => obj.LogServCode == "AIR_FFDR");
              if (index >= 0) {
                this.previousUrl = state.url;
                return true
              }
            }
          } else {
            return this.getProviderLogisticService(this.userProfile.ProviderID, 'AIR')
          }
        }
      }
      else {
        this.router.navigate(['registration']);
      }
    }

    if (state.url == '/provider/manage-rates/ground') {
      if (!this.islogOut) {
        if (this.previousUrl && this.previousUrl.includes('manage-rates') && location.pathname.includes('manage-rates')) {
          if (this.selectedServices && this.selectedServices.length) {
            let index = this.selectedServices.findIndex(obj => obj.LogServCode == "TRUK");
            if (index >= 0) {
              return true;
            }
          }
        } else {
          this.selectedServices = JSON.parse(localStorage.getItem('selectedServices'))
          if (this.selectedServices && this.selectedServices.length) {
            if (this.selectedServices && this.selectedServices.length) {
              let index = this.selectedServices.findIndex(obj => obj.LogServCode == "TRUK");
              if (index >= 0) {
                this.previousUrl = state.url;
                return true
              }
            }
          } else {
            return this.getProviderLogisticService(this.userProfile.ProviderID, 'GROUND')
          }
        }
      }
      else {
        this.router.navigate(['registration']);
      }
    }

    if (state.url == '/provider/manage-rates/warehouse') {
      console.log(this.selectedServices);
      if (!this.islogOut) {
        // if (this.previousUrl && this.previousUrl.includes('manage-rates') && location.pathname.includes('manage-rates')) {
        if (this.selectedServices && this.selectedServices.length) {
          let index = this.selectedServices.findIndex(obj => obj.LogServCode == "WRHS");
          if (index >= 0) {
            return true;
          }
        }
        else {
          this.selectedServices = JSON.parse(localStorage.getItem('selectedServices'))
          if (this.selectedServices && this.selectedServices.length) {
            if (this.selectedServices && this.selectedServices.length) {
              let index = this.selectedServices.findIndex(obj => obj.LogServCode == "WRHS");
              if (index >= 0) {
                this.previousUrl = state.url;
                return true
              }
            }
          } else {
            return this.getProviderLogisticService(this.userProfile.ProviderID, 'WAREHOUSE')
          }
        }
      }
      else {
        this.router.navigate(['registration']);
      }
    }



  }
  getDashboardDataByRoute(id, state, type): Observable<boolean> {
    return this._dashboardService.getdashboardDetails(id).map((res: any) => {
      if (res.returnStatus == 'Success') {
        if (res.returnObject && Object.keys(res.returnObject).length) {
          this._sharedService.dashboardDetail.next(res.returnObject);
          if (res.returnObject.LogisticService && isJSON(res.returnObject.LogisticService)) {
            this.selectedServices = JSON.parse(res.returnObject.LogisticService);
            if (this.selectedServices && this.selectedServices.length) {
              if (type == 'Air') {
                let index = this.selectedServices.findIndex(obj => obj.LogServCode == "AIR_FFDR");
                if (index >= 0) {
                  this.previousUrl = state.url;
                  return true
                }
              }
              else if (type == 'Ground') {
                let index = this.selectedServices.findIndex(obj => obj.LogServCode == "TRUK");
                if (index >= 0) {
                  this.previousUrl = state.url;
                  return true
                }
              }
              else if (type == 'Warehouse') {
                let index = this.selectedServices.findIndex(obj => obj.LogServCode == "WRHS");
                if (index >= 0) {
                  this.previousUrl = state.url;
                  return true
                }
              }

            } else {
              this.router.navigate(['provider/dashboard']);
            }

          }
        }
      }
      else {
        return false;

      }
    }, (err: HttpErrorResponse) => {
      console.log(err)
      this.router.navigate(['provider/dashboard']);
      return Observable.of(true);
    })
  }
  getProviderLogisticService(id, type): Observable<boolean> {
    return this._manageRatesService.getProviderLogisticService(id).map((res: any) => {
      if (res.returnObject) {
        this.selectedServices = res.returnObject;
        localStorage.setItem('selectedServices', JSON.stringify(this.selectedServices))
        if (this.selectedServices && this.selectedServices.length) {
          if (type === 'SEA') {
            let index = this.selectedServices.findIndex(obj => obj.LogServCode == "SEA_FFDR");
            if (index >= 0) {
              return true;
            }
          } else if (type == 'AIR') {
            let index = this.selectedServices.findIndex(obj => obj.LogServCode == "AIR_FFDR");
            if (index >= 0) {

              return true
            }
          }
          else if (type == 'GROUND') {
            let index = this.selectedServices.findIndex(obj => obj.LogServCode == "TRUK");
            if (index >= 0) {

              return true
            }
          }
          else if (type == 'WAREHOUSE') {
            let index = this.selectedServices.findIndex(obj => obj.LogServCode == "WRHS");
            if (index >= 0) {
              return true
            }
          }

          // else {
          //   if (false) {
          //     // this.router.navigate(['provider/manage-rates/air']);
          //     // this.apiLoaded = false;
          //   }
          //   else {
          //     let index = this.selectedServices.findIndex(obj => obj.LogServCode == "TRUK");
          //     if (index >= 0) {
          //       this.router.navigate(['provider/manage-rates/ground']);
          //       this.apiLoaded = true;
          //     }
          //     else {
          //       let index = this.selectedServices.findIndex(obj => obj.LogServCode == "WRHS");
          //       if (index >= 0) {
          //         this.router.navigate(['provider/manage-rates/warehouse']);
          //         this.apiLoaded = true;
          //       }
          //     }
          //   }
          // }

        } else {
          this.router.navigate(['provider/dashboard']);
        }
      }
      else {
        return false;
      }
    }, (err: HttpErrorResponse) => {
      this.router.navigate(['provider/dashboard']);
      return Observable.of(true);
    })
  }
  getloginStatus() {
    let userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.returnText) {
      this.userProfile = JSON.parse(userInfo.returnText);
      this._sharedService.IsloggedIn.subscribe((state: any) => {
        this.islogOut = this.userProfile.IsLogedOut
      })
    } else {
      this.islogOut = true;
    }
  }
}
