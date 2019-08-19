import {
  Component,
  OnInit,
  Input,
  Output,
  OnChanges,
  EventEmitter,
  SimpleChange
} from "@angular/core";
import {
  getImagePath,
  ImageSource,
  ImageRequiredSize,
  getDateDiff,
  changeCase
} from "../../../constants/globalFunctions";
import { baseExternalAssets } from "../../../constants/base.url";
import * as moment from "moment";
import { PaginationInstance } from "ngx-pagination";
import { cloneObject } from "../../../components/pages/user-desk/reports/reports.component";
import { firstBy } from "thenby";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { VesselScheduleDialogComponent } from "../../dialogues/vessel-schedule-dialog/vessel-schedule-dialog.component";
import { ViewBookingService } from "../../../components/pages/user-desk/view-booking/view-booking.service";
import { JsonResponse } from "../../../interfaces/JsonResponse";
import { ToastrService } from "ngx-toastr";
import { AirFreightService } from "../../../components/pages/user-desk/manage-rates/air-freight/air-freight.service";

@Component({
  selector: "app-ui-table",
  templateUrl: "./ui-table.component.html",
  styleUrls: ["./ui-table.component.scss"]
})
export class UiTableComponent implements OnInit, OnChanges {
  @Input() tableData: any;
  @Input() transMode: string;
  @Input() tableType: string; //draftFCL; publishFCL
  @Input() totalRecords: number;
  @Input() containerLoad: string;
  @Input() incomingPage: number
  @Output() checkedRows = new EventEmitter<any>();
  @Output() sorting = new EventEmitter<any>();
  @Output() pageEvent = new EventEmitter<any>();

  public selectedSort: any = {
    title: "Rate For",
    value: "CustomerName",
    column: "CustomerID"
  };
  public data: Array<any> = [];
  public maxSize: number = 7;
  public directionLinks: boolean = true;
  public autoHide: boolean = false;
  public checkAllPublish: boolean = false;
  public checkAllDrafts: boolean = false;
  public LCLRecords: number;
  public FCLRecords: number;

  // pagination vars
  // public pageSize: number = 5;
  public page: number = 1;
  // collectionSize = this.totalRecords

  public thList: Array<HMTableHead> = [
    { title: "", activeClass: "", sortKey: "" },
    { title: "Rate For", activeClass: "", sortKey: "CustomerName" },
    { title: "Shipping Line", activeClass: "", sortKey: "" },
    { title: "Origin/Destination", activeClass: "", sortKey: "" },
    { title: "Cargo Type", activeClass: "", sortKey: "" },
    { title: "Container", activeClass: "", sortKey: "" },
    { title: "Rate", activeClass: "", sortKey: "" },
    { title: "Import Charges", activeClass: "", sortKey: "" },
    { title: "Export Charges", activeClass: "", sortKey: "" },
    { title: "Rate Validity", activeClass: "", sortKey: "" }
  ];

  public devicPageConfig: PaginationInstance = {
    id: "some_unq_publish",
    itemsPerPage: 5,
    currentPage: 1
  };

  public labels: any = {
    previousLabel: "",
    nextLabel: "",
    screenReaderPaginationLabel: "Pagination",
    screenReaderPageLabel: "page",
    screenReaderCurrentLabel: `You're on page`
  };

  public totalCount: number;
  public airFreightTypes: any[] = []

  constructor(
    private _modalService: NgbModal,
    private _viewBookingService: ViewBookingService,
    private _toastr: ToastrService,
    private _airFreightService: AirFreightService,
  ) { }

  ngOnInit() {
    if (this.tableType === "draftFCL") {
      this.tableData = changeCase(this.tableData, "camel");
      this.totalCount = this.tableData.length;
    } else if (this.tableType === "publishFCL") {
      this.totalCount = this.totalRecords;
      if (this.incomingPage) {
        this.page = this.incomingPage
      }
      this.thList = [
        { title: "", activeClass: "", sortKey: "" },
        { title: "Rate For", activeClass: "", sortKey: "CustomerName" },
        { title: "Shipping Line", activeClass: "", sortKey: "" },
        { title: "Origin/Destination", activeClass: "", sortKey: "" },
        { title: "Cargo Type", activeClass: "", sortKey: "" },
        { title: "Container", activeClass: "", sortKey: "" },
        { title: "Rate", activeClass: "", sortKey: "" },
        { title: "Import Charges", activeClass: "", sortKey: "" },
        { title: "Export Charges", activeClass: "", sortKey: "" },
        { title: "Rate Validity", activeClass: "", sortKey: "" },
        { title: "Recent Update", activeClass: "", sortKey: "" }
      ];
    }
    if (this.transMode === 'AIR') {
      this.tableData.forEach(element => {
        element.selectedDepartureDays = []
        if (element.pricingJson) {
          element.parsedPricingJSON = JSON.parse(element.pricingJson)
        }
        if (element.jsonSurchargeDetail) {
          element.parsedjsonSurchargeDetail = JSON.parse(element.jsonSurchargeDetail)
          element.simpleChargesExport = element.parsedjsonSurchargeDetail.filter(e => e.Imp_Exp === 'EXPORT' && e.isSlabBased)
          element.simpleChargesImport = element.parsedjsonSurchargeDetail.filter(e => e.Imp_Exp === 'IMPORT' && e.isSlabBased)
        }
        if (element.jsonDepartureDays) {

          element.parsedjsonDepartureDays = JSON.parse(element.jsonDepartureDays)
          const { D1, D2, D3, D4, D5, D6, D7, DAILY } = element.parsedjsonDepartureDays
          if (D1 === 1) {
            element.selectedDepartureDays.push('Monday')
          }
          if (D2 === 1) {
            element.selectedDepartureDays.push('Tuesday')
          }
          if (D3 === 1) {
            element.selectedDepartureDays.push('Wednesday')
          }
          if (D4 === 1) {
            element.selectedDepartureDays.push('Thursday')
          }
          if (D5 === 1) {
            element.selectedDepartureDays.push('Friday')
          }
          if (D6 === 1) {
            element.selectedDepartureDays.push('Saturday')
          }
          if (D7 === 1) {
            element.selectedDepartureDays.push('Sunday')
          }
          if (DAILY === 1) {
            element.selectedDepartureDays.push('Daily')
          }
          // element.parsedjsonDepartureDays.forEach(e => {
          //   element.selectedDepartureDays.push(e.codeVal)
          // });
        }
        if (element.aircraftTypeID) {
          this.airFreightTypes = JSON.parse(localStorage.getItem('airCrafts'))
          if (!this.airFreightTypes) {
            this._airFreightService.getAirFreightTypes().subscribe((res: any) => {
              this.airFreightTypes = res;
              this.airFreightTypes.forEach(e => {
                if (e.id === element.aircraftTypeID) {
                  element.airCraftTitle = e.title
                }
              })
            }, (err: any) => {
            })
          } else {
            this.airFreightTypes.forEach(e => {
              if (e.id === element.aircraftTypeID) {
                element.airCraftTitle = e.title
              }
            })
          }

        }
      });
    }
    this.data = this.tableData;
    console.log(this.data)
    this.generateTableHeaders();
    this.setPublishedRatesStatus();
  }


  getAirFreightTypes() {
    this._airFreightService.getAirFreightTypes().subscribe((res: any) => {
      this.airFreightTypes = res;
      localStorage.setItem('airCrafts', JSON.stringify(this.airFreightTypes))
      this.airFreightTypes.forEach(e => {
        e.isChecked = false
      })
    }, (err: any) => {
    })
  }

  /**
   * [GENERATE TABLE HEADERS]
   * @param  event [description]
   * @return       [description]
   */
  generateTableHeaders() {
    if (this.containerLoad === "LCL" && this.transMode === "SEA") {
      if (this.tableType === "draftFCL") {
        this.thList = [
          { title: "", activeClass: "", sortKey: "" },
          { title: "Rate For", activeClass: "", sortKey: "CustomerName" },
          { title: "Origin/Destination", activeClass: "", sortKey: "" },
          { title: "Cargo Type", activeClass: "", sortKey: "" },
          { title: "Rate", activeClass: "", sortKey: "" },
          { title: "Import Charges", activeClass: "", sortKey: "" },
          { title: "Export Charges", activeClass: "", sortKey: "" },
          { title: "Rate Validity", activeClass: "", sortKey: "" }
        ];
      } else if (this.tableType === "publishFCL") {
        this.thList = [
          { title: "", activeClass: "", sortKey: "" },
          { title: "Rate For", activeClass: "", sortKey: "CustomerName" },
          { title: "Origin/Destination", activeClass: "", sortKey: "" },
          { title: "Cargo Type", activeClass: "", sortKey: "" },
          { title: "Rate", activeClass: "", sortKey: "" },
          { title: "Import Charges", activeClass: "", sortKey: "" },
          { title: "Export Charges", activeClass: "", sortKey: "" },
          { title: "Rate Validity", activeClass: "", sortKey: "" },
          { title: "Recent Update", activeClass: "", sortKey: "" }
        ];
      }

    } else if (this.containerLoad === "LCL" && this.transMode === "AIR") {
      if (this.tableType === "draftFCL") {
        this.thList = [
          { title: "", activeClass: "", sortKey: "" },
          { title: "Rate For", activeClass: "", sortKey: "CustomerName" },
          { title: "Air Line", activeClass: "", sortKey: "" },
          { title: "Origin/Destination", activeClass: "", sortKey: "" },
          { title: "Cargo Type", activeClass: "", sortKey: "" },
          { title: "Transit Time", activeClass: "", sortKey: "" },
          { title: "Departure Days", activeClass: "", sortKey: "" },
          { title: "Aircraft Type", activeClass: "", sortKey: "" },
          { title: "Min. Rate", activeClass: "", sortKey: "" },
          { title: 'Normal', activeClass: "", sortKey: "" },
          { title: '+45', activeClass: "", sortKey: "" },
          { title: '+100', activeClass: "", sortKey: "" },
          { title: '+300', activeClass: "", sortKey: "" },
          { title: '+500', activeClass: "", sortKey: "" },
          { title: '+1000', activeClass: "", sortKey: "" },
          { title: '+3000', activeClass: "", sortKey: "" },
          { title: '+5000', activeClass: "", sortKey: "" },
          { title: "Import Charges", activeClass: "", sortKey: "" },
          { title: "Export Charges", activeClass: "", sortKey: "" },
          { title: "Rate Validity", activeClass: "", sortKey: "" }
        ];
      } else if (this.tableType === "publishFCL") {
        this.thList = [
          { title: "", activeClass: "", sortKey: "" },
          { title: "Rate For", activeClass: "", sortKey: "CustomerName" },
          { title: "Air Line", activeClass: "", sortKey: "" },
          { title: "Origin/Destination", activeClass: "", sortKey: "" },
          { title: "Cargo Type", activeClass: "", sortKey: "" },
          { title: "Transit Time", activeClass: "", sortKey: "" },
          { title: "Departure Days", activeClass: "", sortKey: "" },
          { title: "Aircraft Type", activeClass: "", sortKey: "" },
          { title: "Min. Rate", activeClass: "", sortKey: "" },
          { title: 'Normal', activeClass: "", sortKey: "" },
          { title: '+45', activeClass: "", sortKey: "" },
          { title: '+100', activeClass: "", sortKey: "" },
          { title: '+300', activeClass: "", sortKey: "" },
          { title: '+500', activeClass: "", sortKey: "" },
          { title: '+1000', activeClass: "", sortKey: "" },
          { title: '+3000', activeClass: "", sortKey: "" },
          { title: '+5000', activeClass: "", sortKey: "" },
          { title: "Import Charges", activeClass: "", sortKey: "" },
          { title: "Export Charges", activeClass: "", sortKey: "" },
          { title: "Rate Validity", activeClass: "", sortKey: "" },
          { title: "Recent Update", activeClass: "", sortKey: "" }
        ];
      }

    } else if (
      (this.containerLoad === "FCL" || this.containerLoad === "FTL") &&
      this.transMode === "GROUND"
    ) {
      if (this.tableType === "draftFCL") {
        this.thList = [
          { title: "", activeClass: "", sortKey: "" },
          { title: "Rate for", activeClass: "", sortKey: "" },
          { title: "Origin/Destination", activeClass: "", sortKey: "" },
          { title: "Cargo Type", activeClass: "", sortKey: "" },
          { title: "Size", activeClass: "", sortKey: "" },
          { title: "Rate", activeClass: "", sortKey: "" },
          { title: "Import Charges", activeClass: "", sortKey: "" },
          { title: "Export Charges", activeClass: "", sortKey: "" },
          { title: "Rate Validity", activeClass: "", sortKey: "" }
        ];
      } else if (this.tableType === "publishFCL") {
        this.thList = [
          { title: "", activeClass: "", sortKey: "" },
          { title: "Rate for", activeClass: "", sortKey: "" },
          { title: "Origin/Destination", activeClass: "", sortKey: "" },
          { title: "Cargo Type", activeClass: "", sortKey: "" },
          { title: "Size", activeClass: "", sortKey: "" },
          { title: "Rate", activeClass: "", sortKey: "" },
          { title: "Import Charges", activeClass: "", sortKey: "" },
          { title: "Export Charges", activeClass: "", sortKey: "" },
          { title: "Rate Validity", activeClass: "", sortKey: "" },
          { title: "Recent Update", activeClass: "", sortKey: "" }
        ];
      }

    } else if (
      this.containerLoad === "WAREHOUSE" &&
      this.transMode === "WAREHOUSE"
    ) {
      let title1 = "";
      let title2 = "";
      let title3 = "";
      let title4 = "";
      let title5 = "";
      let title6 = "";
      if (this.data.length) {
        if (this.data[0].usageType === "SHARED") {
          title1 = "Rate / CBM / Day (SHARED)"
          title2 = "Rate / SQFT / Day (SHARED)"
          title3 = "Rate / PLT / Day (SHARED)"
          title4 = "Rate / CBM / Day (DEDICATED)"
          title5 = "Rate / SQFT / Day (DEDICATED)"
          title6 = "Rate / PLT / Day (DEDICATED)"
        } else {
          title1 = "Rent Per Month"
          title2 = "Rent Per Year"
        }
        if (this.data[0].usageType === "SHARED") {
          this.thList = [
            { title: "", activeClass: "", sortKey: "" },
            { title: "Rate for", activeClass: "", sortKey: "" },
            { title: "Warehouse Type", activeClass: "", sortKey: "" },
            { title: title1, activeClass: "", sortKey: "" },
            { title: title2, activeClass: "", sortKey: "" },
            { title: title3, activeClass: "", sortKey: "" },
            { title: title4, activeClass: "", sortKey: "" },
            { title: title5, activeClass: "", sortKey: "" },
            { title: title6, activeClass: "", sortKey: "" },
            { title: "Addtional Charges (SHARED)", activeClass: "", sortKey: "" },
            { title: "Addtional Charges (DEDICATED)", activeClass: "", sortKey: "" },
            { title: "Rate Validity", activeClass: "", sortKey: "" },
            { title: "Recent Update", activeClass: "", sortKey: "" }
          ];
        } else {
          this.thList = [
            { title: "", activeClass: "", sortKey: "" },
            { title: "Rate for", activeClass: "", sortKey: "" },
            { title: "Warehouse Type", activeClass: "", sortKey: "" },
            { title: title1, activeClass: "", sortKey: "" },
            { title: title2, activeClass: "", sortKey: "" },
            { title: "Rate Validity", activeClass: "", sortKey: "" },
            { title: "Recent Update", activeClass: "", sortKey: "" }
          ];
        }
      }
    }
  }

  /**
   * [SET STATUS FOR PUBLISHED RECORD]
   * @return [description]
   */
  setPublishedRatesStatus() {
    this.data.forEach(e => {
      if (e.jsonCustomerDetail) {
        e.parsedjsonCustomerDetail = JSON.parse(e.jsonCustomerDetail);
      }
      if (e.publishStatus) {
        e.parsedpublishStatus = JSON.parse(e.publishStatus);
        if (e.parsedpublishStatus.Status === "PENDING") {
          e.parsedpublishStatus.printStatus = "Unpublished";
        } else if (e.parsedpublishStatus.Status === "POSTED") {
          e.parsedpublishStatus.printStatus =
            "Published on " +
            moment(e.parsedpublishStatus.PublishDate).format("L h:mm:ss A") + " (GMT)";
        }
      }
      e.isChecked = false;
      let dateDiff = getDateDiff(
        moment(e.effectiveTo).format("L"),
        moment(new Date()).format("L"),
        "days",
        "MM-DD-YYYY"
      );
      if (dateDiff <= 15) {
        e.dateDiff = dateDiff;
      } else {
        e.dateDiff = null;
      }
    });
  }

  /**
   * [ON DRAFTS GRID PAGE CHANGE ACTION]
   * @param  {number} event [page number]
   * @return       [description]
   */
  onPageChangeBootstrap(event) {
    if (this.transMode === "WAREHOUSE") {
      let obj = {
        page: event,
        whid: this.tableData[0].whid
      };
      this.pageEvent.emit(obj);
    } else {
      this.page = event;
      this.pageEvent.emit(this.page);
    }
  }

  onHeadClick($index: number, $activeClass: string, $fieldToSort: any) {
    const cloneThList: HMTableHead[] = cloneObject(this.thList);
    let direction: number;
    if ($activeClass === "sorting_asc") {
      cloneThList[$index].activeClass = "sorting_desc";
      direction = -1;
    } else {
      cloneThList[$index].activeClass = "sorting_asc";
      direction = 1;
    }
    const thLength = cloneThList.length;
    for (let index = 0; index < thLength; index++) {
      if (index !== $index) {
        cloneThList[index].activeClass = "none_sorting_asc";
      }
    }
    this.thList = cloneThList;

    this.data.sort(firstBy($fieldToSort, { direction }));
  }

  /**
   * [On Published Grid Page Change Action]
   * @param  {number} number [page number]
   * @return        [description]
   */
  onPageChange(number: any) {
    this.devicPageConfig.currentPage = number;
    this.pageEvent.emit(number);
  }

  /**
   * [Get UI image path from server]
   * @param  $image [description]
   * @param  type   [description]
   * @return        [description]
   */
  getUIImage($image: string, type) {
    if (type) {
      return baseExternalAssets + "/" + $image;
    }
    return getImagePath(
      ImageSource.FROM_SERVER,
      $image,
      ImageRequiredSize.original
    );
  }

  public checkList = [];
  /**
   * [ACTION ON CHECKBOX SELECTION IN TABLE]
   * @param  {string} type [all/ row id]
   * @param  {object} model [selected row]
   * @return       [description]
   */
  onCheck(type, model) {
    if (type === "all") {
      if (this.tableType === "draftFCL") {
        this.checkAllDrafts = !this.checkAllDrafts;
        if (this.checkAllDrafts) {
          this.data.forEach(e => {
            if (!this.validateRow(e)) {
              e.isChecked = true;
              if (this.containerLoad === "FCL" && this.transMode === "SEA") {
                this.checkList.push(e.providerPricingDraftID);
              } else if (
                this.containerLoad === "LCL" &&
                this.transMode === "SEA"
              ) {
                this.checkList.push(e.consolidatorPricingDraftID);
              } else if (this.transMode === "GROUND") {
                this.checkList.push(e.id);
              } else if (this.transMode === "AIR") {
                this.checkList.push(e.carrierPricingDraftID);
              }
            }
          });
        } else if (!this.checkAllDrafts) {
          this.data.forEach(e => {
            e.isChecked = false;
          });
          this.checkList = [];
        }
      } else if (this.tableType === "publishFCL") {
        this.checkAllPublish = !this.checkAllPublish;
        if (this.checkAllPublish) {
          this.data.forEach(e => {
            e.isChecked = true;
            if ((this.containerLoad === "FCL" && this.transMode === "SEA") || this.transMode === "AIR") {
              this.checkList.push(e.carrierPricingID);
            } else if (
              this.containerLoad === "LCL" &&
              this.transMode === "SEA"
            ) {
              this.checkList.push(e.consolidatorPricingID);
            } else if (this.transMode === "GROUND") {
              this.checkList.push(e.id);
            } else if (this.transMode === "WAREHOUSE") {
              this.checkList.push(e.whPricingID);
            }
          });
        } else if (!this.checkAllPublish) {
          this.data.forEach(e => {
            e.isChecked = false;
          });
          this.checkList = [];
        }
      }
    } else {
      if (!model.isChecked) {
        this.checkList.forEach(e => {
          if (e === type) {
            let idx = this.checkList.indexOf(e);
            this.checkList.splice(idx, 1);
          }
        });
      } else if (model.isChecked) {
        this.checkList.push(type);
      }
    }
    let obj = {
      type: this.tableType,
      list: this.checkList
    };
    this.checkedRows.emit(obj);
  }

  /**
   * [Action on Draft Grid Row]
   * @param  {object} row [selected table row]
   * @param  action [delete/edit]
   * @return        [description]
   */
  draftAction(row, action) {
    if (this.tableType === "publishFCL") return;
    let obj = {};
    if (action === "delete") {
      let deleteIDs
      if (this.transMode === 'GROUND') {
        deleteIDs = row.id
      } else if (this.transMode === "SEA" && row.containerLoadType === "FCL") {
        deleteIDs = row.providerPricingDraftID
      } else if (this.transMode === "AIR") {
        deleteIDs = row.carrierPricingDraftID
      } else {
        deleteIDs = row.consolidatorPricingDraftID
      }
      obj = {
        type: "delete",
        id: deleteIDs,
        load: (row.containerLoadType) ? row.containerLoadType : 'LCL'
      };
    } else if (action === "edit") {
      let editID
      if (this.transMode === 'GROUND') {
        editID = row.id
      } else if (this.transMode === "SEA" && row.containerLoadType === "FCL") {
        editID = row.providerPricingDraftID
      } else if (this.transMode === "AIR") {
        editID = row.carrierPricingDraftID
      } else {
        editID = row.consolidatorPricingDraftID
      }
      obj = {
        type: "edit",
        id: editID,
        load: (row.containerLoadType) ? row.containerLoadType : 'AIR'
      };
    }
    this.checkList.push(obj);
    const emitObj = {
      type: this.tableType,
      list: this.checkList
    };
    this.checkedRows.emit(emitObj);
    this.checkList = [];
  }

  /**
   * [Action on Publish Grid Row]
   * @param  {object} row [selected table row]
   * @param  {string} action [history]
   * @return        [description]
   */
  publishAction(row, action) {
    if (this.tableType === "draftFCL") return;
    let obj = {};
    if (action === "history") {
      let historyID
      if (this.transMode === 'GROUND') {
        historyID = row.id
      } else if (this.transMode === "SEA" && this.containerLoad === "FCL") {
        historyID = row.carrierPricingID
      } else if (this.transMode === "AIR") {
        historyID = row.carrierPricingID
      } else if (this.transMode === "WAREHOUSE") {
        historyID = row.whPricingID
      } else {
        historyID = row.consolidatorPricingID
      }
      obj = {
        type: "history",
        id: historyID,
        load: (this.transMode === "AIR") ? 'Rate_AIR' : this.containerLoad
      };
    }
    this.checkList.push(obj);
    const emitObj = {
      type: this.tableType,
      list: this.checkList
    };
    this.checkedRows.emit(emitObj);
    this.checkList = [];
  }

  viewDetails() {
    let obj = {};
    this.checkList.push(obj);
    const emitObj = {
      type: this.tableType,
      list: this.checkList
    };
    this.checkedRows.emit(emitObj);
    this.checkList = [];
  }

  /**
   * [Validation on row selection via checkboxes]
   * @param {object} row [table row]
   * @return     [description]
   */
  validateRow(row) {
    if (this.containerLoad === "FCL" && this.transMode === "SEA") {
      if (
        !row.polID ||
        !row.podID ||
        !row.price ||
        !row.shippingCatID ||
        !row.effectiveFrom ||
        !row.effectiveTo ||
        !row.containerSpecID ||
        !row.carrierID
      ) {
        return true;
      } else {
        return false;
      }
    } else if (this.containerLoad === "LCL" && this.transMode === "SEA") {
      if (
        !row.polID ||
        !row.podID ||
        !row.price ||
        !row.effectiveFrom ||
        !row.shippingCatID ||
        !row.effectiveTo
      ) {
        return true;
      } else {
        return false;
      }
    } else if (this.transMode === "AIR") {
      if (
        !row.polID ||
        !row.podID ||
        !row.minPrice ||
        !row.effectiveFrom ||
        !row.shippingCatID ||
        !row.effectiveTo ||
        !row.carrierID
      ) {
        return true;
      } else {
        return false;
      }
    } else if (this.transMode === "GROUND") {
      if (
        !row.polID ||
        !row.podID ||
        !row.price ||
        !row.effectiveFrom ||
        !row.effectiveTo
      ) {
        return true;
      } else {
        return false;
      }
    }
  }

  /**
   * [Sorting dropdown selection]
   * @param  value  [string]
   * @param  title  [string]
   * @param  column [number]
   * @return        [description]
   */
  onSortClick(value, title, column) {
    this.selectedSort = {
      title: title,
      value: value,
      column: column
    };
    let sortObj = {
      direction: value === 'recentUpdate' ? "DESC" : 'ASC',
      column: column
    };
    this.sorting.emit(sortObj);
  }

  /**
   * [Change Detedction of Input in the Component]
   * @param  changes [object]
   * @return         [description]
   */
  ngOnChanges(changes) {
    if (changes.totalRecords) {
      if (this.tableType === "draftFCL") {
        this.totalCount = this.tableData.length;
      } else if (this.tableType === "publishFCL") {
        this.totalCount = changes.totalRecords.currentValue;
      }
    }

    if (changes.incomingPage) {
      this.page = this.incomingPage
      this.devicPageConfig.currentPage = this.incomingPage
    }

    if (changes.hasOwnProperty("containerLoad")) {
      if (changes.containerLoad) {
        this.containerLoad = changes.containerLoad.currentValue;
      }
    }

    if (changes.tableData) {
      this.data = changeCase(changes.tableData.currentValue, "camel");
      console.log(this.data)
      this.data.forEach(e => {
        if (e.jsonCustomerDetail) {
          e.parsedjsonCustomerDetail = JSON.parse(e.jsonCustomerDetail);
        }
        if (e.publishStatus) {
          e.parsedpublishStatus = JSON.parse(e.publishStatus);
          if (e.parsedpublishStatus.Status === "PENDING") {
            e.parsedpublishStatus.printStatus = "Unpublished";
          } else if (e.parsedpublishStatus.Status === "POSTED") {
            e.parsedpublishStatus.printStatus =
              "Published on " +
              moment(e.parsedpublishStatus.PublishDate).format(
                "MM/DD/YYYY h:mm:ss A"
              ) + " (GMT)";
          }
        }
        e.isChecked = this.checkAllPublish ? true : false;
        if (this.containerLoad === "FCL" && this.transMode === "SEA") {
          this.checkList.push(e.carrierPricingID);
        } else if (this.containerLoad === "LCL" && this.transMode === "SEA") {
          this.checkList.push(e.consolidatorPricingID);
        } else if (this.transMode === "GROUND") {
          this.checkList.push(e.id);
        } else if (this.transMode === "WAREHOUSE") {
          this.checkList.push(e.whPricingID);
        } else if (this.transMode === "AIR") {
          this.checkList.push(e.carrierPricingDraftID);
        }
        let dateDiff = getDateDiff(
          moment(e.effectiveTo).format("L"),
          moment(new Date()).format("L"),
          "days",
          "MM-DD-YYYY"
        );
        if (dateDiff <= 15) {
          e.dateDiff = dateDiff;
        } else {
          e.dateDiff = null;
        }

        if (this.transMode === 'AIR') {
          e.selectedDepartureDays = []
          if (e.pricingJson) {
            e.parsedPricingJSON = JSON.parse(e.pricingJson)
          }

          if (e.jsonDepartureDays) {
            e.parsedjsonDepartureDays = JSON.parse(e.jsonDepartureDays)
            const { D1, D2, D3, D4, D5, D6, D7, DAILY } = e.parsedjsonDepartureDays
            if (D1 === 1) {
              e.selectedDepartureDays.push('Monday')
            } if (D2 === 1) {
              e.selectedDepartureDays.push('Tuesday')
            } if (D3 === 1) {
              e.selectedDepartureDays.push('Wednesday')
            } if (D4 === 1) {
              e.selectedDepartureDays.push('Thursday')
            } if (D5 === 1) {
              e.selectedDepartureDays.push('Friday')
            } if (D6 === 1) {
              e.selectedDepartureDays.push('Saturday')
            } if (D7 === 1) {
              e.selectedDepartureDays.push('Sunday')
            } if (DAILY === 1) {
              e.selectedDepartureDays.push('Daily')
            }
          }
          if (e.aircraftTypeID) {
            this.airFreightTypes = JSON.parse(localStorage.getItem('airCrafts'))
            if (!this.airFreightTypes) {
              this._airFreightService.getAirFreightTypes().subscribe((res: any) => {
                this.airFreightTypes = res;
                this.airFreightTypes.forEach(c => {
                  if (e.id === e.aircraftTypeID) {
                    e.airCraftTitle = c.title
                  }
                })
              }, (err: any) => {
              })
            } else {
              this.airFreightTypes.forEach(c => {
                if (c.id === e.aircraftTypeID) {
                  e.airCraftTitle = c.title
                }
              })
            }

          }
        }
      });

      if (this.data.length && this.data[0].usageType) {
        this.generateTableHeaders();
      }
    }
    this.checkList = [];
  }

  openSchedule($data) {


    // effectiveFrom: "2019-04-01T00:00:00"
    // effectiveTo: "2019-09-28T00:00:00"
    // carrierID: 100
    // podCode: "PK KHI"
    // podID: 100
    // podName: "Karachi"
    // polCode: "AE JEA"
    // polID: 2007
    // polName: "Jebel Ali"



    const toSend = {
      BookingID: -1,
      PolID: $data.polID,
      PodID: $data.podID,
      ContainerLoadType: this.containerLoad,
      ResponseType: 'details',
      CarrierID: $data.carrierID,
      fromEtdDate: moment.utc($data.effectiveFrom).format(),
      toEtdDate: moment.utc($data.effectiveTo).format(),
    }

    this._viewBookingService.getCarrierSchedule(toSend).subscribe((res: JsonResponse) => {
      const { returnId, returnText, returnObject } = res
      if (returnId > 0) {
        this.openVesselDialog($data, returnObject)
      } else {
        this.openVesselDialog($data, null)
      }
    }, (err: any) => {
      this._toastr.error('There was an error while processing your request, Please try again later.', 'Error')
    })
  }

  openVesselDialog($data, $returnObject) {
    const modalRef = this._modalService.open(VesselScheduleDialogComponent, {
      size: 'lg',
      centered: true,
      windowClass: ($returnObject) ? 'large-modal' : 'small-modal',
      backdrop: 'static',
      keyboard: false
    })
    modalRef.componentInstance.data = {
      bookingID: -1,
      date: null,
      schedules: $returnObject,
      PodCode: $data.podCode,
      PodName: $data.podName,
      PolCode: $data.polCode,
      PolName: $data.polName,
    }
  }

}

export interface HMTableHead {
  title: string;
  activeClass: string;
  sortKey: string;
}
