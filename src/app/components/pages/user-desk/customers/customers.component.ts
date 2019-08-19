import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddCustomerComponent } from '../../../../shared/dialogues/add-customer/add-customer.component';
import { CustomersService } from './customers.service';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { baseExternalAssets } from '../../../../constants/base.url';
import { getImagePath, ImageSource, ImageRequiredSize, isJSON, loading } from '../../../../constants/globalFunctions';
import { PaginationInstance } from 'ngx-pagination';


@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit, OnDestroy {
  public userProfile: any
  public customers: any[] = []
  public loading: boolean = false
  public searchUser: any;

  //Pagination work
  public maxSize: number = 7;
  public directionLinks: boolean = true;
  public autoHide: boolean = false;
  public userPaginationConfig: PaginationInstance = {
    id: "users",
    itemsPerPage: 10,
    currentPage: 1
  };

  public labels: any = {
    previousLabel: "",
    nextLabel: ""
  };
  public currentSort: string = "name";
  constructor(
    private _modalService: NgbModal,
    private _customersService: CustomersService) { }

  ngOnInit() {
    let userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.returnText) {
      this.userProfile = JSON.parse(userInfo.returnText);
    }
    this.getProviderCustomerList()
  }

  addCustomer() {
    const modalRef = this._modalService.open(AddCustomerComponent, {
      size: 'lg',
      centered: true,
      windowClass: 'small-modal',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.searchData = {
      providerID: this.userProfile.ProviderID,
      email: this.userProfile.PrimaryEmail
    }
    modalRef.result.then((result) => {
      if (result) {
        this.getProviderCustomerList()
      }
    });
  }


  /**
   * GET CUSTOMERS FOR PROVIDER
   *
   * @memberof CustomersComponent
   */
  getProviderCustomerList() {
    this._customersService.getProviderCustomerList(this.userProfile.ProviderID).pipe(untilDestroyed(this)).subscribe((res: any) => {
      loading(false)
      if (res.returnId > 0) {
        this.customers = res.returnObject
      }
    }, (err: any) => {
      loading(false)
    })
  }

  /**
   * [Get UI image path from server]
   * @param  $image [description]
   * @param  type   [description]
   * @return        [description]
   */
  getProviderImage($image: string) {
    if (isJSON($image)) {
      const providerImage = JSON.parse($image)
      return baseExternalAssets + '/' + providerImage[0].DocumentFile
    } else {
      return getImagePath(ImageSource.FROM_SERVER, $image, ImageRequiredSize.original)
    }
  }

  onPageChange(number: any) {
    this.userPaginationConfig.currentPage = number;
  }

  ngOnDestroy() {

  }

}
