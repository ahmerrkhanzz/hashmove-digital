import { Injectable } from '@angular/core';
import { baseApi } from '../../../../../constants/base.url';
import { HttpClient, HttpParams } from "@angular/common/http";

@Injectable()
export class AirFreightService {

  constructor(private _http: HttpClient) { }

  getAllrates(obj) {
    let url: string = "ProviderRateAir/SearchRates";
    return this._http.post(baseApi + url, obj);
  }

  addDraftRates(obj) {
    let url: string = "ProviderRateAir/AddDraftRow";
    return this._http.post(baseApi + url, obj);
  }

  saveDraftRate(obj) {
    let url: string = "ProviderRateAir/SaveDraft";
    return this._http.post(baseApi + url, obj);
  }

  publishDraftRate(obj) {
    let url: string = "ProviderRateAir/PublishRate";
    return this._http.post(baseApi + url, obj);
  }


  deleteNDiscardDraftRate(data) {
    let url: string = "ProviderRateAir/DiscardDraft";
    return this._http.request('delete', baseApi + url, { body: data });
  }

  deletePublishRate(data) {
    let url: string = "ProviderRateAir/DeletePublishRate";
    return this._http.request('delete', baseApi + url, { body: data });
  }
  rateValidity(data) {
    let url: string = "ProviderRateAir/EditRate";
    return this._http.post(baseApi + url, data);
  }
  getRecHistory(recId, objectName, createdBy) {
    let url: string = `ProviderRateAir/GetRateHistory/${recId}/${objectName}/${createdBy}`;
    return this._http.get(baseApi + url);
  }


  /**
   *
   * GET AIR FREIGHT SLABS LIST
   * @returns
   * @memberof AirFreightService
   */
  getGetAirFreightSlab() {
    let url: string = `general/GetAirFreightSlab`;
    return this._http.get(baseApi + url);
  }

  /**
   *
   * GET AIR FREIGHT TYPES LIST
   * @returns
   * @memberof AirFreightService
   */
  getAirFreightTypes() {
    let url: string = `AircraftType/GetDropDownDetail/0`;
    return this._http.get(baseApi + url);
  }

  /**
   *
   * GET AIR FREIGHT TYPES LIST
   * @returns
   * @memberof AirFreightService
   */
  getAirDraftRates(providerID) {
    let url: string = `ProviderRateAir/GetAllDrafts/${providerID}`;
    return this._http.get(baseApi + url);
  }

}
