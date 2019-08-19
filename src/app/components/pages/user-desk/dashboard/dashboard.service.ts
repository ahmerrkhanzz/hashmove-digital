import { Injectable } from '@angular/core';
import { baseApi } from '../../../../constants/base.url';
import { HttpClient, HttpParams } from "@angular/common/http";

@Injectable()
export class DashboardService {

  constructor(private _http: HttpClient) { }


  getdashboardDetails(userId) {
    let url = `usersprovider/GetProviderDashboardDetail/${userId}`;
    return this._http.get(baseApi + url);
  }

  getProviderBillingDashboard(providerId: number, period: string) {
    const url = `general/GetProviderBillingDashboard/${providerId}/${period}`;
    return this._http.get(baseApi + url);
  }

  getProviderBillingDashboardInvoices(providerId: number, period: string) {
    const url = `general/GetProviderBillingDashboardInvoices/${providerId}/${period}`;
    return this._http.get(baseApi + url);
  }

  getContainerDetails(bookingKey, portalName) {
    const url = `booking/GetBookingContainer/${bookingKey}/${portalName}`;
    return this._http.get(baseApi + url);
  }

  updateSpecialPrice(bookingID, loginUserID, data) {
    const url = `booking/UpdateBookingSpecialPrice/${bookingID}/${loginUserID}`;
    return this._http.put(baseApi + url, data);
  }

  saveUserDocument(data) {
    let url = "Document/Post";
    return this._http.post(baseApi + url, data);
  }

  getBookingSpecialLogs(bookingKey: string, portalType:string) {
    const url = `booking/GetBookingSpecialPriceLog/${bookingKey}/${portalType}`;
    return this._http.get(baseApi + url);
  }

  getBookingYears() {
    const url = `general/GetBookingYear`;
    return this._http.get(baseApi + url);
  }
}
