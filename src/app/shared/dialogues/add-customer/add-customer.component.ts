import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomersService } from '../../../components/pages/user-desk/customers/customers.service';
import { ToastrService } from 'ngx-toastr';
import { isJSON, getImagePath, ImageSource, ImageRequiredSize } from '../../../constants/globalFunctions';
import { baseExternalAssets } from '../../../constants/base.url';

@Component({
  selector: 'app-add-customer',
  templateUrl: './add-customer.component.html',
  styleUrls: ['./add-customer.component.scss']
})
export class AddCustomerComponent implements OnInit {
  @Input() searchData: any
  public companyLocation: string
  public companyName: string
  public companyEmail: string
  public contactPerson: string
  public showInvitation: boolean = false
  public modalTitle: string = 'Add New Customer'
  constructor(
    public _activeModal: NgbActiveModal,
    private _customersService: CustomersService,
    private _toast: ToastrService
  ) { }

  ngOnInit() {
    console.log(this.searchData)
  }

  close(val) {
    this._activeModal.close(val)
  }


  /**
   * SEARCH CUSTOMER
   *
   * @memberof AddCustomerComponent
   */
  public hasResults: boolean = false
  public searchResults: any[] = []
  searchCustomer() {
    if (this.companyName && this.companyLocation) {
      this._customersService.searchCustomer(this.searchData.providerID, this.companyLocation, this.companyName).subscribe((res: any) => {
        console.log(res)
        this.hasResults = true
        if (res.returnCode === "1") {
          this.searchResults = res.returnObject
          this.searchResults.forEach(element => {
            element.isChecked = false
          });
          this.modalTitle = this.searchResults.length + " result(s) found for " + this.companyName
        } else if (res.returnCode === "2") {
          this.modalTitle = res.returnText + ' for ' + this.companyName
        }


      }, (err) => {
        console.log(err)
      })
    } else {
      this._toast.error('Please fill both fields', 'Error')
    }
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

  sendInvite() {
    this.showInvitation = true
    this.modalTitle = 'Send invite to join Hashmove'
  }

  addCustomer() {
    console.log(this.searchResults)
    let data: any[] = []
    this.searchResults.forEach(element => {
      if (element.isChecked) {
        let obj: AddCustomerPayload = {
          providerID: this.searchData.providerID,
          customerID: element.companyID,
          customerType: 'COMPANY',
          createdBy: this.searchData.email,
          isByCustomer: false,
          isByProvider: true
        }
        data.push(obj)
      }
    })
    this._customersService.proivderCustomer(data).subscribe((res: any) => {
      res.returnObject.forEach(element => {
        if (!element.ErrorMsg) {
          this._toast.success(res.returnText, 'Success')
        }
        if (element.ErrorMsg) {
          this.searchResults.filter(e => e.companyID === element.CustomerID)
          this.searchResults.forEach(e => {
            this._toast.warning(e.companyName + ' ' + element.ErrorMsg, 'Warning')
          })
        }
      });
      this.close(true)
    }, (err: any) => {
      console.log(err)
    })
  }

}


export interface AddCustomerPayload {
  providerID: number;
  customerID: number;
  customerType: string;
  createdBy: string;
  isByCustomer: boolean;
  isByProvider: boolean;
}
