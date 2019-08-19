import { Injectable } from '@angular/core';
import { baseApi } from '../../../../constants/base.url';
import { HttpClient, HttpParams } from "@angular/common/http";

@Injectable()
export class ViewBookingService {
  constructor(private _http: HttpClient) { }

  getBookingDetails(bookingId) {
    let url = `booking/GetProviderBookingSummary/${bookingId}`;
    return this._http.get(baseApi + url);
  }
  getDocReasons() {
    let url = "Document/GetDocumentReason";
    return this._http.get(baseApi + url);
  }
  getDocStatuses() {
    let url = "Status/GetDocumentStatus";
    return this._http.get(baseApi + url);
  }

  getBookingReasons() {
    let url = "booking/GetBookingReason";
    return this._http.get(baseApi + url);
  }

  getBookingStatuses($bookingType: string) {
    let url = `Status/GetBookingStatus/${$bookingType}`;
    return this._http.get(baseApi + url);
  }
  getBookingSubStatuses($bookingType: string, statusId:any) {
    let url = `Activity/GetBookingStatus?statusFor=${$bookingType}&StatusID=${statusId}`;
    return this._http.get(baseApi + url);
  }

  updateBookingStatus(data) {
    let url = "booking/AddBookingStatus";
    return this._http.post(baseApi + url, data);
  }
  updateBookingActivity(data) {
    let url = "Activity/AddActivityStatus";
    return this._http.post(baseApi + url, data);
  }

  cancelBooking(data) {
    let url = "booking/CancelBooking";
    return this._http.put(baseApi + url, data);
  }

  notifyCustomer(data) {
    let url = "booking/NotifyCustomer";
    return this._http.post(baseApi + url, data);
  }

  uploadDocReason(obj) {
    let url = "Document/AddReason";
    return this._http.post(baseApi + url, obj);
  }

  approvedDocx(data) {
    let url = "Document/AddDocumentStatus";
    return this._http.post(baseApi + url, data);

  }

  updateAgentInfo(data) {
    let url = `booking/UpdateBookingContactInfo/${data.BookingNature}/${data.BookingID}/${data.LoginUserID}/${data.PortNature}/${data.ContactInfoFor}`
    return this._http.put(baseApi + url, data.BookingSupDistInfo);
  }

  getCarrierSchedule(data) {
    let url = `booking/GetCarrierSchedule/${data.BookingID}/${data.PolID}/${data.PodID}/${data.ContainerLoadType}/${data.ResponseType}/${data.CarrierID}/${data.fromEtdDate}/${data.toEtdDate}`
    return this._http.get(baseApi + url);
  }

  saveCarrierSchedule(data) {
    let url = `booking/SaveCarrierSchedule`
    return this._http.post(baseApi + url, data);
  }


  /**
   *
   * SAVE CONTAINER DETAILS
   * @param {object} data
   * @returns
   * @memberof ViewBookingService
   */
  saveContainerDetails(data) {
    let url = `booking/SaveContainerInfo`
    return this._http.post(baseApi + url, data);
  }


  /**
   *
   * SAVE B/L NUMBER
   * @param {object} data
   * @returns
   * @memberof ViewBookingService
   */
  saveBLNumber(data) {
    let url = `booking/SaveBLInformation`
    return this._http.post(baseApi + url, data);
  }


}
