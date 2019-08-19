import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { baseApi } from '../../../../constants/base.url';

@Injectable()
export class CustomersService {

  constructor(private _http: HttpClient) { }


  /**
   *
   * GET CUSTOMER'S LIST FOR PROVIDER'S
   * @param {*} providerId
   * @returns
   * @memberof CustomersService
   */
  getProviderCustomerList(providerId) {
    let url = `ProviderCustomer/GetProviderCustomerList/${providerId}`;
    return this._http.get(baseApi + url);
  }


  /**
   *
   * SEARCH CUSTOMER
   * @param {number} providerID
   * @param {string} countryName
   * @param {string} companyName
   * @memberof CustomersService
   */
  searchCustomer(providerID, countryName, companyName) {
    let url = `ProviderCustomer/SearchCustomer/${providerID}/${countryName}/${companyName}`
    return this._http.get(baseApi + url);
  }


  /**
   *
   * SELECTED PROVIDER CUSTOMER
   * @param {object} data
   * @returns
   * @memberof CustomersService
   */
  proivderCustomer(data) {
    let url = `ProviderCustomer/Post`
    return this._http.post(baseApi + url, data);
  }


}
