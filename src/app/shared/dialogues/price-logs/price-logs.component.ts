import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedService } from '../../../services/shared.service';
import { ScrollbarComponent } from 'ngx-scrollbar';
import { DashboardService } from '../../../components/pages/user-desk/dashboard/dashboard.service';
import { encryptBookingID } from '../../../constants/globalFunctions';

@Component({
  selector: 'app-price-logs',
  templateUrl: './price-logs.component.html',
  styleUrls: ['./price-logs.component.scss']
})
export class PriceLogsComponent implements OnInit {
  @Input() data: any;
  closeResult: string;
  public logs: any[] = []
  public currencyList: any[] = []
  public selectedCurrency: any = {}
  constructor(public _activeModal: NgbActiveModal, private _dashboardService: DashboardService) { }


  ngOnInit() {
    console.log(this.data)
    let id = encryptBookingID(this.data.booking.BookingID, this.data.booking.UserID, this.data.booking.ShippingModeCode)
    if (this.data.logs.length) {
      this.logs = this.data.logs
    } else {
      this._dashboardService.getBookingSpecialLogs(id, 'PROVDER').subscribe((res: any) => {
        console.log(res)
        this.logs = res.returnObject
      }, (err: any) => {
        console.log(err)
      })
    }
  }
}
